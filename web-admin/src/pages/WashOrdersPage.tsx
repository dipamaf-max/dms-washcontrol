import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useStation } from '../context/StationContext';
import { Customer, ServiceItem, Vehicle, WashOrder, WashOrderStatus } from '../types';

const COLUMNS: { status: WashOrderStatus; label: string; badgeClass: string; next?: WashOrderStatus }[] = [
  { status: 'PENDING', label: 'En attente', badgeClass: 'badge-pending', next: 'IN_PROGRESS' },
  { status: 'IN_PROGRESS', label: 'En cours', badgeClass: 'badge-progress', next: 'DONE' },
  { status: 'DONE', label: 'Terminé', badgeClass: 'badge-done', next: 'DELIVERED' },
  { status: 'DELIVERED', label: 'Livré', badgeClass: 'badge-delivered' },
];

export function WashOrdersPage() {
  const { currentStationId } = useStation();
  const [orders, setOrders] = useState<WashOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [creating, setCreating] = useState(false);

  async function load() {
    if (!currentStationId) return;
    const [ordersRes, customersRes, vehiclesRes, servicesRes] = await Promise.all([
      api.get<WashOrder[]>('/wash-orders', { params: { stationId: currentStationId } }),
      api.get<Customer[]>('/customers', { params: { stationId: currentStationId } }),
      api.get<Vehicle[]>('/vehicles', { params: { stationId: currentStationId } }),
      api.get<ServiceItem[]>('/services', { params: { stationId: currentStationId } }),
    ]);
    setOrders(ordersRes.data);
    setCustomers(customersRes.data);
    setVehicles(vehiclesRes.data);
    setServices(servicesRes.data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStationId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!currentStationId || !customerId || !vehicleId || !serviceId) return;
    setCreating(true);
    try {
      await api.post('/wash-orders', { stationId: currentStationId, customerId, vehicleId, serviceId });
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function advance(order: WashOrder, next: WashOrderStatus) {
    await api.patch(`/wash-orders/${order.id}/status`, { status: next });
    await load();
  }

  if (!currentStationId) return <p style={{ color: 'var(--color-muted)' }}>Sélectionnez une station.</p>;

  const customerVehicles = vehicles.filter((v) => v.customerId === customerId);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Lavages</h1>

      <form onSubmit={handleCreate} className="card" style={{ marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label className="label">Client</label>
          <select className="input" value={customerId} onChange={(e) => { setCustomerId(e.target.value); setVehicleId(''); }} required>
            <option value="">Sélectionner...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.fullName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Véhicule</label>
          <select className="input" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required disabled={!customerId}>
            <option value="">Sélectionner...</option>
            {customerVehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.plateNumber}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Service</label>
          <select className="input" value={serviceId} onChange={(e) => setServiceId(e.target.value)} required>
            <option value="">Sélectionner...</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name} - {s.price} FCFA</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" disabled={creating}>
          {creating ? 'Création...' : 'Nouveau lavage'}
        </button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {COLUMNS.map((col) => (
          <div key={col.status} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className={`badge ${col.badgeClass}`}>{col.label}</span>
              <span style={{ color: 'var(--color-muted)', fontSize: 13 }}>
                {orders.filter((o) => o.status === col.status).length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {orders
                .filter((o) => o.status === col.status)
                .map((o) => (
                  <div key={o.id} style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{o.vehicle.plateNumber}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>{o.customer.fullName}</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>{o.service.name} - {o.price} FCFA</div>
                    {col.next && (
                      <button
                        className="btn btn-outline"
                        style={{ marginTop: 8, width: '100%', fontSize: 12, padding: '6px 10px' }}
                        onClick={() => advance(o, col.next!)}
                      >
                        {col.next === 'IN_PROGRESS' && 'Démarrer'}
                        {col.next === 'DONE' && 'Terminer'}
                        {col.next === 'DELIVERED' && 'Livrer'}
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
