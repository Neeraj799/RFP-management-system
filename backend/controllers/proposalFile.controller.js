// backend/controllers/proposalFileController.js
import Proposal from "../models/proposal.js";
import fs from "fs";
import path from "path";

const fileToAttachment = (file, req) => {
  const absoluteUrl = `${req.protocol}://${req.get("host")}/uploads/${
    file.filename
  }`;
  return {
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url: absoluteUrl,
  };
};

export const uploadAttachmentsToProposal = async (req, res) => {
  try {
    const { id: proposalId } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }
    const attachments = req.files.map((file) => fileToAttachment(file, req));

    const updated = await Proposal.findByIdAndUpdate(
      proposalId,
      { $push: { attachments: { $each: attachments.map((a) => a.url) } } },
      { new: true }
    ).populate("vendor rfp");

    if (!updated) return res.status(404).json({ error: "Proposal not found" });

    return res.json({
      message: "Files uploaded",
      attachments,
      proposal: updated,
    });
  } catch (err) {
    console.error("uploadAttachmentsToProposal error:", err);
    return res
      .status(500)
      .json({ error: "Internal Server error", message: err.message });
  }
};

export const createProposalWithFiles = async (req, res) => {
  try {
    const {
      rfp,
      vendor,
      rawText = "",
      totalPrice = 0,
      currency = "USD",
      paymentTerms = "",
      warranty = "",
      parsed = false,
    } = req.body;

    let items = [];
    if (req.body.items) {
      try {
        items =
          typeof req.body.items === "string"
            ? JSON.parse(req.body.items)
            : req.body.items;
      } catch (e) {
        return res.status(400).json({ error: "Invalid items JSON" });
      }
    }
    const attachments = (req.files || []).map((file) =>
      fileToAttachment(file, req)
    );

    const newProposal = new Proposal({
      rfp,
      vendor,
      rawText,
      totalPrice: Number(totalPrice),
      currency,
      paymentTerms,
      warranty,
      items,
      parsed,
      attachments: attachments.map((a) => a.url),
    });

    const saved = await newProposal.save();
    const populated = await Proposal.findById(saved._id).populate("vendor rfp");

    return res.status(201).json({
      message: "Proposal created with files",
      proposal: populated,
      attachments,
    });
  } catch (err) {
    console.error("createProposalWithFiles error:", err);
    return res
      .status(500)
      .json({ error: "Internal Server error", message: err.message });
  }
};

export const deleteAttachmentFromProposal = async (req, res) => {
  try {
    const { id: proposalId } = req.params;
    const { url, filename } = req.body;
    if (!url && !filename)
      return res.status(400).json({ error: "url or filename required" });

    // derive filename
    const fname = filename || url.split("/").pop();

    const possibleUrls = [
      url,
      `/uploads/${fname}`,
      `${req.protocol}://${req.get("host")}/uploads/${fname}`,
    ].filter(Boolean);

    const updated = await Proposal.findByIdAndUpdate(
      proposalId,
      { $pull: { attachments: { $in: possibleUrls } } },
      { new: true }
    ).populate("vendor rfp");

    if (!updated) return res.status(404).json({ error: "Proposal not found" });

    const filePath = path.resolve("backend/uploads", fname);
    fs.unlink(filePath, (err) => {
      if (err)
        console.warn("Could not delete file from disk:", filePath, err.message);
    });

    return res.json({ message: "Attachment removed", proposal: updated });
  } catch (err) {
    console.error("deleteAttachmentFromProposal error:", err);
    return res.status(500).json({ error: "Internal Server error" });
  }
};
