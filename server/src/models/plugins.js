// Exposes `id` instead of `_id` and drops `__v` on every serialized document.
export function cleanJson(schema, { omit = [] } = {}) {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => {
      ret.id = String(ret._id);
      delete ret._id;
      for (const key of omit) delete ret[key];
      return ret;
    },
  });
}
