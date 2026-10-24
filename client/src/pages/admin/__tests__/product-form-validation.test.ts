import { describe, expect, it } from 'vitest';
import { validateProductForm } from '../product-form-validation';

const valid = {
  name: 'Field Notes',
  description: 'Three pocket notebooks with graph paper.',
  price: '499',
  category: 'c-stationery',
  stock: '12',
  tags: 'notebook, pocket,,',
  images: 'products/a.svg\n\nproducts/b.svg',
  featured: true,
};

describe('validateProductForm', () => {
  it('converts a valid form into an API input with paise, trimmed tags and images', () => {
    const { input, errors } = validateProductForm(valid);
    expect(errors).toEqual({});
    expect(input).toEqual({
      name: 'Field Notes',
      description: 'Three pocket notebooks with graph paper.',
      price: 49900,
      category: 'c-stationery',
      stock: 12,
      tags: ['notebook', 'pocket'],
      images: ['products/a.svg', 'products/b.svg'],
      featured: true,
    });
  });

  it('reports every invalid field and returns no input', () => {
    const { input, errors } = validateProductForm({
      ...valid,
      name: 'A',
      description: 'short',
      price: 'free',
      stock: '1.5',
      category: '',
    });
    expect(input).toBeUndefined();
    expect(Object.keys(errors).sort()).toEqual([
      'category',
      'description',
      'name',
      'price',
      'stock',
    ]);
  });
});
