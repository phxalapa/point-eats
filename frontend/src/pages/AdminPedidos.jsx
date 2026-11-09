import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminNav } from './Admin'
import axios from 'axios'

import { API_URL as API } from '../services/config'

const ESTADO_COLOR = {
  pendiente: { bg: '#FFF3E0', color: '#FF6B00' },
  confirmado: { bg: '#E3F2FD', color: '#1565C0' },
  preparando: { bg: '#F3E5F5', color: '#6A1B9A' },
  listo: { bg: '#E8F5E9', color: '#2E7D32' },
  en_camino: { bg: '#E0F7FA', color: '#00838F' },
  entregado: { bg: '#F5F5F5', color: '#666' },
  cancelado: { bg: '#FFEBEE', color: '#C62828' },
}

export default function AdminPedidos() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const token = localStorage.getItem('token')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try {
      const res = await axios.get(`${API}/admin/pedidos`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPedidos(res.data)
    } catch { alert('Error al cargar') }
  }

  const filtrados = pedidos.filter(p => {
    const matchBusqueda =
      p.folio?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.restaurante_nombre?.toLowerCase().includes(busqueda.toLowerCase())
    const matchEstado = filtroEstado === 'todos' || p.estado === filtroEstado
    return matchBusqueda && matchEstado
  })

  const totalFiltrados = filtrados.reduce((s, p) => s + p.total, 0)

  const formatFecha = (f) => new Date(f).toLocaleString('es-MX', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div style={s.contenedor}>
      <div style={s.header}>
        <button onClick={() => navigate('/admin')} style={s.btnVolver}>‹</button>
        <p style={s.headerTitulo}>📋 Pedidos globales</p>
        <span style={s.headerCount}>{pedidos.length}</span>
      </div>

      {/* Resumen */}
      <div style={s.resumen}>
        <div style={s.resumenItem}>
          <p style={s.resumenNum}>{filtrados.length}</p>
          <p style={s.resumenLabel}>Pedidos</p>
        </div>
        <div style={s.resumenItem}>
          <p style={{ ...s.resumenNum, color: '#009EE3' }}>${totalFiltrados.toFixed(0)}</p>
          <p style={s.resumenLabel}>Total</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={s.filtrosWrap}>
        <input style={s.buscador}
          placeholder="🔍 Folio, cliente o restaurante..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <div style={s.estadosFiltro}>
          {['todos', 'pendiente', 'preparando', 'entregado', 'cancelado'].map(est => (
            <button key={est} onClick={() => setFiltroEstado(est)}
              style={{
                ...s.estadoBtn,
                background: filtroEstado === est
                  ? (ESTADO_COLOR[est]?.bg || '#1A1A2E')
                  : '#F5F5F5',
                color: filtroEstado === est
                  ? (ESTADO_COLOR[est]?.color || '#fff')
                  : '#999',
              }}>
              {est === 'todos' ? 'Todos' : est}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div style={s.lista}>
        {filtrados.map(p => {
          const ec = ESTADO_COLOR[p.estado] || { bg: '#F5F5F5', color: '#666' }
          return (
            <div key={p.id} style={s.card}>
              <div style={s.cardTop}>
                <div>
                  <p style={s.folio}>{p.folio}</p>
                  <p style={s.fecha}>{formatFecha(p.creado_en)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={s.total}>${p.total.toFixed(2)}</p>
                  <span style={{ ...s.estadoBadge, background: ec.bg, color: ec.color }}>
                    {p.estado}
                  </span>
                </div>
              </div>
              <div style={s.cardBottom}>
                <span style={s.infoTag}>👤 {p.cliente_nombre}</span>
                <span style={s.infoTag}>🍽️ {p.restaurante_nombre}</span>
              </div>
            </div>
          )
        })}
        {filtrados.length === 0 && (
          <div style={s.vacio}>
            <p style={{ fontSize: '40px' }}>📋</p>
            <p style={s.vacioTexto}>No hay pedidos</p>
          </div>
        )}
      </div>

      <AdminNav activo="pedidos" />
    </div>
  )
}

const s = {
  contenedor: { background: '#F5F5F5', minHeight: '100vh', maxWidth: '480px', margin: '0 auto', fontFamily: "'Nunito',sans-serif", paddingBottom: '80px' },
  header: { background: 'linear-gradient(135deg, #1A1A2E, #16213E)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' },
  btnVolver: { background: 'none', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer', padding: '0 4px' },
  headerTitulo: { flex: 1, color: '#fff', fontSize: '18px', fontWeight: '800', margin: 0 },
  headerCount: { background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '12px', padding: '3px 10px', fontSize: '13px', fontWeight: '700' },
  resumen: { background: '#fff', padding: '14px 16px', display: 'flex', gap: '20px', borderBottom: '1px solid #EEE' },
  resumenItem: { textAlign: 'center' },
  resumenNum: { fontSize: '22px', fontWeight: '900', color: '#333', margin: 0 },
  resumenLabel: { fontSize: '11px', color: '#999', margin: 0, fontWeight: '600' },
  filtrosWrap: { background: '#fff', padding: '12px 16px', borderBottom: '1px solid #EEE', display: 'flex', flexDirection: 'column', gap: '10px' },
  buscador: { width: '100%', border: '1px solid #E0E0E0', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#F9F9F9' },
  estadosFiltro: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  estadoBtn: { border: 'none', borderRadius: '20px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  lista: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  card: { background: '#fff', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' },
  folio: { fontSize: '16px', fontWeight: '800', color: '#333', margin: '0 0 2px' },
  fecha: { fontSize: '12px', color: '#999', margin: 0 },
  total: { fontSize: '18px', fontWeight: '900', color: '#009EE3', margin: '0 0 4px' },
  estadoBadge: { fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '10px', display: 'inline-block' },
  cardBottom: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  infoTag: { fontSize: '12px', color: '#666', background: '#F5F5F5', padding: '4px 10px', borderRadius: '8px', fontWeight: '600' },
  vacio: { textAlign: 'center', padding: '60px 20px' },
  vacioTexto: { color: '#ccc', fontSize: '16px', margin: '8px 0 0' },
} 
