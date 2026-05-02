import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useSignalR } from '../hooks/useSignalR'
import { QK } from '../utils/queryKeys'
import {
  IconHome, IconBox, IconArrows, IconScan,
  IconUsers, IconLogout, IconShield, IconX,
} from './Icons'

const CSS = `
  .ly-wrap { display: flex; align-items: flex-start; }

  /* ── Sidebar ── */
  .ly-sidebar {
    width: 210px;
    flex-shrink: 0;
    background: #09090b;
    border-right: 4px solid #000;
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100dvh;
    overflow-y: auto;
  }

  .ly-brand-area {
    padding: 18px 18px 14px;
    border-bottom: 4px solid #000;
  }

  .ly-brand {
    font-size: 19px;
    font-weight: 900;
    font-style: italic;
    letter-spacing: -0.03em;
    text-transform: uppercase;
    color: #facc15;
    margin: 0;
    line-height: 1;
  }
  .ly-brand span { color: #fff; }

  .ly-brand-sub {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #2e3545;
    margin: 5px 0 0;
  }

  .ly-nav { flex: 1; padding: 10px; display: flex; flex-direction: column; gap: 2px; }

  .ly-nav-sep {
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #1e2a3a;
    padding: 12px 8px 4px;
  }

  .ly-nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: #3d4f66;
    text-decoration: none;
    border: 3px solid transparent;
    border-left: 3px solid transparent;
    transition: color 0.12s, background 0.12s, border-color 0.12s;
    cursor: pointer;
    background: none;
    width: 100%;
    text-align: left;
  }
  .ly-nav-item:hover {
    color: #dce2f7;
    background: rgba(255,255,255,0.04);
    border-left-color: rgba(255,255,255,0.1);
  }
  .ly-nav-item.ly-active {
    color: #facc15;
    border-left-color: #facc15;
    background: rgba(250,204,21,0.07);
  }

  /* ── Sidebar footer ── */
  .ly-sidebar-ft {
    padding: 10px;
    border-top: 4px solid #000;
  }
  .ly-user-box { padding: 6px 10px 8px; }
  .ly-user-name {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #dce2f7;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ly-user-role {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #2e3545;
    margin-top: 3px;
  }

  /* ── Content area ── */
  .ly-content { flex: 1; display: flex; flex-direction: column; min-height: 100dvh; background: var(--bg-secondary); }

  /* ── Mobile header ── */
  .ly-mob-header {
    display: none;
    background: #09090b;
    border-bottom: 4px solid #000;
    padding: 13px 16px;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .ly-mob-brand {
    font-size: 17px;
    font-weight: 900;
    font-style: italic;
    text-transform: uppercase;
    letter-spacing: -0.03em;
    color: #facc15;
    line-height: 1;
  }
  .ly-mob-brand span { color: #fff; }
  .ly-mob-sub {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #2e3545;
    margin-top: 3px;
  }
  .ly-mob-logout {
    background: none;
    border: none;
    cursor: pointer;
    color: #3d4f66;
    padding: 6px;
    transition: color 0.15s;
  }
  .ly-mob-logout:hover { color: #facc15; }

  /* ── Main ── */
  .ly-main { flex: 1; padding: 20px; padding-bottom: 84px; }

  /* ── Bottom nav ── */
  .ly-bot-nav {
    display: none;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: #09090b;
    border-top: 4px solid #000;
    z-index: 50;
  }
  .ly-bot-inner { display: flex; }
  .ly-bot-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 11px 8px 10px;
    gap: 4px;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #3d4f66;
    text-decoration: none;
    background: none;
    border: none;
    border-left: 1px solid #000;
    cursor: pointer;
    transition: color 0.12s, background 0.12s;
  }
  .ly-bot-btn:first-child { border-left: none; }
  .ly-bot-btn.ly-active, .ly-bot-btn:hover { color: #facc15; background: rgba(250,204,21,0.06); }

  /* ── Admin bottom sheet ── */
  .ly-sheet-bd {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.8);
    z-index: 40;
  }
  .ly-sheet {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 50;
    background: #09090b;
    border-top: 4px solid #000;
    box-shadow: 0 -6px 0 0 rgba(0,0,0,1);
  }
  .ly-sheet-hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 4px solid #000;
  }
  .ly-sheet-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #facc15;
  }
  .ly-sheet-close {
    background: none; border: none; cursor: pointer;
    color: #9a9078; padding: 4px; transition: color 0.15s;
  }
  .ly-sheet-close:hover { color: #fff; }
  .ly-sheet-nav { padding: 8px; }
  .ly-sheet-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 13px 12px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #dce2f7;
    background: none;
    border: none;
    border-left: 3px solid transparent;
    cursor: pointer;
    text-align: left;
    transition: color 0.12s, border-color 0.12s, background 0.12s;
  }
  .ly-sheet-item:hover { color: #facc15; border-left-color: #facc15; background: rgba(250,204,21,0.06); }

  /* ── Responsive ── */
  @media (max-width: 767px) {
    .ly-sidebar    { display: none; }
    .ly-mob-header { display: flex; }
    .ly-main       { padding: 14px; padding-bottom: 80px; }
    .ly-bot-nav    { display: block; }
  }
  @media (min-width: 768px) {
    .ly-main { padding-bottom: 20px; }
  }
`

