import { Category } from '../models/category.js';
import { Product } from '../models/product.js';
import { slugify } from '../utils/slugify.js';
import { conflict, notFound } from '../utils/http-error.js';

export async function listCategories(req, res) {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ name: 1 }),
    Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const countById = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json({
    items: categories.map((c) => ({ ...c.toJSON(), productCount: countById.get(c.id) ?? 0 })),
  });
}

export async function getCategory(req, res) {
  const category = await Category.findOne({ slug: req.validated.params.slug });
  if (!category) throw notFound('Category');
  res.json({ category });
}

export async function createCategory(req, res) {
  const body = req.validated.body;
  const slug = body.slug ?? slugify(body.name);
  if (await Category.exists({ slug })) {
    throw conflict('SLUG_TAKEN', `A category with slug "${slug}" already exists`);
  }
  const category = await Category.create({ ...body, slug });
  res.status(201).json({ category });
}

export async function updateCategory(req, res) {
  const category = await Category.findById(req.validated.params.id);
  if (!category) throw notFound('Category');
  Object.assign(category, req.validated.body);
  await category.save();
  res.json({ category });
}

export async function deleteCategory(req, res) {
  const { id } = req.validated.params;
  const inUse = await Product.countDocuments({ category: id });
  if (inUse > 0) {
    throw conflict('CATEGORY_IN_USE', 'Move or delete its products before removing this category', {
      productCount: inUse,
    });
  }
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw notFound('Category');
  res.status(204).end();
}
