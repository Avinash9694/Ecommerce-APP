import { User } from '../models/user.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { HttpError, conflict } from '../utils/http-error.js';

const invalidCredentials = () =>
  new HttpError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password');

export async function register(req, res) {
  const { name, email, password, phone, address } = req.validated.body;

  const existing = await User.findOne({ email });
  if (existing) throw conflict('EMAIL_TAKEN', 'An account with that email already exists');

  const user = await User.create({
    name,
    email,
    phone,
    address,
    passwordHash: await hashPassword(password),
  });

  res.status(201).json({ user, token: signToken(user) });
}

export async function login(req, res) {
  const { email, password } = req.validated.body;

  const user = await User.findOne({ email });
  // Same response for unknown email and wrong password so accounts can't be enumerated.
  if (!user) throw invalidCredentials();
  const match = await comparePassword(password, user.passwordHash);
  if (!match) throw invalidCredentials();

  res.json({ user, token: signToken(user) });
}

export async function me(req, res) {
  res.json({ user: req.user });
}

export async function updateProfile(req, res) {
  Object.assign(req.user, req.validated.body);
  await req.user.save();
  res.json({ user: req.user });
}
