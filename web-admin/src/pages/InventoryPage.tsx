import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useStation } from '../context/StationContext';
import { InventoryItem } from '../types';

const CATEGORIES = ['SHAMPOO', 'WAX', 'CLEANING_PRODUCT', 'ACCESSORY'];

export function InventoryPage() {
  const { currentStationId } = useStation();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('SHAMPOO');
  const [unit, setUnit] = useState('L');
  const [alertThreshold, setAlertThreshold] = useState('5');
  const [creating, setCreating] = useState(false);

  async function load() {
    if (!currentStationId) return;
    const { data } = await api.get<InventoryItem[]>('/inventory', { params: { stationId: currentStationId } });
    setItems(data);
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
      await api.post('/inventory', {
        name,
        category,
        unit,
        alertThreshold: Number(alertThreshold),
        stationId: currentStationId,
      });
      setName('');
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function addMovement(id: string, type: 'IN' | 'OUT') {
    const quantity = window.prompt(`Quantité à ${type === 'IN' ? 'ajouter' : 'retirer'}`);
    if (!quantity) return;
    await api.post(`/inventory/${id}/movements`, { type, quantity: Number(quantity) });
    await load();
  }

  if (!currentStationId) return <p style={{ color: 'var(--color-muted)' }}>Sélectionnez une station.</p>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Stock</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Article</th>
                <th>Catégorie</th>
                <th>Quantité</th>
                <th>Seuil alerte</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const low = Number(item.quantity) <= Number(item.alertThreshold);
                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td style={{ color: low ? 'var(--color-danger)' : undefined }}>
                      {item.quantity} {item.unit}
                    </td>
                    <td>{item.alertThreshold}</td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline" onClick={() => addMovement(item.id, 'IN')}>+ Entrée</button>
                      <button className="btn btn-outline" onClick={() => addMovement(item.id, 'OUT')}>- Sortie</button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: 'var(--color-muted)' }}>Aucun article</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleCreate} className="card">
          <h3 style={{ marginTop: 0 }}>Nouvel article</h3>
          <label className="label">Nom</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required style={{ marginBottom: 12 }} />
          <label className="label">Catégorie</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} style={{ marginBottom: 12 }}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="label">Unité (L, kg, pièce...)</label>
          <input className="input" value={unit} onChange={(e) => setUnit(e.target.value)} required style={{ marginBottom: 12 }} />
          <label className="label">Seuil d'alerte</label>
          <input className="input" type="number" min={0} value={alertThreshold} onChange={(e) => setAlertThreshold(e.target.value)} style={{ marginBottom: 16 }} />
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={creating}>
            {creating ? 'Création...' : 'Ajouter article'}
          </button>
        </form>
      </div>
    </div>
  );
}
