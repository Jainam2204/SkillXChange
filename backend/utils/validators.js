const { body, validationResult } = require("express-validator");

const normalizeSkill = (skill) =>
  typeof skill === "string" ? skill.trim().toLowerCase() : "";

const registerStrategy = () => [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .matches(/^[A-Za-z]+(?: [A-Za-z]+)*$/)
    .withMessage("Name must contain only letters and spaces"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .withMessage("Invalid email format"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .matches(
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,14}$/
    )
    .withMessage(
      "Password must be 6-14 chars, include uppercase, lowercase, digit, and special character"
    ),

  body("skillsHave")
    .isArray({ min: 1, max: 3 })
    .withMessage("You must provide 1 to 3 skills in 'skillsHave'")
    .customSanitizer((arr) =>
      (arr || [])
        .map((s) => normalizeSkill(s))
        .filter((s) => s !== "")
    )
    .custom((arr) => {
      if (!arr.length) {
        throw new Error("You must provide at least 1 skill in 'skillsHave'");
      }

      if (new Set(arr).size !== arr.length) {
        throw new Error("'skillsHave' contains duplicate skills");
      }

      return true;
    }),

  body("skillsWant")
    .isArray({ min: 1, max: 3 })
    .withMessage("You must provide 1 to 3 skills in 'skillsWant'")
    .customSanitizer((arr) =>
      (arr || [])
        .map((s) => normalizeSkill(s))
        .filter((s) => s !== "")
    )
    .custom((arr, { req }) => {
      if (!arr.length) {
        throw new Error("You must provide at least 1 skill in 'skillsWant'");
      }

      if (new Set(arr).size !== arr.length) {
        throw new Error("'skillsWant' contains duplicate skills");
      }

      const have = (req.body.skillsHave || []).map(normalizeSkill);
      const overlap = arr.filter((skill) => have.includes(skill));

      if (overlap.length > 0) {
        throw new Error(
          `These skills cannot be in both 'skillsHave' and 'skillsWant': ${overlap.join(
            ", "
          )}`
        );
      }

      return true;
    }),
];

const loginStrategy = () => [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .withMessage("Invalid email format"),

  body("password").notEmpty().withMessage("Password is required"),
];

const verificationStrategy = () => [
  body("verificationCode")
    .trim()
    .notEmpty()
    .withMessage("Verification code is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("Verification code must be exactly 6 digits")
    .matches(/^\d+$/)
    .withMessage("Verification code must contain only digits"),
];

const strategies = {
  register: registerStrategy,
  login: loginStrategy,
  verification: verificationStrategy,
};

const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

const useValidation = (strategyName) => {
  const strategy = strategies[strategyName];

  if (!strategy) {
    throw new Error(`Unknown validation strategy: ${strategyName}`);
  }
  return [...strategy(), validateResult];
};

module.exports = {
  useValidation,
};
