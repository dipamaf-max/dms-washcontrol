import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(fullName, email, password, phone || undefined);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <form onSubmit={handleSubmit} className="card" style={{ width: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <img src="/logo.svg" width={40} height={40} alt="DMS WashControl" />
          <div style={{ fontWeight: 700, fontSize: 18 }}>Créer un compte propriétaire</div>
        </div>

        <label className="label">Nom complet</label>
        <input
          className="input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          style={{ marginBottom: 16 }}
        />

        <label className="label">Email</label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ marginBottom: 16 }}
        />

        <label className="label">Téléphone</label>
        <input
          className="input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <label className="label">Mot de passe</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{ marginBottom: 16 }}
        />

        {error && (
          <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Création...' : 'Créer le compte'}
        </button>

        <div style={{ marginTop: 16, fontSize: 13, color: 'var(--color-muted)', textAlign: 'center' }}>
          Déjà inscrit ?{' '}
          <Link to="/login" style={{ color: 'var(--color-blue-light)' }}>
            Se connecter
          </Link>
        </div>
      </form>
    </div>
  );
}
