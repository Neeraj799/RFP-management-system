import Proposal from "../models/proposal.js";
import { proposalSchema } from "../validation/proposalValidation.js";

export const createProposal = async (req, res) => {
  try {
    const { error } = proposalSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ success: false, error: error.details[0].message });

    const {
      rfp,
      vendor,
      rawText,
      totalPrice,
      currency,
      paymentTerms,
      warranty,
      items,
      parsed,
      attachments,
    } = req.body;

    const newProposal = new Proposal({
      rfp,
      vendor,
      rawText: rawText || "",
      totalPrice: totalPrice ?? 0,
      currency: currency || "USD",
      paymentTerms: paymentTerms || "",
      warranty: warranty || "",
      items: items || [],
      parsed: parsed ?? false,
      attachments: attachments || [],
    });

    const saved = await newProposal.save();
    return res
      .status(201)
      .json({ success: true, message: "Proposal created", proposal: saved });
  } catch (err) {
    console.error("createProposal error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server error" });
  }
};

export const listProposals = async (req, res) => {
  try {
    const filter = {};
    if (req.query.rfp) {
      filter.rfp = req.query.rfp;
    }
    const list = await Proposal.find(filter)
      .sort({ createdAt: -1 })
      .populate("vendor rfp");
    return res.json({
      success: true,
      message: "Proposals fetched",
      proposals: list,
    });
  } catch (err) {
    console.error("listProposals error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server error" });
  }
};

export const getProposalsByRfp = async (req, res) => {
  try {
    const { id: rfpId } = req.params;
    const list = await Proposal.find({ rfp: rfpId })
      .sort({ createdAt: -1 })
      .populate("vendor rfp");

    return res.json({
      success: true,
      message: "Proposals for RFP fetched",
      proposals: list,
    });
  } catch (err) {
    console.error("getProposalsByRfp error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server error" });
  }
};

export const getProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const proposal = await Proposal.findById(id).populate("vendor rfp");
    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }
    return res.json({
      success: true,
      message: "Proposal fetched",
      proposal: proposal,
    });
  } catch (err) {
    console.error("getProposal error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server error" });
  }
};

export const updateProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = proposalSchema.validate(req.body, {
      presence: "optional",
    });
    if (error) {
      return res
        .status(400)
        .json({ success: false, error: error.details[0].message });
    }
    const updated = await Proposal.findByIdAndUpdate(id, req.body, {
      new: true,
    }).populate("vendor rfp");
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, error: "Proposal not found" });
    }
    return res.json({
      success: true,
      message: "Proposal updated",
      proposal: updated,
    });
  } catch (err) {
    console.error("updateProposal error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server error" });
  }
};

export const deleteProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Proposal.findByIdAndDelete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, error: "Proposal not found" });
    }
    return res.json({ success: true, message: "Proposal deleted" });
  } catch (err) {
    console.error("deleteProposal error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server error" });
  }
};
