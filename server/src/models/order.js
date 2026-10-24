import mongoose from 'mongoose';
import { cleanJson } from './plugins.js';

export const ORDER_STATUSES = ['placed', 'paid', 'shipped', 'delivered', 'cancelled'];
export const PAYMENT_STATUSES = ['pending', 'paid', 'refunded'];

// Which statuses an order may move to from each state.
export const ORDER_TRANSITIONS = {
  placed: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true },
    currency: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    totals: {
      subtotal: { type: Number, required: true },
      shipping: { type: Number, required: true },
      total: { type: Number, required: true },
    },
    currency: { type: String, default: 'INR' },
    shippingAddress: { type: addressSchema, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'placed', index: true },
    statusHistory: {
      type: [{ _id: false, status: { type: String, enum: ORDER_STATUSES }, at: Date }],
      default: [],
    },
    payment: {
      provider: { type: String, enum: ['mock'], default: 'mock' },
      status: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
      reference: { type: String, default: '' },
      paidAt: { type: Date },
    },
  },
  { timestamps: true },
);

cleanJson(orderSchema);

export const Order = mongoose.model('Order', orderSchema);
