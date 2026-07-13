import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useStation } from '../context/StationContext';
import { Transaction } from '../types';

export function TransactionsPage() {
  const { currentStationId } = useStation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [daily, setDaily] = useState<{ income: number; expense: number; profit: number } | null>(null);
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [creating, setCreating] = useState(false);

  async function load() {
    if (!currentStationId) return;
    const [txRes, dailyRes] = await Promise.all([
      api.get<Transaction[]>('/transactions', { params: { stationId: currentStationId } }),
      api.get('/transactions/reports/daily', { params: { stationId: currentStationId } }),
    ]);
    setTransactions(txRes.data);
    setDaily(dailyRes.data);
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
      await api.post('/transactions', { type, amount: Number(amount), category, stationId: currentStationId });
      setAmount('');
      setCategory('');
      await load();
    } finally {
      setCreating(false);
    }
  }

  if (!currentStationId) return <p style={{ color: 'var(--color-muted)' }}>Sélectionnez une station.</p>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Finances</h1>

      {daily && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ flex: 1 }}>
            <div className="label">Revenus du jour</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{daily.income.toLocaleString('fr-FR')} FCFA</div>
          </div>
          <div className="card" style={{ flex: 1 }}>
            <div className="label">Dépenses du jour</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-danger)' }}>{daily.expense.toLocaleString('fr-FR')} FCFA</div>
          </div>
          <div className="card" style={{ flex: 1 }}>
            <div className="label">Bénéfice du jour</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-success)' }}>{daily.profit.toLocaleString('fr-FR')} FCFA</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Catégorie</th>
                <th>Montant</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className={t.type === 'INCOME' ? 'badge badge-done' : 'badge badge-pending'}>
                      {t.type === 'INCOME' ? 'Entrée' : 'Dépense'}
                    </span>
                  </td>
                  <td>{t.category}</td>
                  <td>{t.amount} FCFA</td>
                  <td>{new Date(t.date).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--color-muted)' }}>Aucune transaction</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleCreate} className="card">
          <h3 style={{ marginTop: 0 }}>Nouvelle transaction</h3>
          <label className="label">Type</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as 'INCOME' | 'EXPENSE')} style={{ marginBottom: 12 }}>
            <option value="EXPENSE">Dépense</option>
            <option value="INCOME">Entrée</option>
          </select>
          <label className="label">Catégorie</label>
          <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} required style={{ marginBottom: 12 }} />
          <label className="label">Montant (FCFA)</label>
          <input className="input" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required style={{ marginBottom: 16 }} />
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={creating}>
            {creating ? 'Ajout...' : 'Ajouter'}
          </button>
        </form>
      </div>
    </div>
  );
}
