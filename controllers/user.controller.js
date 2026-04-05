import { User } from "../models/user.model.js";
import { ApiError, catchAsync } from "../middleware/error.middleware.js";
import { generateToken } from "../utils/generateToken.js";
import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";

export const createUserAccount = catchAsync(async (req, res, next) => {
  const { name, email, password, role = "student" } = req.body;

  // check if user exists (we will do validations globally)
  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    throw new ApiError("User already exists", 400);
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role,
  });

  await user.updateLastActive();
  generateToken(res, user, "Account created successfully");
});

export const authenticateUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = User.findOne({ email: email.toLowerCase() }).select("+password"); // grab the password field explicitly since select is set to false in the user model for password field

  if (!user || (await user.comparePassword(password))) {
    throw new ApiError("Invalid email or password", 401);
  }

  await user.updateLastActive();
  generateToken(res, user, `Welcome back ${user.name}`);
});

export const signOutUser = catchAsync(async (req, res) => {
  res.cookie("token", "", { maxAge: 0 }); // clean the cookies
  res.status(200).json({
    success: true,
    message: "Signed out successfully",
  });
});

export const getCurrentUserProfile = catchAsync(async (req, res) => {
  // before this code hits, the middleware has already executed and the id is attached to the req.
  const user = User.findById(req.id).populate({
    path: "enrolledCourses.course",
    select: "title thumbnail description", // separate the fields you want to grab with a space.
  });
  // we want to populate more info from the enrolledCourses instead of just a list of objectIds

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  res.status(200).json({
    success: true,
    data: {
      ...user.toJSON(),
      totalEnrolledCourses: user.totalEnrolledCourses, // this is grabbing a virtual field, with the auto calculation done
    },
  });
});

export const updateUserProfile = catchAsync(async (req, res) => {
  const { name, email, bio } = req.body;
  const updateData = {
    name,
    email: email?.toLowerCase(),
    bio,
  };

  // in case user wants to update avatar
  // we are expecting that multer middleware is there, allowing us to handle the file
  if (req.file) {
    const avatarResult = await uploadMedia(req.file.path); // multer will give us the req.file
    updateData.avatar = avatarResult.secure_url; // avatarResult is a cloudinary object

    // delete old avatar
    // 1. find the user
    const user = await User.findById(req.id);
    if (user.avatar && user.avatar !== "default-avatar.png") {
      await deleteMediaFromCloudinary(user.avatar); // user.avatar stores the url
    }
  }

  // update user and get updated doc
  const updatedUser = await User.findByIdAndUpdate(req.id, updateData, {
    new: true,
    runValidators: true, // data provided by user, best to run validators
  });

  if (!updatedUser) {
    throw new ApiError("User not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: updatedUser,
  });
});
