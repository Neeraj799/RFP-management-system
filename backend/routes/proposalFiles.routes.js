// backend/routes/proposalFiles.js
import express from "express";
import {
  createProposalWithFiles,
  deleteAttachmentFromProposal,
  uploadAttachmentsToProposal,
} from "../controllers/proposalFile.controller.js";
import upload from "../middleware/multerConfig.js";

const router = express.Router();

// upload files to an existing proposal (multipart/form-data) field name: files
router.post(
  "/:id/attachments",
  upload.array("files", 10),
  uploadAttachmentsToProposal
);

// create a proposal with files in one call (multipart/form-data)
router.post(
  "/create-with-files",
  upload.array("files", 10),
  createProposalWithFiles
);

router.delete("/:id/attachments", deleteAttachmentFromProposal);

export default router;
