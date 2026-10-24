export const PLACEHOLDER_IMAGE = `${import.meta.env.BASE_URL}placeholder.svg`;

/** Resolves catalog image paths against the deploy base so they work on Pages and locally. */
export function resolveImage(src: string | undefined): string {
  if (!src) return PLACEHOLDER_IMAGE;
  if (/^(https?:)?\/\//.test(src) || src.startsWith('data:')) return src;
  return `${import.meta.env.BASE_URL}${src.replace(/^\//, '')}`;
}
