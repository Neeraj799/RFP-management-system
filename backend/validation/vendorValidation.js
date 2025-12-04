import Joi from "joi";

export const vendorSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  email: Joi.string().email().allow("", null),
  contactPerson: Joi.string().trim().allow("", null),
  phone: Joi.string().trim().allow("", null),
  notes: Joi.string().trim().allow("", null),
});
