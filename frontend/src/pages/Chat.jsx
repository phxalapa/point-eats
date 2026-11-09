import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { restaurantesService, pedidosService, chatService } from '../services/api'
import axios from 'axios'

import { API_URL as API } from '../services/config'
const hora = () => new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

// ── Burbuja Bot genérica ───────────────────────────────
function BurbujaBot({ children, time }) {
  return (
    <div style={s.rowBot}>
      <div style={s.bubbleBot}>{children}</div>
      <p style={s.ts}>{time || hora()}</p>
    </div>
  )
}

// ── Burbuja Usuario ────────────────────────────────────
function BurbujaUsr({ texto, time }) {
  return (
    <div style={s.rowUsr}>
      <div style={s.bubbleUsr}>{texto}</div>
      <p style={{ ...s.ts, textAlign: 'right' }}>{time || hora()}</p>
    </div>
  )
}

// ── Burbuja Sistema ────────────────────────────────────
function BurubjaSistema({ texto }) {
  return (
    <div style={s.rowCenter}>
      <div style={s.bubbleSistema}>{texto}</div>
    </div>
  )
}

// ── Categorías ─────────────────────────────────────────
function BurbujaCategorias({ categorias, onSelect, titulo }) {
  return (
    <BurbujaBot>
      <p style={s.bubbleTexto}>{titulo || '¿Qué más se te antoja? 😋'}</p>
      <div style={s.categoriasWrap}>
        {categorias.map(cat => (
          <button key={cat} onClick={() => onSelect(cat)} style={s.btnCategoria}>
            {cat}
          </button>
        ))}
      </div>
    </BurbujaBot>
  )
}

