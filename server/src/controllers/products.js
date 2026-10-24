import { Product } from '../models/product.js';
import { Category } from '../models/category.js';
import { escapeRegex, slugify } from '../utils/slugify.js';
import { badRequest, notFound } from '../utils/http-error.js';

const SORT_MAP = {
  newest: { createdAt: -1, _id: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: 1 },
  rating: { 'rating.average': -1, 'rating.count': -1, _id: 1 },
  name: { name: 1, _id: 1 },
};

const CATEGORY_FIELDS = 'name slug';

const emptyPage = (page, limit) => ({ items: [], page, limit, total: 0, totalPages: 0 });

async function uniqueSlug(base) {
  let slug = base;
  for (let n = 2; await Product.exists({ slug }); n += 1) slug = `${base}-${n}`;
  return slug;
}

export async function listProducts(req, res) {
  const { page, limit, q, category, tag, minPrice, maxPrice, sort, featured } = req.validated.query;

  const filter = {};
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { description: rx }, { tags: rx }];
  }
  if (category) {
    const cat = await Category.findOne({ slug: category }).select('_id');
    if (!cat) return res.json(emptyPage(page, limit));
    filter.category = cat._id;
  }
  if (tag) filter.tags = tag;
  if (featured !== undefined) filter.featured = featured;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(SORT_MAP[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', CATEGORY_FIELDS),
    Product.countDocuments(filter),
  ]);

  res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function getProductBySlug(req, res) {
  const product = await Product.findOne({ slug: req.validated.params.slug }).populate(
    'category',
    CATEGORY_FIELDS,
  );
  if (!product) throw notFound('Product');
  res.json({ product });
}

export async function createProduct(req, res) {
  const body = req.validated.body;
  if (!(await Category.exists({ _id: body.category }))) {
    throw badRequest('Category does not exist', [
      { path: 'category', message: 'Unknown category' },
    ]);
  }
  const slug = body.slug ?? (await uniqueSlug(slugify(body.name)));
  const product = await Product.create({ ...body, slug });
  await product.populate('category', CATEGORY_FIELDS);
  res.status(201).json({ product });
}

export async function updateProduct(req, res) {
  const body = req.validated.body;
  const product = await Product.findById(req.validated.params.id);
  if (!product) throw notFound('Product');
  if (body.category && !(await Category.exists({ _id: body.category }))) {
    throw badRequest('Category does not exist', [
      { path: 'category', message: 'Unknown category' },
    ]);
  }
  Object.assign(product, body);
  await product.save();
  await product.populate('category', CATEGORY_FIELDS);
  res.json({ product });
}

export async function deleteProduct(req, res) {
  const product = await Product.findByIdAndDelete(req.validated.params.id);
  if (!product) throw notFound('Product');
  res.status(204).end();
}
