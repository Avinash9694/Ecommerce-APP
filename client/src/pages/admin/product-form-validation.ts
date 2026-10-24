import type { ProductInput } from '@/api/types';
import { parseMoneyInput } from '@/lib/money';

export interface ProductFormState {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  tags: string;
  images: string;
  featured: boolean;
}

export function validateProductForm(form: ProductFormState): {
  input?: ProductInput;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  const price = parseMoneyInput(form.price);
  const stock = Number(form.stock);
  if (form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (form.description.trim().length < 10)
    errors.description = 'Describe the product in at least 10 characters';
  if (price === null) errors.price = 'Enter a valid price';
  if (!form.category) errors.category = 'Choose a category';
  if (!Number.isInteger(stock) || stock < 0) errors.stock = 'Stock must be a whole number';
  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    input: {
      name: form.name.trim(),
      description: form.description.trim(),
      price: price as number,
      category: form.category,
      stock,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      images: form.images
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean),
      featured: form.featured,
    },
  };
}
