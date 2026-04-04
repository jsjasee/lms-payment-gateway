import mongoose from "mongoose";

const lectureProgressSchema = new mongoose.Schema({
  lecture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lecture",
    required: [true, "Lecture reference is required"],
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  watchTime: {
    type: Number,
    default: 0,
  },
  lastWatched: {
    type: Date,
    default: Date.now,
  },
});

const courseProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course reference is required"],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lectureProgress: [lectureProgressSchema], // each object in this array will be FOLLOW THE EXACT STRUCTURE lectureProgressSchema, you can also just write the entire schema in the [] as well, instead of creating it outside and storing it as a reference. (one example is the enrolledCourses field in the user schema, it is also an array of objs)

    lastAccessed: {
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

// calculate course completion
courseProgressSchema.pre("save", function (next) {
  if (this.lectureProgress.length > 0) {
    const completedLectures = this.lectureProgress.filter(
      (lp) => lp.isCompleted.length,
    ); // lp is lecture progress, aka the document in the lectureProgress array. so we can finding the documents which are marked as completed.

    this.completionPercentage = Math.round(
      (completedLectures / this.lectureProgress.length) * 100,
    ); // completed lectures divide by total lectures to get the %
    this.isCompleted = this.completionPercentage === 100; // if it is 100, then value is true, otherwise it is false
  }

  next();
});

// update last accessed
courseProgressSchema.methods.updateLastAccessed = async function () {
  this.lastAccessed = Date.now();
  return await this.save({ validateBeforeSave: false });
};

export const CourseProgress = mongoose.model("Course", courseProgressSchema); // the lectureProgressSchema is only used internally
