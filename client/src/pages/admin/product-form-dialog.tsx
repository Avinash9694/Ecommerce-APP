import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Category, Product } from '@/api';
import { errorMessage, fieldErrors } from '@/api';
import { useCreateProduct, useUpdateProduct } from '@/features/products/queries';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckboxField, InputField, SelectField, TextareaField } from '@/components/ui/field';
import { majorUnits } from '@/lib/money';
import { validateProductForm } from './product-form-validation';
import type { ProductFormState as FormState } from './product-form-validation';
import { toast } from '@/store/toast-store';

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  categories: Category[];
}

const emptyForm = (categories: Category[]): FormState => ({
  name: '',
  description: '',
  price: '',
  category: categories[0]?.id ?? '',
  stock: '0',
  tags: '',
  images: '',
  featured: false,
});

const fromProduct = (p: Product): FormState => ({
  name: p.name,
  description: p.description,
  price: majorUnits(p.price),
  category: p.category.id,
  stock: String(p.stock),
  tags: p.tags.join(', '),
  images: p.images.join('\n'),
  featured: p.featured,
});

export function ProductFormDialog({ open, onClose, product, categories }: ProductFormDialogProps) {
  const [form, setForm] = useState<FormState>(() =>
    product ? fromProduct(product) : emptyForm(categories),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const busy = create.isPending || update.isPending;

  useEffect(() => {
    if (open) {
      setForm(product ? fromProduct(product) : emptyForm(categories));
      setErrors({});
    }
  }, [open, product, categories]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const { input, errors: validationErrors } = validateProductForm(form);
    setErrors(validationErrors);
    if (!input) return;
    const onError = (err: unknown) => {
      const fields = fieldErrors(err);
      if (Object.keys(fields).length) setErrors(fields);
      else toast.error(errorMessage(err));
    };
    if (product) {
      update.mutate(
        { id: product.id, input },
        {
          onSuccess: () => {
            toast.success('Product updated');
            onClose();
          },
          onError,
        },
      );
    } else {
      create.mutate(input, {
        onSuccess: () => {
          toast.success('Product created');
          onClose();
        },
        onError,
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={product ? `Edit ${product.name}` : 'New product'}
      widthClassName="sm:max-w-xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" isLoading={busy}>
            {product ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      }
    >
      <form id="product-form" onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <InputField
          label="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
          required
        />
        <TextareaField
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          error={errors.description}
          required
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <InputField
            label="Price (₹)"
            inputMode="decimal"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            error={errors.price}
            className="font-mono"
            required
          />
          <InputField
            label="Stock"
            inputMode="numeric"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            error={errors.stock}
            className="font-mono"
            required
          />
          <SelectField
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            error={errors.category}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>
        </div>
        <InputField
          label="Tags"
          hint="Comma separated"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
        />
        <TextareaField
          label="Image paths"
          hint="One per line; relative paths resolve under /products"
          value={form.images}
          onChange={(e) => setForm({ ...form, images: e.target.value })}
          className="min-h-16 font-mono text-xs"
        />
        <CheckboxField
          label="Featured on the home page"
          checked={form.featured}
          onChange={(e) => setForm({ ...form, featured: e.target.checked })}
        />
      </form>
    </Dialog>
  );
}