const adminSidebarItems = [
  { to: '/',          label: 'Dashboard',   Icon: IconHome,  end: true },
  { to: '/products',  label: 'Productos',   Icon: IconBox },
  { to: '/movements', label: 'Movimientos', Icon: IconArrows },
  { to: '/scan',      label: 'Escanear',    Icon: IconScan },
]

const adminSidebarSecondary = [
  { to: '/users', label: 'Usuarios', Icon: IconUsers },
]

const adminPanelItems = [
  { to: '/',          label: 'Dashboard',   Icon: IconHome,  end: true },
  { to: '/products',  label: 'Productos',   Icon: IconBox },
  { to: '/movements', label: 'Movimientos', Icon: IconArrows },
  { to: '/users',     label: 'Usuarios',    Icon: IconUsers },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [adminPanelOpen, setAdminPanelOpen] = useState(false)
  const isAdmin = user?.role === 'Admin'

  // Conexión global: invalida todos los datos afectados cuando hay un movimiento de stock,
  // sin importar en qué página esté el usuario.
  useSignalR({
    onStockUpdated: () => {
      queryClient.invalidateQueries({ queryKey: QK.products })
      queryClient.invalidateQueries({ queryKey: QK.movements })
      queryClient.invalidateQueries({ queryKey: QK.lowStock })
    },
  })

  const handleLogout = () => { logout(); navigate('/login') }
  const handleAdminNav = (to) => { setAdminPanelOpen(false); navigate(to) }

  const navItems = isAdmin
    ? adminSidebarItems
    : [{ to: '/scan', label: 'Escanear', Icon: IconScan }]

  return (
    <>
      <style>{CSS}</style>
      <div className="ly-wrap">

        {/* ── Sidebar desktop ── */}
        <aside className="ly-sidebar">
          <div className="ly-brand-area">
            <h1 className="ly-brand">Gestión<span>PGB</span></h1>
            <p className="ly-brand-sub">Control de Stock</p>
          </div>

          <nav className="ly-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `ly-nav-item${isActive ? ' ly-active' : ''}`}
              >
                <item.Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
                {item.label}
              </NavLink>
            ))}

            {isAdmin && (
              <>
                <p className="ly-nav-sep">Admin</p>
                {adminSidebarSecondary.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `ly-nav-item${isActive ? ' ly-active' : ''}`}
                  >
                    <item.Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
                    {item.label}
                  </NavLink>
                ))}
              </>
            )}
          </nav>

          <div className="ly-sidebar-ft">
            <div className="ly-user-box">
              <p className="ly-user-name">{user?.unique_name}</p>
              <p className="ly-user-role">{isAdmin ? 'Administrador' : 'Operario'}</p>
            </div>
            <button onClick={handleLogout} className="ly-nav-item">
              <IconLogout style={{ width: 14, height: 14 }} />
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* ── Content ── */}
        <div className="ly-content">

          {/* Mobile header */}
          <header className="ly-mob-header">
            <div>
              <p className="ly-mob-brand">Gestión<span>PGB</span></p>
              <p className="ly-mob-sub">{isAdmin ? 'Admin' : 'Operario'} · {user?.unique_name}</p>
            </div>
            <button onClick={handleLogout} className="ly-mob-logout" aria-label="Cerrar sesión">
              <IconLogout style={{ width: 20, height: 20 }} />
            </button>
          </header>

          <main className="ly-main">
            {children}
          </main>

          {/* ── Mobile bottom nav ── */}
          {isAdmin ? (
            <>
              <div className="ly-bot-nav">
                <div className="ly-bot-inner">
                  <NavLink
                    to="/scan"
                    className={({ isActive }) => `ly-bot-btn${isActive ? ' ly-active' : ''}`}
                  >
                    <IconScan style={{ width: 22, height: 22 }} />
                    Escanear
                  </NavLink>
                  <button
                    onClick={() => setAdminPanelOpen(true)}
                    className={`ly-bot-btn${adminPanelOpen ? ' ly-active' : ''}`}
                  >
                    <IconShield style={{ width: 22, height: 22 }} />
                    Admin
                  </button>
                </div>
              </div>

              {adminPanelOpen && (
                <>
                  <div className="ly-sheet-bd" onClick={() => setAdminPanelOpen(false)} />
                  <div className="ly-sheet">
                    <div className="ly-sheet-hd">
                      <p className="ly-sheet-title">Panel de administración</p>
                      <button onClick={() => setAdminPanelOpen(false)} className="ly-sheet-close">
                        <IconX style={{ width: 18, height: 18 }} />
                      </button>
                    </div>
                    <nav className="ly-sheet-nav">
                      {adminPanelItems.map((item) => (
                        <button
                          key={item.to}
                          onClick={() => handleAdminNav(item.to)}
                          className="ly-sheet-item"
                        >
                          <item.Icon style={{ width: 18, height: 18, color: '#facc15' }} />
                          {item.label}
                        </button>
                      ))}
                    </nav>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="ly-bot-nav">
              <div className="ly-bot-inner">
                <NavLink
                  to="/scan"
                  className={({ isActive }) => `ly-bot-btn${isActive ? ' ly-active' : ''}`}
                >
                  <IconScan style={{ width: 24, height: 24 }} />
                  Escanear
                </NavLink>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
