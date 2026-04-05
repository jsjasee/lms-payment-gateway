export class ApiError extends Error {
  constructor(message, statusCode) {
    super(message); // we call the constructor from the Error class
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : error;
    this.isOperational = true; // optional

    Error.captureStackTrace(this, this.constructor); // what even is this??
  }
}

// we don't want to do try catch for every file (this is done in prev projects) - i don't understand this??
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
