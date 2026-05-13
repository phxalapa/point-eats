import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { restaurantesService, pedidosService, chatService } from '../services/api'

export default function Chat() {
  const { restauranteId } = useParams()
  const navigate = useNavigate()
  const [restaurante, setRestaurante] = useState(null)
  const [menu, setMenu] = useState({})
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [carrito, setCarrito] = useState([])
  const [verMenu, setVerMenu] = useState(false)
  const [pedidoActivo, setPedidoActivo] = useState(null)
  const [cargando, setCargando] = useState(false)
  const bottomRef = useRef(null)
  const usuarioId = parseInt(localStorage.getItem('usuario_id'))

  useEffect(() => {
    restaurantesService.menu(restauranteId).then(res => {
      setRestaurante(res.data.restaurante)
      setMenu(res.data.menu)
    })
  }, [restauranteId])

  useEffect(() => {
    if (!pedidoActivo) return
    const interval = setInterval(() => {
      chatService.obtener(pedidoActivo).then(res => setMensajes(res.data))
    }, 3000)
    return () => clearInterval(interval)
  }, [pedidoActivo])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const cantidad = (id) => carrito.find(i => i.id === id)?.cantidad || 0

  const agregar = (platillo) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.id === platillo.id)
      if (existe) return prev.map(i => i.id === platillo.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { ...platillo, cantidad: 1 }]
    })
  }

  const quitar = (id) => {
    setCarrito(prev => {
      const item = prev.find(i => i.id === id)
      if (item.cantidad === 1) return prev.filter(i => i.id !== id)
      return prev.map(i => i.id === id ? { ...i, cantidad: i.cantidad - 1 } : i)
    })
  }

  const totalItems = carrito.reduce((s, i) => s + i.cantidad, 0)
  const totalPrecio = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0)

  const enviarPedido = async () => {
    if (carrito.length === 0) return
    setCargando(true)
    try {
      const res = await pedidosService.crear({
        restaurante_id: parseInt(restauranteId),
        items: carrito.map(i => ({ platillo_id: i.id, cantidad: i.cantidad }))
      })
      setPedidoActivo(res.data.pedido_id)
      const msgs = await chatService.obtener(res.data.pedido_id)
      setMensajes(msgs.data)
      setCarrito([])
      setVerMenu(false)
    } catch {
      alert('Error al enviar el pedido')
    } finally {
      setCargando(false)
    }
  }

  const enviarMensaje = async () => {
    if (!texto.trim() || !pedidoActivo) return
    await chatService.enviar(pedidoActivo, texto)
    setTexto('')
    const res = await chatService.obtener(pedidoActivo)
    setMensajes(res.data)
  }

  if (!restaurante) return (
    <div style={e.cargando}><p style={{ color: '#009EE3' }}>Cargando...</p></div>
  )

  return (
    <div style={e.contenedor}>

      {/* ── HEADER ── */}
      <div style={e.header}>
        <button onClick={() => navigate('/contactos')} style={e.btnVolver}>‹</button>
        <div style={e.avatarWrap}>
          <div style={e.avatar}>🍽️</div>
          <span style={{ ...e.online, background: restaurante.abierto ? '#25D366' : '#ccc' }} />
        </div>
        <div style={e.headerInfo}>
          <p style={e.headerNombre}>{restaurante.nombre}</p>
          <p style={e.headerSub}>
            {restaurante.abierto ? '● Abierto' : '● Cerrado'} · ⏱ {restaurante.tiempo_entrega_min} min
          </p>
        </div>
        <button onClick={() => setVerMenu(!verMenu)} style={e.btnMenuHdr}>🍽️</button>
      </div>

      {/* ── PANEL MENÚ ── */}
      {verMenu && (
        <div style={e.menuPanel}>
          <div style={e.menuHeader}>
            <p style={e.menuTitulo}>Menú</p>
            <button onClick={() => setVerMenu(false)} style={e.btnCerrarMenu}>✕</button>
          </div>
          <div style={e.menuScroll}>
            {Object.entries(menu).map(([cat, platillos]) => (
              <div key={cat}>
                <div style={e.catLabel}>{cat}</div>
                <div style={e.cardsRow}>
                  {platillos.map(p => (
                    <div key={p.id} style={e.card}>
                      {p.destacado && <div style={e.cardBadge}>⭐ Popular</div>}
                      <div style={e.cardImg}>
                        {p.foto_url
                          ? <img src={p.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={p.nombre} />
                          : <span style={e.cardEmoji}>🍽️</span>
                        }
                      </div>
                      <div style={e.cardBody}>
                        <p style={e.cardNombre}>{p.nombre}</p>
                        <p style={e.cardDesc}>{p.descripcion}</p>
                        <p style={e.cardPrecio}>${p.precio.toFixed(2)}</p>
                        <div style={e.cardAction}>
                          {cantidad(p.id) === 0 ? (
                            <button onClick={() => agregar(p)} style={e.btnAgregar}>+ Agregar</button>
                          ) : (
                            <div style={e.qtyCtrl}>
                              <button onClick={() => quitar(p.id)} style={e.qtyBtn}>−</button>
                              <span style={e.qtyNum}>{cantidad(p.id)}</span>
                              <button onClick={() => agregar(p)} style={e.qtyBtn}>+</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Botón confirmar pedido dentro del menú */}
          {totalItems > 0 && (
            <div style={e.menuFooter}>
              <button onClick={enviarPedido} style={e.btnPedir} disabled={cargando}>
                {cargando ? 'Enviando...' : `Pedir · ${totalItems} items · $${totalPrecio.toFixed(2)}`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── CHAT ── */}
      <div style={e.chat}>
        {mensajes.length === 0 && !pedidoActivo && (
          <div style={e.bienvenida}>
            <p style={e.bienvenidaEmoji}>🍽️</p>
            <p style={e.bienvenidaTitulo}>¡Bienvenido a {restaurante.nombre}!</p>
            <p style={e.bienvenidaDesc}>{restaurante.descripcion}</p>
            <button onClick={() => setVerMenu(true)} style={e.btnVerMenuChat}>
              Ver menú y ordenar 🛒
            </button>
          </div>
        )}

        {mensajes.map(m => (
          <div key={m.id} style={{ ...e.row, alignItems: m.es_mio ? 'flex-end' : 'flex-start' }}>
            <div style={{
              ...e.bubble,
              background: m.es_mio
                ? 'linear-gradient(135deg, #009EE3, #0077B6)'
                : '#FFFFFF',
              color: m.es_mio ? '#FFFFFF' : '#333333',
              borderTopRightRadius: m.es_mio ? '4px' : '18px',
              borderTopLeftRadius: m.es_mio ? '18px' : '4px',
            }}>
              {m.tipo === 'pedido' && '🛒 '}
              {m.tipo === 'estado' && '📢 '}
              {m.contenido}
            </div>
            <p style={{ ...e.ts, textAlign: m.es_mio ? 'right' : 'left' }}>
              {new Date(m.creado_en).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── CARRITO FLOTANTE ── */}
      {totalItems > 0 && !verMenu && (
        <button onClick={() => setVerMenu(true)} style={e.carritoFlotante}>
          🛒 {totalItems} {totalItems === 1 ? 'item' : 'items'} · ${totalPrecio.toFixed(2)}
        </button>
      )}

      {/* ── INPUT BAR ── */}
      <div style={e.inputBar}>
        <button onClick={() => setVerMenu(!verMenu)} style={e.btnMenuInput} title="Ver menú">
          🍽️
        </button>
        <input
          style={e.input}
          placeholder={pedidoActivo ? 'Escribe un mensaje...' : 'Pide desde el menú 🍽️'}
          value={texto}
          onChange={ev => setTexto(ev.target.value)}
          onKeyDown={ev => ev.key === 'Enter' && enviarMensaje()}
          disabled={!pedidoActivo}
        />
        <button
          onClick={enviarMensaje}
          style={{ ...e.btnEnviar, opacity: texto.trim() && pedidoActivo ? 1 : 0.4 }}
          disabled={!texto.trim() || !pedidoActivo}
        >➤</button>
      </div>
    </div>
  )
}

const e = {
  contenedor: {
    display: 'flex', flexDirection: 'column', height: '100vh',
    background: '#EEF2F5',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0C9 0 0 9 0 20s9 20 20 20 20-9 20-20S31 0 20 0zm0 2c9.9 0 18 8.1 18 18S29.9 38 20 38 2 29.9 2 20 10.1 2 20 2z' fill='%23009EE3' fill-opacity='0.04'/%3E%3C/svg%3E\")",
    fontFamily: "'Nunito','Helvetica Neue',Helvetica,Arial,sans-serif"
  },
  cargando: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' },

  // Header
  header: {
    background: 'linear-gradient(135deg, #009EE3, #0077B6)',
    padding: '13px 16px', display: 'flex', alignItems: 'center',
    gap: '10px', flexShrink: 0, zIndex: 10
  },
  btnVolver: { background: 'none', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer', padding: '0 4px', lineHeight: 1 },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: {
    width: '42px', height: '42px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '20px', border: '2px solid rgba(255,255,255,0.3)'
  },
  online: { position: 'absolute', bottom: '1px', right: '1px', width: '11px', height: '11px', borderRadius: '50%', border: '2px solid #0077B6' },
  headerInfo: { flex: 1 },
  headerNombre: { color: '#fff', fontSize: '15px', fontWeight: '700', margin: 0 },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: '11px', margin: 0 },
  btnMenuHdr: { background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '8px 10px', fontSize: '18px', cursor: 'pointer' },

  // Menú panel
  menuPanel: {
    background: '#FFFFFF', borderBottom: '1px solid #E0E0E0',
    maxHeight: '65vh', display: 'flex', flexDirection: 'column', flexShrink: 0
  },
  menuHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 10px' },
  menuTitulo: { fontSize: '17px', fontWeight: '800', color: '#333', margin: 0 },
  btnCerrarMenu: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' },
  menuScroll: { overflowY: 'auto', padding: '0 12px 12px', flex: 1 },
  catLabel: {
    display: 'inline-block', background: '#009EE3', color: '#fff',
    fontSize: '11px', fontWeight: '800', padding: '4px 14px',
    borderRadius: '20px', margin: '10px 0 8px',
    letterSpacing: '0.3px', boxShadow: '0 2px 8px rgba(0,158,227,0.3)'
  },
  cardsRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },

  // Cards
  card: {
    width: 'calc(33.33% - 6px)', borderRadius: '14px', overflow: 'hidden',
    background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
    display: 'flex', flexDirection: 'column',
    border: '1.5px solid rgba(0,158,227,0.08)', position: 'relative',
    minWidth: '95px'
  },
  cardBadge: {
    position: 'absolute', top: '6px', left: '6px',
    background: 'linear-gradient(135deg, #009EE3, #0077B6)',
    color: '#fff', fontSize: '8px', fontWeight: '900',
    padding: '2px 6px', borderRadius: '6px', zIndex: 2
  },
  cardImg: {
    width: '100%', height: '72px', overflow: 'hidden',
    background: 'linear-gradient(135deg, #E8F7FF, #C5E8F7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  cardEmoji: { fontSize: '32px' },
  cardBody: { padding: '7px 7px 8px', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 },
  cardNombre: { fontSize: '11px', fontWeight: '800', color: '#222', margin: 0, lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cardDesc: { fontSize: '9px', color: '#aaa', fontWeight: '600', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cardPrecio: { fontSize: '13px', fontWeight: '900', color: '#009EE3', margin: '2px 0 0' },
  cardAction: { marginTop: '5px' },
  btnAgregar: {
    width: '100%', padding: '5px 0', borderRadius: '8px', border: 'none',
    background: '#009EE3', color: '#fff', fontSize: '11px', fontWeight: '800',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px'
  },
  qtyCtrl: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#E8F7FF', borderRadius: '8px', overflow: 'hidden',
    border: '1.5px solid rgba(0,158,227,0.2)'
  },
  qtyBtn: {
    width: '28px', height: '26px', border: 'none', background: 'transparent',
    fontSize: '16px', fontWeight: '900', color: '#009EE3', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  qtyNum: { fontSize: '13px', fontWeight: '900', color: '#0077B6', minWidth: '18px', textAlign: 'center' },

  menuFooter: { padding: '12px 16px', borderTop: '1px solid #EEEEEE' },
  btnPedir: {
    width: '100%', background: 'linear-gradient(135deg, #009EE3, #0077B6)',
    border: 'none', borderRadius: '10px', padding: '14px',
    color: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,158,227,0.35)'
  },

  // Chat
  chat: { flex: 1, overflowY: 'auto', padding: '14px 10px 80px', display: 'flex', flexDirection: 'column', gap: '8px' },
  bienvenida: { textAlign: 'center', padding: '40px 20px', margin: 'auto 0' },
  bienvenidaEmoji: { fontSize: '52px', margin: '0 0 12px' },
  bienvenidaTitulo: { fontSize: '18px', fontWeight: '800', color: '#333', margin: '0 0 8px' },
  bienvenidaDesc: { fontSize: '14px', color: '#777', margin: '0 0 24px' },
  btnVerMenuChat: {
    background: 'linear-gradient(135deg, #009EE3, #0077B6)', border: 'none',
    borderRadius: '10px', padding: '13px 24px', color: '#fff',
    fontSize: '15px', fontWeight: '800', cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0,158,227,0.35)'
  },
  row: { display: 'flex', flexDirection: 'column' },
  bubble: {
    padding: '10px 14px', borderRadius: '18px', fontSize: '13.5px',
    lineHeight: '1.5', maxWidth: '80%',
    boxShadow: '0 1px 6px rgba(0,0,0,0.09)',
    animation: 'none'
  },
  ts: { fontSize: '10px', color: '#bbb', margin: '3px 4px 0' },

  // Carrito flotante
  carritoFlotante: {
    position: 'absolute', bottom: '70px', left: '50%', transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #009EE3, #0077B6)',
    border: 'none', borderRadius: '24px', padding: '12px 24px',
    color: '#fff', fontSize: '14px', fontWeight: '800', cursor: 'pointer',
    boxShadow: '0 -2px 24px rgba(0,158,227,0.35), 0 6px 24px rgba(0,0,0,0.12)',
    zIndex: 20, whiteSpace: 'nowrap'
  },

  // Input bar
  inputBar: {
    background: '#FFFFFF', borderTop: '1px solid #E0E0E0',
    padding: '10px 12px', display: 'flex', alignItems: 'center',
    gap: '8px', flexShrink: 0
  },
  btnMenuInput: { background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', padding: '4px' },
  input: {
    flex: 1, border: '1px solid #E0E0E0', borderRadius: '24px',
    padding: '10px 16px', fontSize: '14px', color: '#333',
    outline: 'none', background: '#F5F5F5', fontFamily: 'inherit'
  },
  btnEnviar: {
    background: 'linear-gradient(135deg, #009EE3, #0077B6)',
    border: 'none', borderRadius: '50%', width: '38px', height: '38px',
    color: '#fff', fontSize: '16px', cursor: 'pointer', flexShrink: 0
  }
}
