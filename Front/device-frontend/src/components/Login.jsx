// Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn } from '../lib/auth-client';
import { Activity } from 'lucide-react';
import '../App.css';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn.email({
        email: formData.email,
        password: formData.password
      });

      if (result.error) {
        setError(result.error.message || 'Error al iniciar sesión');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="auth-container">
      {/* Left Side - Image & Brand */}
      <div className="auth-image-side">
        <div className="auth-brand">
          <Activity size={64} className="auth-brand-icon" color="white" />
          <h1>MediControl</h1>
          <p>Sistema integral para la gestión y control de dispositivos médicos y equipos hospitalarios.</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Bienvenido de nuevo</h2>
            <p>Ingresa tus credenciales para acceder</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="nombre@hospital.com"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                minLength={8}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              ¿No tienes una cuenta?{' '}
              <Link to="/register">Solicitar acceso</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
