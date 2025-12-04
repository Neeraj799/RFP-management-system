import Vendor from "../models/vendor.js";
import { vendorSchema } from "../validation/vendorValidation.js";

export const createVendor = async (req, res) => {
  try {
    const { name, email, contactPerson, phone, notes } = req.body;

    const { error } = vendorSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const newVendor = new Vendor({
      name,
      email,
      contactPerson,
      phone,
      notes,
    });

    const vendor = await newVendor.save();

    return res
      .status(201)
      .json({ message: "Vendor created successfully", vendor });
  } catch (err) {
    console.error("createVendor error:", err);
    return res.status(500).json({ error: "Internal Server error" });
  }
};

export const listVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().sort({ createdAt: -1 });
    return res.json({ message: "Vendor list fetched successfully", vendors });
  } catch (err) {
    console.error("listVendors error:", err);
    return res.status(500).json({ error: "Internal Server error" });
  }
};

export const getVendor = async (req, res) => {
  try {
    const { id: vendorId } = req.params;
    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({ error: "vendor not found" });
    }

    return res.json({ message: "Vendor fetched succesfully", vendor });
  } catch (err) {
    console.error("getVendor error:", err);
    return res.status(500).json({ error: "Internal Server error" });
  }
};

export const updateVendor = async (req, res) => {
  try {
    const { id: vendorId } = req.params;

    const { error } = vendorSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, email, contactPerson, phone, notes } = req.body;

    const updated = await Vendor.findByIdAndUpdate(
      vendorId,
      { name, email, contactPerson, phone, notes },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    return res.json({ message: "Vendor updated successfully", updated });
  } catch (err) {
    console.error("updatedVendor error:", err);
    return res.status(500).json({ error: "Internal Server error" });
  }
};

export const deleteVendor = async (req, res) => {
  try {
    const { id: vendorId } = req.params;

    const deleteVendor = await Vendor.findByIdAndDelete(vendorId);

    return res.json({ message: "Vendor deleted successfully" });
  } catch (err) {
    console.error("updatedVendor error:", err);
    return res.status(500).json({ error: "Internal Server error" });
  }
};
