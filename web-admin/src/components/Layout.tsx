import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStation } from '../context/StationContext';

const NAV_ITEMS = [
  { to: '/', label: 'Tableau de bord', end: true },
  { to: '/stations', label: 'Stations' },
  { to: '/wash-orders', label: 'Lavages' },
  { to: '/customers', label: 'Clients' },
  { to: '/vehicles', label: 'Véhicules' },
  { to: '/employees', label: 'Employés' },
  { to: '/inventory', label: 'Stock' },
  { to: '/transactions', label: 'Finances' },
  { to: '/subscription', label: 'Abonnement' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const { stations, currentStationId, setCurrentStationId } = useStation();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 240,
          background: 'var(--color-black-soft)',
          borderRight: '1px solid var(--color-border)',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <img src="/logo.svg" alt="DMS WashControl" width={36} height={36} />
          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
            DMS
            <br />
            WashControl
          </div>
        </div>

        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              padding: '10px 12px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              color: isActive ? 'var(--color-white)' : 'var(--color-muted)',
              background: isActive ? 'var(--color-blue)' : 'transparent',
              textDecoration: 'none',
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            height: 64,
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
          }}
        >
          <select
            className="input"
            style={{ width: 260 }}
            value={currentStationId ?? ''}
            onChange={(e) => setCurrentStationId(e.target.value)}
          >
            {stations.length === 0 && <option value="">Aucune station</option>}
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.fullName}</div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{user?.role}</div>
            </div>
            <button className="btn btn-outline" onClick={logout}>
              Déconnexion
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
