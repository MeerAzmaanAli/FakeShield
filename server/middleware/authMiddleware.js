const jwt = require('jsonwebtoken');
const UserSchema = require("../models/User");

exports.protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"

  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // { id: "abc123", iat, exp }
    req.user = await UserSchema.findById(decoded.id).select('-password'); // attach user, strip password
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};
