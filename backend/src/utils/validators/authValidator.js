const slugify = require("slugify");
// const bcrypt = require("bcryptjs");
const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const User = require("../../models/userModel");

exports.signupValidator = [
  check("name")
    .notEmpty()
    .withMessage("Name required")
    .isLength({ min: 3 })
    .withMessage("Too short name")
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check("email")
    .notEmpty()
    .withMessage("Email Required")
    .isEmail()
    .withMessage("Invalid Email Address")
    .custom((val) =>
      User.findOne({ email: val }).then((user) => {
        if (user) {
          return Promise.reject(new Error("Email Already Exists"));
        }
      })
    ),

  check("password")
    .notEmpty()
    .withMessage("Password required")
    .isLength({ minLength: 6 })
    .withMessage("Passowrd must be at least 6 characters")
    .custom((password, { req }) => {
      if (password !== req.body.passwordConfirm) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  check("passwordConfirm")
    .notEmpty()
    .withMessage("Password confirmation required"),
  validatorMiddleware,
];

exports.loginValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email Required")
    .isEmail()
    .withMessage("Invalid Email Address"),

  check("password")
    .notEmpty()
    .withMessage("Password required")
    .isLength({ minLength: 6 })
    .withMessage("Passowrd must be at least 6 characters"),
  validatorMiddleware,
];

//Changing password having the forms CurrentPassword and ConfrimPassword
// exports.changeUserPasswordValidator = [
//   check("id").isMongoId().withMessage("Invalid User id format"),
//   body("currentPassword")
//     .notEmpty()
//     .withMessage("You must enter your current password"),
//   body("passwordConfirm")
//     .notEmpty()
//     .withMessage("You must enter the password confirm"),
//   body("password")
//     .notEmpty()
//     .withMessage("You must enter new password")
//     .custom(async (val, { req }) => {
//       // 1) Verify current password
//       const user = await User.findById(req.params.id);
//       if (!user) {
//         throw new Error("There is no user for this id");
//       }
//       const isCorrectPassword = await bcrypt.compare(
//         req.body.currentPassword,
//         user.password
//       );
//       if (!isCorrectPassword) {
//         throw new Error("Incorrect current password");
//       }

//       // 2) Verify password confirm
//       if (val !== req.body.passwordConfirm) {
//         throw new Error("Password Confirmation incorrect");
//       }
//       return true;
//     }),
//   validatorMiddleware,
// ];
