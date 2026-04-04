import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Lecture title is required"],
      trim: true,
      maxLength: [100, "Lecture title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxLength: [500, "Lecture description cannot exceed 500 characters"],
    },
    videoUrl: {
      type: String,
      required: [true, "Video URL is required"],
    },
    duration: {
      type: Number, // third party providers like cloudinary will provide us the duration
      default: 0,
    },
    publicId: {
      type: String,
      required: [true, "Public ID is required for video management."],
    }, // cloudinary gives us a publicId which helps us to track and delete them
    isPreview: {
      type: Boolean,
      default: false,
    }, // making the lecture available to audiences
    order: {
      type: Number,
      required: [true, "Lecture order is required"],
    }, // this is for lecture #1, lecture #2, in case user wants to drag and reorder the fields
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, //  include virtuals in JSON output
    toObject: { virtuals: true }, //  include virtuals in object output
  },
);

// prehook
lectureSchema.pre("save", function (next) {
  if (this.duration) {
    this.duration = Math.round(this.duration * 100) / 100; // optional, just to round duration to 2dp??
  }
});

export const Lecture = mongoose.model("Lecture", lectureSchema);
