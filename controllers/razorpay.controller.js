import Razorpay from "razorpay";

import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/courseProgress.js";
import { ApiError } from "../middleware/error.middleware.js";
import crypto from "node:crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// or can use the catchAsync function that we created in error.middleware.js
export const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.id;
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const newPurchase = new CoursePurchase({
      course: courseId,
      user: userId,
      amount: course.price,
      status: "pending",
    });

    const options = {
      amount: course.price * 100, // this is in the minimum amount in local currency (for usd it is cents)
      currency: "USD",
      receipt: `course_${courseId}`,
      notes: {
        courseId: courseId,
        userId: userId,
      },
    };

    const order = await razorpay.orders.create(options);

    newPurchase.paymentId = order.id;
    await newPurchase.save();

    res.status(200).json({
      success: true,
      order,
      course: {
        name: course.title,
        description: course.description,
      },
    });
  } catch (error) {
    // Todo: handle errors
    throw new ApiError("Error handling payment", 404);
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // this is a specific format in the docs
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    // also from razorpay docs
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const purchase = await CoursePurchase.findOne({
      paymentId: razorpay_order_id,
    });

    if (!purchase) {
      return res.status(404).json({ message: "Purcahse record not found" });
    }

    purchase.status = "completed";
    await purchase.save();

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      courseId: purchase.course,
    });
  } catch (error) {
    // handle errors
  }
};
