import { useState, useMemo, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importProducts } from '../api/products'
import { ModalBackdrop } from './ModalBackdrop'
import { IconX } from './Icons'
import { QK } from '../utils/queryKeys'

/* ─── Config de campos ─────────────────────────────────── */
const FIELDS = [
  { key: 'barcode',          label: 'Código de barras',   required: true,
    hints: ['barcode','codigo','código','ean','code','cod','barra'] },
  { key: 'itemName',         label: 'Nombre del producto', required: true,
    hints: ['nombre','name','producto','item','articulo','artículo'] },
  { key: 'description',      label: 'Descripción',         required: false,
    hints: ['descripcion','descripción','description','detalle','obs','nota'] },
  { key: 'providerName',     label: 'Proveedor',           required: false,
    hints: ['proveedor','provider','marca','brand','fabricante'] },
  { key: 'currentStock',     label: 'Stock inicial',       required: false,
    hints: ['stock','cantidad','qty','existencia','actual','unidades'] },
  { key: 'minRequiredStock', label: 'Stock mínimo',        required: false,
    hints: ['minimo','mínimo','min','minimum','reposicion','reposición'] },
]

function autoDetect(columns) {
  const result = {}
  for (const { key, hints } of FIELDS) {
    const col = columns.find(c => hints.some(h => c.toLowerCase().includes(h)))
    if (col) result[key] = col
  }
  return result
}

function buildProducts(rows, mapping) {
  return rows
    .map(row => ({
      barcode:          String(mapping.barcode          ? row[mapping.barcode]          ?? '' : '').trim(),
      itemName:         String(mapping.itemName         ? row[mapping.itemName]         ?? '' : '').trim(),
      description:      String(mapping.description      ? row[mapping.description]      ?? '' : '').trim(),
      providerName:     String(mapping.providerName     ? row[mapping.providerName]     ?? '' : '').trim(),
      currentStock:     Math.max(0, parseInt(row[mapping.currentStock]     ?? 0, 10) || 0),
      minRequiredStock: Math.max(0, parseInt(row[mapping.minRequiredStock] ?? 0, 10) || 0),
    }))
    .filter(p => p.barcode && p.itemName)
}

/* ─── CSS ──────────────────────────────────────────────── */
const CSS = `
  .imp-steps {
    display: flex;
    border-bottom: 4px solid #000;
  }
  .imp-step {
    flex: 1; padding: 9px 8px; text-align: center;
    font-size: 9px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
    color: #2e3545; border-right: 2px solid #000;
  }
  .imp-step:last-child { border-right: none; }
  .imp-step.active { color: #facc15; background: rgba(250,204,21,0.06); }
  .imp-step.done   { color: #4ae176; }

  .imp-drop {
    border: 4px dashed #2e3545; padding: 44px 20px; text-align: center;
    cursor: pointer; transition: border-color 0.15s, background 0.15s;
  }
  .imp-drop:hover, .imp-drop.drag { border-color: #facc15; background: rgba(250,204,21,0.04); }
  .imp-drop-icon { font-size: 30px; margin-bottom: 12px; }
  .imp-drop-title { font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #fff; }
  .imp-drop-sub   { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #4d5a72; margin-top: 6px; }

  .imp-cols { display: flex; flex-wrap: wrap; gap: 6px; }
  .imp-col-chip {
    font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    padding: 3px 8px; background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.08); color: #4d5a72;
  }

  .imp-map-grid {
    border: 4px solid #000;
    overflow: hidden;
  }
  .imp-map-row {
    display: grid; grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .imp-map-row:last-child { border-bottom: none; }
  .imp-map-label {
    padding: 10px 14px; border-right: 4px solid #000; display: flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    color: #dce2f7; background: #0c1322;
  }
  .imp-req { color: #facc15; }
  .imp-map-sel {
    padding: 0 12px; background: #09090b; display: flex; align-items: center;
  }
  .imp-map-sel select {
    width: 100%; background: transparent; border: none; outline: none;
    font-family: 'Inter', system-ui, sans-serif; font-size: 12px; font-weight: 600;
    color: #dce2f7; cursor: pointer; -webkit-appearance: none; padding: 10px 0;
  }
  .imp-map-sel select option { background: #0c1322; }

  .imp-preview-wrap { border: 4px solid #000; overflow-x: auto; }
  .imp-preview-hd {
    padding: 8px 14px; background: #0c1322; border-bottom: 4px solid #000;
    font-size: 9px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #facc15;
  }
  .imp-preview-more {
    padding: 8px 16px; font-size: 10px; color: #2e3545; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
  }

  .imp-result-ok {
    background: rgba(74,225,118,0.08); border: 4px solid #000;
    padding: 24px 20px; text-align: center;
  }
  .imp-result-num { font-size: 52px; font-weight: 900; color: #4ae176; letter-spacing: -0.03em; line-height: 1; }
  .imp-result-lbl { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #4ae176; margin-top: 8px; }
  .imp-skipped-title { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #4d5a72; }
  .imp-skipped-list  { display: flex; flex-direction: column; gap: 3px; margin-top: 8px; }
  .imp-skipped-item  { font-family: 'Courier New', monospace; font-size: 11px; color: #9a9078; }
`

