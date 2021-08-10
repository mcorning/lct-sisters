export var Some = (v) => ({
  map: (f) => Some(f(v)),
  inspect: () => Some(inspect(v)),
  bind: (f) => f(v),
  match: (pattern) => pattern.Some(v),
});

export var None = () => ({
  map: () => None(),
  inspect: () => None(),
  bind: () => None(),
  match: (pattern) => pattern.None(),
});

const inspect = (v) => {
  console.log('Inspecting:', v);
  return v;
};
