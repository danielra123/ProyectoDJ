// Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '../lib/auth-client';
import { Activity } from 'lucide-react';
import '../App.css';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp.email({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      if (result.error) {
        setError(result.error.message || 'Error al registrar usuario');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
      console.error('Register error:', err);
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
          <p>Únete a la plataforma líder en gestión de dispositivos médicos.</p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Crear Cuenta</h2>
            <p>Completa tus datos para registrarte</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">Nombre completo</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Dr. Juan Pérez"
                disabled={loading}
              />
            </div>

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
                placeholder="Mínimo 8 caracteres"
                minLength={8}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Repite tu contraseña"
                minLength={8}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login">Inicia sesión aquí</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
