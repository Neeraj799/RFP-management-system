import mongoose from "mongoose";

const lineItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },

    qty: {
      type: Number,
    },

    specs: {
      type: String,
    },
  },

  { _id: false }
);

const rfpSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    budget: {
      type: Number,
    },

    currency: {
      type: String,
      default: "USD",
    },

    deliveryDays: {
      type: Number,
    },

    paymentTerms: {
      type: String,
    },

    warranty: {
      type: String,
    },

    lineItems: {
      type: [lineItemSchema],
      default: [],
    },

    sentTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
      },
    ],

    status: {
      type: String,
      enum: ["draft", "sent", "closed"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

const Rfp = mongoose.model("Rfp", rfpSchema);

export default Rfp;
