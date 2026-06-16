export function FormField({ label, value, onChange, type = 'text', required, placeholder, min, options }) {
  // Cuando se pasan `options`, el input ofrece autocompletado con valores ya
  // existentes (vía <datalist>) sin impedir escribir uno nuevo.
  const listId = options ? `dl-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined
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
        list={listId}
        className="ds-input"
      />
      {options && (
        <datalist id={listId}>
          {options.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
      )}
    </div>
  )
}
