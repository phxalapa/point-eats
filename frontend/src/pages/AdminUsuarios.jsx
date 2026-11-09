import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminNav } from './Admin'
import axios from 'axios'

import { API_URL as API } from '../services/config'

export default function AdminUsuarios() {
  const navigate = useNavigate()
  const [usuarios, setUsuarios] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('todos')
  const token = localStorage.getItem('token')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try {
      const res = await axios.get(`${API}/admin/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsuarios(res.data)
    } catch { alert('Error al cargar') }
  }

  const suspender = async (id, activo, nombre) => {
    const accion = activo ? 'activar' : 'suspender'
    if (!confirm(`¿${accion} a ${nombre}?`)) return
    try {
      await axios.patch(`${API}/admin/usuarios/${id}/suspender`,
        { activo },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      await cargar()
    } catch { alert('Error') }
  }

  const filtrados = usuarios.filter(u => {
    const matchBusqueda = u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email?.toLowerCase().includes(busqueda.toLowerCase())
    const matchRol = filtroRol === 'todos' || u.rol === filtroRol
    return matchBusqueda && matchRol
  })

  const rolColor = (rol) => {
    if (rol === 'admin') return { bg: '#F3E5F5', color: '#6A1B9A' }
    if (rol === 'restaurante') return { bg: '#FFF3E0', color: '#FF6B00' }
    return { bg: '#E3F2FD', color: '#1565C0' }
  }

  const formatFecha = (f) => f ? new Date(f).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Nunca'

  return (
    <div style={s.contenedor}>
      <div style={s.header}>
        <button onClick={() => navigate('/admin')} style={s.btnVolver}>‹</button>
        <p style={s.headerTitulo}>👥 Usuarios</p>
        <span style={s.headerCount}>{usuarios.length}</span>
      </div>

      <div style={s.filtrosWrap}>
        <input style={s.buscador} placeholder="🔍 Buscar nombre o email..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <div style={s.tabs}>
          {[
            { key: 'todos', label: 'Todos' },
            { key: 'cliente', label: 'Clientes' },
            { key: 'restaurante', label: 'Restaurantes' },
            { key: 'admin', label: 'Admins' },
          ].map(t => (
            <button key={t.key} onClick={() => setFiltroRol(t.key)}
              style={{ ...s.tab, background: filtroRol === t.key ? '#1A1A2E' : '#F5F5F5', color: filtroRol === t.key ? '#fff' : '#666' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={s.lista}>
        {filtrados.map(u => {
          const rc = rolColor(u.rol)
          return (
            <div key={u.id} style={{ ...s.card, opacity: u.activo ? 1 : 0.6 }}>
              <div style={s.cardTop}>
                <div style={s.avatar}>
                  {u.nombre?.charAt(0).toUpperCase()}
                </div>
                <div style={s.cardInfo}>
                  <div style={s.cardFila}>
                    <p style={s.cardNombre}>{u.nombre}</p>
                    <span style={{ ...s.rolBadge, background: rc.bg, color: rc.color }}>{u.rol}</span>
                  </div>
                  <p style={s.cardEmail}>{u.email}</p>
                  <p style={s.cardFecha}>
                    Registrado: {formatFecha(u.creado_en)}
                    {u.ultimo_acceso && ` · Último acceso: ${formatFecha(u.ultimo_acceso)}`}
                  </p>
                </div>
              </div>
              {!u.activo && (
                <div style={s.suspendidoBanner}>🚫 Cuenta suspendida</div>
              )}
              <div style={s.cardAcciones}>
                <button
                  onClick={() => suspender(u.id, !u.activo, u.nombre)}
                  style={{ ...s.btnAccion, background: u.activo ? '#FFEBEE' : '#E8F5E9', color: u.activo ? '#C62828' : '#2E7D32' }}
                >
                  {u.activo ? '🚫 Suspender' : '✅ Activar'}
                </button>
              </div>
            </div>
          )
        })}
        {filtrados.length === 0 && (
          <div style={s.vacio}>
            <p style={{ fontSize: '40px' }}>👥</p>
            <p style={s.vacioTexto}>No hay usuarios</p>
          </div>
        )}
      </div>

      <AdminNav activo="usuarios" />
    </div>
  )
}

const s = {
  contenedor: { background: '#F5F5F5', minHeight: '100vh', maxWidth: '480px', margin: '0 auto', fontFamily: "'Nunito',sans-serif", paddingBottom: '80px' },
  header: { background: 'linear-gradient(135deg, #1A1A2E, #16213E)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' },
  btnVolver: { background: 'none', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer', padding: '0 4px' },
  headerTitulo: { flex: 1, color: '#fff', fontSize: '18px', fontWeight: '800', margin: 0 },
  headerCount: { background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '12px', padding: '3px 10px', fontSize: '13px', fontWeight: '700' },
  filtrosWrap: { background: '#fff', padding: '12px 16px', borderBottom: '1px solid #EEE', display: 'flex', flexDirection: 'column', gap: '10px' },
  buscador: { width: '100%', border: '1px solid #E0E0E0', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#F9F9F9' },
  tabs: { display: 'flex', gap: '6px' },
  tab: { flex: 1, border: 'none', borderRadius: '8px', padding: '7px 4px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  lista: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  card: { background: '#fff', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTop: { display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' },
  avatar: { width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #1A1A2E, #16213E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', fontWeight: '800', flexShrink: 0 },
  cardInfo: { flex: 1, minWidth: 0 },
  cardFila: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' },
  cardNombre: { fontSize: '15px', fontWeight: '800', color: '#333', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rolBadge: { fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '10px', flexShrink: 0 },
  cardEmail: { fontSize: '12px', color: '#666', margin: '0 0 2px' },
  cardFecha: { fontSize: '11px', color: '#999', margin: 0 },
  suspendidoBanner: { background: '#FFEBEE', color: '#C62828', fontSize: '12px', fontWeight: '700', padding: '6px 10px', borderRadius: '8px', marginBottom: '10px', textAlign: 'center' },
  cardAcciones: { display: 'flex', gap: '8px' },
  btnAccion: { flex: 1, border: 'none', borderRadius: '8px', padding: '9px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  vacio: { textAlign: 'center', padding: '60px 20px' },
  vacioTexto: { color: '#ccc', fontSize: '16px', margin: '8px 0 0' },
} 
