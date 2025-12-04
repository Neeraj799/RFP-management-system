import Joi from "joi";

const lineItemSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  qty: Joi.number().integer().min(0).required(),
  specs: Joi.string().trim().allow("", null),
});

export const rfpSchema = Joi.object({
  title: Joi.string().trim().min(1).required(),
  description: Joi.string().trim().allow("", null),
  budget: Joi.number().precision(2).allow(null),
  currency: Joi.string().trim().allow("", null),
  deliveryDays: Joi.number().integer().min(0).allow(null),
  paymentTerms: Joi.string().trim().allow("", null),
  warranty: Joi.string().trim().allow("", null),
  lineItems: Joi.array().items(lineItemSchema).allow(null),
  // server handles sentTo/status but accept them if provided
  sentTo: Joi.array().items(Joi.string().hex().length(24)).allow(null),
  status: Joi.string().valid("draft", "sent", "closed").allow(null),
});
