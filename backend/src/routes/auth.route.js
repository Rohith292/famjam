import express from "express";
import { checkAuth, deleteAccount, login, logout, signup, updateProfile ,updateProfileDetails} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { uploadSingleImage } from "../middleware/multer.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-details",protectRoute,updateProfileDetails);
router.put("/update-profile", protectRoute,uploadSingleImage, updateProfile);

router.get("/check",protectRoute,  checkAuth);
router.delete("/delete-account",protectRoute,deleteAccount);

export default router;
