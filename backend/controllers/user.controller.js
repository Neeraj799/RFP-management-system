import envConfig from "../config/envConfig.js";
import {
  userLoginValidation,
  userSignupValidation,
} from "../helpers/authValidation.js";
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const register = async (req, res) => {
  try {
    const { error } = userSignupValidation.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      console.log(error);
      return res.status(403).json({ error: error.details });
    }

    const { username, email, password } = req.body;

    const user = await User.findOne({ email });

    if (user) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    return res
      .status(201)
      .json({ success: true, message: "Signup successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const login = async (req, res) => {
  try {
    const { error } = userLoginValidation.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      console.log(error);

      return res.status(403).json({ error: error.details });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid credentails" });
    }

    const token = jwt.sign(
      { email: user.email, userId: user._id },
      envConfig.general.APP_KEY,
      { expiresIn: "24h" }
    );

    return res
      .status(200)
      .json({ success: true, message: "User login successfully", token, user });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export { register, login };