/* ─── Componente ───────────────────────────────────────── */
export function ImportProductsModal({ onClose }) {
  const queryClient  = useQueryClient()
  const fileInputRef = useRef(null)

  const [step,       setStep]       = useState(1)
  const [isDrag,     setIsDrag]     = useState(false)
  const [columns,    setColumns]    = useState([])
  const [rows,       setRows]       = useState([])
  const [mapping,    setMapping]    = useState({})
  const [parseError, setParseError] = useState('')
  const [result,     setResult]     = useState(null)

  const products = useMemo(() => buildProducts(rows, mapping), [rows, mapping])
  const canNext  = !!(mapping.barcode && mapping.itemName)

  const mutation = useMutation({
    mutationFn: importProducts,
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: QK.products })
      setResult(data)
      setStep(4)
    },
    onError: (err) => {
      const detail = err?.response?.data?.detail
      setParseError(detail ?? 'Error al importar. Intentá de nuevo.')
    },
  })

  const parseFile = (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setParseError('Solo se admiten archivos .xlsx, .xls o .csv')
      return
    }
    setParseError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(e.target.result, { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' })
        if (!data.length) { setParseError('La planilla está vacía'); return }
        const cols = Object.keys(data[0])
        setColumns(cols)
        setRows(data)
        setMapping(autoDetect(cols))
        setStep(2)
      } catch {
        setParseError('No se pudo leer el archivo. Verificá el formato.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const stepLabel = (i) => {
    if (step > i + 1) return 'done'
    if (step === i + 1) return 'active'
    return ''
  }

  const ignoredCount = rows.length - products.length

  return (
    <>
      <style>{CSS}</style>
      <ModalBackdrop onClose={onClose} modalStyle={{ maxWidth: 600 }}>

        {/* Indicador de pasos */}
        <div className="imp-steps">
          {['Archivo', 'Columnas', 'Confirmar'].map((label, i) => (
            <div key={label} className={`imp-step ${stepLabel(i)}`}>
              {step > i + 1 ? '✓ ' : ''}{label}
            </div>
          ))}
        </div>

        {/* Cabecera */}
        <div className="ds-modal-hd">
          <p className="ds-modal-title">
            {step === 1 && 'Importar productos desde Excel'}
            {step === 2 && 'Mapear columnas'}
            {step === 3 && 'Confirmar importación'}
            {step === 4 && 'Importación completada'}
          </p>
          <button onClick={onClose} className="ds-btn-icon">
            <IconX style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div className="ds-modal-body">

          {/* ── Paso 1: Subir archivo ── */}
          {step === 1 && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={(e) => parseFile(e.target.files[0])}
              />
              <div
                className={`imp-drop${isDrag ? ' drag' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDrag(true) }}
                onDragLeave={() => setIsDrag(false)}
                onDrop={(e) => { e.preventDefault(); setIsDrag(false); parseFile(e.dataTransfer.files[0]) }}
              >
                <p className="imp-drop-icon">📊</p>
                <p className="imp-drop-title">Arrastrá o hacé click para subir</p>
                <p className="imp-drop-sub">.xlsx · .xls · .csv</p>
              </div>
              {parseError && <p className="ds-msg-error">{parseError}</p>}
            </>
          )}

          {/* ── Paso 2: Mapear columnas ── */}
          {step === 2 && (
            <>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4d5a72', marginBottom: 8 }}>
                  {columns.length} columnas detectadas
                </p>
                <div className="imp-cols">
                  {columns.map(c => <span key={c} className="imp-col-chip">{c}</span>)}
                </div>
              </div>

              <div className="imp-map-grid">
                {FIELDS.map(({ key, label, required }) => (
                  <div key={key} className="imp-map-row">
                    <div className="imp-map-label">
                      {label}{required && <span className="imp-req"> *</span>}
                    </div>
                    <div className="imp-map-sel">
                      <select
                        value={mapping[key] ?? ''}
                        onChange={(e) => setMapping(m => ({
                          ...m,
                          [key]: e.target.value || undefined,
                        }))}
                      >
                        <option value="">— No mapear —</option>
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} className="ds-btn-ghost" style={{ flex: 1, height: 44 }}>
                  Atrás
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canNext}
                  className="ds-btn"
                  style={{ flex: 1, height: 44 }}
                >
                  Siguiente · {products.length} productos
                </button>
              </div>
            </>
          )}

          {/* ── Paso 3: Preview y confirmar ── */}
          {step === 3 && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4d5a72' }}>
                {products.length} productos para importar
                {ignoredCount > 0 && ` · ${ignoredCount} filas ignoradas (sin código o nombre)`}
              </p>

              <div className="imp-preview-wrap">
                <p className="imp-preview-hd">Vista previa — primeras 5 filas</p>
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th>Proveedor</th>
                      <th className="right">Stock</th>
                      <th className="right">Mín.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 5).map((p, i) => (
                      <tr key={i}>
                        <td><span className="ds-mono">{p.barcode}</span></td>
                        <td style={{ fontWeight: 700, color: '#fff' }}>{p.itemName}</td>
                        <td style={{ color: '#9a9078', fontSize: 12 }}>{p.providerName || '—'}</td>
                        <td className="right tabular" style={{ fontWeight: 700 }}>{p.currentStock}</td>
                        <td className="right tabular" style={{ color: '#4d5a72', fontWeight: 700 }}>{p.minRequiredStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length > 5 && (
                  <p className="imp-preview-more">+ {products.length - 5} más...</p>
                )}
              </div>

              {parseError && <p className="ds-msg-error">{parseError}</p>}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(2)} className="ds-btn-ghost" style={{ flex: 1, height: 48 }}>
                  Atrás
                </button>
                <button
                  onClick={() => mutation.mutate(products)}
                  disabled={mutation.isPending || products.length === 0}
                  className="ds-btn"
                  style={{ flex: 1, height: 48 }}
                >
                  {mutation.isPending ? 'Importando...' : `Importar ${products.length} productos`}
                </button>
              </div>
            </>
          )}

          {/* ── Paso 4: Resultado ── */}
          {step === 4 && result && (
            <>
              <div className="imp-result-ok">
                <p className="imp-result-num">{result.imported}</p>
                <p className="imp-result-lbl">Productos importados</p>
              </div>

              {result.skipped > 0 && (
                <div>
                  <p className="imp-skipped-title">
                    {result.skipped} omitidos — código de barras ya existente
                  </p>
                  <div className="imp-skipped-list">
                    {result.skippedBarcodes.slice(0, 10).map(bc => (
                      <span key={bc} className="imp-skipped-item">· {bc}</span>
                    ))}
                    {result.skippedBarcodes.length > 10 && (
                      <span className="imp-skipped-item">
                        ... y {result.skippedBarcodes.length - 10} más
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button onClick={onClose} className="ds-btn" style={{ width: '100%', height: 48 }}>
                Cerrar
              </button>
            </>
          )}

        </div>
      </ModalBackdrop>
    </>
  )
}
