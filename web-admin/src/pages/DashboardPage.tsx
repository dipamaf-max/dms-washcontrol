import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useStation } from '../context/StationContext';
import { DashboardOverview } from '../types';
import { StatCard } from '../components/StatCard';

function formatFCFA(value: number) {
  return `${value.toLocaleString('fr-FR')} FCFA`;
}

export function DashboardPage() {
  const { currentStationId } = useStation();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentStationId) return;
    setLoading(true);
    api
      .get<DashboardOverview>('/dashboard/overview', { params: { stationId: currentStationId } })
      .then((res) => setOverview(res.data))
      .finally(() => setLoading(false));
  }, [currentStationId]);

  if (!currentStationId) {
    return <p style={{ color: 'var(--color-muted)' }}>Créez ou sélectionnez une station pour commencer.</p>;
  }

  if (loading || !overview) {
    return <p style={{ color: 'var(--color-muted)' }}>Chargement...</p>;
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Tableau de bord</h1>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard label="CA du jour" value={formatFCFA(overview.revenueToday)} accent="var(--color-blue-light)" />
        <StatCard label="Véhicules lavés" value={String(overview.vehiclesWashedToday)} />
        <StatCard label="Employés actifs" value={String(overview.activeEmployees)} />
        <StatCard label="Dépenses" value={formatFCFA(overview.expensesToday)} accent="var(--color-danger)" />
        <StatCard label="Bénéfices" value={formatFCFA(overview.profitToday)} accent="var(--color-success)" />
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Meilleurs clients</h3>
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Lavages</th>
              <th>Points fidélité</th>
            </tr>
          </thead>
          <tbody>
            {overview.topCustomers.map((c) => (
              <tr key={c.id}>
                <td>{c.fullName}</td>
                <td>{c.washCount}</td>
                <td>{c.loyaltyPoints}</td>
              </tr>
            ))}
            {overview.topCustomers.length === 0 && (
              <tr>
                <td colSpan={3} style={{ color: 'var(--color-muted)' }}>
                  Aucun client pour le moment
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
