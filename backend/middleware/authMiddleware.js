const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(403).json({ error: 'No token provided' });
  }

  // Token format: "Bearer <token>"
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: 'Token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    req.user = decoded; // { id, username, role }
    next();
  });
}

function verifyAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user && req.user.role === 'Admin') {
      next();
    } else {
      res.status(403).json({ error: 'Admin privileges required' });
    }
  });
}

module.exports = {
  verifyToken,
  verifyAdmin,
  JWT_SECRET
};
