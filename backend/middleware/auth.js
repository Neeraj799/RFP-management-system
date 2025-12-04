import jwt from "jsonwebtoken";
import envConfig from "../config/envConfig.js";

const adminAuth = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.json({ message: "Unauthorized, JWT token is required" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized, Invalid token format" });
  }

  try {
    const decoded = jwt.verify(token, envConfig.general.APP_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({
        success: false,
        message: "Unauthorized, JWT token is wrong or expired",
      });
  }
};

export { adminAuth };
