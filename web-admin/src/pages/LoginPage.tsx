import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Email ou mot de passe incorrect');
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
          <div style={{ fontWeight: 700, fontSize: 18 }}>DMS WashControl</div>
        </div>

        <label className="label">Email</label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ marginBottom: 16 }}
        />

        <label className="label">Mot de passe</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ marginBottom: 16 }}
        />

        {error && (
          <div style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>

        <div style={{ marginTop: 16, fontSize: 13, color: 'var(--color-muted)', textAlign: 'center' }}>
          Pas encore de compte propriétaire ?{' '}
          <Link to="/register" style={{ color: 'var(--color-blue-light)' }}>
            Créer un compte
          </Link>
        </div>
      </form>
    </div>
  );
}
