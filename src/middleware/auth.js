const jwt = require('jsonwebtoken');
require('dotenv').config();

function verifyToken(req, res, next) {
  const token = req?.cookies?.token;
  if (!token) return res.status(401).send({ message: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ message: 'Unauthorized' });
    req.decoded = decoded;
    next();
  });
}

module.exports = verifyToken;
