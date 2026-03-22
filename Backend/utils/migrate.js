require("dotenv").config();
const mongoose = require("mongoose");
const Student = require("../models/Student.model");

const migrate = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  // Set all existing verified students to active
  const verifiedResult = await Student.updateMany(
    { isVerified: true, accountStatus: { $exists: false } },
    {
      accountStatus: "active",
      source: "self_signup",
    }
  );

  // Set all existing unverified students to pending_verification
  const unverifiedResult = await Student.updateMany(
    { isVerified: false, accountStatus: { $exists: false } },
    {
      accountStatus: "pending_verification",
      source: "self_signup",
    }
  );

  console.log(`✅ Migrated ${verifiedResult.modifiedCount} verified students → active`);
  console.log(`✅ Migrated ${unverifiedResult.modifiedCount} unverified students → pending_verification`);

  await mongoose.disconnect();
  console.log("Migration complete!");
};

migrate().catch(console.error);