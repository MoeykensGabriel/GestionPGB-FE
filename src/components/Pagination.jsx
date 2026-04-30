export function Pagination({ page, pageSize, total, onPage }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      paddingTop: 14,
      fontSize: 11,
      fontWeight: 700,
      color: '#4d5a72',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    }}>
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="ds-btn-ghost"
        style={{ height: 34, padding: '0 12px', fontSize: 14, lineHeight: 1 }}
      >
        ‹
      </button>
      <span>Pág. {page} / {totalPages} · {total} total</span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="ds-btn-ghost"
        style={{ height: 34, padding: '0 12px', fontSize: 14, lineHeight: 1 }}
      >
        ›
      </button>
    </div>
  )
}
