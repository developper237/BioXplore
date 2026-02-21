const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

function getTokenExpiration(expiresIn) {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return null;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  const now = new Date();
  
  switch (unit) {
    case 's': return new Date(now.getTime() + value * 1000);
    case 'm': return new Date(now.getTime() + value * 60 * 1000);
    case 'h': return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'd': return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    default: return null;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getTokenExpiration,
  JWT_REFRESH_EXPIRES_IN
};