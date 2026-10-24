// Parses body/query/params with Zod and stores the typed result on req.validated.
export const validate = (schemas) => (req, res, next) => {
  try {
    req.validated = {
      body: schemas.body ? schemas.body.parse(req.body ?? {}) : req.body,
      query: schemas.query ? schemas.query.parse(req.query ?? {}) : req.query,
      params: schemas.params ? schemas.params.parse(req.params ?? {}) : req.params,
    };
    next();
  } catch (err) {
    next(err);
  }
};
