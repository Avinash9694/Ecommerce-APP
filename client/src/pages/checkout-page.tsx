import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/use-auth';
import { useCart } from '@/features/cart/queries';
import { useCreateOrder, usePayOrder } from '@/features/orders/queries';
import {
  EMPTY_ADDRESS,
  formatCardNumber,
  mockCardSchema,
  shippingAddressSchema,
} from '@/features/checkout/checkout-schema';
import type { MockCardForm, ShippingAddressForm } from '@/features/checkout/checkout-schema';
import { zodFieldErrors } from '@/features/auth/auth-schemas';
import { errorMessage, isApiError } from '@/api';
import type { Order } from '@/api';
import { Button, LinkButton } from '@/components/ui/button';
import { InputField } from '@/components/ui/field';
import { CartSummary } from '@/components/cart/cart-summary';
import { Price } from '@/components/ui/price';
import { ProductImage } from '@/components/ui/product-image';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { LineSkeleton } from '@/components/ui/skeleton';
import { CheckIcon, ShieldIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { toast } from '@/store/toast-store';

type Step = 'address' | 'payment';

function Steps({ current }: { current: Step }) {
  const steps: Array<{ key: Step; label: string }> = [
    { key: 'address', label: 'Shipping' },
    { key: 'payment', label: 'Payment' },
  ];
  const index = steps.findIndex((s) => s.key === current);
  return (
    <ol className="flex items-center gap-3 text-sm" aria-label="Checkout progress">
      {steps.map((step, i) => (
        <li key={step.key} className="flex items-center gap-3">
          <span
            className={cn('flex items-center gap-2', i > index && 'text-ink-muted')}
            aria-current={i === index ? 'step' : undefined}
          >
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                i < index
                  ? 'bg-accent text-accent-fg'
                  : i === index
                    ? 'border-2 border-accent text-accent'
                    : 'border border-line-strong',
              )}
            >
              {i < index ? <CheckIcon size={12} /> : i + 1}
            </span>
            {step.label}
          </span>
          {i < steps.length - 1 && <span className="h-px w-8 bg-line-strong" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}

export function CheckoutPage() {
  const { user } = useAuth();
  const cart = useCart();
  const createOrder = useCreateOrder();
  const payOrder = usePayOrder();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('address');
  const [address, setAddress] = useState<ShippingAddressForm>({
    ...EMPTY_ADDRESS,
    fullName: user?.name ?? '',
    phone: user?.phone ?? '',
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<Order | null>(null);
  const [card, setCard] = useState<MockCardForm>({
    cardNumber: '',
    expiry: '',
    cvc: '',
    nameOnCard: user?.name ?? '',
  });
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [stepError, setStepError] = useState<string | null>(null);

  const setField = (key: keyof ShippingAddressForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddress({ ...address, [key]: e.target.value });

  const submitAddress = (event: FormEvent) => {
    event.preventDefault();
    const parsed = shippingAddressSchema.safeParse(address);
    if (!parsed.success) {
      setAddressErrors(zodFieldErrors(parsed.error));
      return;
    }
    setAddressErrors({});
    setStepError(null);
    createOrder.mutate(
      { shippingAddress: { ...parsed.data, line2: parsed.data.line2 || '' } },
      {
        onSuccess: (created) => {
          setOrder(created);
          setStep('payment');
        },
        onError: (err) => {
          setStepError(
            isApiError(err) && err.code === 'INSUFFICIENT_STOCK'
              ? `${err.message}. Adjust your cart and try again.`
              : errorMessage(err),
          );
        },
      },
    );
  };

  const submitPayment = (event: FormEvent) => {
    event.preventDefault();
    if (!order) return;
    const parsed = mockCardSchema.safeParse(card);
    if (!parsed.success) {
      setCardErrors(zodFieldErrors(parsed.error));
      return;
    }
    setCardErrors({});
    setStepError(null);
    payOrder.mutate(
      { id: order.id, input: { cardLast4: parsed.data.cardNumber.slice(-4) } },
      {
        onSuccess: (paid) => {
          toast.success(
            'Payment confirmed',
            `Order ${paid.id.slice(-8).toUpperCase()} is on its way`,
          );
          navigate(`/orders/${paid.id}`, { replace: true });
        },
        onError: (err) => setStepError(errorMessage(err)),
      },
    );
  };

  if (step === 'address') {
    if (cart.isPending) return <LineSkeleton lines={6} />;
    if (cart.isError) return <ErrorState error={cart.error} onRetry={() => cart.refetch()} />;
    if (cart.data.items.length === 0) {
      return (
        <EmptyState
          title="Nothing to check out"
          description="Your cart is empty."
          action={<LinkButton to="/catalog">Browse products</LinkButton>}
        />
      );
    }
  }

  const summaryItems = order
    ? order.items.map((i) => ({
        key: i.product,
        name: i.name,
        image: i.image,
        qty: i.qty,
        lineTotal: i.price * i.qty,
        currency: i.currency,
      }))
    : (cart.data?.items ?? []).map((i) => ({
        key: i.product.id,
        name: i.product.name,
        image: i.product.images[0],
        qty: i.qty,
        lineTotal: i.lineTotal,
        currency: i.product.currency,
      }));
  const totals = order?.totals ?? cart.data?.totals ?? { subtotal: 0, shipping: 0, total: 0 };
  const itemCount = order
    ? order.items.reduce((s, i) => s + i.qty, 0)
    : (cart.data?.itemCount ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Checkout</h1>
        <Steps current={step} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {step === 'address' ? (
          <form
            onSubmit={submitAddress}
            className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 shadow-card"
            noValidate
          >
            <h2 className="text-lg font-semibold">Shipping address</h2>
            <InputField
              label="Full name"
              value={address.fullName}
              onChange={setField('fullName')}
              error={addressErrors.fullName}
              autoComplete="name"
              required
            />
            <InputField
              label="Address line 1"
              value={address.line1}
              onChange={setField('line1')}
              error={addressErrors.line1}
              autoComplete="address-line1"
              required
            />
            <InputField
              label="Address line 2 (optional)"
              value={address.line2 ?? ''}
              onChange={setField('line2')}
              error={addressErrors.line2}
              autoComplete="address-line2"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label="City"
                value={address.city}
                onChange={setField('city')}
                error={addressErrors.city}
                autoComplete="address-level2"
                required
              />
              <InputField
                label="State"
                value={address.state}
                onChange={setField('state')}
                error={addressErrors.state}
                autoComplete="address-level1"
                required
              />
              <InputField
                label="Postal code"
                value={address.postalCode}
                onChange={setField('postalCode')}
                error={addressErrors.postalCode}
                autoComplete="postal-code"
                inputMode="numeric"
                required
              />
              <InputField
                label="Country"
                value={address.country}
                onChange={setField('country')}
                error={addressErrors.country}
                autoComplete="country-name"
                required
              />
            </div>
            <InputField
              label="Phone"
              value={address.phone}
              onChange={setField('phone')}
              error={addressErrors.phone}
              autoComplete="tel"
              inputMode="tel"
              required
            />
            {stepError && (
              <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                {stepError}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
              <LinkButton to="/cart" variant="ghost">
                Back to cart
              </LinkButton>
              <Button type="submit" size="lg" isLoading={createOrder.isPending}>
                Continue to payment
              </Button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={submitPayment}
            className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 shadow-card"
            noValidate
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Payment</h2>
                <p className="mt-0.5 text-sm text-ink-muted">
                  Order <span className="font-mono text-xs">{order?.id}</span> is reserved. Complete
                  payment to confirm it.
                </p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-info-soft px-2.5 py-1 text-xs font-medium text-info">
                <ShieldIcon size={14} /> Mock payment
              </span>
            </div>
            <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-muted">
              No real charge is made. Any 16-digit number works, for example{' '}
              <code className="font-mono">4242 4242 4242 4242</code>.
            </p>
            <InputField
              label="Name on card"
              value={card.nameOnCard}
              onChange={(e) => setCard({ ...card, nameOnCard: e.target.value })}
              error={cardErrors.nameOnCard}
              autoComplete="cc-name"
              required
            />
            <InputField
              label="Card number"
              value={card.cardNumber}
              onChange={(e) => setCard({ ...card, cardNumber: formatCardNumber(e.target.value) })}
              error={cardErrors.cardNumber}
              autoComplete="cc-number"
              inputMode="numeric"
              className="font-mono"
              placeholder="4242 4242 4242 4242"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Expiry (MM/YY)"
                value={card.expiry}
                onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                error={cardErrors.expiry}
                autoComplete="cc-exp"
                inputMode="numeric"
                placeholder="12/28"
                className="font-mono"
                required
              />
              <InputField
                label="CVC"
                value={card.cvc}
                onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                error={cardErrors.cvc}
                autoComplete="cc-csc"
                inputMode="numeric"
                className="font-mono"
                required
              />
            </div>
            {stepError && (
              <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                {stepError}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
              <Link
                to={`/orders/${order?.id}`}
                className="inline-flex min-h-10 items-center text-sm text-ink-muted hover:underline"
              >
                Pay later from your orders
              </Link>
              <Button type="submit" size="lg" isLoading={payOrder.isPending}>
                Pay <Price amount={totals.total} currency={order?.currency} />
              </Button>
            </div>
          </form>
        )}

        <aside
          aria-label="Order summary"
          className="h-fit rounded-2xl border border-line bg-surface p-5 shadow-card lg:sticky lg:top-24"
        >
          <h2 className="mb-4 text-lg font-semibold">Order summary</h2>
          <ul className="mb-4 flex flex-col gap-3">
            {summaryItems.map((item) => (
              <li key={item.key} className="flex items-center gap-3 text-sm">
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                  <ProductImage src={item.image} alt="" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 font-medium">{item.name}</span>
                  <span className="text-ink-muted">Qty {item.qty}</span>
                </span>
                <Price
                  amount={item.lineTotal}
                  currency={item.currency}
                  className="shrink-0 font-medium"
                />
              </li>
            ))}
          </ul>
          <CartSummary totals={totals} itemCount={itemCount} currency={order?.currency} />
        </aside>
      </div>
    </div>
  );
}
