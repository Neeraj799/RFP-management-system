import Joi from "joi";

const proposalItem = Joi.object({
  name: Joi.string().trim().min(1).required(),
  qty: Joi.number().integer().min(0).required(),
  unitPrice: Joi.number().precision(2).required(),
  total: Joi.number().precision(2).required(),
  notes: Joi.string().trim().allow("", null),
}).unknown(true);

export const proposalSchema = Joi.object({
  rfp: Joi.string().hex().length(24).required(),
  vendor: Joi.string().hex().length(24).required(),
  rawText: Joi.string().allow("", null), // keep rawText as you wanted
  totalPrice: Joi.number().precision(2).allow(null),
  currency: Joi.string().trim().allow("", null),
  paymentTerms: Joi.string().trim().allow("", null),
  warranty: Joi.string().trim().allow("", null),
  items: Joi.array().items(proposalItem).allow(null),
  parsed: Joi.boolean().allow(null),
  attachments: Joi.array().items(Joi.string()).allow(null),
});
