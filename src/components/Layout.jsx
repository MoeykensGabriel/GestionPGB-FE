import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { useSignalR } from '../hooks/useSignalR'
import { QK } from '../utils/queryKeys'
import {
  IconHome, IconBox, IconArrows, IconScan,
  IconUsers, IconLogout, IconShield, IconX, IconWrench,
  IconSun, IconMoon,
} from './Icons'
import { InstallApp } from './InstallApp'

const CSS = `
  .ly-wrap { display: flex; align-items: flex-start; }

  /* ── Sidebar ── */
  .ly-sidebar {
    width: 210px;
    flex-shrink: 0;
    background: var(--bg-primary);
    border-right: 4px solid var(--border);
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100dvh;
    overflow-y: auto;
  }

  .ly-brand-area {
    padding: 18px 18px 14px;
    border-bottom: 4px solid var(--border);
  }

  .ly-brand {
    font-size: 19px;
    font-weight: 900;
    font-style: italic;
    letter-spacing: -0.03em;
    text-transform: uppercase;
    color: var(--accent);
    margin: 0;
    line-height: 1;
  }
  .ly-brand span { color: var(--text-primary); }

  .ly-brand-sub {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--text-tertiary);
    margin: 5px 0 0;
  }

  .ly-nav { flex: 1; padding: 10px; display: flex; flex-direction: column; gap: 2px; }

  .ly-nav-sep {
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--text-tertiary);
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
    color: var(--text-secondary);
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
    color: var(--text-primary);
    background: var(--overlay-hover);
    border-left-color: var(--overlay);
  }
  .ly-nav-item.ly-active {
    color: var(--accent);
    border-left-color: var(--accent);
    background: var(--overlay);
  }

  /* ── Sidebar footer ── */
  .ly-sidebar-ft {
    padding: 10px;
    border-top: 4px solid var(--border);
  }
  .ly-user-box { padding: 6px 10px 8px; }
  .ly-user-name {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ly-user-role {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-tertiary);
    margin-top: 3px;
  }

  /* ── Content area ── */
  .ly-content { flex: 1; display: flex; flex-direction: column; min-height: 100dvh; background: var(--bg-secondary); }

  /* ── Mobile header ── */
  .ly-mob-header {
    display: none;
    background: var(--bg-primary);
    border-bottom: 4px solid var(--border);
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
    color: var(--accent);
    line-height: 1;
  }
  .ly-mob-brand span { color: var(--text-primary); }
  .ly-mob-sub {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-tertiary);
    margin-top: 3px;
  }
  .ly-mob-logout {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-secondary);
    padding: 6px;
    transition: color 0.15s;
  }
  .ly-mob-logout:hover { color: var(--accent); }

  .ly-mob-actions { display: flex; align-items: center; gap: 4px; }

  /* ── Main ── */
  .ly-main { flex: 1; padding: 20px; padding-bottom: 84px; }

  /* ── Bottom nav ── */
  .ly-bot-nav {
    display: none;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    background: var(--bg-primary);
    border-top: 4px solid var(--border);
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
    color: var(--text-secondary);
    text-decoration: none;
    background: none;
    border: none;
    border-left: 1px solid var(--border);
    cursor: pointer;
    transition: color 0.12s, background 0.12s;
  }
  .ly-bot-btn:first-child { border-left: none; }
  .ly-bot-btn.ly-active, .ly-bot-btn:hover { color: var(--accent); background: var(--overlay); }

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
    background: var(--bg-primary);
    border-top: 4px solid var(--border);
    box-shadow: 0 -6px 0 0 var(--border);
  }
  .ly-sheet-hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 4px solid var(--border);
  }
  .ly-sheet-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .ly-sheet-close {
    background: none; border: none; cursor: pointer;
    color: var(--text-tertiary); padding: 4px; transition: color 0.15s;
  }
  .ly-sheet-close:hover { color: var(--text-primary); }
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
    color: var(--text-primary);
    background: none;
    border: none;
    border-left: 3px solid transparent;
    cursor: pointer;
    text-align: left;
    transition: color 0.12s, border-color 0.12s, background 0.12s;
  }
  .ly-sheet-item:hover { color: var(--accent); border-left-color: var(--accent); background: var(--overlay); }

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
  { to: '/',                 label: 'Dashboard',     Icon: IconHome,   end: true },
  { to: '/products',         label: 'Productos',     Icon: IconBox },
  { to: '/movements',        label: 'Movimientos',   Icon: IconArrows },
  { to: '/workshop-orders',  label: 'Pedidos taller', Icon: IconWrench },
  { to: '/scan',             label: 'Escanear',      Icon: IconScan },
]

const adminSidebarSecondary = [
  { to: '/users', label: 'Usuarios', Icon: IconUsers },
]

const adminPanelItems = [
  { to: '/',                 label: 'Dashboard',     Icon: IconHome,   end: true },
  { to: '/products',         label: 'Productos',     Icon: IconBox },
  { to: '/movements',        label: 'Movimientos',   Icon: IconArrows },
  { to: '/workshop-orders',  label: 'Pedidos taller', Icon: IconWrench },
  { to: '/users',            label: 'Usuarios',      Icon: IconUsers },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
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
            <InstallApp className="ly-nav-item" />
            <button onClick={toggleTheme} className="ly-nav-item" title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}>
              {theme === 'dark'
                ? <IconSun style={{ width: 14, height: 14, flexShrink: 0 }} />
                : <IconMoon style={{ width: 14, height: 14, flexShrink: 0 }} />}
              {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            </button>
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
            <div className="ly-mob-actions">
              <InstallApp className="ly-mob-logout" label="" iconSize={20} />
              <button onClick={toggleTheme} className="ly-mob-logout" aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}>
                {theme === 'dark'
                  ? <IconSun style={{ width: 20, height: 20 }} />
                  : <IconMoon style={{ width: 20, height: 20 }} />}
              </button>
              <button onClick={handleLogout} className="ly-mob-logout" aria-label="Cerrar sesión">
                <IconLogout style={{ width: 20, height: 20 }} />
              </button>
            </div>
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
