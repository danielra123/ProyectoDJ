// Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Laptop, Activity, Clock, Search, Plus, LogOut, Check, User, History, Menu } from 'lucide-react';
import { signOut } from '../lib/auth-client';
import { useAuth } from '../contexts/AuthContext';
import PhotoCapture from './PhotoCapture';
import '../App.css';

const API_BASE = 'http://localhost:3000/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('computers');
  const [computers, setComputers] = useState([]);
  const [medicalDevices, setMedicalDevices] = useState([]);
  const [frequentComputers, setFrequentComputers] = useState([]);
  const [enteredDevices, setEnteredDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState('');

  const [computerForm, setComputerForm] = useState({
    brand: '',
    model: '',
    color: '',
    ownerName: '',
    ownerId: '',
    photoFile: null
  });

  const [medicalDeviceForm, setMedicalDeviceForm] = useState({
    deviceType: '',
    brand: '',
    model: '',
    serial: '',
    ownerName: '',
    ownerId: '',
    photoFile: null
  });

  useEffect(() => {
    loadData();
  }, [activeTab, filters, sort]);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(`filter[${key}]`, value);
    });
    if (sort) params.append('sort', sort);
    return params.toString();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const query = buildQueryString();
      const endpoint = query ? `?${query}` : '';

      switch(activeTab) {
        case 'computers':
          const comps = await fetch(`${API_BASE}/computers${endpoint}`, {
            credentials: 'include'
          }).then(r => r.json());
          setComputers(Array.isArray(comps) ? comps : []);
          break;
        case 'medical':
          const meds = await fetch(`${API_BASE}/medicaldevices${endpoint}`, {
            credentials: 'include'
          }).then(r => r.json());
          setMedicalDevices(Array.isArray(meds) ? meds : []);
          break;
        case 'frequent':
          const freq = await fetch(`${API_BASE}/computers/frequent${endpoint}`, {
            credentials: 'include'
          }).then(r => r.json());
          setFrequentComputers(Array.isArray(freq) ? freq : []);
          break;
        case 'entered':
          const ent = await fetch(`${API_BASE}/devices/entered${endpoint}`, {
            credentials: 'include'
          }).then(r => r.json());
          setEnteredDevices(Array.isArray(ent) ? ent : []);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const handleComputerCheckin = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('brand', computerForm.brand);
      formData.append('model', computerForm.model);
      formData.append('ownerName', computerForm.ownerName);
      formData.append('ownerId', computerForm.ownerId);
      if (computerForm.color) formData.append('color', computerForm.color);
      if (computerForm.photoFile) formData.append('photo', computerForm.photoFile);

      const response = await fetch(`${API_BASE}/computers/checkin`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error al registrar: ${JSON.stringify(errorData)}`);
        return;
      }

      setShowForm(false);
      setComputerForm({ brand: '', model: '', color: '', ownerName: '', ownerId: '', photoFile: null });
      loadData();
    } catch (error) {
      console.error('Error checking in computer:', error);
      alert('Error al registrar la computadora');
    }
  };

  const handleMedicalDeviceCheckin = async (e) => {
    e.preventDefault();

    if (!medicalDeviceForm.photoFile) {
      alert('La foto es obligatoria para dispositivos médicos');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('brand', medicalDeviceForm.brand);
      formData.append('model', medicalDeviceForm.model);
      formData.append('ownerName', medicalDeviceForm.ownerName);
      formData.append('ownerId', medicalDeviceForm.ownerId);
      formData.append('serial', medicalDeviceForm.serial);
      formData.append('photo', medicalDeviceForm.photoFile);

      const response = await fetch(`${API_BASE}/medicaldevices/checkin`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error al registrar: ${JSON.stringify(errorData, null, 2)}`);
        return;
      }

      setShowForm(false);
      setMedicalDeviceForm({ deviceType: '', brand: '', model: '', serial: '', ownerName: '', ownerId: '', photoFile: null });
      loadData();
    } catch (error) {
      console.error('Error checking in medical device:', error);
      alert('Error al registrar el dispositivo médico');
    }
  };

  const handleFrequentCheckin = async (id) => {
    try {
      await fetch(`${API_BASE}/computers/frequent/checkin/${id}`, {
        method: 'PATCH',
        credentials: 'include'
      });
      loadData();
    } catch (error) {
      console.error('Error checking in frequent computer:', error);
    }
  };

  const handleRegisterFrequent = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('brand', computerForm.brand);
      formData.append('model', computerForm.model);
      formData.append('ownerName', computerForm.ownerName);
      formData.append('ownerId', computerForm.ownerId);
      if (computerForm.color) formData.append('color', computerForm.color);
      if (computerForm.photoFile) formData.append('photo', computerForm.photoFile);

      const response = await fetch(`${API_BASE}/computers/frequent`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error al registrar: ${JSON.stringify(errorData)}`);
        return;
      }

      setShowForm(false);
      setComputerForm({ brand: '', model: '', color: '', ownerName: '', ownerId: '', photoFile: null });
      loadData();
    } catch (error) {
      console.error('Error registering frequent computer:', error);
      alert('Error al registrar computadora frecuente');
    }
  };

  const handleCheckout = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/devices/checkout/${id}`, {
        method: 'PATCH',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error al hacer checkout: ${JSON.stringify(errorData)}`);
        return;
      }

      loadData();
    } catch (error) {
      console.error('Error checking out device:', error);
      alert('Error al hacer checkout del dispositivo');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">
            <Activity className="sidebar-title-icon" size={28} />
            <span>MediControl</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            onClick={() => setActiveTab('computers')} 
            className={`sidebar-nav-item ${activeTab === 'computers' ? 'active' : ''}`}
          >
            <Laptop className="sidebar-nav-item-icon" size={20} />
            Computadoras
          </button>
          <button 
            onClick={() => setActiveTab('medical')} 
            className={`sidebar-nav-item ${activeTab === 'medical' ? 'active' : ''}`}
          >
            <Activity className="sidebar-nav-item-icon" size={20} />
            Dispositivos Médicos
          </button>
          <button 
            onClick={() => setActiveTab('frequent')} 
            className={`sidebar-nav-item ${activeTab === 'frequent' ? 'active' : ''}`}
          >
            <Clock className="sidebar-nav-item-icon" size={20} />
            Frecuentes
          </button>
          <button 
            onClick={() => setActiveTab('entered')} 
            className={`sidebar-nav-item ${activeTab === 'entered' ? 'active' : ''}`}
          >
            <Search className="sidebar-nav-item-icon" size={20} />
            Dispositivos Ingresados
          </button>
          <button 
            onClick={() => navigate('/history')} 
            className="sidebar-nav-item"
          >
            <History className="sidebar-nav-item-icon" size={20} />
            Historial
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn btn-logout" style={{width: '100%'}}>
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <div className="app-content">
          <header className="app-header">
            <h1 className="app-title">
              {activeTab === 'computers' && 'Computadoras'}
              {activeTab === 'medical' && 'Dispositivos Médicos'}
              {activeTab === 'frequent' && 'Frecuentes'}
              {activeTab === 'entered' && 'Dispositivos Ingresados'}
            </h1>
            <div className="user-section">
              <div className="user-info">
                <User size={18} />
                <span>{user?.name || user?.email}</span>
              </div>
            </div>
          </header>

          <button onClick={() => setShowForm(!showForm)} className="btn btn-add">
            <Plus size={20} />
            Nuevo Registro
          </button>

          {showForm && (activeTab === 'computers' || activeTab === 'frequent') && (
            <div className="form-container">
              <h3 className="form-title">
                {activeTab === 'frequent' ? 'Registrar Computadora Frecuente' : 'Registrar Computadora'}
              </h3>
              <div className="form-grid">
                <input type="text" placeholder="Marca" value={computerForm.brand} onChange={e => setComputerForm({...computerForm, brand: e.target.value})} className="form-input" required />
                <input type="text" placeholder="Modelo" value={computerForm.model} onChange={e => setComputerForm({...computerForm, model: e.target.value})} className="form-input" required />
                <input type="text" placeholder="Color (opcional)" value={computerForm.color} onChange={e => setComputerForm({...computerForm, color: e.target.value})} className="form-input" />
                <input type="text" placeholder="Nombre del Propietario" value={computerForm.ownerName} onChange={e => setComputerForm({...computerForm, ownerName: e.target.value})} className="form-input" required />
                <input type="text" placeholder="ID del Propietario" value={computerForm.ownerId} onChange={e => setComputerForm({...computerForm, ownerId: e.target.value})} className="form-input" required />
              </div>
              <PhotoCapture
                onPhotoSelected={(file) => setComputerForm({...computerForm, photoFile: file})}
                required={false}
                label="Fotografía del Equipo"
                maxSizeMB={5}
              />
              <div className="form-actions">
                <button
                  onClick={activeTab === 'frequent' ? handleRegisterFrequent : handleComputerCheckin}
                  className="btn btn-primary"
                >
                  Registrar
                </button>
                <button onClick={() => setShowForm(false)} className="btn btn-cancel">Cancelar</button>
              </div>
            </div>
          )}

          {showForm && activeTab === 'medical' && (
            <div className="form-container">
              <h3 className="form-title">Registrar Dispositivo Médico</h3>
              <div className="form-grid">
                <input type="text" placeholder="Marca" value={medicalDeviceForm.brand} onChange={e => setMedicalDeviceForm({...medicalDeviceForm, brand: e.target.value})} className="form-input medical" required />
                <input type="text" placeholder="Modelo" value={medicalDeviceForm.model} onChange={e => setMedicalDeviceForm({...medicalDeviceForm, model: e.target.value})} className="form-input medical" required />
                <input type="text" placeholder="Número de Serie" value={medicalDeviceForm.serial} onChange={e => setMedicalDeviceForm({...medicalDeviceForm, serial: e.target.value})} className="form-input medical" required />
                <input type="text" placeholder="Nombre del Propietario" value={medicalDeviceForm.ownerName} onChange={e => setMedicalDeviceForm({...medicalDeviceForm, ownerName: e.target.value})} className="form-input medical" required />
                <input type="text" placeholder="ID del Propietario" value={medicalDeviceForm.ownerId} onChange={e => setMedicalDeviceForm({...medicalDeviceForm, ownerId: e.target.value})} className="form-input medical" required />
              </div>
              <PhotoCapture
                onPhotoSelected={(file) => setMedicalDeviceForm({...medicalDeviceForm, photoFile: file})}
                required={true}
                label="Fotografía del Dispositivo Médico"
                maxSizeMB={5}
              />
              <div className="form-actions">
                <button onClick={handleMedicalDeviceCheckin} className="btn btn-success">Registrar</button>
                <button onClick={() => setShowForm(false)} className="btn btn-cancel">Cancelar</button>
              </div>
            </div>
          )}

          <div className="content-box">
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">Cargando...</p>
              </div>
            ) : (
              <>
                {activeTab === 'computers' && (
                  <div className="device-list">
                    {computers.map((comp, idx) => (
                      <div key={idx} className="device-card">
                        <div className="device-info">
                          <h3 className="device-title">{comp.brand} {comp.model}</h3>
                          {comp.color && <p className="device-detail">Color: {comp.color}</p>}
                          <p className="device-detail">Propietario: {comp.owner?.name} (ID: {comp.owner?.id})</p>
                        </div>
                        <Laptop className="device-icon blue" size={32} />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'medical' && (
                  <div className="device-list">
                    {medicalDevices.map((dev, idx) => (
                      <div key={idx} className="device-card">
                        <div className="device-info">
                          <h3 className="device-title">Dispositivo Médico</h3>
                          <p className="device-detail">{dev.brand} {dev.model}</p>
                          <p className="device-detail">S/N: {dev.serial}</p>
                          <p className="device-detail">Propietario: {dev.owner?.name} (ID: {dev.owner?.id})</p>
                        </div>
                        <Activity className="device-icon green" size={32} />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'frequent' && (
                  <div className="device-list">
                    {frequentComputers.map((comp, idx) => (
                      <div key={idx} className="device-card">
                        <div className="device-info-flex">
                          <div>
                            <h3 className="device-title">{comp.device?.brand} {comp.device?.model}</h3>
                            {comp.device?.color && <p className="device-detail">Color: {comp.device.color}</p>}
                            <p className="device-detail">Propietario: {comp.device?.owner?.name} (ID: {comp.device?.owner?.id})</p>
                          </div>
                          <button onClick={() => handleFrequentCheckin(comp.device?.id)} className="btn btn-primary btn-with-icon">
                            <Check size={16} />
                            Check-in
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'entered' && (
                  <div className="device-list">
                    {enteredDevices.map((dev, idx) => (
                      <div key={idx} className="device-card">
                        <div className="device-info-flex">
                          <div>
                            <h3 className="device-title">
                              {dev.serial ? 'Dispositivo Médico' : 'Computadora'}
                            </h3>
                            <p className="device-detail">{dev.brand} {dev.model}</p>
                            {dev.serial && <p className="device-detail">S/N: {dev.serial}</p>}
                            <p className="device-detail">Propietario: {dev.owner?.name}</p>
                            <p className="device-detail-small">Ingresó: {dev.checkinAt ? new Date(dev.checkinAt).toLocaleString() : 'N/A'}</p>
                          </div>
                          <button onClick={() => handleCheckout(dev.id)} className="btn btn-danger btn-with-icon">
                            <LogOut size={16} />
                            Check-out
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {((activeTab === 'computers' && computers.length === 0) ||
                  (activeTab === 'medical' && medicalDevices.length === 0) ||
                  (activeTab === 'frequent' && frequentComputers.length === 0) ||
                  (activeTab === 'entered' && enteredDevices.length === 0)) && (
                  <div className="empty-state">No hay registros disponibles</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
