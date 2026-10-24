import { useState } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { PLACEHOLDER_IMAGE, resolveImage } from '@/lib/images';

interface ProductImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | undefined;
  alt: string;
}

export function ProductImage({ src, alt, className, ...props }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed ? PLACEHOLDER_IMAGE : resolveImage(src)}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn('h-full w-full object-cover', className)}
      {...props}
    />
  );
}
