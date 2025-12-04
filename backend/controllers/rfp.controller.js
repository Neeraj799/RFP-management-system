import Rfp from "../models/rfp.js";
import { rfpSchema } from "../validation/rfpValidation.js";

export const createRfp = async (req, res) => {
  try {
    const { error } = rfpSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

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
      .json({ message: "RFP created successfully", rfp: saved });
  } catch (err) {
    console.error("createRfp error:", err);
    return res.status(500).json({ error: "Internal Server error" });
  }
};

export const listRfps = async (req, res) => {
  try {
    const rfps = await Rfp.find().sort({ createdAt: -1 }).populate("sentTo");
    return res.json({ message: "RFP list fetched", rfps });
  } catch (err) {
    console.error("listRfps error:", err);
    return res.status(500).json({ error: "Internal Server error" });
  }
};

export const getRfp = async (req, res) => {
  try {
    const { id } = req.params;
    const rfp = await Rfp.findById(id).populate("sentTo");

    if (!rfp) {
      return res.status(404).json({ error: "RFP not found" });
    }

    return res.json({ message: "RFP fetched successfully", rfp });
  } catch (err) {
    console.error("getRfp error:", err);
    return res.status(500).json({ error: "Internal Server error" });
  }
};

export const updateRfp = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = rfpSchema.validate(req.body, { presence: "optional" });

    if (error) return res.status(400).json({ error: error.details[0].message });

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
      return res.status(404).json({ error: "RFP not found" });
    }
    return res.json({ message: "RFP updated", rfp: updated });
  } catch (err) {
    console.error("updateRfp error:", err);
    return res.status(500).json({ error: "Internal Server error" });
  }
};

export const deleteRfp = async (req, res) => {
  try {
    const { id } = req.params;

    await Rfp.findByIdAndDelete(id);

    return res.json({ message: "RFP deleted successfully" });
  } catch (err) {
    console.error("deleteRfp error:", err);
    return res.status(500).json({ error: "Internal Server error" });
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
      return res.status(404).json({ error: "RFP or Vendor not found" });
    return res.json({ message: "Vendor added to RFP", rfp: updated });
  } catch (err) {
    console.error("addVendorToRfp error:", err);
    return res.status(500).json({ error: "Internal Server error" });
  }
};
