import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verifyToken = (req, res, next) => {
  // Get token from header (usually "Bearer <token>")
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access Denied. No token provided." });
  }

  try {
    // Verify token using your secret key
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach the user data (user_id, email, etc.) to the request object
    req.user = verified;
    
    next(); // Move to the controller
  } catch (err) {
    res.status(403).json({ message: "Invalid or Expired Token" });
  }
};