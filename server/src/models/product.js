import mongoose from 'mongoose';
import { cleanJson } from './plugins.js';

export const PRODUCT_SORTS = ['newest', 'price_asc', 'price_desc', 'rating', 'name'];

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    // Integer in minor units (paise), never a float.
    price: { type: Number, required: true, min: 0, validate: Number.isInteger },
    currency: { type: String, default: 'INR', uppercase: true, minlength: 3, maxlength: 3 },
    images: { type: [String], default: [] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    stock: { type: Number, required: true, min: 0, default: 0, validate: Number.isInteger },
    rating: {
      average: { type: Number, min: 0, max: 5, default: 0 },
      count: { type: Number, min: 0, default: 0 },
    },
    tags: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

productSchema.index({ category: 1, price: 1 });
productSchema.index({ tags: 1 });

cleanJson(productSchema);

export const Product = mongoose.model('Product', productSchema);
