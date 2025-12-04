import express from "express";
import multer from "multer";
import { inboundEmail } from "../controllers/inboundEmail.controller.js";

const upload = multer(); // attachments in memory
const router = express.Router();

router.post("/mailgun/inbound", upload.any(), inboundEmail);

export default router;
