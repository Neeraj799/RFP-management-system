// backend/middleware/multerConfig.js
import multer from "multer";
import path from "path";
import fs from "fs";

// ensure uploads dir exists
const uploadsDir = path.resolve("backend/uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// storage: keep original name but prefix with timestamp to avoid clashes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    const safeName = `${Date.now()}-${base}${ext}`;
    cb(null, safeName);
  },
});

// file filter: allow pdf/doc/docx and images (jpeg/png)
function fileFilter(req, file, cb) {
  const allowed = [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "image/jpeg",
    "image/png",
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Unsupported file type"), false);
}

// limits: max 10 files, 8MB per file (adjust as needed)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
});

export default upload;
