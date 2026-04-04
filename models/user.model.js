import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxLength: [50, "Name cannot exceed 50 characters"], // the 2nd part is the error message
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: true,
      lowercase: true,
      match: [
        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
        "Please provde a valid email",
      ], // we will write a regex expression, note that it is NOT wrapped in ""
    },
    password: {
      type: String,
      required: [true, "password is required"],
      minLength: [8, "Password must be at least 8 characters"],
      select: false, // when we make a query, this field will NOT be brought along with the query result i guess. if we need the field we will select that manually
    },
    role: {
      type: String,
      enum: {
        values: ["student", "instructor", "admin"],
        message: "Please select a valid role",
      },
      default: "student",
    },
    avatar: {
      type: String,
      default: "default-avatar.png", // placeholder, usually we store the avatar in cloudinary or some cloud provider
    },
    bio: {
      type: String,
      maxLength: [200, "Bio cannot exceed 200 characters"],
    },
    enrolledCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course", // specify which MODEL/SCHEMA you are referring to.
        },
        enrolledAt: {
          type: Date,
          default: Date.now, // don't write Date.now() - it will execute right now, we just want to store a reference
        },
      },
    ], // is an array, use [] or specify type to be Array
    createdCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, //  include virtuals in JSON output
    toObject: { virtuals: true }, //  include virtuals in object output
  },
);

// mongoose has prehooks (what to do before saving data) and posthooks (what you want to do after saving data)
// hashing the password - use function here NOT arrow function, they need the context
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);

  // next() is only added for hooks, because they are middleware, requires a signal, called automatically
  next(); // pass the code to whatever it needs to go next ('passing the baton')
});

// compare password (you can use user.comparePassword() to use this method)
// dont need next here because this is a standalone method and not called automatically!
userSchema.methods.comparePassword = async function (enterPassword) {
  return await bcrypt.compare(enterPassword, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes from now
  return resetToken;
  // 1 resettoken copy is saved in db, another copy is sent to user, later user when they click on the link, we will take the resettoken from user and search it up from the db to find that user, validate then reset password for them.
};

userSchema.methods.updateLastActive = async function () {
  this.lastActive = Date.now();
  return await this.save({ validateBeforeSave: false });
};

// Virtual fields -> these fields don't actually exist, but if someone access this field like '.totalEnrolledCourses' these we can calculate it on the go?
// Virtual field for total enrolled courses (the .get here is NOT like GET POST, it just how you are going to calculate the value for this field)
// we need to enable 2 options for virtual fields to SHOW UP (toJSON and toObject in the schema?) in  res.json(user) or user.toJSON() or user.toObject()
userSchema.virtual("totalEnrolledCourses").get(function () {
  return this.enrolledCourses?.length ?? 0;
});

export const User = mongoose.model("User", userSchema);
