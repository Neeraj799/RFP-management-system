import axios from "axios";
import Rfp from "../models/rfp.js";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function callGeminiAndParseJSON(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const prompt = `
Extract structured RFP details from the following text.
Return ONLY JSON with:

{
  "title": string,
  "description": string,
  "budget": number or null,
  "currency": string or null,
  "deliveryDays": number or null,
  "paymentTerms": string or null,
  "warranty": string or null,
  "lineItems": [
    { "name": string, "qty": number, "specs": string }
  ]
}

User text:
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

  // Try direct JSON parse → fallback to substring
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

export const parseRfpFromText = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }

    const parsed = await callGeminiAndParseJSON(text);

    return res.json({ parsed });
  } catch (err) {
    console.error("parseRfpFromText error:", err);
    return res.status(500).json({
      error: "Gemini API error",
      details: err.message,
    });
  }
};

export const parseAndCreateRfp = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required (string)" });
    }

    // Step 1 — Get parsed RFP from Gemini
    const parsed = await callGeminiAndParseJSON(text);

    // Step 2 — Prepare RFP document for MongoDB
    const rfpDoc = {
      title:
        parsed.title ||
        (parsed.lineItems && parsed.lineItems.length
          ? `${parsed.lineItems[0].name} procurement`
          : "Parsed RFP"),

      description: parsed.description || text.slice(0, 400),

      budget: parsed.budget ?? null,
      currency: parsed.currency ?? "USD",
      deliveryDays: parsed.deliveryDays ?? null,
      paymentTerms: parsed.paymentTerms ?? null,
      warranty: parsed.warranty ?? null,

      lineItems: Array.isArray(parsed.lineItems)
        ? parsed.lineItems.map((li) => ({
            name: li.name ?? "",
            qty: li.qty ?? 0,
            specs: li.specs ?? "",
          }))
        : [],
    };

    // Step 3 — Save into MongoDB
    const created = await new Rfp(rfpDoc).save();

    // Step 4 — Respond with the saved RFP
    return res.status(201).json({
      message: "RFP created",
      rfp: created,
    });
  } catch (err) {
    console.error("parseAndCreateRfp error:", err);
    return res.status(500).json({
      error: "Failed to parse/create RFP",
      message: err.message,
    });
  }
};
