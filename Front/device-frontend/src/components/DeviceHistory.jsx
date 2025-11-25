import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Activity, Laptop } from 'lucide-react';
import DataTable from './DataTable';

export default function DeviceHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/devices/history', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error al cargar el historial');
      }

      const data = await response.json();
      setHistory(data);
    } catch (err) {
      setError('Error al cargar el historial de dispositivos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceTypeIcon = (type) => {
    switch(type) {
      case 'medical-device':
        return <Activity size={16} style={{ color: '#10b981' }} />;
      case 'frequent-computer':
        return <Package size={16} style={{ color: '#8b5cf6' }} />;
      default:
        return <Laptop size={16} style={{ color: '#2563eb' }} />;
    }
  };

  const getDeviceTypeLabel = (type) => {
    const labels = {
      'computer': 'Computadora',
      'frequent-computer': 'Computadora Frecuente',
      'medical-device': 'Dispositivo Médico'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Configuración de columnas para el DataTable
  const columns = [
    {
      key: 'deviceType',
      header: 'Tipo',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getDeviceTypeIcon(value)}
          <span>{getDeviceTypeLabel(value)}</span>
        </div>
      )
    },
    {
      key: 'event',
      header: 'Evento',
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className={`event-badge-inline ${value === 'checkin' ? 'badge-success' : 'badge-warning'}`}>
          {value === 'checkin' ? 'Entrada' : 'Salida'}
        </span>
      )
    },
    {
      key: 'brand',
      header: 'Marca',
      sortable: true,
      filterable: true
    },
    {
      key: 'model',
      header: 'Modelo',
      sortable: true,
      filterable: true
    },
    {
      key: 'serial',
      header: 'Serial',
      sortable: true,
      filterable: true,
      render: (value) => value || '-'
    },
    {
      key: 'color',
      header: 'Color',
      sortable: true,
      filterable: true,
      render: (value) => value || '-'
    },
    {
      key: 'owner.name',
      header: 'Propietario',
      sortable: true,
      filterable: true
    },
    {
      key: 'owner.id',
      header: 'ID Propietario',
      sortable: true,
      filterable: true
    },
    {
      key: 'eventDate',
      header: 'Fecha y Hora',
      sortable: true,
      render: (value) => formatDate(value)
    }
  ];

  if (loading) {
    return (
      <div className="app-container">
        <div className="app-content">
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Cargando historial...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-content">
        <div className="history-header-container">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
            style={{ marginBottom: '20px' }}
          >
            <ArrowLeft size={18} />
            Volver al Dashboard
          </button>

          <div className="page-header">
            <h1 className="page-title">
              <Package size={32} />
              Historial de Dispositivos
            </h1>
            <p className="page-subtitle">
              Registro completo de todas las entradas y salidas de equipos
            </p>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <DataTable
          data={history}
          columns={columns}
          itemsPerPage={25}
          searchable={true}
          paginated={true}
          emptyMessage="No hay registros en el historial. Los eventos de entrada y salida aparecerán aquí."
        />
      </div>
    </div>
  );
}
