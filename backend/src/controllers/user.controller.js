// controllers/user.controller.js
import User from "../models/user.model.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "fullName email"); // Only expose safe fields
    res.json({ users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Failed to fetch users." });
  }
};
