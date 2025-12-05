// utils/extractAttachmentText.js
import fs from "fs";
import mammoth from "mammoth";
import PDFParser from "pdf2json";

/**
 * Safely decode a pdf2json text token.
 * Attempts decodeURIComponent, but falls back to:
 *  - a best-effort replacement for percent sequences, or
 *  - the raw token if decode fails.
 */
function safeDecodeToken(token) {
  if (!token || typeof token !== "string") return "";
  try {
    // Common case: percent-encoded text
    return decodeURIComponent(token);
  } catch (e) {
    // Token contained malformed percent escapes.
    // Try a tolerant replacement: replace any % not followed by two hex digits.
    try {
      const tolerant = token.replace(/%(?![0-9A-Fa-f]{2})/g, "%25");
      return decodeURIComponent(tolerant);
    } catch (e2) {
      // Last resort: return raw token (it may still be encoded but at least won't crash).
      return token;
    }
  }
}

/**
 * Extract text from PDF or DOCX attachments.
 * Uses pdf2json for PDF extraction and mammoth for DOCX.
 */
export async function extractAttachmentText(file) {
  const { path, mimetype, originalname } = file;

  try {
    // -------------------------
    // PDF extraction using pdf2json
    // -------------------------
    if (
      mimetype === "application/pdf" ||
      (originalname && originalname.toLowerCase().endsWith(".pdf"))
    ) {
      const pdfParser = new PDFParser();

      return await new Promise((resolve, reject) => {
        let aggregated = "";

        pdfParser.on("pdfParser_dataError", (err) => {
          // Log and resolve empty rather than reject to avoid crashing webhook handling
          console.error("PDF parse error:", err);
          resolve("");
        });

        pdfParser.on("pdfParser_dataReady", (pdfData) => {
          try {
            if (!pdfData || !pdfData.Pages) {
              return resolve("");
            }

            pdfData.Pages.forEach((page) => {
              if (!page.Texts) return;
              page.Texts.forEach((t) => {
                // t.R is an array of text runs
                if (!Array.isArray(t.R)) return;
                t.R.forEach((r) => {
                  // r.T may be percent-encoded or plain. Use safe decoder.
                  const token = r && r.T ? safeDecodeToken(r.T) : "";
                  // Append token + a space to separate words; keep newlines per text object
                  aggregated += token + " ";
                });
                // small separator per text object to preserve rough structure
                aggregated += "\n";
              });
            });

            // Normalize whitespace and return
            const cleaned = aggregated
              .replace(/[ \t]+/g, " ")
              .replace(/\n{2,}/g, "\n")
              .trim();
            resolve(cleaned);
          } catch (e) {
            console.error("Error processing pdf2json output:", e);
            resolve("");
          }
        });

        // start parsing (path must be a filesystem path)
        try {
          pdfParser.loadPDF(path);
        } catch (e) {
          console.error("pdfParser.loadPDF error:", e);
          resolve("");
        }
      });
    }

    // -------------------------
    // DOCX extraction via mammoth
    // -------------------------
    if (
      mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      (originalname && originalname.toLowerCase().endsWith(".docx"))
    ) {
      const result = await mammoth.extractRawText({ path });
      return result.value || "";
    }

    // Unsupported formats
    return "";
  } catch (err) {
    console.error("Attachment parse error:", err);
    return "";
  }
}
