import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useStation } from '../context/StationContext';
import { Station } from '../types';

export function StationsPage() {
  const { stations, refresh } = useStation();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/stations', { name, address, phone });
      setName('');
      setAddress('');
      setPhone('');
      await refresh();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Stations</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Adresse</th>
                <th>Téléphone</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((s: Station) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.address}</td>
                  <td>{s.phone}</td>
                </tr>
              ))}
              {stations.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ color: 'var(--color-muted)' }}>
                    Aucune station
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleCreate} className="card">
          <h3 style={{ marginTop: 0 }}>Nouvelle station</h3>
          <label className="label">Nom</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required style={{ marginBottom: 12 }} />
          <label className="label">Adresse</label>
          <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} required style={{ marginBottom: 12 }} />
          <label className="label">Téléphone</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ marginBottom: 16 }} />
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={creating}>
            {creating ? 'Création...' : 'Créer la station'}
          </button>
        </form>
      </div>
    </div>
  );
}
