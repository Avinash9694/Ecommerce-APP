import mongoose from 'mongoose';
import { cleanJson } from './plugins.js';

export const USER_ROLES = ['user', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    role: { type: String, enum: USER_ROLES, default: 'user' },
  },
  { timestamps: true },
);

cleanJson(userSchema, { omit: ['passwordHash'] });

export const User = mongoose.model('User', userSchema);
