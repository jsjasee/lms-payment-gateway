import jwt from "jsonwebtoken";

export const generateToken = (res, user, message) => {
  const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
    expiresIn: "1d",
  });

  // access the cookies and store the token in the cookies
  return res
    .status(200)
    .cookie("token", token, {
      httpOnly: true, // can only be modify by server not user,
      sameSite: "strict", // never send the cookie with cross-site requests, only send the cookie if request originates from the exact same site where the cookies is set, prevents against cross site request forgery attacks
      maxAge: 24 * 60 * 1000,
    })
    .json({
      success: true,
      message,
      user,
      token,
    }); // 1st and 2nd params  in .cookie() mean key is "token", and value is token, 3rd params is the options
};
