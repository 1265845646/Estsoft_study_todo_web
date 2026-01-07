// src/components/common/Toggle.jsx
export default function Toggle({ checked, onChange, label, offText = "OFF", onText = "ON" }) {
  return (
    <div className="pillToggle">
      {label ? <span className="pillToggle__label">{label}</span> : null}

      <button
        type="button"
        className={`pillToggle__btn ${checked ? "is-on" : "is-off"}`}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
      >
        {checked ? onText : offText}
      </button>
    </div>
  );
}
