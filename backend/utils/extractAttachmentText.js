// utils/extractAttachmentText.js
import fs from "fs";
import os from "os";
import path from "path";
import mammoth from "mammoth";

let pdfParseLoadPromise = null;

/**
 * Ensure we load pdf-parse and return the actual parse function.
 * Handles various module shapes across Node/npm versions.
 */
async function getPdfParseFunction() {
  if (!pdfParseLoadPromise) {
    pdfParseLoadPromise = (async () => {
      try {
        const mod = await import("pdf-parse");
        // Try common locations for the callable
        if (typeof mod === "function") return mod;
        if (typeof mod.default === "function") return mod.default;
        // Some bundlers may wrap differently — try a couple sensible fallbacks
        if (mod && typeof mod.pdf === "function") return mod.pdf;
        if (mod && typeof mod.parse === "function") return mod.parse;
        // If we reach here, module shape is unexpected — return the module for inspection
        return mod;
      } catch (e) {
        // propagate import error
        throw e;
      }
    })();
  }
  return pdfParseLoadPromise;
}

function makeTempPath(filename = "attachment") {
  const name = `${Date.now()}-${(filename || "attachment").replace(
    /\s+/g,
    "_"
  )}`;
  return path.join(os.tmpdir(), name);
}

/**
 * Extract text from PDF or DOCX attachments.
 * Supports file.path (disk) OR file.buffer (memory).
 */
export async function extractAttachmentText(file) {
  const { path: filePath, mimetype, originalname, buffer } = file;
  let tmpPath;
  let wroteTemp = false;

  try {
    // Prepare local file path
    if (filePath && typeof filePath === "string") {
      tmpPath = filePath;
    } else if (buffer && Buffer.isBuffer(buffer)) {
      tmpPath = makeTempPath(originalname || "attachment");
      await fs.promises.writeFile(tmpPath, buffer);
      wroteTemp = true;
    } else {
      // nothing to read
      return "";
    }

    // Load pdf-parse and determine callable
    let pdfParseFunc = await getPdfParseFunction();
    // If it's not a function yet, try common property names
    if (typeof pdfParseFunc !== "function") {
      if (pdfParseFunc?.default && typeof pdfParseFunc.default === "function")
        pdfParseFunc = pdfParseFunc.default;
      else if (pdfParseFunc?.pdf && typeof pdfParseFunc.pdf === "function")
        pdfParseFunc = pdfParseFunc.pdf;
      else if (pdfParseFunc?.parse && typeof pdfParseFunc.parse === "function")
        pdfParseFunc = pdfParseFunc.parse;
    }

    // PDF
    if (
      (mimetype && mimetype === "application/pdf") ||
      (originalname && originalname.toLowerCase().endsWith(".pdf"))
    ) {
      if (!pdfParseFunc) {
        // helpful error message for debugging module shape
        console.error(
          "pdf-parse loaded but no callable function found. Module shape:",
          pdfMod
        );
        throw new Error(
          "pdf-parse parsing function not found. See server logs for module shape."
        );
      }
      const fileBuffer = await fs.promises.readFile(tmpPath);
      const data = await pdfParseFunc(fileBuffer);
      return data?.text || "";
    }

    // DOCX
    if (
      (mimetype &&
        mimetype ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
      (originalname && originalname.toLowerCase().endsWith(".docx"))
    ) {
      const result = await mammoth.extractRawText({ path: tmpPath });
      return result?.value || "";
    }

    // Unsupported
    return "";
  } catch (err) {
    console.error("Attachment parse error:", err);
    return "";
  } finally {
    // cleanup temp file if we wrote one
    if (wroteTemp && tmpPath) {
      try {
        await fs.promises.unlink(tmpPath);
      } catch (e) {
        // ignore cleanup error
      }
    }
  }
}
