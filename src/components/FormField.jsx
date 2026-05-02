export function FormField({ label, value, onChange, type = 'text', required, placeholder, min }) {
  return (
    <div className="ds-field">
      <label className="ds-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        min={min}
        className="ds-input"
      />
    </div>
  )
}