// ── Cards de productos ─────────────────────────────────
function BurbujaProductos({ categoria, platillos, carrito, onAgregar, onQuitar, categorias, onVerCategoria }) {
  const cantidad = (id) => carrito.find(i => i.id === id)?.cantidad || 0
  return (
    <div style={s.rowBot}>
      <div style={{ ...s.bubbleBot, padding: '12px', maxWidth: '97%' }}>
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
        {/* Otras categorías debajo de las cards */}
        <div style={s.otrasCats}>
          <p style={s.otrasCatsTitulo}>Ver también:</p>
          <div style={s.categoriasWrap}>
            {categorias.filter(c => c !== categoria).map(cat => (
              <button key={cat} onClick={() => onVerCategoria(cat)} style={s.btnCatSecundaria}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p style={s.ts}>{hora()}</p>
    </div>
  )
}

// ── Promoción imagen ───────────────────────────────────
function BurbujaPromoImagen({ promo, onAgregar }) {
  return (
    <BurbujaBot>
      <div style={s.promoWrap}>
        <img src={promo.media_url} style={s.promoImg} alt={promo.titulo} />
        <div style={s.promoInfo}>
          <p style={s.promoTitulo}>{promo.titulo}</p>
          {promo.descripcion && <p style={s.promoDesc}>{promo.descripcion}</p>}
          {promo.precio_promo && (
            <p style={s.promoPrecio}>🏷️ Precio especial: ${promo.precio_promo.toFixed(2)}</p>
          )}
          {promo.tiene_boton_agregar && (
            <button onClick={() => onAgregar(promo)} style={s.btnPromoAgregar}>
              🛒 Agregar al carrito
            </button>
          )}
        </div>
      </div>
    </BurbujaBot>
  )
}

// ── Promoción video ────────────────────────────────────
function BurbujaPromoVideo({ promo, onAgregar }) {
  const videoRef = useRef(null)
  return (
    <BurbujaBot>
      <div style={s.promoWrap}>
        <video
          ref={videoRef}
          src={promo.media_url}
          style={s.promoVideo}
          controls
          preload="metadata"
          onLoadedMetadata={() => {
            if (videoRef.current && videoRef.current.duration > 30) {
              videoRef.current.currentTime = 0
            }
          }}
          onTimeUpdate={() => {
            if (videoRef.current && videoRef.current.currentTime >= 30) {
              videoRef.current.pause()
              videoRef.current.currentTime = 0
            }
          }}
        />
        <div style={s.promoInfo}>
          <p style={s.promoTitulo}>{promo.titulo}</p>
          {promo.descripcion && <p style={s.promoDesc}>{promo.descripcion}</p>}
          {promo.precio_promo && (
            <p style={s.promoPrecio}>🏷️ ${promo.precio_promo.toFixed(2)}</p>
          )}
          {promo.tiene_boton_agregar && (
            <button onClick={() => onAgregar(promo)} style={s.btnPromoAgregar}>
              🛒 Agregar al carrito
            </button>
          )}
        </div>
      </div>
    </BurbujaBot>
  )
}

// ── Resumen carrito en chat ────────────────────────────
function BurbujaCarrito({ carrito, total, onPagar, onSeguir }) {
  return (
    <BurbujaBot>
      <p style={s.bubbleTexto}>🛒 <strong>Tu pedido</strong></p>
      {carrito.map(i => (
        <div key={i.id} style={s.carritoFila}>
          <span style={s.carritoItem}>{i.cantidad}× {i.nombre}</span>
          <span style={s.carritoPrecio}>${(i.precio * i.cantidad).toFixed(2)}</span>
        </div>
      ))}
      <div style={s.carritoSep} />
      <div style={s.carritoFila}>
        <strong style={{ color: '#333', fontSize: '14px' }}>Total</strong>
        <strong style={{ color: '#009EE3', fontSize: '17px' }}>${total.toFixed(2)}</strong>
      </div>
      <p style={{ ...s.bubbleTexto, marginTop: '14px', fontWeight: '700' }}>¿Cómo quieres pagar?</p>
      <div style={s.pagoOpciones}>
        <button onClick={() => onPagar('transferencia')} style={s.btnPagoTrans}>🏦 Transferencia</button>
        <button onClick={() => onPagar('mercadopago')} style={s.btnPagoMP}>💳 En línea</button>
      </div>
      <button onClick={onSeguir} style={s.btnSeguir}>+ Seguir agregando</button>
    </BurbujaBot>
  )
}

// ── Transferencia bancaria ─────────────────────────────
function BurbujaTransferencia({ datos, total, onConfirmar }) {
  const copiar = (texto, label) => {
    navigator.clipboard.writeText(texto).then(() => alert(`✅ ${label} copiado`))
      .catch(() => {
        const el = document.createElement('textarea')
        el.value = texto; document.body.appendChild(el); el.select()
        document.execCommand('copy'); document.body.removeChild(el)
        alert(`✅ ${label} copiado`)
      })
  }
  return (
    <BurbujaBot>
      <p style={s.transTitle}>📋 Datos de transferencia</p>
      <p style={s.transSubtitle}>{datos.banco_nombre}</p>
      <div style={s.transBloque}>
        <span style={s.transLabel}>A nombre de</span>
        <span style={s.transValor}>{datos.banco_titular}</span>
      </div>
      {[
        { label: 'No. Cuenta', valor: datos.banco_cuenta },
        { label: 'Tarjeta', valor: datos.banco_tarjeta?.replace(/(.{4})/g, '$1 ').trim() },
        { label: 'CLABE', valor: datos.banco_clabe }
      ].map(({ label, valor }) => valor && (
        <div key={label} style={s.transBloqueCopy}>
          <div>
            <span style={s.transLabel}>{label}</span>
            <span style={s.transValor}>{valor}</span>
          </div>
          <button onClick={() => copiar(valor.replace(/\s/g, ''), label)} style={s.btnCopiar}>Copiar</button>
        </div>
      ))}
      <div style={s.transMonto}>
        <span style={s.transLabel}>Monto a transferir</span>
        <span style={s.transTotalNum}>${total.toFixed(2)}</span>
      </div>
      <p style={s.transNota}>Realiza la transferencia y avísanos aquí 📲</p>
      <button onClick={onConfirmar} style={s.btnConfirmarPago}>✅ Ya pagué — avisar al restaurante</button>
    </BurbujaBot>
  )
}

// ── Modal MercadoPago ──────────────────────────────────
function ModalMP({ total, onCerrar, onPagado }) {
  const [num, setNum] = useState('')
  const [venc, setVenc] = useState('')
  const [cvv, setCvv] = useState('')
  const [nombre, setNombre] = useState('')
  const [proc, setProc] = useState(false)

  const fmtTarjeta = v => v.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19)
  const fmtVenc = v => { const c = v.replace(/\D/g, '').slice(0, 4); return c.length > 2 ? c.slice(0, 2) + '/' + c.slice(2) : c }

  const pagar = () => {
    if (!num || !venc || !cvv || !nombre) { alert('Completa todos los campos'); return }
    setProc(true)
    setTimeout(() => { setProc(false); onPagado() }, 2000)
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
          <input style={s.mpInput} placeholder="4152 5236 5214 5123" value={num} onChange={e => setNum(fmtTarjeta(e.target.value))} maxLength={19} />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ ...s.mpCampo, flex: 1 }}>
            <label style={s.mpLabel}>Vencimiento</label>
            <input style={s.mpInput} placeholder="MM/AA" value={venc} onChange={e => setVenc(fmtVenc(e.target.value))} maxLength={5} />
          </div>
          <div style={{ ...s.mpCampo, flex: 1 }}>
            <label style={s.mpLabel}>CVV</label>
            <input style={s.mpInput} placeholder="123" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))} maxLength={3} />
          </div>
        </div>
        <div style={s.mpCampo}>
          <label style={s.mpLabel}>Nombre en la tarjeta</label>
          <input style={s.mpInput} placeholder="Como aparece en tu tarjeta" value={nombre} onChange={e => setNombre(e.target.value)} />
        </div>
        <p style={s.mpSeguro}>🔒 Pago 100% seguro · Encriptado SSL</p>
        <button onClick={pagar} style={s.mpBtnPagar} disabled={proc}>
          {proc ? '⏳ Procesando...' : `Pagar $${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  )
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────
export default function Chat() {
  const { restauranteId } = useParams()
  const navigate = useNavigate()
  const [restaurante, setRestaurante] = useState(null)
  const [menu, setMenu] = useState({})
  const [promociones, setPromociones] = useState([])
  const [burbujas, setBurbujas] = useState([])
  const [mensajesReales, setMensajesReales] = useState([])
  const [texto, setTexto] = useState('')
  const [carrito, setCarrito] = useState([])
  const [pedidoActivo, setPedidoActivo] = useState(null)
  const [mostrarMP, setMostrarMP] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [subiendoMedia, setSubiendoMedia] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const audioInputRef = useRef(null)
  const token = localStorage.getItem('token')
  const usuarioId = parseInt(localStorage.getItem('usuario_id'))

  useEffect(() => {
    Promise.all([
      restaurantesService.menu(restauranteId),
      axios.get(`${API}/promociones/restaurante/${restauranteId}`)
    ]).then(([menuRes, promoRes]) => {
      const rest = menuRes.data.restaurante
      const menuData = menuRes.data.menu
      const promos = promoRes.data

      setRestaurante(rest)
      setMenu(menuData)
      setPromociones(promos)

      const cats = Object.keys(menuData)
      const bienvenida = []

      bienvenida.push({ tipo: 'bienvenida', id: 'bv', nombre: rest.nombre, desc: rest.descripcion })

      // Mostrar promociones activas al inicio
      promos.forEach((p, i) => {
        bienvenida.push({
          tipo: p.tipo === 'video' ? 'promo-video' : 'promo-imagen',
          id: `promo-${i}`,
          promo: p
        })
      })

      bienvenida.push({
        tipo: 'categorias', id: 'cat-inicio',
        categorias: cats,
        titulo: '¿Qué se te antoja hoy? 😋'
      })

      setBurbujas(bienvenida)
    })
  }, [restauranteId])

  // Polling mensajes cada 2 segundos
  useEffect(() => {
    if (!pedidoActivo) return
    const cargar = () => chatService.obtener(pedidoActivo).then(res => setMensajesReales(res.data))
    cargar()
    const iv = setInterval(cargar, 2000)
    return () => clearInterval(iv)
  }, [pedidoActivo])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [burbujas, mensajesReales])

  const cantidad = (id) => carrito.find(i => i.id === id)?.cantidad || 0
  const totalItems = carrito.reduce((s, i) => s + i.cantidad, 0)
  const totalCarrito = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0)

  const agregar = (item) => {
    const platillo = {
      id: item.platillo_id || item.id,
      nombre: item.titulo || item.nombre,
      precio: item.precio_promo || item.precio,
      foto_url: item.media_url || item.foto_url
    }
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

  const seleccionarCategoria = (cat) => {
    setBurbujas(prev => [
      ...prev,
      { tipo: 'msg-usr', id: `u-${Date.now()}`, texto: `📂 ${cat}` },
      { tipo: 'productos', id: `p-${Date.now()}`, categoria: cat, platillos: menu[cat] || [] }
    ])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const verCarrito = () => {
    if (carrito.length === 0) return
    setBurbujas(prev => [
      ...prev,
      { tipo: 'msg-usr', id: `u-carr-${Date.now()}`, texto: '🛒 Ver mi pedido' },
      { tipo: 'carrito', id: `carr-${Date.now()}` }
    ])
  }

  const seguirPidiendo = () => {
    setBurbujas(prev => [
      ...prev,
      { tipo: 'categorias', id: `cat-${Date.now()}`, categorias: Object.keys(menu), titulo: '¿Qué más quieres agregar? 😊' }
    ])
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

  const crearPedido = async () => {
    try {
      const res = await pedidosService.crear({
        restaurante_id: parseInt(restauranteId),
        items: carrito.map(i => ({ platillo_id: i.id, cantidad: i.cantidad }))
      })
      setPedidoActivo(res.data.pedido_id)
      setCarrito([])
      return res.data
    } catch {
      alert('Error al crear el pedido')
      return null
    }
  }

  const confirmarTransferencia = async () => {
    const pedido = await crearPedido()
    if (!pedido) return
    await chatService.enviar(pedido.pedido_id, '💳 Ya realicé la transferencia bancaria. Por favor confirmar pago.')
    setBurbujas(prev => [...prev, {
      tipo: 'sistema', id: `sis-${Date.now()}`,
      texto: '✅ Aviso enviado. El restaurante confirmará tu pago en breve.'
    }])
  }

  const pagoMPExitoso = async () => {
    setMostrarMP(false)
    const pedido = await crearPedido()
    if (!pedido) return
    await chatService.enviar(pedido.pedido_id, '💳 Pago realizado en línea exitosamente.')
    setBurbujas(prev => [...prev, {
      tipo: 'sistema', id: `sis-mp-${Date.now()}`,
      texto: '✅ ¡Pago exitoso! Tu pedido está siendo preparado 👨‍🍳'
    }])
  }

  // Enviar mensaje de texto
  const enviarMensaje = async () => {
    if (!texto.trim() || enviando) return
    const textoEnviar = texto.trim()
    setTexto('')
    setEnviando(true)

    if (!pedidoActivo) {
      setBurbujas(prev => [...prev, {
        tipo: 'msg-usr', id: `u-txt-${Date.now()}`, texto: textoEnviar
      }])
      setEnviando(false)
      return
    }

    try {
      await chatService.enviar(pedidoActivo, textoEnviar)
      const res = await chatService.obtener(pedidoActivo)
      setMensajesReales(res.data)
    } catch { alert('Error al enviar') }
    finally { setEnviando(false); inputRef.current?.focus() }
  }

  // Compartir imagen desde galería
  const compartirImagen = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSubiendoMedia(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('carpeta', 'chat')
      const res = await axios.post(`${API}/media/subir-imagen`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      const url = res.data.url
      // Mostrar imagen en el chat
      setBurbujas(prev => [...prev, {
        tipo: 'img-usr', id: `img-${Date.now()}`, url
      }])
      // Enviar URL como mensaje si hay pedido
      if (pedidoActivo) {
        await chatService.enviar(pedidoActivo, `📷 [Imagen] ${url}`)
      }
    } catch { alert('Error al subir imagen') }
    finally { setSubiendoMedia(false); e.target.value = '' }
  }

  // Compartir audio
  const compartirAudio = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setBurbujas(prev => [...prev, {
      tipo: 'audio-usr', id: `aud-${Date.now()}`, url, nombre: file.name
    }])
    e.target.value = ''
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
            <span style={{ color: restaurante.abierto ? '#90EE90' : '#ffaaaa' }}>
              {restaurante.abierto ? '● Abierto' : '● Cerrado'}
            </span>
            {' · '}⏱ {restaurante.tiempo_entrega_min} min
          </p>
        </div>
      </div>

      {/* ── BARRA CARRITO FIJA ── */}
      {totalItems > 0 && (
        <div style={s.barraCarrito}>
          <div style={s.barraCarritoIzq}>
            <span style={s.barraCarritoBadge}>{totalItems}</span>
            <span style={s.barraCarritoTexto}>
              {carrito.map(i => `${i.cantidad}× ${i.nombre}`).join(', ').slice(0, 30)}
              {carrito.length > 1 ? '...' : ''}
            </span>
          </div>
          <div style={s.barraCarritoDer}>
            <span style={s.barraCarritoTotal}>${totalCarrito.toFixed(2)}</span>
            <button onClick={verCarrito} style={s.btnVerCarrito}>Ver pedido</button>
          </div>
        </div>
      )}

      {/* ── CHAT ── */}
      <div style={s.chat}>
        {burbujas.map(b => {
          if (b.tipo === 'bienvenida') return (
            <BurbujaBot key={b.id}>
              <p style={s.bubbleTexto}>¡Hola! 👋 Bienvenido a <strong>{b.nombre}</strong></p>
              {b.desc && <p style={{ ...s.bubbleTexto, color: '#777', fontSize: '12px', marginTop: '4px' }}>{b.desc}</p>}
            </BurbujaBot>
          )

          if (b.tipo === 'categorias') return (
            <BurbujaCategorias key={b.id} categorias={b.categorias} onSelect={seleccionarCategoria} titulo={b.titulo} />
          )

          if (b.tipo === 'productos') return (
            <BurbujaProductos key={b.id} categoria={b.categoria} platillos={b.platillos}
              carrito={carrito} onAgregar={agregar} onQuitar={quitar}
              categorias={Object.keys(menu)} onVerCategoria={seleccionarCategoria} />
          )

          if (b.tipo === 'promo-imagen') return (
            <BurbujaPromoImagen key={b.id} promo={b.promo} onAgregar={agregar} />
          )

          if (b.tipo === 'promo-video') return (
            <BurbujaPromoVideo key={b.id} promo={b.promo} onAgregar={agregar} />
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
            <BurbujaUsr key={b.id} texto={b.texto} />
          )

          if (b.tipo === 'sistema') return (
            <BurubjaSistema key={b.id} texto={b.texto} />
          )

          if (b.tipo === 'img-usr') return (
            <div key={b.id} style={s.rowUsr}>
              <div style={s.bubbleUsr}>
                <img src={b.url} style={s.imgChat} alt="Imagen compartida" />
              </div>
              <p style={{ ...s.ts, textAlign: 'right' }}>{hora()}</p>
            </div>
          )

          if (b.tipo === 'audio-usr') return (
            <div key={b.id} style={s.rowUsr}>
              <div style={{ ...s.bubbleUsr, padding: '8px 12px' }}>
                <p style={{ margin: '0 0 6px', fontSize: '12px', opacity: 0.8 }}>🎵 Audio</p>
                <audio controls src={b.url} style={{ width: '100%', maxWidth: '220px' }} />
              </div>
              <p style={{ ...s.ts, textAlign: 'right' }}>{hora()}</p>
            </div>
          )

          return null
        })}

        {/* Mensajes reales */}
        {mensajesReales.map(m => (
          <div key={m.id} style={m.es_mio ? s.rowUsr : s.rowBot}>
            <div style={m.es_mio ? s.bubbleUsr : s.bubbleBot}>
              {m.tipo === 'pedido' && '🛒 '}
              {m.tipo === 'estado' && '📢 '}
              {m.contenido}
            </div>
            <p style={{ ...s.ts, textAlign: m.es_mio ? 'right' : 'left' }}>
              {new Date(m.creado_en).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* ── INPUT BAR ── */}
      <div style={s.inputBar}>
        {/* Input oculto imagen */}
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={compartirImagen} />
        {/* Input oculto audio */}
        <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={compartirAudio} />

        <button onClick={() => fileInputRef.current?.click()} style={s.btnMediaInput} title="Imagen" disabled={subiendoMedia}>
          {subiendoMedia ? '⏳' : '📷'}
        </button>
        <button onClick={() => audioInputRef.current?.click()} style={s.btnMediaInput} title="Audio">
          🎵
        </button>
        <button onClick={seguirPidiendo} style={s.btnMediaInput} title="Ver menú">
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

      {/* ── MODAL MP ── */}
      {mostrarMP && (
        <ModalMP total={totalCarrito} onCerrar={() => setMostrarMP(false)} onPagado={pagoMPExitoso} />
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
  spinner: { width: '36px', height: '36px', border: '3px solid #E0E0E0', borderTop: '3px solid #009EE3', borderRadius: '50%' },

  header: {
    background: 'linear-gradient(135deg, #009EE3, #0077B6)',
    padding: '12px 14px', display: 'flex', alignItems: 'center',
    gap: '10px', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,119,182,0.3)'
  },
  btnVolver: { background: 'none', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer', padding: '0 4px', lineHeight: 1 },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', border: '2px solid rgba(255,255,255,0.35)' },
  online: { position: 'absolute', bottom: '1px', right: '1px', width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #0077B6' },
  headerInfo: { flex: 1, minWidth: 0 },
  headerNombre: { color: '#fff', fontSize: '15px', fontWeight: '700', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: '11px', margin: 0 },

  // Barra carrito fija
  barraCarrito: {
    background: '#FFFFFF', borderBottom: '2px solid #009EE3',
    padding: '8px 14px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '8px', flexShrink: 0,
    boxShadow: '0 2px 6px rgba(0,158,227,0.15)'
  },
  barraCarritoIzq: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 },
  barraCarritoBadge: { background: '#009EE3', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0 },
  barraCarritoTexto: { fontSize: '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  barraCarritoDer: { display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 },
  barraCarritoTotal: { fontSize: '15px', fontWeight: '800', color: '#009EE3' },
  btnVerCarrito: { background: '#009EE3', border: 'none', borderRadius: '6px', padding: '6px 12px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },

  chat: { flex: 1, overflowY: 'auto', padding: '12px 10px 16px', display: 'flex', flexDirection: 'column', gap: '6px' },

  rowBot: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '100%' },
  rowUsr: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  rowCenter: { display: 'flex', justifyContent: 'center' },

  bubbleBot: { background: '#FFFFFF', borderRadius: '18px', borderTopLeftRadius: '4px', padding: '10px 14px', maxWidth: '88%', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  bubbleUsr: { background: 'linear-gradient(135deg, #009EE3, #0077B6)', color: '#fff', borderRadius: '18px', borderTopRightRadius: '4px', padding: '10px 14px', maxWidth: '82%', fontSize: '14px', lineHeight: '1.5', boxShadow: '0 2px 8px rgba(0,158,227,0.25)' },
  bubbleSistema: { background: '#F0FFF7', border: '1px solid #00A650', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', color: '#00A650', fontWeight: '600', textAlign: 'center', margin: '4px 0' },
  bubbleTexto: { fontSize: '14px', color: '#333', margin: 0, lineHeight: '1.5' },
  ts: { fontSize: '10px', color: '#bbb', margin: '2px 4px 4px' },

  categoriasWrap: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' },
  btnCategoria: { background: 'linear-gradient(135deg, #009EE3, #0077B6)', border: 'none', borderRadius: '20px', padding: '7px 14px', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,158,227,0.3)' },

  otrasCats: { marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #E0E0E0' },
  otrasCatsTitulo: { fontSize: '11px', color: '#999', margin: '0 0 6px', fontWeight: '600' },
  btnCatSecundaria: { background: '#F0F8FF', border: '1px solid #009EE3', borderRadius: '16px', padding: '5px 12px', color: '#009EE3', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },

  catTitulo: { fontSize: '12px', fontWeight: '800', color: '#009EE3', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  cardsGrid: { display: 'flex', gap: '7px', flexWrap: 'wrap' },
  card: { width: 'calc(33.33% - 5px)', minWidth: '88px', borderRadius: '12px', overflow: 'hidden', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', border: '1px solid rgba(0,158,227,0.1)', display: 'flex', flexDirection: 'column', position: 'relative' },
  cardBadge: { position: 'absolute', top: '4px', left: '4px', background: '#009EE3', color: '#fff', fontSize: '8px', fontWeight: '900', padding: '2px 5px', borderRadius: '4px', zIndex: 2 },
  cardImgWrap: { width: '100%', height: '65px', background: 'linear-gradient(135deg, #E8F7FF, #C5E8F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardEmoji: { fontSize: '26px' },
  cardBody: { padding: '6px', display: 'flex', flexDirection: 'column', gap: '1px', flex: 1 },
  cardNombre: { fontSize: '10px', fontWeight: '800', color: '#222', margin: 0, lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardDesc: { fontSize: '9px', color: '#aaa', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardPrecio: { fontSize: '12px', fontWeight: '900', color: '#009EE3', margin: '2px 0 0' },
  cardAction: { marginTop: '4px' },
  btnAgregar: { width: '100%', padding: '5px 0', borderRadius: '7px', border: 'none', background: '#009EE3', color: '#fff', fontSize: '10px', fontWeight: '800', cursor: 'pointer' },
  qtyCtrl: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#E8F7FF', borderRadius: '7px', border: '1px solid rgba(0,158,227,0.3)' },
  qtyBtn: { width: '24px', height: '22px', border: 'none', background: 'transparent', fontSize: '14px', fontWeight: '900', color: '#009EE3', cursor: 'pointer' },
  qtyNum: { fontSize: '11px', fontWeight: '900', color: '#0077B6', minWidth: '14px', textAlign: 'center' },

  // Promociones
  promoWrap: { display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px', maxWidth: '260px' },
  promoImg: { width: '100%', borderRadius: '10px', objectFit: 'cover', maxHeight: '180px' },
  promoVideo: { width: '100%', borderRadius: '10px', maxHeight: '180px' },
  promoInfo: { padding: '4px 0' },
  promoTitulo: { fontSize: '14px', fontWeight: '800', color: '#333', margin: '0 0 2px' },
  promoDesc: { fontSize: '12px', color: '#666', margin: '0 0 4px' },
  promoPrecio: { fontSize: '13px', fontWeight: '800', color: '#009EE3', margin: '0 0 8px' },
  btnPromoAgregar: { width: '100%', padding: '9px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #009EE3, #0077B6)', color: '#fff', fontSize: '13px', fontWeight: '800', cursor: 'pointer' },

  // Carrito
  carritoFila: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F5F5F5' },
  carritoItem: { fontSize: '13px', color: '#333' },
  carritoPrecio: { fontSize: '13px', color: '#009EE3', fontWeight: '700' },
  carritoSep: { borderTop: '2px dashed #E0E0E0', margin: '8px 0' },
  pagoOpciones: { display: 'flex', gap: '8px', marginTop: '10px' },
  btnPagoTrans: { flex: 1, padding: '10px 6px', borderRadius: '8px', border: '2px solid #009EE3', background: '#fff', color: '#009EE3', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  btnPagoMP: { flex: 1, padding: '10px 6px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #009EE3, #0077B6)', color: '#fff', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  btnSeguir: { width: '100%', marginTop: '8px', padding: '8px', borderRadius: '8px', border: '1px dashed #ccc', background: 'transparent', color: '#aaa', fontSize: '12px', cursor: 'pointer' },

  // Transferencia
  transTitle: { fontSize: '15px', fontWeight: '800', color: '#333', margin: '0 0 2px' },
  transSubtitle: { fontSize: '13px', color: '#009EE3', fontWeight: '700', margin: '0 0 10px' },
  transBloque: { padding: '7px 0', borderBottom: '1px solid #F5F5F5' },
  transBloqueCopy: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #F5F5F5' },
  transLabel: { fontSize: '10px', color: '#999', display: 'block', marginBottom: '1px' },
  transValor: { fontSize: '13px', color: '#333', fontWeight: '700', display: 'block', fontFamily: 'monospace' },
  btnCopiar: { background: '#E8F7FF', border: '1px solid #009EE3', borderRadius: '6px', padding: '5px 10px', color: '#009EE3', fontSize: '11px', fontWeight: '700', cursor: 'pointer', flexShrink: 0 },
  transMonto: { background: '#E8F7FF', borderRadius: '8px', padding: '10px 12px', margin: '12px 0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  transTotalNum: { fontSize: '20px', fontWeight: '900', color: '#009EE3' },
  transNota: { fontSize: '12px', color: '#666', lineHeight: '1.5', margin: '0 0 10px' },
  btnConfirmarPago: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#00A650', color: '#fff', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },

  // Media en chat
  imgChat: { width: '100%', maxWidth: '220px', borderRadius: '10px', objectFit: 'cover' },

  // Input bar
  inputBar: { background: '#FFFFFF', borderTop: '1px solid #E0E0E0', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, boxShadow: '0 -2px 8px rgba(0,0,0,0.05)' },
  btnMediaInput: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '4px', flexShrink: 0 },
  input: { flex: 1, border: '1px solid #E0E0E0', borderRadius: '24px', padding: '10px 14px', fontSize: '14px', color: '#333', outline: 'none', background: '#F5F5F5', fontFamily: 'inherit' },
  btnEnviar: { background: 'linear-gradient(135deg, #009EE3, #0077B6)', border: 'none', borderRadius: '50%', width: '38px', height: '38px', color: '#fff', fontSize: '16px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,158,227,0.35)' },

  // Modal
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 },
  modalBox: { background: '#FFFFFF', borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', width: '100%', maxWidth: '480px', boxShadow: '0 -4px 24px rgba(0,0,0,0.15)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  modalLogo: { fontSize: '16px', fontWeight: '800', color: '#333' },
  modalCerrar: { background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#999' },
  modalTotal: { fontSize: '15px', color: '#333', marginBottom: '18px' },
  mpCampo: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' },
  mpLabel: { fontSize: '12px', color: '#666', fontWeight: '600' },
  mpInput: { border: '1px solid #CCCCCC', borderRadius: '8px', padding: '11px 14px', fontSize: '15px', color: '#333', outline: 'none', fontFamily: 'inherit' },
  mpSeguro: { fontSize: '12px', color: '#00A650', textAlign: 'center', margin: '4px 0 14px', fontWeight: '600' },
  mpBtnPagar: { width: '100%', padding: '14px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #009EE3, #0077B6)', color: '#fff', fontSize: '16px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,158,227,0.35)' }
}
