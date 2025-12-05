import express from "express";
import multer from "multer";
import path from "path";
import { inboundEmail } from "../controllers/inboundEmail.controller.js";

const upload = multer({
  dest: path.join(process.cwd(), "uploads/"), // simple disk storage
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
}); // attachments in memory
const router = express.Router();

router.post("/mailgun/inbound", upload.any(), inboundEmail);

export default router;
