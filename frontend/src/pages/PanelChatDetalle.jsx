import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = 'http://127.0.0.1:8000'

const ESTADOS = ['pendiente', 'confirmado', 'preparando', 'listo', 'en_camino', 'entregado']
const EMOJIS_ESTADO = {
  pendiente: '🔔', confirmado: '✅', preparando: '👨‍🍳',
  listo: '🎉', en_camino: '🛵', entregado: '📦', cancelado: '❌'
}
const COLOR_ESTADO = {
  pendiente: '#FF6B00', confirmado: '#1565C0', preparando: '#6A1B9A',
  listo: '#2E7D32', en_camino: '#00838F', entregado: '#999', cancelado: '#C62828'
}

const hora = (fecha) => new Date(fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

export default function PanelChatDetalle() {
  const { pedidoId } = useParams()
  const navigate = useNavigate()
  const [datos, setDatos] = useState(null)
  const [detallePedido, setDetallePedido] = useState(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mostrarEstados, setMostrarEstados] = useState(false)
  const [mostrarComanda, setMostrarComanda] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const token = localStorage.getItem('token')

  useEffect(() => {
    cargar()
    cargarDetalle()
    const iv = setInterval(cargar, 2000)
    return () => clearInterval(iv)
  }, [pedidoId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [datos])

  const cargar = async () => {
    try {
      const res = await axios.get(`${API}/chat/${pedidoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDatos(res.data)
    } catch {}
  }

  const cargarDetalle = async () => {
    try {
      const res = await axios.get(`${API}/pedidos/${pedidoId}/detalle`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDetallePedido(res.data)
    } catch {}
  }

  const enviarMensaje = async () => {
    if (!texto.trim() || enviando) return
    const t = texto.trim()
    setTexto('')
    setEnviando(true)
    try {
      await axios.post(`${API}/chat/${pedidoId}`, { contenido: t }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      await cargar()
    } catch { alert('Error al enviar') }
    finally { setEnviando(false); inputRef.current?.focus() }
  }

  const cambiarEstado = async (nuevoEstado) => {
    try {
      await axios.patch(`${API}/chat/${pedidoId}/estado`, { estado: nuevoEstado }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMostrarEstados(false)
      await cargar()
      await cargarDetalle()
    } catch { alert('Error al cambiar estado') }
  }

  const siguienteEstado = (estado) => {
    const idx = ESTADOS.indexOf(estado)
    return idx >= 0 && idx < ESTADOS.length - 1 ? ESTADOS[idx + 1] : null
  }

  if (!datos) return (
    <div style={s.cargando}>
      <p style={{ color: '#009EE3' }}>Cargando...</p>
    </div>
  )

  const { pedido, mensajes } = datos
  const sigEst = pedido ? siguienteEstado(pedido.estado) : null

  return (
    <div style={s.contenedor}>

      {/* ── HEADER ── */}
      <div style={s.header}>
        <button onClick={() => navigate('/panel/chats')} style={s.btnVolver}>‹</button>
        <div style={s.avatarWrap}>
          <div style={s.avatar}>👤</div>
        </div>
        <div style={s.headerInfo}>
          <p style={s.headerNombre}>
            {detallePedido?.cliente?.nombre || 'Cliente'} · {pedido?.folio}
          </p>
          {pedido && (
            <p style={s.headerSub}>
              <span style={{ color: '#90EE90' }}>
                {EMOJIS_ESTADO[pedido.estado]} {pedido.estado}
              </span>
              {' · '}${pedido.total.toFixed(2)}
            </p>
          )}
        </div>
        <div style={s.headerAcciones}>
          <button onClick={() => navigate(`/panel/comanda/${pedidoId}`)} style={s.btnComanda}>
            🖨️
          </button>
          <button onClick={() => setMostrarEstados(!mostrarEstados)} style={s.btnEstado}>
            📋
          </button>
        </div>
      </div>

      {/* ── PANEL CAMBIAR ESTADO ── */}
      {mostrarEstados && pedido && (
        <div style={s.estadosPanel}>
          <p style={s.estadosPanelTitulo}>Actualizar estado del pedido</p>
          <div style={s.estadosGrid}>
            {ESTADOS.map(est => (
              <button
                key={est}
                onClick={() => cambiarEstado(est)}
                style={{
                  ...s.estadoBtn,
                  background: pedido.estado === est ? '#009EE3' : '#F5F5F5',
                  color: pedido.estado === est ? '#fff' : COLOR_ESTADO[est],
                  border: `2px solid ${COLOR_ESTADO[est]}`,
                }}
              >
                {EMOJIS_ESTADO[est]} {est}
              </button>
            ))}
          </div>
          <button onClick={() => cambiarEstado('cancelado')} style={s.btnCancelar}>
            ❌ Cancelar pedido
          </button>
        </div>
      )}

      {/* ── COMANDA MINI ── */}
      {detallePedido && (
        <div style={s.comandaMini}>
          <div style={s.comandaHeader}>
            <p style={s.comandaTitulo}>🧾 Comanda — {detallePedido.folio}</p>
            <div style={s.comandaAcciones}>
              <button
                onClick={() => setMostrarComanda(!mostrarComanda)}
                style={s.btnVerComanda}
              >
                {mostrarComanda ? 'Ocultar' : 'Ver items'}
              </button>
              <button
                onClick={() => navigate(`/panel/comanda/${pedidoId}`)}
                style={s.btnImprimirMini}
              >
                🖨️ Imprimir
              </button>
            </div>
          </div>

          {mostrarComanda && (
            <div style={s.comandaItems}>
              {detallePedido.items.map((item, i) => (
                <div key={i} style={s.comandaItem}>
                  <div style={s.comandaItemFila}>
                    <span style={s.comandaItemCant}>{item.cantidad}×</span>
                    <span style={s.comandaItemNombre}>{item.nombre}</span>
                    <span style={s.comandaItemPrecio}>${item.subtotal.toFixed(2)}</span>
                  </div>
                  {item.notas && (
                    <p style={s.comandaItemNota}>📝 {item.notas}</p>
                  )}
                </div>
              ))}
              <div style={s.comandaTotal}>
                <span style={s.comandaTotalLabel}>TOTAL</span>
                <span style={s.comandaTotalValor}>${detallePedido.total.toFixed(2)}</span>
              </div>
              {detallePedido.notas && (
                <p style={s.comandaNotas}>📝 Nota: {detallePedido.notas}</p>
              )}
            </div>
          )}

          {/* Botón avanzar estado rápido */}
          {sigEst && (
            <button onClick={() => cambiarEstado(sigEst)} style={s.btnAvanzar}>
              {EMOJIS_ESTADO[sigEst]} Marcar como {sigEst.toUpperCase()}
            </button>
          )}
        </div>
      )}

      {/* ── MENSAJES ── */}
      <div style={s.mensajes}>
        {mensajes.length === 0 && (
          <div style={s.sinMensajes}>
            <p style={{ fontSize: '32px' }}>💬</p>
            <p style={s.sinMensajesTexto}>Sin mensajes aún</p>
          </div>
        )}

        {mensajes.map(m => (
          <div key={m.id} style={m.es_mio ? s.rowMio : s.rowOtro}>
            <div style={{
              ...s.burbuja,
              background: m.es_mio
                ? 'linear-gradient(135deg, #009EE3, #0077B6)'
                : m.tipo === 'estado' ? '#F0FFF7'
                : m.tipo === 'pedido' ? '#FFF8E1'
                : '#FFFFFF',
              color: m.es_mio ? '#fff' : '#333',
              borderTopRightRadius: m.es_mio ? '4px' : '18px',
              borderTopLeftRadius: m.es_mio ? '18px' : '4px',
              border: m.tipo === 'estado' ? '1px solid #00A650'
                : m.tipo === 'pedido' ? '1px solid #FFB300' : 'none',
              whiteSpace: 'pre-line',
            }}>
              {m.tipo === 'pedido' && <span>🛒 </span>}
              {m.tipo === 'estado' && <span style={{ color: m.es_mio ? '#fff' : '#00A650' }}>📢 </span>}
              <span style={{ fontSize: '13px', lineHeight: '1.5' }}>{m.contenido}</span>
            </div>
            <p style={{ ...s.ts, textAlign: m.es_mio ? 'right' : 'left' }}>
              {hora(m.creado_en)}
              {m.es_mio && <span> {m.leido ? '✓✓' : '✓'}</span>}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── INPUT BAR ── */}
      <div style={s.inputBar}>
        <input
          ref={inputRef}
          style={s.input}
          placeholder="Escribe un mensaje al cliente..."
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje() }
          }}
        />
        <button
          onClick={enviarMensaje}
          style={{ ...s.btnEnviar, opacity: texto.trim() ? 1 : 0.4 }}
          disabled={!texto.trim() || enviando}
        >
          {enviando ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  )
}

const s = {
  contenedor: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#EEF2F5', fontFamily: "'Nunito',sans-serif", maxWidth: '480px', margin: '0 auto', overflow: 'hidden' },
  cargando: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' },

  header: { background: 'linear-gradient(135deg, #009EE3, #0077B6)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 },
  btnVolver: { background: 'none', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer', lineHeight: 1, padding: '0 4px' },
  avatarWrap: { flexShrink: 0 },
  avatar: { width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', border: '2px solid rgba(255,255,255,0.3)' },
  headerInfo: { flex: 1, minWidth: 0 },
  headerNombre: { color: '#fff', fontSize: '14px', fontWeight: '700', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: '11px', margin: 0 },
  headerAcciones: { display: 'flex', gap: '6px', flexShrink: 0 },
  btnComanda: { background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', color: '#fff', padding: '7px 10px', fontSize: '16px', cursor: 'pointer' },
  btnEstado: { background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', color: '#fff', padding: '7px 10px', fontSize: '16px', cursor: 'pointer' },

  estadosPanel: { background: '#fff', padding: '14px 16px', borderBottom: '2px solid #E0E0E0', flexShrink: 0 },
  estadosPanelTitulo: { fontSize: '13px', fontWeight: '800', color: '#333', margin: '0 0 10px' },
  estadosGrid: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' },
  estadoBtn: { padding: '7px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  btnCancelar: { width: '100%', background: '#FFEBEE', border: 'none', borderRadius: '8px', padding: '10px', color: '#C62828', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },

  comandaMini: { background: '#fff', borderBottom: '2px solid #E0E0E0', padding: '12px 16px', flexShrink: 0 },
  comandaHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  comandaTitulo: { fontSize: '13px', fontWeight: '800', color: '#333', margin: 0 },
  comandaAcciones: { display: 'flex', gap: '6px' },
  btnVerComanda: { background: '#F0F8FF', border: '1px solid #009EE3', borderRadius: '6px', padding: '5px 10px', color: '#009EE3', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  btnImprimirMini: { background: '#009EE3', border: 'none', borderRadius: '6px', padding: '5px 10px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  comandaItems: { background: '#F9F9F9', borderRadius: '8px', padding: '10px', marginBottom: '8px' },
  comandaItem: { marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #EEE' },
  comandaItemFila: { display: 'flex', alignItems: 'center', gap: '6px' },
  comandaItemCant: { fontSize: '13px', fontWeight: '800', color: '#009EE3', minWidth: '24px' },
  comandaItemNombre: { flex: 1, fontSize: '13px', fontWeight: '600', color: '#333' },
  comandaItemPrecio: { fontSize: '13px', fontWeight: '800', color: '#009EE3' },
  comandaItemNota: { fontSize: '11px', color: '#999', margin: '3px 0 0 24px', fontStyle: 'italic' },
  comandaTotal: { display: 'flex', justifyContent: 'space-between', paddingTop: '8px', marginTop: '4px', borderTop: '2px dashed #E0E0E0' },
  comandaTotalLabel: { fontSize: '14px', fontWeight: '800', color: '#333' },
  comandaTotalValor: { fontSize: '16px', fontWeight: '900', color: '#009EE3' },
  comandaNotas: { fontSize: '12px', color: '#666', margin: '8px 0 0', fontStyle: 'italic' },
  btnAvanzar: { width: '100%', background: 'linear-gradient(135deg, #009EE3, #0077B6)', border: 'none', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '13px', fontWeight: '800', cursor: 'pointer' },

  mensajes: { flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '6px' },
  sinMensajes: { textAlign: 'center', padding: '40px', color: '#ccc' },
  sinMensajesTexto: { fontSize: '14px', margin: '8px 0 0' },
  rowMio: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  rowOtro: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
  burbuja: { padding: '10px 14px', borderRadius: '18px', maxWidth: '82%', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  ts: { fontSize: '10px', color: '#bbb', margin: '2px 4px 4px' },

  inputBar: { background: '#fff', borderTop: '1px solid #E0E0E0', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, boxShadow: '0 -2px 6px rgba(0,0,0,0.05)' },
  input: { flex: 1, border: '1px solid #E0E0E0', borderRadius: '24px', padding: '10px 16px', fontSize: '14px', color: '#333', outline: 'none', background: '#F5F5F5', fontFamily: 'inherit' },
  btnEnviar: { background: 'linear-gradient(135deg, #009EE3, #0077B6)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: '#fff', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
}
