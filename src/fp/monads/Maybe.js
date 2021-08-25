export const Some = (v) => ({
  map: (f) => Some(f(v)),
  inspect: () => Some(inspect(v)),
  bind: (f) => f(v),
  match: (pattern) => pattern.Some(v),
});

export const None = () => ({
  map: () => None(),
  inspect: () => None(),
  bind: () => None(),
  match: (pattern) => pattern.None(),
});

const inspect = (v) => {
  console.log('Inspecting:', v);
  return v;
};

export const Maybe = (x) => {
  if (x instanceof Maybe) {
    return x;
  }

  if (this instanceof Maybe) this.value = x;
  else return new Maybe(x);
};
