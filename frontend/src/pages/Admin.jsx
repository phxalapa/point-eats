import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

import { API_URL as API } from '../services/config'

export function AdminNav({ activo }) {
  const navigate = useNavigate()
  const items = [
    { icon: '🏠', label: 'Inicio', ruta: '/admin' },
    { icon: '🍽️', label: 'Restaurantes', ruta: '/admin/restaurantes' },
    { icon: '👥', label: 'Usuarios', ruta: '/admin/usuarios' },
    { icon: '📋', label: 'Pedidos', ruta: '/admin/pedidos' },
  ]
  return (
    <div style={s.navInferior}>
      {items.map(item => (
        <button key={item.ruta} onClick={() => navigate(item.ruta)}
          style={{ ...s.navBtn, color: activo === item.label.toLowerCase() ? '#009EE3' : '#999' }}>
          <span style={s.navIcon}>{item.icon}</span>
          <span style={s.navLabel}>{item.label}</span>
        </button>
      ))}
    </div>
  )
}

export default function Admin() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const token = localStorage.getItem('token')
  const nombre = localStorage.getItem('nombre')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try {
      const res = await axios.get(`${API}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(res.data)
    } catch { alert('Error al cargar dashboard') }
  }

  const cerrarSesion = () => {
    localStorage.clear()
    navigate('/login')
  }

  if (!stats) return (
    <div style={s.cargando}>
      <p style={{ color: '#009EE3', fontFamily: 'Nunito,sans-serif' }}>Cargando...</p>
    </div>
  )

  return (
    <div style={s.contenedor}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <p style={s.headerTitulo}>⚡ Super Admin</p>
          <p style={s.headerSub}>Hola, {nombre}</p>
        </div>
        <button onClick={cerrarSesion} style={s.btnSalir}>Salir</button>
      </div>

      {/* Métricas globales */}
      <div style={s.seccionTitulo}>📊 Resumen global</div>
      <div style={s.grid2}>
        <div style={{ ...s.metricaCard, background: '#E3F2FD' }}>
          <p style={s.metricaNum}>{stats.usuarios.total}</p>
          <p style={s.metricaLabel}>Usuarios totales</p>
          <p style={s.metricaSub}>{stats.usuarios.clientes} clientes · {stats.usuarios.restaurantes} restaurantes</p>
        </div>
        <div style={{ ...s.metricaCard, background: '#E8F5E9' }}>
          <p style={{ ...s.metricaNum, color: '#2E7D32' }}>{stats.restaurantes_abiertos}</p>
          <p style={s.metricaLabel}>Restaurantes abiertos</p>
          <p style={s.metricaSub}>ahora mismo</p>
        </div>
        <div style={{ ...s.metricaCard, background: '#FFF3E0' }}>
          <p style={{ ...s.metricaNum, color: '#FF6B00' }}>{stats.pedidos.total}</p>
          <p style={s.metricaLabel}>Pedidos totales</p>
          <p style={s.metricaSub}>{stats.pedidos.hoy} hoy</p>
        </div>
        <div style={{ ...s.metricaCard, background: '#F3E5F5' }}>
          <p style={{ ...s.metricaNum, color: '#6A1B9A' }}>${stats.ventas.total.toFixed(0)}</p>
          <p style={s.metricaLabel}>Ventas totales</p>
          <p style={s.metricaSub}>${stats.ventas.hoy.toFixed(0)} hoy</p>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div style={s.seccionTitulo}>🔧 Gestión</div>
      <div style={s.grid2}>
        {[
          { icon: '🍽️', label: 'Restaurantes', desc: 'Ver, editar y suspender', ruta: '/admin/restaurantes', color: '#E3F2FD' },
          { icon: '👥', label: 'Usuarios', desc: 'Clientes y cuentas', ruta: '/admin/usuarios', color: '#E8F5E9' },
          { icon: '📋', label: 'Pedidos', desc: 'Todos los pedidos', ruta: '/admin/pedidos', color: '#FFF3E0' },
          { icon: '⚙️', label: 'Configuración', desc: 'Ajustes globales', ruta: '/admin', color: '#F3E5F5' },
        ].map(a => (
          <button key={a.ruta} onClick={() => navigate(a.ruta)}
            style={{ ...s.accesoBtn, background: a.color }}>
            <span style={s.accesoIcon}>{a.icon}</span>
            <div>
              <p style={s.accesoLabel}>{a.label}</p>
              <p style={s.accesoDesc}>{a.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <AdminNav activo="inicio" />
    </div>
  )
}

const s = {
  contenedor: { background: '#F5F5F5', minHeight: '100vh', maxWidth: '480px', margin: '0 auto', fontFamily: "'Nunito',sans-serif", paddingBottom: '80px' },
  cargando: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  header: { background: 'linear-gradient(135deg, #333', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #1A1A2E, #16213E)' },
  headerTitulo: { color: '#fff', fontSize: '20px', fontWeight: '900', margin: 0 },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 },
  btnSalir: { background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', color: '#fff', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' },
  seccionTitulo: { fontSize: '13px', fontWeight: '800', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '16px 16px 8px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '0 16px 8px' },
  metricaCard: { borderRadius: '12px', padding: '16px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  metricaNum: { fontSize: '28px', fontWeight: '900', color: '#333', margin: '0 0 2px' },
  metricaLabel: { fontSize: '13px', fontWeight: '700', color: '#333', margin: '0 0 2px' },
  metricaSub: { fontSize: '11px', color: '#999', margin: 0 },
  accesoBtn: { border: 'none', borderRadius: '12px', padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', textAlign: 'left' },
  accesoIcon: { fontSize: '28px', flexShrink: 0 },
  accesoLabel: { fontSize: '14px', fontWeight: '800', color: '#333', margin: '0 0 2px' },
  accesoDesc: { fontSize: '11px', color: '#999', margin: 0 },
  navInferior: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: '#fff', borderTop: '1px solid #EEE', display: 'flex', zIndex: 50 },
  navBtn: { flex: 1, border: 'none', background: 'none', padding: '10px 0', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
  navIcon: { fontSize: '20px' },
  navLabel: { fontSize: '10px', fontWeight: '700' },
} 
