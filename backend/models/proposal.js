import mongoose from "mongoose";

const proposalItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },

    qty: { type: Number, default: 0 },

    unitPrice: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
      default: 0,
    },

    notes: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const proposalSchema = new mongoose.Schema(
  {
    rfp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rfp",
      required: true,
    },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    rawText: { type: String, default: "" },

    totalPrice: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "USD",
    },

    paymentTerms: {
      type: String,
      default: "",
    },

    warranty: {
      type: String,
      default: "",
    },

    items: {
      type: [proposalItemSchema],
      default: [],
    },

    parsed: {
      type: Boolean,
      default: false,
    },

    attachments: [
      {
        filename: String,
        path: String,
        mimetype: String,
        size: Number,
      },
    ],
  },

  { timestamps: true }
);

const Proposal = mongoose.model("Proposal", proposalSchema);

export default Proposal;
