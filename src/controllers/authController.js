const jwt = require('jsonwebtoken');
require('dotenv').config();

function generateToken(req, res) {
  const user = req.body;
  const token = jwt.sign(user, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None'
  }).send({ success: true });
}

function clearToken(req, res) {
  res.clearCookie('token', { secure: process.env.NODE_ENV === 'production', sameSite: 'None' })
    .send({ success: true });
}

module.exports = { generateToken, clearToken };
