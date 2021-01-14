export default function createElement(tag, attrs, children) {
  children = Array.isArray(children)
    ? children.map(v => {
        return typeof v === 'number' ? String(v) : v;
      })
    : typeof children === 'number'
    ? String(children)
    : children;

  children = typeof children === 'number' ? String(children) : children;
  return { tag, attrs, children };
}
