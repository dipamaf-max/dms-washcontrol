import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useStation } from '../context/StationContext';
import { SubscriptionPlan } from '../types';

interface CurrentSubscription {
  id: string;
  status: string;
  endDate: string;
  plan: SubscriptionPlan;
}

export function SubscriptionPage() {
  const { currentStationId } = useStation();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [current, setCurrent] = useState<CurrentSubscription | null>(null);
  const [payerPhone, setPayerPhone] = useState('');
  const [provider, setProvider] = useState<'ORANGE_MONEY' | 'WAVE' | 'MTN_MONEY' | 'MOOV_MONEY' | 'CASH'>('ORANGE_MONEY');
  const [subscribing, setSubscribing] = useState<string | null>(null);

  async function load() {
    const plansRes = await api.get<SubscriptionPlan[]>('/subscriptions/plans');
    setPlans(plansRes.data);
    if (currentStationId) {
      const currentRes = await api.get('/subscriptions/current', { params: { stationId: currentStationId } });
      setCurrent(currentRes.data);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStationId]);

  async function subscribe(planType: string) {
    if (!currentStationId || !payerPhone) return;
    setSubscribing(planType);
    try {
      const { data } = await api.post('/subscriptions', {
        stationId: currentStationId,
        planType,
        provider,
        payerPhone,
      });
      await load();
      if (data.paymentUrl) {
        window.open(data.paymentUrl, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setSubscribing(null);
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Abonnement SaaS</h1>

      {current && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="label">Abonnement actuel</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {current.plan.name} — <span className={`badge ${current.status === 'ACTIVE' ? 'badge-done' : 'badge-pending'}`}>{current.status}</span>
          </div>
          <div style={{ color: 'var(--color-muted)', fontSize: 13, marginTop: 4 }}>
            Expire le {new Date(current.endDate).toLocaleDateString('fr-FR')}
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div>
          <label className="label">Numéro Mobile Money</label>
          <input className="input" value={payerPhone} onChange={(e) => setPayerPhone(e.target.value)} placeholder="07 00 00 00 00" />
        </div>
        <div>
          <label className="label">Opérateur</label>
          <select className="input" value={provider} onChange={(e) => setProvider(e.target.value as any)}>
            <option value="ORANGE_MONEY">Orange Money</option>
            <option value="WAVE">Wave</option>
            <option value="MTN_MONEY">MTN Money</option>
            <option value="MOOV_MONEY">Moov Money</option>
            <option value="CASH">Espèces</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {plans.map((plan) => (
          <div key={plan.id} className="card">
            <h3 style={{ marginTop: 0 }}>{plan.name}</h3>
            <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-blue-light)', marginBottom: 16 }}>
              {Number(plan.monthlyPrice).toLocaleString('fr-FR')} FCFA<span style={{ fontSize: 14, color: 'var(--color-muted)' }}>/mois</span>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={!payerPhone || subscribing === plan.type}
              onClick={() => subscribe(plan.type)}
            >
              {subscribing === plan.type ? 'Traitement...' : "S'abonner"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
