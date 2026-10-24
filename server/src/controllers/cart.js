import { Cart } from '../models/cart.js';
import { Product } from '../models/product.js';
import { computeTotals } from '../utils/pricing.js';
import { conflict, notFound } from '../utils/http-error.js';

const PRODUCT_FIELDS = 'name slug price currency images stock';

async function loadCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

async function serializeCart(cart) {
  await cart.populate('items.product', PRODUCT_FIELDS);
  // Products deleted since they were added are dropped rather than shown as blanks.
  const items = cart.items
    .filter((item) => item.product)
    .map((item) => ({
      product: item.product.toJSON(),
      qty: item.qty,
      lineTotal: item.product.price * item.qty,
    }));
  const totals = computeTotals(items.map((i) => ({ price: i.product.price, qty: i.qty })));
  return {
    id: cart.id,
    items,
    itemCount: items.reduce((sum, i) => sum + i.qty, 0),
    totals,
    updatedAt: cart.updatedAt,
  };
}

const insufficientStock = (product, requested) =>
  conflict('INSUFFICIENT_STOCK', `Only ${product.stock} of "${product.name}" available`, {
    productId: product.id,
    requested,
    available: product.stock,
  });

export async function getCart(req, res) {
  const cart = await loadCart(req.user._id);
  res.json({ cart: await serializeCart(cart) });
}

export async function addItem(req, res) {
  const { productId, qty } = req.validated.body;
  const product = await Product.findById(productId);
  if (!product) throw notFound('Product');

  const cart = await loadCart(req.user._id);
  const existing = cart.items.find((item) => String(item.product) === productId);
  const nextQty = (existing?.qty ?? 0) + qty;
  if (nextQty > product.stock) throw insufficientStock(product, nextQty);

  if (existing) existing.qty = nextQty;
  else cart.items.push({ product: product._id, qty });
  await cart.save();

  res.json({ cart: await serializeCart(cart) });
}

export async function updateItem(req, res) {
  const { productId } = req.validated.params;
  const { qty } = req.validated.body;

  const cart = await loadCart(req.user._id);
  const existing = cart.items.find((item) => String(item.product) === productId);
  if (!existing) throw notFound('Cart item');

  if (qty === 0) {
    cart.items = cart.items.filter((item) => String(item.product) !== productId);
  } else {
    const product = await Product.findById(productId);
    if (!product) throw notFound('Product');
    if (qty > product.stock) throw insufficientStock(product, qty);
    existing.qty = qty;
  }
  await cart.save();

  res.json({ cart: await serializeCart(cart) });
}

export async function removeItem(req, res) {
  const { productId } = req.validated.params;
  const cart = await loadCart(req.user._id);
  cart.items = cart.items.filter((item) => String(item.product) !== productId);
  await cart.save();
  res.json({ cart: await serializeCart(cart) });
}

export async function clearCart(req, res) {
  const cart = await loadCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.json({ cart: await serializeCart(cart) });
}
