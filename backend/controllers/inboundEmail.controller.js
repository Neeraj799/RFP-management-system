import Proposal from "../models/Proposal.js";
import Vendor from "../models/vendor.js";
import axios from "axios";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Parse vendor proposal text
 */
export async function callGeminiAndParseProposal(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const prompt = `
Extract structured PROPOSAL details from this vendor reply.
Return ONLY JSON in the following structure:

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

  if (!raw) throw new Error("Empty response from Gemini");

  try {
    return JSON.parse(raw);
  } catch (err) {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }
    throw new Error("Failed to parse JSON from Gemini (proposal)");
  }
}

export const inboundEmail = async (req, res) => {
  try {
    const from = req.body.sender || req.body.from || "";
    const text = req.body["body-plain"] || "";
    const subject = req.body.subject || "";
    const rfpId = req.body.rfpId; // RFP ID passed from Postman or Mailgun

    // Identify vendor
    const emailMatch = from.match(/<([^>]+)>/) || [];
    const vendorEmail = (emailMatch[1] || from).trim().toLowerCase();
    const vendor = await Vendor.findOne({ email: vendorEmail });

    // ---------- SIMPLE ATTACHMENT HANDLING ----------
    let attachments = [];

    if (req.files && req.files.length > 0) {
      attachments = req.files.map((file) => ({
        filename: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
      }));
    }
    // -------------------------------------------------

    // Parse using Gemini
    const parsed = await callGeminiAndParseProposal(text);

    // Save Proposal
    const proposal = await Proposal.create({
      rfp: rfpId,
      vendor: vendor?._id || null,
      rawText: text,
      items: parsed.items || [],
      totalPrice: parsed.totalPrice || null,
      currency: parsed.currency || null,
      paymentTerms: parsed.paymentTerms || null,
      warranty: parsed.warranty || null,
      deliveryDays: parsed.deliveryDays || null,
      attachments, // <--- we added this
      parsed: true,
    });

    return res.json({
      message: "Vendor email parsed (with attachments supported)",
      proposalId: proposal._id,
    });
  } catch (err) {
    console.error("Inbound email error:", err);
    return res.status(500).json({ error: "Inbound processing failed" });
  }
};
