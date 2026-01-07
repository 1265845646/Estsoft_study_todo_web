export default function Input({
  type = "text",
  value,
  onChange,
  placeholder,
  className = "",
  ...rest
}) {
  return (
    <input
      className={`input ${className}`}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...rest}
    />
  );
}
