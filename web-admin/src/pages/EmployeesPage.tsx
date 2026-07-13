import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useStation } from '../context/StationContext';
import { Employee } from '../types';

export function EmployeesPage() {
  const { currentStationId } = useStation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState('');
  const [commissionRate, setCommissionRate] = useState('0');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!currentStationId) return;
    const { data } = await api.get<Employee[]>('/employees', { params: { stationId: currentStationId } });
    setEmployees(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStationId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!currentStationId) return;
    setCreating(true);
    setError(null);
    try {
      await api.post('/employees', {
        fullName,
        email,
        phone: phone || undefined,
        password,
        position,
        commissionRate: Number(commissionRate),
        stationId: currentStationId,
      });
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setPosition('');
      setCommissionRate('0');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  }

  async function checkIn(id: string) {
    await api.post(`/employees/${id}/attendance/check-in`);
  }

  async function checkOut(id: string) {
    await api.post(`/employees/${id}/attendance/check-out`);
  }

  if (!currentStationId) return <p style={{ color: 'var(--color-muted)' }}>Sélectionnez une station.</p>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Employés</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Poste</th>
                <th>Commission</th>
                <th>Présence</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.user.fullName}</td>
                  <td>{emp.position}</td>
                  <td>{emp.commissionRate}%</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline" onClick={() => checkIn(emp.id)}>Entrée</button>
                    <button className="btn btn-outline" onClick={() => checkOut(emp.id)}>Sortie</button>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--color-muted)' }}>Aucun employé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleCreate} className="card">
          <h3 style={{ marginTop: 0 }}>Nouvel employé</h3>
          <label className="label">Nom complet</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ marginBottom: 12 }} />
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ marginBottom: 12 }} />
          <label className="label">Téléphone</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ marginBottom: 12 }} />
          <label className="label">Mot de passe</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={{ marginBottom: 12 }} />
          <label className="label">Poste</label>
          <input className="input" value={position} onChange={(e) => setPosition(e.target.value)} required style={{ marginBottom: 12 }} />
          <label className="label">Commission (%)</label>
          <input className="input" type="number" min={0} value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} style={{ marginBottom: 16 }} />
          {error && <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={creating}>
            {creating ? 'Création...' : 'Ajouter employé'}
          </button>
        </form>
      </div>
    </div>
  );
}
