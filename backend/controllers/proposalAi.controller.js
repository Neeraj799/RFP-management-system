import axios from "axios";
import Proposal from "../models/proposal.js";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function callGeminiAndParseJSON(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const prompt = `
Extract structured PROPOSAL details from the vendor quote text.
Return ONLY JSON with the following structure:

{
  "items": [
    { "name": string, "qty": number, "unitPrice": number, "total": number, "specs": string }
  ],
  "totalPrice": number,
  "currency": string,
  "deliveryDays": number or null,
  "paymentTerms": string or null,
  "warranty": string or null
}

If information is missing, return null or empty values.
Never return extra text outside JSON.

Vendor quote:
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
    throw new Error("Failed to parse JSON from Gemini response");
  }
}

export const parseAndCreateProposal = async (req, res) => {
  try {
    const { text, rfp, vendor } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }
    if (!rfp || !vendor) {
      return res
        .status(400)
        .json({ error: "rfp and vendor IDs are required to create proposal" });
    }

    const parsed = await callGeminiAndParseJSON(text);

    const items = Array.isArray(parsed.lineItems || parsed.items)
      ? (parsed.lineItems || parsed.items).map((it) => ({
          name: it.name ?? it.item ?? "",
          qty: Number(it.qty ?? it.quantity ?? 0),
          unitPrice: it.unitPrice
            ? Number(it.unitPrice)
            : it.unit_price
            ? Number(it.unit_price)
            : undefined,
          total: it.total ? Number(it.total) : undefined,
          specs: it.specs ?? it.spec ?? "",
        }))
      : [];

    const totalPrice =
      parsed.totalPrice ?? parsed.total ?? parsed.amount ?? null;

    const proposalDoc = {
      rfp,
      vendor,
      rawText: text,
      totalPrice:
        totalPrice !== undefined && totalPrice !== null
          ? Number(totalPrice)
          : 0,
      currency: parsed.currency ?? "USD",
      paymentTerms: parsed.paymentTerms ?? parsed.payment_terms ?? "",
      warranty: parsed.warranty ?? "",
      items,
      parsed: true,
      attachments: [],
    };

    const created = await new Proposal(proposalDoc).save();

    const populated = await Proposal.findById(created._id).populate(
      "vendor rfp"
    );

    return res
      .status(201)
      .json({ message: "Proposal created", proposal: populated });
  } catch (err) {
    console.error(
      "parseAndCreateProposal error:",
      err?.response?.data || err.message || err
    );
    return res
      .status(500)
      .json({ error: "Failed to parse/create proposal", message: err.message });
  }
};
