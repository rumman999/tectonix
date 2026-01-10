import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verifyToken = (req, res, next) => {
  const tokenHeader = req.header("Authorization");

  if (!tokenHeader) {
    return res.status(401).json({ message: "Access Denied. No token provided." });
  }

  try {
    const token = tokenHeader.split(" ")[1];

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = verified;
    next(); 

  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};