export default function Select({ children, className = "", ...props }) {
  return (
    <select className={`select ${className}`} {...props}>
      {children}
    </select>
  );
}
