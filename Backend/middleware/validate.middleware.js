const Joi = require("joi");

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const message = error.details.map((d) => d.message.replace(/['"]/g, "")).join(", ");
    return res.status(400).json({ success: false, message });
  }
  next();
};

const registerStudentSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  rollNo: Joi.string().required(),
  branch: Joi.string().valid("CSE", "IT", "ECE", "EEE", "ME", "CE", "CHEM", "OTHER").required(),
  year: Joi.number().valid(1, 2, 3, 4).required(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const createJobSchema = Joi.object({
  companyName: Joi.string().min(2).required(),
  jobRole: Joi.string().required(),
  jobType: Joi.string().valid("Full-time", "Intern", "Intern+PPO").default("Full-time"),
  ctc: Joi.number().positive().required(),
  stipend: Joi.number().positive(),
  location: Joi.array().items(Joi.string()),
  bond: Joi.number().min(0).default(0),
  jobDescription: Joi.string(),
  sector: Joi.string().valid("IT", "Core", "Finance", "Consulting", "Government", "Other"),
  eligibility: Joi.object({
    minCgpa: Joi.number().min(0).max(10).default(0),
    allowedBranches: Joi.array().items(Joi.string()).default(["ALL"]),
    maxActiveBacklogs: Joi.number().min(0).default(0),
    maxTotalBacklogs: Joi.number().min(0).default(0),
    allowPlaced: Joi.boolean().default(false),
    minYear: Joi.number().valid(1, 2, 3, 4).default(4),
  }),
  applicationDeadline: Joi.date().iso().required(),
  driveDate: Joi.date().iso(),
  isDreamCompany: Joi.boolean().default(false),
  rounds: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    date: Joi.date().iso(),
    venue: Joi.string(),
    description: Joi.string(),
  })),
});
const registerRequestSchema = Joi.object({
  name: Joi.string().min(2).max(60).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  rollNo: Joi.string().required(),
  branch: Joi.string().valid("CSE", "IT", "ECE", "EEE", "ME", "CE", "CHEM", "OTHER").required(),
  year: Joi.number().valid(1, 2, 3, 4).required(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required(),
});

module.exports = {
  validate,
  registerStudentSchema,
  registerRequestSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  loginSchema,
  createJobSchema,
};