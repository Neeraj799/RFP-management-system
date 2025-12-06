import Proposal from "../models/proposal.js";
import Vendor from "../models/vendor.js";
import axios from "axios";
import { extractAttachmentText } from "../utils/extractAttachmentText.js";

/**
 * Gemini Parsing Helper
 */

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function callGeminiAndParseProposal(text) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY missing");

    const prompt = `
Extract structured PROPOSAL details from this vendor reply.
Return ONLY JSON:

{
  "items": [
    { "name": string, "qty": number, "unitPrice": number, "total": number }
  ],
  "totalPrice": number | null,
  "currency": string | null,
  "paymentTerms": string | null,
  "warranty": string | null,
  "deliveryDays": number | null
}

Vendor text:
"""${text}"""
`;

    const response = await axios.post(
      GEMINI_URL,
      { contents: [{ parts: [{ text: prompt }] }] },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
      }
    );

    const raw =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      response.data?.candidates?.[0]?.content?.text;

    if (!raw) throw new Error("Empty AI response");

    try {
      return JSON.parse(raw);
    } catch (e) {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start >= 0 && end > start) {
        return JSON.parse(raw.slice(start, end + 1));
      }
      throw new Error("AI did not return valid JSON");
    }
  } catch (err) {
    console.error("Gemini parsing error:", err);
    throw new Error("Failed to parse proposal using AI: " + err.message);
  }
}

/**
 * Inbound Email Webhook Controller
 */
export const inboundEmail = async (req, res) => {
  try {
    console.log("Inbound webhook summary — keys present:", {
      bodyKeys: Object.keys(req.body || {}),
      headersKeys: Object.keys(req.headers || {}),
      fromRaw: req.body?.from || req.body?.sender,
      subject: req.body?.subject,
      files: req.files?.length || 0,
    });

    const body = req.body || {};

    const from = body.sender || body.from || "";
    const text =
      body["body-plain"] || body["stripped-text"] || body["text"] || "";

    const subject = body.subject || "";

    if (!from) {
      return res.status(400).json({ error: "Missing sender email in webhook" });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        error: "No email text found — Mailgun did not send body-plain",
      });
    }

    // Extract RFP ID
    let rfpId = body.rfpId || null;

    if (!rfpId && subject) {
      const match = subject.match(/([0-9a-fA-F]{24})/);
      if (match) rfpId = match[1];
    }

    if (!rfpId) {
      const match = text.match(/([0-9a-fA-F]{24})/);
      if (match) rfpId = match[1];
    }

    if (!rfpId) {
      return res.status(400).json({
        error:
          "Missing RFP ID — include rfpId or add it in email reply (RFP ID: <id>)",
      });
    }

    // Vendor lookup
    const emailMatch = from.match(/<([^>]+)>/);
    const vendorEmail = (emailMatch?.[1] || from).trim().toLowerCase();

    const vendor = await Vendor.findOne({ email: vendorEmail });
    if (!vendor) {
      return res.status(400).json({
        error: "Vendor email not recognized: " + vendorEmail,
      });
    }

    /**
     * SIMPLE ATTACHMENT EXTRACTION
     */
    let attachments = [];
    let attachmentText = "";

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const extracted = await extractAttachmentText(file);

        attachments.push({
          filename: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
          extractedText: extracted,
        });

        if (extracted && extracted.trim() !== "") {
          attachmentText += `\n\n--- Attachment: ${file.originalname} ---\n${extracted}`;
        }
      }
    }

    // Combine email + attachment text
    const combinedText = text + attachmentText;

    // Parse with Gemini
    const parsed = await callGeminiAndParseProposal(combinedText);

    // Create proposal
    const proposal = await Proposal.create({
      rfp: rfpId,
      vendor: vendor._id,
      rawText: text,
      items: parsed.items || [],
      totalPrice: parsed.totalPrice || null,
      currency: parsed.currency || null,
      paymentTerms: parsed.paymentTerms || null,
      warranty: parsed.warranty || null,
      deliveryDays: parsed.deliveryDays || null,
      attachments,
      parsed: true,
    });

    return res.json({
      message: "Inbound email processed successfully",
      proposalId: proposal._id,
    });
  } catch (err) {
    console.error("Inbound email error:", err);
    return res.status(500).json({
      error: "Inbound email processing failed",
      details: err.message,
    });
  }
};
