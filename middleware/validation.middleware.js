import { body, param, query, validationResult } from "express-validator";
import { ApiError } from "./error.middleware.js";

export const validate = (validations) => {
  return async (req, res, next) => {
    // run all validation
    await Promise.all(validations.map((validation) => validation.run(req))); // for all the validations run the validation

    // in the docs, the result of the validations is auto thrown in validationResult in express-validator ?? no need store as a variable??
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // do we use the extractedError at all??
    const extractedError = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    throw new ApiError("Error validating req", 500);
  };
};

// need to digest this?
export const commonValidations = {
  // pagination comes in the query like ?page=1 ??
  pagination: [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("limit must be between 1 and 100"),
  ],
  email: body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  name: body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Please provide a valid name"),
};

export const validateSignUp = validate([
  commonValidations.email,
  commonValidations.name,
]);
