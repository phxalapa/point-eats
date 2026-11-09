import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavInferior } from './Panel'
import axios from 'axios'

import { API_URL as API } from '../services/config'

const estadoColor = (estado) => {
  const c = {
    pendiente: '#FF6B00', confirmado: '#1565C0',
    preparando: '#6A1B9A', listo: '#2E7D32',
    en_camino: '#00838F', entregado: '#999', cancelado: '#C62828'
  }
  return c[estado] || '#999'
}

const estadoEmoji = (estado) => {
  const e = {
    pendiente: '🔔', confirmado: '✅', preparando: '👨‍🍳',
    listo: '🎉', en_camino: '🛵', entregado: '📦', cancelado: '❌'
  }
  return e[estado] || '💬'
}

export default function PanelChats() {
  const navigate = useNavigate()
  const [conversaciones, setConversaciones] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const token = localStorage.getItem('token')

  useEffect(() => {
    cargar()
    const iv = setInterval(cargar, 3000)
    return () => clearInterval(iv)
  }, [])

  const cargar = async () => {
    try {
      const res = await axios.get(`${API}/chat/mis-conversaciones`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setConversaciones(res.data)
    } catch {}
  }

  const filtradas = conversaciones.filter(c => {
    const matchBusqueda = c.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.folio.toLowerCase().includes(busqueda.toLowerCase())
    if (filtro === 'todas') return matchBusqueda
    if (filtro === 'activas') return matchBusqueda && !['entregado', 'cancelado'].includes(c.estado)
    if (filtro === 'nuevas') return matchBusqueda && c.no_leidos > 0
    return matchBusqueda
  })

  const totalNoLeidos = conversaciones.reduce((s, c) => s + c.no_leidos, 0)

  const formatHora = (fecha) => {
    const d = new Date(fecha)
    const ahora = new Date()
    const esHoy = d.toDateString() === ahora.toDateString()
    if (esHoy) return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  }

  const truncar = (texto, max = 40) =>
    texto?.length > max ? texto.slice(0, max) + '...' : texto

  return (
    <div style={s.contenedor}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerTop}>
          <p style={s.headerTitulo}>
            💬 Chats
            {totalNoLeidos > 0 && (
              <span style={s.badgeTotal}>{totalNoLeidos}</span>
            )}
          </p>
          <button onClick={() => navigate('/panel')} style={s.btnPanel}>
            🏠 Panel
          </button>
        </div>

        {/* Buscador */}
        <div style={s.buscadorWrap}>
          <span style={s.buscadorIcon}>🔍</span>
          <input
            style={s.buscador}
            placeholder="Buscar cliente o folio..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        {/* Filtros */}
        <div style={s.filtros}>
          {[
            { key: 'todas', label: 'Todas' },
            { key: 'activas', label: 'Activas' },
            { key: 'nuevas', label: `Nuevas ${totalNoLeidos > 0 ? `(${totalNoLeidos})` : ''}` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              style={{ ...s.filtroBt, ...(filtro === f.key ? s.filtroActivo : {}) }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista conversaciones */}
      <div style={s.lista}>
        {filtradas.length === 0 && (
          <div style={s.vacio}>
            <p style={{ fontSize: '48px', margin: '0 0 12px' }}>💬</p>
            <p style={s.vacioTexto}>
              {busqueda ? 'No se encontraron resultados' : 'No hay conversaciones aún'}
            </p>
            <p style={s.vacioSub}>Los pedidos de tus clientes aparecerán aquí</p>
          </div>
        )}

        {filtradas.map(c => (
          <div
            key={c.pedido_id}
            style={{ ...s.item, background: c.no_leidos > 0 ? '#F0F8FF' : '#FFFFFF' }}
            onClick={() => navigate(`/panel/chat/${c.pedido_id}`)}
          >
            {/* Avatar */}
            <div style={s.avatarWrap}>
              <div style={s.avatar}>
                {c.cliente_nombre.charAt(0).toUpperCase()}
              </div>
              <span style={{ ...s.estadoPunto, background: estadoColor(c.estado) }} />
            </div>

            {/* Info */}
            <div style={s.info}>
              <div style={s.fila}>
                <span style={s.clienteNombre}>{c.cliente_nombre}</span>
                <span style={s.hora}>{formatHora(c.ultimo_mensaje_hora)}</span>
              </div>
              <div style={s.fila}>
                <span style={s.folio}>{c.folio}</span>
                <span style={{ ...s.estadoTag, color: estadoColor(c.estado) }}>
                  {estadoEmoji(c.estado)} {c.estado}
                </span>
              </div>
              <div style={s.fila}>
                <span style={s.ultimoMsg}>{truncar(c.ultimo_mensaje)}</span>
                <div style={s.derecha}>
                  <span style={s.total}>${c.total.toFixed(2)}</span>
                  {c.no_leidos > 0 && (
                    <span style={s.badgeNoLeido}>{c.no_leidos}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <NavInferior activo="chats" />
    </div>
  )
}

const s = {
  contenedor: { background: '#F5F5F5', minHeight: '100vh', maxWidth: '480px', margin: '0 auto', fontFamily: "'Nunito',sans-serif", paddingBottom: '70px' },
  header: { background: 'linear-gradient(135deg, #009EE3, #0077B6)', padding: '16px 16px 12px' },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  headerTitulo: { color: '#fff', fontSize: '20px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  badgeTotal: { background: '#FF6B00', color: '#fff', borderRadius: '12px', padding: '2px 8px', fontSize: '13px', fontWeight: '800' },
  btnPanel: { background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', color: '#fff', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
  buscadorWrap: { background: 'rgba(255,255,255,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '8px 12px', gap: '8px', marginBottom: '10px' },
  buscadorIcon: { fontSize: '14px' },
  buscador: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '14px', fontFamily: 'inherit' },
  filtros: { display: 'flex', gap: '6px' },
  filtroBt: { flex: 1, border: 'none', borderRadius: '8px', padding: '7px 4px', background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  filtroActivo: { background: '#fff', color: '#009EE3' },
  lista: { display: 'flex', flexDirection: 'column' },
  vacio: { textAlign: 'center', padding: '80px 20px' },
  vacioTexto: { fontSize: '16px', fontWeight: '700', color: '#ccc', margin: '0 0 6px' },
  vacioSub: { fontSize: '13px', color: '#ddd', margin: 0 },
  item: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: '1px solid #F0F0F0', cursor: 'pointer' },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: { width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, #009EE3, #0077B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px', fontWeight: '800' },
  estadoPunto: { position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #fff' },
  info: { flex: 1, minWidth: 0 },
  fila: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' },
  clienteNombre: { fontSize: '15px', fontWeight: '800', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  hora: { fontSize: '11px', color: '#999', flexShrink: 0, marginLeft: '8px' },
  folio: { fontSize: '12px', color: '#009EE3', fontWeight: '700' },
  estadoTag: { fontSize: '11px', fontWeight: '700', flexShrink: 0 },
  ultimoMsg: { fontSize: '13px', color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 },
  derecha: { display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '8px' },
  total: { fontSize: '13px', fontWeight: '700', color: '#009EE3' },
  badgeNoLeido: { background: '#009EE3', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' },
} 
