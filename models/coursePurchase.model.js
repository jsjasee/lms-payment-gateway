import mongoose from "mongoose";

const coursePurchaseSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course reference is required."],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required."],
    },
    amount: {
      type: Number,
      required: [true, "Purchase amount is required."],
      min: [0, "Amount must be non-negative"],
    },
    currency: {
      type: String,
      required: [true, "currency is required"],
      uppercase: true,
      default: "USD",
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "completed", "failed", "refunded"],
        message: "Please select a valid status",
      },
      default: "pending",
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
    },
    paymentId: {
      type: String,
      required: [true, "Payment ID is required"],
    },
    refundId: {
      type: String,
    },
    refundAmount: {
      type: Number,
      min: [0, "Refund amount must be non-negative"],
    },
    refundReason: {
      type: String,
    },
    metadata: {
      type: Map, // key value pairs, so like an object i guess?
      of: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, //  include virtuals in JSON output
    toObject: { virtuals: true }, //  include virtuals in object output
  },
);

// indexing makes searching faster (here, when there is a search of the user, the search is much faster)
coursePurchaseSchema.index({ user: 1, course: 1 }); // usually keep 1 or 2 in .index() so if we want to remove it we just remove that line, 1 means ascending index order
coursePurchaseSchema.index({ status: 1 });
coursePurchaseSchema.index({ createdAt: -1 }); // -1 means descending index order, the latest / larger values comes first

coursePurchaseSchema.virtual("isRefundable").get(function () {
  if (this.status !== "completed") return false;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.createdAt > thirtyDaysAgo; // true if it is within 30 day window
});

// method to process refund - stripe or razorpay will process the actual refund on their end
coursePurchaseSchema.methods.processRefund = async function (reason, amount) {
  this.status = "refunded";
  this.refundReason = reason;
  this.refundAmount = amount || this.amount; // either refund the FULL amount of the course or partial amount aka the amount passed inside
  return await this.save({ validateBeforeSave: false });
};

export const CoursePurchase = mongoose.model(
  "CoursePurchase",
  coursePurchaseSchema,
);
