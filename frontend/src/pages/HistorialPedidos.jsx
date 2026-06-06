import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = 'http://127.0.0.1:8000'

const ESTADO_COLOR = {
  pendiente: { bg: '#FFF3E0', color: '#FF6B00' },
  confirmado: { bg: '#E3F2FD', color: '#1565C0' },
  preparando: { bg: '#F3E5F5', color: '#6A1B9A' },
  listo: { bg: '#E8F5E9', color: '#2E7D32' },
  en_camino: { bg: '#E0F7FA', color: '#00838F' },
  entregado: { bg: '#F5F5F5', color: '#666' },
  cancelado: { bg: '#FFEBEE', color: '#C62828' },
}

const ESTADO_EMOJI = {
  pendiente: '🔔', confirmado: '✅', preparando: '👨‍🍳',
  listo: '🎉', en_camino: '🛵', entregado: '📦', cancelado: '❌'
}

export default function HistorialPedidos() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const token = localStorage.getItem('token')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    setCargando(true)
    try {
      const res = await axios.get(`${API}/pedidos/mis-pedidos`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPedidos(res.data)
    } catch { alert('Error al cargar pedidos') }
    finally { setCargando(false) }
  }

  const filtrados = pedidos.filter(p => {
    if (filtro === 'activos') return !['entregado', 'cancelado'].includes(p.estado)
    if (filtro === 'entregados') return p.estado === 'entregado'
    if (filtro === 'cancelados') return p.estado === 'cancelado'
    return true
  })

  const totalGastado = pedidos
    .filter(p => p.estado === 'entregado')
    .reduce((s, p) => s + p.total, 0)

  const formatFecha = (f) => new Date(f).toLocaleString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <div style={s.contenedor}>
      {/* Header */}
      <div style={s.header}>
        <button onClick={() => navigate('/contactos')} style={s.btnVolver}>‹</button>
        <p style={s.headerTitulo}>Mis pedidos</p>
        <span style={s.headerCount}>{pedidos.length}</span>
      </div>

      {/* Resumen */}
      <div style={s.resumen}>
        <div style={s.resumenItem}>
          <p style={s.resumenNum}>{pedidos.length}</p>
          <p style={s.resumenLabel}>Total pedidos</p>
        </div>
        <div style={s.resumenItem}>
          <p style={s.resumenNum}>{pedidos.filter(p => p.estado === 'entregado').length}</p>
          <p style={s.resumenLabel}>Entregados</p>
        </div>
        <div style={s.resumenItem}>
          <p style={{ ...s.resumenNum, color: '#009EE3' }}>${totalGastado.toFixed(0)}</p>
          <p style={s.resumenLabel}>Total gastado</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={s.filtros}>
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'activos', label: 'Activos' },
          { key: 'entregados', label: 'Entregados' },
          { key: 'cancelados', label: 'Cancelados' },
        ].map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            style={{
              ...s.filtroBt,
              background: filtro === f.key ? '#009EE3' : '#F5F5F5',
              color: filtro === f.key ? '#fff' : '#666'
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div style={s.lista}>
        {cargando && (
          <p style={s.cargandoTexto}>Cargando pedidos...</p>
        )}

        {!cargando && filtrados.length === 0 && (
          <div style={s.vacio}>
            <p style={{ fontSize: '48px', margin: '0 0 12px' }}>🧾</p>
            <p style={s.vacioTexto}>No hay pedidos aquí</p>
            <button onClick={() => navigate('/contactos')} style={s.btnPedir}>
              🍽️ Hacer mi primer pedido
            </button>
          </div>
        )}

        {filtrados.map(p => {
          const ec = ESTADO_COLOR[p.estado] || { bg: '#F5F5F5', color: '#666' }
          return (
            <div key={p.id} style={s.card}>
              {/* Cabeza */}
              <div style={s.cardTop}>
                <div>
                  <p style={s.folio}>{p.folio}</p>
                  <p style={s.fecha}>{formatFecha(p.creado_en)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={s.total}>${p.total.toFixed(2)}</p>
                  <span style={{ ...s.estadoBadge, background: ec.bg, color: ec.color }}>
                    {ESTADO_EMOJI[p.estado]} {p.estado}
                  </span>
                </div>
              </div>

              {/* Items */}
              {p.items && p.items.length > 0 && (
                <div style={s.items}>
                  {p.items.map((item, i) => (
                    <div key={i} style={s.itemFila}>
                      <span style={s.itemCant}>{item.cantidad}×</span>
                      <span style={s.itemNombre}>{item.nombre}</span>
                      <span style={s.itemPrecio}>${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Notas */}
              {p.notas && (
                <p style={s.notas}>📝 {p.notas}</p>
              )}

              {/* Botón repetir */}
              {p.estado === 'entregado' && (
                <button
                  onClick={() => navigate(`/chat/${p.restaurante_id || 1}`)}
                  style={s.btnRepetir}
                >
                  🔄 Pedir de nuevo
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const s = {
  contenedor: { background: '#F5F5F5', minHeight: '100vh', maxWidth: '480px', margin: '0 auto', fontFamily: "'Nunito',sans-serif", paddingBottom: '30px' },
  header: { background: 'linear-gradient(135deg, #009EE3, #0077B6)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' },
  btnVolver: { background: 'none', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer', padding: '0 4px' },
  headerTitulo: { flex: 1, color: '#fff', fontSize: '18px', fontWeight: '800', margin: 0 },
  headerCount: { background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '12px', padding: '3px 10px', fontSize: '13px', fontWeight: '700' },
  resumen: { background: '#fff', padding: '16px', display: 'flex', gap: '8px', borderBottom: '1px solid #EEE' },
  resumenItem: { flex: 1, textAlign: 'center', background: '#F9F9F9', borderRadius: '10px', padding: '12px 8px' },
  resumenNum: { fontSize: '22px', fontWeight: '900', color: '#333', margin: '0 0 2px' },
  resumenLabel: { fontSize: '11px', color: '#999', margin: 0, fontWeight: '600' },
  filtros: { display: 'flex', gap: '6px', padding: '12px 16px', background: '#fff', borderBottom: '1px solid #EEE' },
  filtroBt: { flex: 1, border: 'none', borderRadius: '8px', padding: '8px 4px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  lista: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  cargandoTexto: { textAlign: 'center', color: '#009EE3', padding: '40px', fontSize: '15px' },
  vacio: { textAlign: 'center', padding: '60px 20px' },
  vacioTexto: { color: '#ccc', fontSize: '16px', margin: '0 0 20px' },
  btnPedir: { background: 'linear-gradient(135deg, #009EE3, #0077B6)', border: 'none', borderRadius: '10px', padding: '13px 24px', color: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer' },
  card: { background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  folio: { fontSize: '16px', fontWeight: '800', color: '#333', margin: '0 0 2px' },
  fecha: { fontSize: '12px', color: '#999', margin: 0 },
  total: { fontSize: '18px', fontWeight: '900', color: '#009EE3', margin: '0 0 4px' },
  estadoBadge: { fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '10px', display: 'inline-block' },
  items: { background: '#F9F9F9', borderRadius: '10px', padding: '10px', marginBottom: '10px' },
  itemFila: { display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0', borderBottom: '1px solid #F0F0F0' },
  itemCant: { fontSize: '12px', fontWeight: '800', color: '#009EE3', minWidth: '22px' },
  itemNombre: { flex: 1, fontSize: '13px', color: '#333', fontWeight: '600' },
  itemPrecio: { fontSize: '13px', fontWeight: '700', color: '#009EE3' },
  notas: { fontSize: '12px', color: '#666', fontStyle: 'italic', margin: '0 0 10px' },
  btnRepetir: { width: '100%', background: '#F0F8FF', border: '2px solid #009EE3', borderRadius: '8px', padding: '10px', color: '#009EE3', fontSize: '13px', fontWeight: '800', cursor: 'pointer' },
} 
