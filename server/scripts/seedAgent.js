require("dotenv").config();

const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");

const run = async () => {
  try {
    await connectDB();

    const name = process.env.SEED_AGENT_NAME || "Threadline Support";
    const email = (process.env.SEED_AGENT_EMAIL || "agent@threadline.local").toLowerCase();
    const password = process.env.SEED_AGENT_PASSWORD || "ChangeMe123!";

    const existing = await User.findOne({ email });

    if (existing) {
      if (existing.role === "agent" || existing.role === "admin") {
        console.log(`Agent already exists: ${email}`);
        process.exit(0);
      }

      existing.role = "agent";
      await existing.save();
      console.log(`Existing user promoted to agent: ${email}`);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "agent",
    });

    console.log(`Agent created: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error("Agent seed failed:", error.message);
    process.exit(1);
  }
};

run();
