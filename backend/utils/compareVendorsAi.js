import axios from "axios";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function compareVendorsWithAI(rfp, proposals) {
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `
You are helping evaluate vendor proposals for an RFP.

RFP Title: ${rfp.title}
Requirements: ${rfp.description}

Here are the vendor proposals in JSON:

${JSON.stringify(proposals, null, 2)}

Compare the vendors across:
- Total price
- Item-level pricing
- Delivery time
- Warranty terms
- Payment terms
- Completeness of response

Then produce this JSON output:

{
  "summary": "short overview of differences",
  "comparisonTable": [
    {
      "vendor": string,
      "totalPrice": number,
      "deliveryDays": number,
      "warranty": string,
      "paymentTerms": string,
      "score": number
    }
  ],
  "recommendation": {
    "vendor": string,
    "reason": string
  }
}
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

  const text =
    response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    response.data?.candidates?.[0]?.content?.text;

  try {
    return JSON.parse(text);
  } catch (e) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    return JSON.parse(text.slice(start, end + 1));
  }
}
