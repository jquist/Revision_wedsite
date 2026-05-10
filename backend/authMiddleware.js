const jwt = require("jsonwebtoken");
const { getUserById } = require("./db");

function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing auth token." });
  }

  const token = header.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-change-me");
    const user = getUserById(payload.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    req.user = {
      userId: user.userId,
      username: user.username
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired auth token." });
  }
}

module.exports = requireAuth;
