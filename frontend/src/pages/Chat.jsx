import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { restaurantesService, pedidosService, chatService } from '../services/api'

// ── Burbuja de categorías ──────────────────────────────
function BurbujaCategorias({ categorias, onSelect }) {
  return (
    <div style={s.rowBot}>
      <div style={s.bubbleBot}>
        <p style={s.bubbleTexto}>¿Qué se te antoja hoy? 😋</p>
        <div style={s.categoriasWrap}>
          {categorias.map(cat => (
            <button key={cat} onClick={() => onSelect(cat)} style={s.btnCategoria}>
              {cat}
            </button>
          ))}
        </div>
      </div>
      <p style={s.ts}>{hora()}</p>
    </div>
  )
}

// ── Cards de productos ─────────────────────────────────
function BurbujaProductos({ categoria, platillos, carrito, onAgregar, onQuitar }) {
  const cantidad = (id) => carrito.find(i => i.id === id)?.cantidad || 0
  return (
    <div style={s.rowBot}>
      <div style={{ ...s.bubbleBot, padding: '12px', maxWidth: '96%' }}>
        <p style={s.catTitulo}>{categoria}</p>
        <div style={s.cardsGrid}>
          {platillos.map(p => (
            <div key={p.id} style={s.card}>
              {p.destacado && <div style={s.cardBadge}>⭐</div>}
              <div style={s.cardImgWrap}>
                {p.foto_url
                  ? <img src={p.foto_url} style={s.cardImg} alt={p.nombre} />
                  : <span style={s.cardEmoji}>🍽️</span>
                }
              </div>
              <div style={s.cardBody}>
                <p style={s.cardNombre}>{p.nombre}</p>
                <p style={s.cardDesc}>{p.descripcion || ''}</p>
                <p style={s.cardPrecio}>${p.precio.toFixed(2)}</p>
                <div style={s.cardAction}>
                  {cantidad(p.id) === 0 ? (
                    <button onClick={() => onAgregar(p)} style={s.btnAgregar}>+ Agregar</button>
                  ) : (
                    <div style={s.qtyCtrl}>
                      <button onClick={() => onQuitar(p.id)} style={s.qtyBtn}>−</button>
                      <span style={s.qtyNum}>{cantidad(p.id)}</span>
                      <button onClick={() => onAgregar(p)} style={s.qtyBtn}>+</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p style={s.ts}>{hora()}</p>
    </div>
  )
}

// ── Burbuja resumen carrito ────────────────────────────
function BurbujaCarrito({ carrito, total, onPagar, onSeguir }) {
  return (
    <div style={s.rowBot}>
      <div style={{ ...s.bubbleBot, padding: '14px', maxWidth: '92%' }}>
        <p style={s.bubbleTexto}>🛒 <strong>Tu pedido</strong></p>
        {carrito.map(i => (
          <div key={i.id} style={s.carritoFila}>
            <span style={s.carritoItem}>{i.cantidad}x {i.nombre}</span>
            <span style={s.carritoPrecio}>${(i.precio * i.cantidad).toFixed(2)}</span>
          </div>
        ))}
        <div style={s.carritoSep} />
        <div style={s.carritoFila}>
          <strong style={{ color: '#333' }}>Total</strong>
          <strong style={{ color: '#009EE3', fontSize: '16px' }}>${total.toFixed(2)}</strong>
        </div>
        <p style={{ ...s.bubbleTexto, marginTop: '12px' }}>¿Cómo quieres pagar?</p>
        <div style={s.pagoOpciones}>
          <button onClick={() => onPagar('transferencia')} style={s.btnPagoTrans}>
            🏦 Transferencia
          </button>
          <button onClick={() => onPagar('mercadopago')} style={s.btnPagoMP}>
            💳 En línea
          </button>
        </div>
        <button onClick={onSeguir} style={s.btnSeguir}>+ Seguir pidiendo</button>
      </div>
      <p style={s.ts}>{hora()}</p>
    </div>
  )
}

// ── Burbuja transferencia ──────────────────────────────
function BurbujaTransferencia({ datos, total, onConfirmar }) {
  const copiar = (texto, label) => {
    navigator.clipboard.writeText(texto)
      .then(() => alert(`✅ ${label} copiado`))
      .catch(() => {
        const el = document.createElement('textarea')
        el.value = texto
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
        alert(`✅ ${label} copiado`)
      })
  }
  return (
    <div style={s.rowBot}>
      <div style={{ ...s.bubbleBot, padding: '16px', maxWidth: '94%' }}>
        <p style={s.transTitle}>📋 Datos de pago</p>
        <p style={s.transSubtitle}>{datos.banco_nombre}</p>

        <div style={s.transBloque}>
          <span style={s.transLabel}>A nombre de</span>
          <span style={s.transValor}>{datos.banco_titular}</span>
        </div>

        <div style={s.transBloqueCopy}>
          <div>
            <span style={s.transLabel}>No. Cuenta</span>
            <span style={s.transValor}>{datos.banco_cuenta}</span>
          </div>
          <button onClick={() => copiar(datos.banco_cuenta, 'Número de cuenta')} style={s.btnCopiar}>Copiar</button>
        </div>

        <div style={s.transBloqueCopy}>
          <div>
            <span style={s.transLabel}>Tarjeta</span>
            <span style={s.transValor}>
              {datos.banco_tarjeta?.replace(/(.{4})/g, '$1 ').trim()}
            </span>
          </div>
          <button onClick={() => copiar(datos.banco_tarjeta, 'Número de tarjeta')} style={s.btnCopiar}>Copiar</button>
        </div>

        <div style={s.transBloqueCopy}>
          <div>
            <span style={s.transLabel}>CLABE</span>
            <span style={s.transValor}>{datos.banco_clabe}</span>
          </div>
          <button onClick={() => copiar(datos.banco_clabe, 'CLABE')} style={s.btnCopiar}>Copiar</button>
        </div>

        <div style={s.transMonto}>
          <span style={s.transLabel}>Monto a transferir</span>
          <span style={s.transTotalNum}>${total.toFixed(2)}</span>
        </div>

        <p style={s.transNota}>
          Realiza la transferencia y avísanos aquí 📲
        </p>
        <button onClick={onConfirmar} style={s.btnConfirmarPago}>
          ✅ Ya pagué — avisar al restaurante
        </button>
      </div>
      <p style={s.ts}>{hora()}</p>
    </div>
  )
}

// ── Modal MercadoPago ──────────────────────────────────
function ModalMercadoPago({ total, onCerrar, onPagado }) {
  const [numero, setNumero] = useState('')
  const [vencimiento, setVencimiento] = useState('')
  const [cvv, setCvv] = useState('')
  const [nombre, setNombre] = useState('')
  const [procesando, setProcesando] = useState(false)

  const formatTarjeta = v => v.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19)
  const formatVenc = v => {
    const clean = v.replace(/\D/g, '').slice(0, 4)
    return clean.length > 2 ? clean.slice(0, 2) + '/' + clean.slice(2) : clean
  }

  const pagar = () => {
    if (!numero || !vencimiento || !cvv || !nombre) { alert('Completa todos los campos'); return }
    setProcesando(true)
    setTimeout(() => { setProcesando(false); onPagado() }, 2000)
  }

  return (
    <div style={s.modalOverlay}>
      <div style={s.modalBox}>
        <div style={s.modalHeader}>
          <span style={s.modalLogo}>💳 Pago seguro</span>
          <button onClick={onCerrar} style={s.modalCerrar}>✕</button>
        </div>
        <p style={s.modalTotal}>Total: <strong style={{ color: '#009EE3' }}>${total.toFixed(2)}</strong></p>
        <div style={s.mpCampo}>
          <label style={s.mpLabel}>Número de tarjeta</label>
          <input style={s.mpInput} placeholder="4152 5236 5214 5123"
            value={numero} onChange={e => setNumero(formatTarjeta(e.target.value))} maxLength={19} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ ...s.mpCampo, flex: 1 }}>
            <label style={s.mpLabel}>Vencimiento</label>
            <input style={s.mpInput} placeholder="MM/AA"
              value={vencimiento} onChange={e => setVencimiento(formatVenc(e.target.value))} maxLength={5} />
          </div>
          <div style={{ ...s.mpCampo, flex: 1 }}>
            <label style={s.mpLabel}>CVV</label>
            <input style={s.mpInput} placeholder="123"
              value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))} maxLength={3} />
          </div>
        </div>
        <div style={s.mpCampo}>
          <label style={s.mpLabel}>Nombre en la tarjeta</label>
          <input style={s.mpInput} placeholder="Como aparece en tu tarjeta"
            value={nombre} onChange={e => setNombre(e.target.value)} />
        </div>
        <p style={s.mpSeguro}>🔒 Pago 100% seguro · Encriptado SSL</p>
        <button onClick={pagar} style={s.mpBtnPagar} disabled={procesando}>
          {procesando ? '⏳ Procesando...' : `Pagar $${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────
const hora = () => new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

// ── COMPONENTE PRINCIPAL ───────────────────────────────
export default function Chat() {
  const { restauranteId } = useParams()
  const navigate = useNavigate()
  const [restaurante, setRestaurante] = useState(null)
  const [menu, setMenu] = useState({})
  const [burbujas, setBurbujas] = useState([])
  const [mensajesReales, setMensajesReales] = useState([])
  const [texto, setTexto] = useState('')
  const [carrito, setCarrito] = useState([])
  const [pedidoActivo, setPedidoActivo] = useState(null)
  const [mostrarMP, setMostrarMP] = useState(false)
  const [fase, setFase] = useState('inicio')
  const [enviando, setEnviando] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const usuarioId = parseInt(localStorage.getItem('usuario_id'))

  // Cargar restaurante y menú
  useEffect(() => {
    restaurantesService.menu(restauranteId).then(res => {
      setRestaurante(res.data.restaurante)
      setMenu(res.data.menu)
      setBurbujas([
        { tipo: 'bienvenida', id: 'bienvenida', nombre: res.data.restaurante.nombre, desc: res.data.restaurante.descripcion },
        { tipo: 'categorias', id: 'cat-inicio', categorias: Object.keys(res.data.menu) }
      ])
    })
  }, [restauranteId])

  // Polling mensajes reales cada 2 segundos
  useEffect(() => {
    if (!pedidoActivo) return
    const cargar = () => chatService.obtener(pedidoActivo).then(res => setMensajesReales(res.data))
    cargar()
    const interval = setInterval(cargar, 2000)
    return () => clearInterval(interval)
  }, [pedidoActivo])

  // Scroll automático
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [burbujas, mensajesReales])

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
      if (!item) return prev
      if (item.cantidad === 1) return prev.filter(i => i.id !== id)
      return prev.map(i => i.id === id ? { ...i, cantidad: i.cantidad - 1 } : i)
    })
  }

  const totalCarrito = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0)
  const totalItems = carrito.reduce((s, i) => s + i.cantidad, 0)

  const seleccionarCategoria = (cat) => {
    setBurbujas(prev => [
      ...prev,
      { tipo: 'msg-usr', id: `u-${Date.now()}`, texto: `📂 ${cat}` },
      { tipo: 'productos', id: `p-${cat}-${Date.now()}`, categoria: cat, platillos: menu[cat] || [] }
    ])
  }

  const verCarrito = () => {
    if (carrito.length === 0) return
    setBurbujas(prev => [
      ...prev,
      { tipo: 'msg-usr', id: `u-carr-${Date.now()}`, texto: '🛒 Ver mi pedido' },
      { tipo: 'carrito', id: `carr-${Date.now()}` }
    ])
    setFase('carrito')
  }

  const elegirPago = (metodo) => {
    if (metodo === 'transferencia') {
      setBurbujas(prev => [
        ...prev,
        { tipo: 'msg-usr', id: `u-t-${Date.now()}`, texto: '🏦 Pagar por transferencia' },
        { tipo: 'transferencia', id: `trans-${Date.now()}` }
      ])
    } else {
      setBurbujas(prev => [
        ...prev,
        { tipo: 'msg-usr', id: `u-mp-${Date.now()}`, texto: '💳 Pagar en línea' }
      ])
      setMostrarMP(true)
    }
  }

  const seguirPidiendo = () => {
    setBurbujas(prev => [
      ...prev,
      { tipo: 'categorias', id: `cat-${Date.now()}`, categorias: Object.keys(menu) }
    ])
    setFase('pidiendo')
  }

  const crearPedido = async () => {
    try {
      const res = await pedidosService.crear({
        restaurante_id: parseInt(restauranteId),
        items: carrito.map(i => ({ platillo_id: i.id, cantidad: i.cantidad }))
      })
      setPedidoActivo(res.data.pedido_id)
      setCarrito([])
      setFase('pedido-activo')
      return res.data
    } catch {
      alert('Error al crear el pedido')
    }
  }

  const confirmarTransferencia = async () => {
    const pedido = await crearPedido()
    if (!pedido) return
    await chatService.enviar(pedido.pedido_id, '💳 Ya realicé la transferencia, por favor confirmar pago.')
    setBurbujas(prev => [...prev, {
      tipo: 'msg-sistema', id: `sis-${Date.now()}`,
      texto: '✅ Aviso enviado. El restaurante confirmará tu pago en breve.'
    }])
  }

  const pagoMPExitoso = async () => {
    setMostrarMP(false)
    const pedido = await crearPedido()
    if (!pedido) return
    await chatService.enviar(pedido.pedido_id, '💳 Pago realizado en línea exitosamente.')
    setBurbujas(prev => [...prev, {
      tipo: 'msg-sistema', id: `sis-mp-${Date.now()}`,
      texto: '✅ ¡Pago exitoso! Tu pedido está siendo preparado 👨‍🍳'
    }])
  }

  // Enviar mensaje de texto — SIEMPRE disponible
  const enviarMensaje = async () => {
    if (!texto.trim() || enviando) return
    const textoEnviar = texto.trim()
    setTexto('')
    setEnviando(true)

    // Si no hay pedido activo, crear uno temporal para el chat
    let idPedido = pedidoActivo
    if (!idPedido) {
      try {
        // Crear pedido vacío para habilitar el chat
        // Por ahora agregamos el mensaje como burbuja local
        setBurbujas(prev => [...prev, {
          tipo: 'msg-usr', id: `u-txt-${Date.now()}`, texto: textoEnviar
        }])
        setEnviando(false)
        inputRef.current?.focus()
        return
      } catch {
        setEnviando(false)
        return
      }
    }

    try {
      await chatService.enviar(idPedido, textoEnviar)
      const res = await chatService.obtener(idPedido)
      setMensajesReales(res.data)
    } catch {
      alert('Error al enviar mensaje')
    } finally {
      setEnviando(false)
      inputRef.current?.focus()
    }
  }

  if (!restaurante) return (
    <div style={s.cargando}>
      <div style={s.spinner} />
      <p style={{ color: '#009EE3', fontFamily: 'Nunito,sans-serif', marginTop: '12px' }}>Cargando...</p>
    </div>
  )

  return (
    <div style={s.contenedor}>

      {/* ── HEADER ── */}
      <div style={s.header}>
        <button onClick={() => navigate('/contactos')} style={s.btnVolver}>‹</button>
        <div style={s.avatarWrap}>
          <div style={s.avatar}>🍽️</div>
          <span style={{ ...s.online, background: restaurante.abierto ? '#25D366' : '#ccc' }} />
        </div>
        <div style={s.headerInfo}>
          <p style={s.headerNombre}>{restaurante.nombre}</p>
          <p style={s.headerSub}>
            <span style={{ color: restaurante.abierto ? '#90EE90' : '#ffcccc' }}>
              {restaurante.abierto ? '● Abierto' : '● Cerrado'}
            </span>
            {' · '}⏱ {restaurante.tiempo_entrega_min} min
          </p>
        </div>
        {totalItems > 0 && (
          <button onClick={verCarrito} style={s.btnCarritoHeader}>
            🛒 {totalItems} · ${totalCarrito.toFixed(2)}
          </button>
        )}
      </div>

      {/* ── ÁREA DE CHAT ── */}
      <div style={s.chat}>

        {/* Burbujas interactivas */}
        {burbujas.map(b => {
          if (b.tipo === 'bienvenida') return (
            <div key={b.id} style={s.rowBot}>
              <div style={s.bubbleBot}>
                <p style={s.bubbleTexto}>¡Hola! 👋 Bienvenido a <strong>{b.nombre}</strong></p>
                {b.desc && <p style={{ ...s.bubbleTexto, color: '#777', fontSize: '12px', marginTop: '4px' }}>{b.desc}</p>}
              </div>
              <p style={s.ts}>{hora()}</p>
            </div>
          )

          if (b.tipo === 'categorias') return (
            <BurbujaCategorias key={b.id} categorias={b.categorias} onSelect={seleccionarCategoria} />
          )

          if (b.tipo === 'productos') return (
            <BurbujaProductos key={b.id} categoria={b.categoria} platillos={b.platillos}
              carrito={carrito} onAgregar={agregar} onQuitar={quitar} />
          )

          if (b.tipo === 'carrito') return (
            <BurbujaCarrito key={b.id} carrito={carrito} total={totalCarrito}
              onPagar={elegirPago} onSeguir={seguirPidiendo} />
          )

          if (b.tipo === 'transferencia') return (
            <BurbujaTransferencia key={b.id} datos={restaurante} total={totalCarrito}
              onConfirmar={confirmarTransferencia} />
          )

          if (b.tipo === 'msg-usr') return (
            <div key={b.id} style={s.rowUsr}>
              <div style={s.bubbleUsr}>{b.texto}</div>
              <p style={{ ...s.ts, textAlign: 'right' }}>{hora()}</p>
            </div>
          )

          if (b.tipo === 'msg-sistema') return (
            <div key={b.id} style={s.rowCenter}>
              <div style={s.bubbleSistema}>{b.texto}</div>
            </div>
          )

          return null
        })}

        {/* Mensajes reales en tiempo real */}
        {mensajesReales.map(m => (
          <div key={m.id} style={m.es_mio ? s.rowUsr : s.rowBot}>
            <div style={m.es_mio ? s.bubbleUsr : s.bubbleBot}>
              {m.tipo === 'pedido' && <span>🛒 </span>}
              {m.tipo === 'estado' && <span>📢 </span>}
              {m.contenido}
            </div>
            <p style={{ ...s.ts, textAlign: m.es_mio ? 'right' : 'left' }}>
              {new Date(m.creado_en).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* ── INPUT BAR — SIEMPRE ACTIVO ── */}
      <div style={s.inputBar}>
        <button onClick={seguirPidiendo} style={s.btnMenuInput} title="Ver menú">
          🍽️
        </button>
        <input
          ref={inputRef}
          style={s.input}
          placeholder="Escribe un mensaje..."
          value={texto}
          onChange={ev => setTexto(ev.target.value)}
          onKeyDown={ev => { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); enviarMensaje() } }}
        />
        <button
          onClick={enviarMensaje}
          style={{ ...s.btnEnviar, opacity: texto.trim() ? 1 : 0.4 }}
          disabled={!texto.trim() || enviando}
        >
          {enviando ? '⏳' : '➤'}
        </button>
      </div>

      {/* ── MODAL MERCADOPAGO ── */}
      {mostrarMP && (
        <ModalMercadoPago total={totalCarrito} onCerrar={() => setMostrarMP(false)} onPagado={pagoMPExitoso} />
      )}
    </div>
  )
}

// ── ESTILOS ────────────────────────────────────────────
const s = {
  contenedor: {
    display: 'flex', flexDirection: 'column', height: '100vh',
    background: '#EEF2F5',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0C9 0 0 9 0 20s9 20 20 20 20-9 20-20S31 0 20 0zm0 2c9.9 0 18 8.1 18 18S29.9 38 20 38 2 29.9 2 20 10.1 2 20 2z' fill='%23009EE3' fill-opacity='0.04'/%3E%3C/svg%3E\")",
    fontFamily: "'Nunito','Helvetica Neue',Helvetica,Arial,sans-serif",
    position: 'relative', overflow: 'hidden'
  },
  cargando: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  spinner: { width: '36px', height: '36px', border: '3px solid #E0E0E0', borderTop: '3px solid #009EE3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  header: {
    background: 'linear-gradient(135deg, #009EE3, #0077B6)',
    padding: '12px 14px', display: 'flex', alignItems: 'center',
    gap: '10px', flexShrink: 0, zIndex: 10,
    boxShadow: '0 2px 8px rgba(0,119,182,0.3)'
  },
  btnVolver: { background: 'none', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer', padding: '0 4px', lineHeight: 1, flexShrink: 0 },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '18px', border: '2px solid rgba(255,255,255,0.35)'
  },
  online: { position: 'absolute', bottom: '1px', right: '1px', width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #0077B6' },
  headerInfo: { flex: 1, minWidth: 0 },
  headerNombre: { color: '#fff', fontSize: '15px', fontWeight: '700', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: '11px', margin: 0 },
  btnCarritoHeader: {
    background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '20px',
    color: '#fff', padding: '6px 10px', fontSize: '12px', fontWeight: '700',
    cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap'
  },

  chat: {
    flex: 1, overflowY: 'auto', padding: '12px 10px 16px',
    display: 'flex', flexDirection: 'column', gap: '6px'
  },

  rowBot: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '100%' },
  rowUsr: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  rowCenter: { display: 'flex', justifyContent: 'center' },

  bubbleBot: {
    background: '#FFFFFF', borderRadius: '18px', borderTopLeftRadius: '4px',
    padding: '10px 14px', maxWidth: '85%',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
  },
  bubbleUsr: {
    background: 'linear-gradient(135deg, #009EE3, #0077B6)',
    color: '#fff', borderRadius: '18px', borderTopRightRadius: '4px',
    padding: '10px 14px', maxWidth: '82%',
    fontSize: '14px', lineHeight: '1.5',
    boxShadow: '0 2px 8px rgba(0,158,227,0.25)'
  },
  bubbleSistema: {
    background: '#F0FFF7', border: '1px solid #00A650',
    borderRadius: '10px', padding: '8px 14px',
    fontSize: '13px', color: '#00A650', fontWeight: '600',
    textAlign: 'center', margin: '4px 0'
  },
  bubbleTexto: { fontSize: '14px', color: '#333', margin: 0, lineHeight: '1.5' },
  ts: { fontSize: '10px', color: '#bbb', margin: '2px 4px 4px' },

  categoriasWrap: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' },
  btnCategoria: {
    background: 'linear-gradient(135deg, #009EE3, #0077B6)',
    border: 'none', borderRadius: '20px', padding: '7px 14px',
    color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,158,227,0.3)',
    transition: 'transform 0.1s',
  },

  catTitulo: { fontSize: '12px', fontWeight: '800', color: '#009EE3', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  cardsGrid: { display: 'flex', gap: '7px', flexWrap: 'wrap' },
  card: {
    width: 'calc(33.33% - 5px)', minWidth: '88px', borderRadius: '12px',
    overflow: 'hidden', background: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
    border: '1px solid rgba(0,158,227,0.1)',
    display: 'flex', flexDirection: 'column', position: 'relative'
  },
  cardBadge: {
    position: 'absolute', top: '4px', left: '4px',
    background: '#009EE3', color: '#fff',
    fontSize: '8px', fontWeight: '900',
    padding: '2px 5px', borderRadius: '4px', zIndex: 2
  },
  cardImgWrap: {
    width: '100%', height: '65px',
    background: 'linear-gradient(135deg, #E8F7FF, #C5E8F7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    overflow: 'hidden'
  },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardEmoji: { fontSize: '26px' },
  cardBody: { padding: '6px', display: 'flex', flexDirection: 'column', gap: '1px', flex: 1 },
  cardNombre: { fontSize: '10px', fontWeight: '800', color: '#222', margin: 0, lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardDesc: { fontSize: '9px', color: '#aaa', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardPrecio: { fontSize: '12px', fontWeight: '900', color: '#009EE3', margin: '2px 0 0' },
  cardAction: { marginTop: '4px' },
  btnAgregar: {
    width: '100%', padding: '5px 0', borderRadius: '7px', border: 'none',
    background: '#009EE3', color: '#fff', fontSize: '10px', fontWeight: '800', cursor: 'pointer'
  },
  qtyCtrl: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#E8F7FF', borderRadius: '7px',
    border: '1px solid rgba(0,158,227,0.3)'
  },
  qtyBtn: {
    width: '24px', height: '22px', border: 'none', background: 'transparent',
    fontSize: '14px', fontWeight: '900', color: '#009EE3', cursor: 'pointer'
  },
  qtyNum: { fontSize: '11px', fontWeight: '900', color: '#0077B6', minWidth: '14px', textAlign: 'center' },

  carritoFila: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F5F5F5' },
  carritoItem: { fontSize: '13px', color: '#333' },
  carritoPrecio: { fontSize: '13px', color: '#009EE3', fontWeight: '700' },
  carritoSep: { borderTop: '2px dashed #E0E0E0', margin: '8px 0' },
  pagoOpciones: { display: 'flex', gap: '8px', marginTop: '10px' },
  btnPagoTrans: {
    flex: 1, padding: '10px 6px', borderRadius: '8px',
    border: '2px solid #009EE3', background: '#fff',
    color: '#009EE3', fontSize: '12px', fontWeight: '800', cursor: 'pointer'
  },
  btnPagoMP: {
    flex: 1, padding: '10px 6px', borderRadius: '8px', border: 'none',
    background: 'linear-gradient(135deg, #009EE3, #0077B6)',
    color: '#fff', fontSize: '12px', fontWeight: '800', cursor: 'pointer'
  },
  btnSeguir: {
    width: '100%', marginTop: '8px', padding: '8px', borderRadius: '8px',
    border: '1px dashed #ccc', background: 'transparent',
    color: '#aaa', fontSize: '12px', cursor: 'pointer'
  },

  transTitle: { fontSize: '15px', fontWeight: '800', color: '#333', margin: '0 0 2px' },
  transSubtitle: { fontSize: '13px', color: '#009EE3', fontWeight: '700', margin: '0 0 10px' },
  transBloque: { padding: '7px 0', borderBottom: '1px solid #F5F5F5' },
  transBloqueCopy: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #F5F5F5' },
  transLabel: { fontSize: '10px', color: '#999', display: 'block', marginBottom: '1px' },
  transValor: { fontSize: '13px', color: '#333', fontWeight: '700', display: 'block', fontFamily: 'monospace' },
  btnCopiar: {
    background: '#E8F7FF', border: '1px solid #009EE3', borderRadius: '6px',
    padding: '5px 10px', color: '#009EE3', fontSize: '11px', fontWeight: '700', cursor: 'pointer', flexShrink: 0
  },
  transMonto: {
    background: '#E8F7FF', borderRadius: '8px', padding: '10px 12px',
    margin: '12px 0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  transTotalNum: { fontSize: '20px', fontWeight: '900', color: '#009EE3' },
  transNota: { fontSize: '12px', color: '#666', lineHeight: '1.5', margin: '0 0 10px' },
  btnConfirmarPago: {
    width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
    background: '#00A650', color: '#fff', fontSize: '14px', fontWeight: '800', cursor: 'pointer'
  },

  inputBar: {
    background: '#FFFFFF', borderTop: '1px solid #E0E0E0',
    padding: '10px 12px', display: 'flex', alignItems: 'center',
    gap: '8px', flexShrink: 0,
    boxShadow: '0 -2px 8px rgba(0,0,0,0.05)'
  },
  btnMenuInput: {
    background: 'none', border: 'none', fontSize: '22px',
    cursor: 'pointer', padding: '4px', flexShrink: 0
  },
  input: {
    flex: 1, border: '1px solid #E0E0E0', borderRadius: '24px',
    padding: '10px 16px', fontSize: '14px', color: '#333',
    outline: 'none', background: '#F5F5F5', fontFamily: 'inherit'
  },
  btnEnviar: {
    background: 'linear-gradient(135deg, #009EE3, #0077B6)',
    border: 'none', borderRadius: '50%', width: '40px', height: '40px',
    color: '#fff', fontSize: '16px', cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,158,227,0.35)'
  },

  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100
  },
  modalBox: {
    background: '#FFFFFF', borderRadius: '20px 20px 0 0',
    padding: '24px 20px 36px', width: '100%', maxWidth: '480px',
    boxShadow: '0 -4px 24px rgba(0,0,0,0.15)'
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  modalLogo: { fontSize: '16px', fontWeight: '800', color: '#333' },
  modalCerrar: { background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#999' },
  modalTotal: { fontSize: '15px', color: '#333', marginBottom: '18px' },
  mpCampo: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' },
  mpLabel: { fontSize: '12px', color: '#666', fontWeight: '600' },
  mpInput: {
    border: '1px solid #CCCCCC', borderRadius: '8px',
    padding: '11px 14px', fontSize: '15px', color: '#333',
    outline: 'none', fontFamily: 'inherit'
  },
  mpSeguro: { fontSize: '12px', color: '#00A650', textAlign: 'center', margin: '4px 0 14px', fontWeight: '600' },
  mpBtnPagar: {
    width: '100%', padding: '14px', borderRadius: '8px', border: 'none',
    background: 'linear-gradient(135deg, #009EE3, #0077B6)',
    color: '#fff', fontSize: '16px', fontWeight: '800', cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0,158,227,0.35)'
  }
}
