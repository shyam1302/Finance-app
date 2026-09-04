import Joi from 'joi';

export const createTransactionSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  type: Joi.string().valid('income', 'expense').required(),
  category: Joi.string().max(50).allow(''),
  merchant: Joi.string().max(100).allow(''),
  date: Joi.date().iso().required(),
  notes: Joi.string().allow('', null)
});

export const updateTransactionSchema = Joi.object({
  amount: Joi.number().positive().precision(2),
  type: Joi.string().valid('income', 'expense'),
  category: Joi.string().max(50).allow(''),
  merchant: Joi.string().max(100).allow(''),
  date: Joi.date().iso(),
  notes: Joi.string().allow('', null)
});
