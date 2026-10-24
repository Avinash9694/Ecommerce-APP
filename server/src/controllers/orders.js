import { randomBytes } from 'node:crypto';
import { Cart } from '../models/cart.js';
import { Order, ORDER_TRANSITIONS } from '../models/order.js';
import { Product } from '../models/product.js';
import { computeTotals } from '../utils/pricing.js';
import { HttpError, badRequest, conflict, notFound } from '../utils/http-error.js';

async function reserveStock(productId, qty) {
  return Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: qty } },
    { $inc: { stock: -qty } },
    { new: true },
  );
}

async function releaseStock(items) {
  await Promise.all(
    items.map((item) => Product.updateOne({ _id: item.product }, { $inc: { stock: item.qty } })),
  );
}

function pushStatus(order, status) {
  order.status = status;
  order.statusHistory.push({ status, at: new Date() });
}

function assertTransition(order, next) {
  if (!ORDER_TRANSITIONS[order.status].includes(next)) {
    throw conflict(
      'INVALID_STATUS_TRANSITION',
      `Cannot move an order from "${order.status}" to "${next}"`,
      { from: order.status, to: next, allowed: ORDER_TRANSITIONS[order.status] },
    );
  }
}

async function findOwnOrder(req) {
  const order = await Order.findOne({ _id: req.validated.params.id, user: req.user._id });
  if (!order) throw notFound('Order');
  return order;
}

export async function createOrder(req, res) {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  const cartItems = (cart?.items ?? []).filter((item) => item.product);
  if (cartItems.length === 0) throw badRequest('Your cart is empty');

  // Stock is reserved one conditional update at a time; a failure releases what was
  // already taken so an order is never half-reserved without a transaction.
  const reserved = [];
  for (const item of cartItems) {
    const updated = await reserveStock(item.product._id, item.qty);
    if (!updated) {
      await releaseStock(reserved);
      const fresh = await Product.findById(item.product._id).select('name stock');
      throw conflict(
        'INSUFFICIENT_STOCK',
        `Only ${fresh?.stock ?? 0} of "${item.product.name}" available`,
        {
          productId: String(item.product._id),
          requested: item.qty,
          available: fresh?.stock ?? 0,
        },
      );
    }
    reserved.push({ product: item.product._id, qty: item.qty });
  }

  const items = cartItems.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    slug: item.product.slug,
    image: item.product.images[0] ?? '',
    price: item.product.price,
    currency: item.product.currency,
    qty: item.qty,
  }));

  const order = new Order({
    user: req.user._id,
    items,
    totals: computeTotals(items),
    currency: items[0].currency,
    shippingAddress: req.validated.body.shippingAddress,
  });
  pushStatus(order, 'placed');
  await order.save();

  cart.items = [];
  await cart.save();

  res.status(201).json({ order });
}

export async function listMyOrders(req, res) {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ items: orders });
}

export async function getMyOrder(req, res) {
  res.json({ order: await findOwnOrder(req) });
}

export async function payOrder(req, res) {
  const order = await findOwnOrder(req);
  if (order.status !== 'placed') {
    throw new HttpError(409, 'ALREADY_PAID', 'This order is not awaiting payment');
  }
  order.payment.status = 'paid';
  order.payment.paidAt = new Date();
  order.payment.reference = `MOCK-${randomBytes(4).toString('hex').toUpperCase()}`;
  pushStatus(order, 'paid');
  await order.save();
  res.json({ order });
}

export async function cancelMyOrder(req, res) {
  const order = await findOwnOrder(req);
  assertTransition(order, 'cancelled');
  await releaseStock(order.items);
  if (order.payment.status === 'paid') order.payment.status = 'refunded';
  pushStatus(order, 'cancelled');
  await order.save();
  res.json({ order });
}

export async function adminListOrders(req, res) {
  const { page, limit, status } = req.validated.query;
  const filter = status ? { status } : {};
  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email'),
    Order.countDocuments(filter),
  ]);
  res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function adminUpdateStatus(req, res) {
  const order = await Order.findById(req.validated.params.id);
  if (!order) throw notFound('Order');
  const { status } = req.validated.body;
  assertTransition(order, status);

  if (status === 'cancelled') {
    await releaseStock(order.items);
    if (order.payment.status === 'paid') order.payment.status = 'refunded';
  }
  if (status === 'paid' && order.payment.status === 'pending') {
    order.payment.status = 'paid';
    order.payment.paidAt = new Date();
    order.payment.reference = `ADMIN-${randomBytes(4).toString('hex').toUpperCase()}`;
  }
  pushStatus(order, status);
  await order.save();
  await order.populate('user', 'name email');
  res.json({ order });
}
