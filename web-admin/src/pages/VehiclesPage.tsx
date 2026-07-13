import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useStation } from '../context/StationContext';
import { Customer, Vehicle } from '../types';

const VEHICLE_TYPES = ['CAR', 'SUV', 'MOTORCYCLE', 'VAN', 'TRUCK', 'OTHER'];

export function VehiclesPage() {
  const { currentStationId } = useStation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plateNumber, setPlateNumber] = useState('');
  const [type, setType] = useState('CAR');
  const [customerId, setCustomerId] = useState('');
  const [creating, setCreating] = useState(false);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  async function load() {
    if (!currentStationId) return;
    const [vehiclesRes, customersRes] = await Promise.all([
      api.get<Vehicle[]>('/vehicles', { params: { stationId: currentStationId } }),
      api.get<Customer[]>('/customers', { params: { stationId: currentStationId } }),
    ]);
    setVehicles(vehiclesRes.data);
    setCustomers(customersRes.data);
    if (!customerId && customersRes.data.length > 0) setCustomerId(customersRes.data[0].id);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStationId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!currentStationId || !customerId) return;
    setCreating(true);
    try {
      await api.post('/vehicles', { plateNumber, type, customerId, stationId: currentStationId });
      setPlateNumber('');
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function showQrCode(vehicleId: string) {
    const { data } = await api.get(`/vehicles/${vehicleId}/qrcode`);
    setQrPreview(data.qrCodeImage);
  }

  if (!currentStationId) return <p style={{ color: 'var(--color-muted)' }}>Sélectionnez une station.</p>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Véhicules</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Plaque</th>
                <th>Type</th>
                <th>Client</th>
                <th>QR Code</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td>{v.plateNumber}</td>
                  <td>{v.type}</td>
                  <td>{v.customer?.fullName}</td>
                  <td>
                    <button className="btn btn-outline" onClick={() => showQrCode(v.id)}>
                      Voir QR
                    </button>
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--color-muted)' }}>
                    Aucun véhicule
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <form onSubmit={handleCreate} className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Nouveau véhicule</h3>
            <label className="label">Plaque d'immatriculation</label>
            <input className="input" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} required style={{ marginBottom: 12 }} />

            <label className="label">Type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)} style={{ marginBottom: 12 }}>
              {VEHICLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <label className="label">Client</label>
            <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required style={{ marginBottom: 16 }}>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </select>

            <button className="btn btn-primary" style={{ width: '100%' }} disabled={creating || !customerId}>
              {creating ? 'Création...' : 'Ajouter le véhicule'}
            </button>
          </form>

          {qrPreview && (
            <div className="card" style={{ textAlign: 'center' }}>
              <img src={qrPreview} alt="QR Code véhicule" style={{ width: '100%', maxWidth: 220 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
