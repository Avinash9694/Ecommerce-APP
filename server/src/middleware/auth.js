import { User } from '../models/user.js';
import { verifyToken } from '../utils/jwt.js';
import { forbidden, unauthorized } from '../utils/http-error.js';
import { asyncHandler } from '../utils/async-handler.js';

function extractToken(req) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw unauthorized();

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    throw unauthorized(err?.name === 'TokenExpiredError' ? 'Session expired' : 'Invalid token');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw unauthorized('Account no longer exists');
  req.user = user;
  next();
});

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return next(forbidden('Admin access required'));
  next();
};
