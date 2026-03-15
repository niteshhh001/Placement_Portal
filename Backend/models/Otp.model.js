const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  data: { type: Object }, // stores registration data temporarily
  createdAt: { type: Date, default: Date.now, expires: 600 }, // auto delete after 10 minutes
});

module.exports = mongoose.model("Otp", otpSchema);