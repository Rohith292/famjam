import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import Album from "../models/album.model.js";
import Image from "../models/image.model.js";
import Collaboration from "../models/collaboration.model.js";
import FamilyGroup from "../models/familyGroup.model.js";
import FamilyMember from "../models/family.model.js";
import ShareLink from "../models/shareLink.model.js";
import cloudinary from "../lib/cloudinary.js"; // Assuming cloudinary is used for profilePic uploads

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // Generate JWT token and set it as an HTTP-only cookie
      const token = generateToken(newUser._id, res); // Assuming generateToken now returns the token string

      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
        token: token, // <--- CRITICAL FIX: Include the token in the JSON response
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token and set it as an HTTP-only cookie
    const token = generateToken(user._id, res); // Assuming generateToken now returns the token string

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      token: token, // <--- CRITICAL FIX: Include the token in the JSON response
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 }); // Clear the JWT cookie
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id; // Assuming req.user is populated by your protectRoute middleware

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    // Assuming cloudinary.uploader.upload returns an object with secure_url
    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true } // Return the updated document
    );

    // If you also want to update the token (e.g., if user details are part of the token payload),
    // you might regenerate and send a new token here. For now, just sending updated user.
    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    // req.user should be populated by your protectRoute middleware if a valid token/cookie exists
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// auth.controller.js
// ... other imports
export const updateProfileDetails = async (req, res) => {
  try {
    const { fullName, email } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the fields if they are provided
    if (fullName) {
      user.fullName = fullName;
    }
    if (email) {
      user.email = email;
    }

    // Save the updated user document
    await user.save();

    // Respond with the updated user details
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });

  } catch (error) {
    console.error("Error in updateProfileDetails controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id; // assuming you use JWT middleware

    // 1. Remove user’s albums + related images
    const albums = await Album.find({ owner: userId });
    const albumIds = albums.map(a => a._id);

    await Image.deleteMany({ album: { $in: albumIds } });
    await Album.deleteMany({ owner: userId });

    // 2. Remove family members created by user
    await FamilyMember.deleteMany({ createdBy: userId });

    // 3. Remove user from family groups
    await FamilyGroup.updateMany(
      { "members.user": userId },
      { $pull: { members: { user: userId } } }
    );
    // If user was the creator, you might want to delete the group entirely:
    await FamilyGroup.deleteMany({ createdBy: userId });

    // 4. Remove collaborations (both as owner and collaborator)
    await Collaboration.deleteMany({
      $or: [{ familyMapOwnerId: userId }, { collaboratorId: userId }]
    });

    // 5. Remove share links
    await ShareLink.deleteMany({ familyMapOwnerId: userId });

    // 6. Remove user’s uploaded images (not tied to albums)
    await Image.deleteMany({ uploadedBy: userId });

    // 7. Finally, delete the user
    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "Account and all related data deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete account",
      error: error.message,
    });
  }
};

// Assuming generateToken is in ../lib/utils.js and looks something like this:
// import jwt from 'jsonwebtoken';
// export const generateToken = (userId, res) => {
//     const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
//         expiresIn: '15d', // Or whatever your expiration is
//     });
//     res.cookie("jwt", token, {
//         maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in ms
//         httpOnly: true, // Prevents XSS attacks
//         sameSite: "strict", // CSRF protection
//         secure: process.env.NODE_ENV !== "development", // Use secure cookies in production (HTTPS)
//     });
//     return token; // <--- MAKE SURE generateToken RETURNS THE TOKEN STRING!
// };
