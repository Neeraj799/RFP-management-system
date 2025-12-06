import Proposal from "../models/proposal.js";
import Rfp from "../models/rfp.js";
import { compareVendorsWithAI } from "../utils/compareVendorsAi.js";
import { rfpSchema } from "../validation/rfpValidation.js";

export const createRfp = async (req, res) => {
  try {
    const { error } = rfpSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ success: false, error: error.details[0].message });

    const {
      title,
      description,
      budget,
      currency,
      deliveryDays,
      paymentTerms,
      warranty,
      lineItems,
    } = req.body;

    const newRfp = new Rfp({
      title,
      description,
      budget,
      currency,
      deliveryDays,
      paymentTerms,
      warranty,
      lineItems: lineItems || [],
    });

    const saved = await newRfp.save();
    return res
      .status(201)
      .json({ success: true, message: "RFP created successfully", rfp: saved });
  } catch (err) {
    console.error("createRfp error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server error" });
  }
};

export const listRfps = async (req, res) => {
  try {
    const rfps = await Rfp.find().sort({ createdAt: -1 }).populate("sentTo");
    return res.json({ success: true, message: "RFP list fetched", rfps });
  } catch (err) {
    console.error("listRfps error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server error" });
  }
};

export const getRfp = async (req, res) => {
  try {
    const { id } = req.params;
    const rfp = await Rfp.findById(id).populate("sentTo");

    if (!rfp) {
      return res.status(404).json({ success: false, error: "RFP not found" });
    }

    return res.json({
      success: true,
      message: "RFP fetched successfully",
      rfp,
    });
  } catch (err) {
    console.error("getRfp error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server error" });
  }
};

export const updateRfp = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = rfpSchema.validate(req.body, { presence: "optional" });

    if (error)
      return res
        .status(400)
        .json({ success: false, error: error.details[0].message });

    const {
      title,
      description,
      budget,
      currency,
      deliveryDays,
      paymentTerms,
      warranty,
      lineItems,
    } = req.body;

    const updatePayload = {
      ...req.body,
      ...(lineItems === null ? { lineItems: [] } : {}),
    };

    const updated = await Rfp.findByIdAndUpdate(id, updatePayload, {
      new: true,
    }).populate("sentTo");

    if (!updated) {
      return res.status(404).json({ success: false, error: "RFP not found" });
    }
    return res.json({ success: true, message: "RFP updated", rfp: updated });
  } catch (err) {
    console.error("updateRfp error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server error" });
  }
};

export const deleteRfp = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Rfp.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ success: false, error: "RFP not found" });

    return res.json({ success: true, message: "RFP deleted successfully" });
  } catch (err) {
    console.error("deleteRfp error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server error" });
  }
};

export const addVendorToRfp = async (req, res) => {
  try {
    const { id, vendorId } = req.params;
    const updated = await Rfp.findByIdAndUpdate(
      id,
      { $addToSet: { sentTo: vendorId }, $set: { status: "sent" } },
      { new: true }
    ).populate("sentTo");
    if (!updated)
      return res
        .status(404)
        .json({ success: false, error: "RFP or Vendor not found" });
    return res.json({
      success: true,
      message: "Vendor added to RFP",
      rfp: updated,
    });
  } catch (err) {
    console.error("addVendorToRfp error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server error" });
  }
};

export const compareVendors = async (req, res) => {
  try {
    const rfpId = req.params.id;

    const rfp = await Rfp.findById(rfpId);
    if (!rfp)
      return res.status(404).json({ success: false, error: "RFP not found" });

    const proposals = await Proposal.find({ rfp: rfpId }).populate(
      "vendor",
      "name email"
    );

    if (proposals.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No vendor proposals found for this RFP",
      });
    }

    const aiResult = await compareVendorsWithAI(rfp, proposals);

    return res.json({
      success: true,
      rfpId,
      vendorCount: proposals.length,
      ...aiResult,
    });
  } catch (err) {
    console.error("Compare vendors error:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to compare vendors" });
  }
};
