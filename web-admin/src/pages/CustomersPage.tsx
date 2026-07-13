import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useStation } from '../context/StationContext';
import { Customer } from '../types';

export function CustomersPage() {
  const { currentStationId } = useStation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [creating, setCreating] = useState(false);

  async function load() {
    if (!currentStationId) return;
    const { data } = await api.get<Customer[]>('/customers', { params: { stationId: currentStationId } });
    setCustomers(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStationId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!currentStationId) return;
    setCreating(true);
    try {
      await api.post('/customers', { fullName, phone, stationId: currentStationId });
      setFullName('');
      setPhone('');
      await load();
    } finally {
      setCreating(false);
    }
  }

  if (!currentStationId) return <p style={{ color: 'var(--color-muted)' }}>Sélectionnez une station.</p>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Clients</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Téléphone</th>
                <th>Lavages</th>
                <th>Points fidélité</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>{c.fullName}</td>
                  <td>{c.phone}</td>
                  <td>{c._count?.washOrders ?? 0}</td>
                  <td>{c.loyaltyPoints}</td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--color-muted)' }}>
                    Aucun client
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleCreate} className="card">
          <h3 style={{ marginTop: 0 }}>Nouveau client</h3>
          <label className="label">Nom complet</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ marginBottom: 12 }} />
          <label className="label">Téléphone</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ marginBottom: 16 }} />
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={creating}>
            {creating ? 'Création...' : 'Ajouter le client'}
          </button>
        </form>
      </div>
    </div>
  );
}
