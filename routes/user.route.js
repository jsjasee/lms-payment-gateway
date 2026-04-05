import express from "express";
import {
  authenticateUser,
  createUserAccount,
  getCurrentUserProfile,
  signOutUser,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import upload from "../utils/multer.js";
import { validateSignUp } from "../middleware/validation.middleware.js";

const router = express.Router();

// Auth routes
router.post("/signup", validateSignUp, createUserAccount); // we don't have isAuthenticated on sign up route, so we can use validateSignUp aka our middleware that we created in a file.
router.post("/signin", authenticateUser);
router.post("/signout", signOutUser);

// Profile routes
router.get("/profile", isAuthenticated, getCurrentUserProfile); // inject middleware (isAuthenticated) so our request has the .id property
router.put(
  "/profile",
  isAuthenticated,
  upload.single("avatar"),
  updateUserProfile,
);
// we are expecting the field in the form to be named as "avatar"

export default router;
