import mongoose from 'mongoose';
import { cleanJson } from './plugins.js';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    image: { type: String, default: '' },
  },
  { timestamps: true },
);

cleanJson(categorySchema);

export const Category = mongoose.model('Category', categorySchema);
