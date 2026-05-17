import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavInferior } from './Panel'
import axios from 'axios'

const API = 'http://127.0.0.1:8000'

function Modal({ titulo, onCerrar, children }) {
  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <p style={s.modalTitulo}>{titulo}</p>
          <button onClick={onCerrar} style={s.modalCerrar}>✕</button>
        </div>
        <div style={s.modalBody}>{children}</div>
      </div>
    </div>
  )
}

function CampoEditable({ icono, label, valor, placeholder, onEditar }) {
  return (
    <div style={s.campo} onClick={onEditar}>
      <div style={s.campoIzq}>
        <span style={s.campoIcono}>{icono}</span>
        <div>
          <p style={s.campoLabel}>{label}</p>
          <p style={s.campoValor}>{valor || <span style={s.campoVacio}>{placeholder}</span>}</p>
        </div>
      </div>
      <span style={s.campoFlecha}>›</span>
    </div>
  )
}

export default function PanelPerfil() {
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [subiendoPortada, setSubiendoPortada] = useState(false)
  const fotoRef = useRef(null)
  const portadaRef = useRef(null)
  const token = localStorage.getItem('token')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try {
      const res = await axios.get(`${API}/restaurantes/mi-perfil/info`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPerfil(res.data)
    } catch { alert('Error al cargar perfil') }
  }

  const abrirModal = (seccion, camposIniciales) => {
    setForm(camposIniciales)
    setModal(seccion)
  }

  const cerrarModal = () => { setModal(null); setForm({}) }

  const guardar = async (endpoint, datos) => {
    setGuardando(true)
    try {
      await axios.patch(`${API}${endpoint}`, datos, {
        headers: { Authorization: `Bearer ${token}` }
      })
      await cargar()
      cerrarModal()
    } catch { alert('Error al guardar') }
    finally { setGuardando(false) }
  }

  const subirFoto = async (e, tipo) => {
    const file = e.target.files[0]
    if (!file) return
    if (tipo === 'perfil') setSubiendoFoto(true)
    else setSubiendoPortada(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tipo', tipo)
      await axios.post(`${API}/restaurantes/mi-perfil/foto?tipo=${tipo}`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      await cargar()
    } catch { alert('Error al subir foto. Verifica que sea JPG, PNG o WEBP de máximo 5MB') }
    finally {
      if (tipo === 'perfil') setSubiendoFoto(false)
      else setSubiendoPortada(false)
      e.target.value = ''
    }
  }

  if (!perfil) return (
    <div style={s.cargando}>
      <p style={{ color: '#009EE3', fontFamily: 'Nunito,sans-serif' }}>Cargando perfil...</p>
    </div>
  )

  return (
    <div style={s.contenedor}>

      {/* ── PORTADA ── */}
      <div style={s.portadaWrap}>
        {perfil.portada_url
          ? <img src={perfil.portada_url} style={s.portadaImg} alt="portada" />
          : <div style={s.portadaVacia} />
        }
        <div style={s.portadaOverlay} />

        <input ref={portadaRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => subirFoto(e, 'portada')} />
        <button onClick={() => portadaRef.current?.click()} style={s.btnCambiarPortada} disabled={subiendoPortada}>
          {subiendoPortada ? '⏳ Subiendo...' : '📷 Cambiar portada'}
        </button>

        {/* ── FOTO DE PERFIL ── */}
        <input ref={fotoRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => subirFoto(e, 'perfil')} />
        <div style={s.avatarWrap}>
          <button
            onClick={() => fotoRef.current?.click()}
            disabled={subiendoFoto}
            style={s.avatarBoton}
          >
            {perfil.foto_url
              ? <img src={perfil.foto_url} style={s.avatarImg} alt="foto perfil" />
              : <span style={s.avatarEmoji}>🍽️</span>
            }
            <div style={s.avatarBadge}>
              {subiendoFoto ? '⏳' : '📷'}
            </div>
          </button>
          <p style={s.avatarHint}>
            {subiendoFoto ? 'Subiendo...' : 'Toca para cambiar'}
          </p>
        </div>
      </div>

      {/* ── NOMBRE VISIBLE ── */}
      <div style={s.nombreSection}>
        <p style={s.nombreGrande}>{perfil.nombre}</p>
        <p style={s.categoriaTag}>{perfil.categoria || 'Sin categoría'}</p>
        <p style={s.ciudadTag}>📍 {perfil.ciudad || 'Sin ciudad'}</p>
      </div>

      {/* ── IDENTIDAD ── */}
      <div style={s.seccion}>
        <p style={s.seccionTitulo}>🏪 Identidad</p>
        <CampoEditable icono="✏️" label="Nombre del restaurante" valor={perfil.nombre}
          placeholder="Escribe el nombre"
          onEditar={() => abrirModal('nombre', { nombre: perfil.nombre || '' })} />
        <CampoEditable icono="📝" label="Descripción / reseña" valor={perfil.descripcion}
          placeholder="Ej: Los mejores tacos de la ciudad"
          onEditar={() => abrirModal('descripcion', { descripcion: perfil.descripcion || '' })} />
        <CampoEditable icono="🍽️" label="Categoría" valor={perfil.categoria}
          placeholder="Ej: Tacos, Pizza, Sushi..."
          onEditar={() => abrirModal('categoria', { categoria: perfil.categoria || '' })} />
      </div>

      {/* ── UBICACIÓN ── */}
      <div style={s.seccion}>
        <p style={s.seccionTitulo}>📍 Ubicación y contacto</p>
        <CampoEditable icono="🏠" label="Dirección" valor={perfil.direccion}
          placeholder="Calle, número, colonia"
          onEditar={() => abrirModal('direccion', { direccion: perfil.direccion || '', ciudad: perfil.ciudad || '' })} />
        <CampoEditable icono="🗺️" label="Link de Google Maps"
          valor={perfil.maps_url ? '✅ Link configurado — toca para editar' : null}
          placeholder="Pega el link de Google Maps"
          onEditar={() => abrirModal('maps', { maps_url: perfil.maps_url || '' })} />
        <CampoEditable icono="📞" label="Teléfono" valor={perfil.telefono}
          placeholder="Número de contacto"
          onEditar={() => abrirModal('telefono', { telefono: perfil.telefono || '' })} />
      </div>

      {/* ── OPERACIÓN ── */}
      <div style={s.seccion}>
        <p style={s.seccionTitulo}>⏰ Operación</p>
        <CampoEditable icono="🕐" label="Horario"
          valor={perfil.horario_apertura && perfil.horario_cierre ? `${perfil.horario_apertura} — ${perfil.horario_cierre}` : null}
          placeholder="Define tu horario"
          onEditar={() => abrirModal('horario', { horario_apertura: perfil.horario_apertura || '09:00', horario_cierre: perfil.horario_cierre || '22:00' })} />
        <CampoEditable icono="🛵" label="Tiempo de entrega"
          valor={perfil.tiempo_entrega_min ? `${perfil.tiempo_entrega_min} minutos` : null}
          placeholder="Minutos estimados"
          onEditar={() => abrirModal('entrega', { tiempo_entrega_min: perfil.tiempo_entrega_min || 30, pedido_minimo: perfil.pedido_minimo || 0 })} />
        <CampoEditable icono="💰" label="Pedido mínimo"
          valor={perfil.pedido_minimo ? `$${Number(perfil.pedido_minimo).toFixed(2)}` : null}
          placeholder="Monto mínimo de pedido"
          onEditar={() => abrirModal('entrega', { tiempo_entrega_min: perfil.tiempo_entrega_min || 30, pedido_minimo: perfil.pedido_minimo || 0 })} />
      </div>

      {/* ── PAGOS ── */}
      <div style={s.seccion}>
        <p style={s.seccionTitulo}>🏦 Datos bancarios</p>
        <CampoEditable icono="🏦" label="Banco" valor={perfil.banco_nombre}
          placeholder="Nombre del banco"
          onEditar={() => abrirModal('banco', {
            banco_nombre: perfil.banco_nombre || '',
            banco_titular: perfil.banco_titular || '',
            banco_cuenta: perfil.banco_cuenta || '',
            banco_tarjeta: perfil.banco_tarjeta || '',
            banco_clabe: perfil.banco_clabe || ''
          })} />
        <CampoEditable icono="💳" label="Tarjeta"
          valor={perfil.banco_tarjeta ? `•••• •••• •••• ${perfil.banco_tarjeta.slice(-4)}` : null}
          placeholder="Número de tarjeta"
          onEditar={() => abrirModal('banco', {
            banco_nombre: perfil.banco_nombre || '',
            banco_titular: perfil.banco_titular || '',
            banco_cuenta: perfil.banco_cuenta || '',
            banco_tarjeta: perfil.banco_tarjeta || '',
            banco_clabe: perfil.banco_clabe || ''
          })} />
      </div>

      {/* ── MODALES ── */}

      {modal === 'nombre' && (
        <Modal titulo="Nombre del restaurante" onCerrar={cerrarModal}>
          <input style={s.input} placeholder="Nombre del restaurante"
            value={form.nombre || ''}
            onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
          <button style={s.btnGuardar} disabled={guardando}
            onClick={() => guardar('/restaurantes/mi-perfil', { nombre: form.nombre })}>
            {guardando ? '⏳ Guardando...' : '✅ Guardar'}
          </button>
        </Modal>
      )}

      {modal === 'descripcion' && (
        <Modal titulo="Descripción del restaurante" onCerrar={cerrarModal}>
          <textarea style={{ ...s.input, height: '100px', resize: 'vertical' }}
            placeholder="Describe tu restaurante..."
            value={form.descripcion || ''}
            onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} />
          <button style={s.btnGuardar} disabled={guardando}
            onClick={() => guardar('/restaurantes/mi-perfil', { descripcion: form.descripcion })}>
            {guardando ? '⏳ Guardando...' : '✅ Guardar'}
          </button>
        </Modal>
      )}

      {modal === 'categoria' && (
        <Modal titulo="Categoría del restaurante" onCerrar={cerrarModal}>
          <div style={s.categoriasGrid}>
            {['Tacos', 'Pizza', 'Hamburguesas', 'Sushi', 'Mariscos', 'Pollo',
              'Vegetariano', 'Postres', 'Bebidas', 'Desayunos', 'Comida corrida', 'Otro'].map(cat => (
              <button key={cat}
                onClick={() => setForm(p => ({ ...p, categoria: cat }))}
                style={{
                  ...s.catBtn,
                  background: form.categoria === cat ? '#009EE3' : '#F5F5F5',
                  color: form.categoria === cat ? '#fff' : '#333'
                }}>
                {cat}
              </button>
            ))}
          </div>
          <button style={s.btnGuardar} disabled={guardando}
            onClick={() => guardar('/restaurantes/mi-perfil', { categoria: form.categoria })}>
            {guardando ? '⏳ Guardando...' : '✅ Guardar'}
          </button>
        </Modal>
      )}

      {modal === 'direccion' && (
        <Modal titulo="Ubicación del restaurante" onCerrar={cerrarModal}>
          <label style={s.inputLabel}>Dirección completa</label>
          <input style={s.input} placeholder="Calle, número, colonia"
            value={form.direccion || ''}
            onChange={e => setForm(p => ({ ...p, direccion: e.target.value }))} />
          <label style={s.inputLabel}>Ciudad</label>
          <input style={s.input} placeholder="Ciudad"
            value={form.ciudad || ''}
            onChange={e => setForm(p => ({ ...p, ciudad: e.target.value }))} />
          <button style={s.btnGuardar} disabled={guardando}
            onClick={() => guardar('/restaurantes/mi-perfil', { direccion: form.direccion, ciudad: form.ciudad })}>
            {guardando ? '⏳ Guardando...' : '✅ Guardar'}
          </button>
        </Modal>
      )}

      {modal === 'maps' && (
        <Modal titulo="Link de Google Maps" onCerrar={cerrarModal}>
          <p style={s.modalDesc}>
            1. Abre Google Maps en tu teléfono{'\n'}
            2. Busca tu restaurante{'\n'}
            3. Toca "Compartir" y copia el link
          </p>
          <label style={s.inputLabel}>Link de Google Maps</label>
          <input style={s.input} placeholder="https://maps.google.com/..."
            value={form.maps_url || ''}
            onChange={e => setForm(p => ({ ...p, maps_url: e.target.value }))} />
          {form.maps_url && (
            <a href={form.maps_url} target="_blank" rel="noreferrer" style={s.linkMaps}>
              🗺️ Verificar link en el mapa
            </a>
          )}
          <button style={s.btnGuardar} disabled={guardando}
            onClick={() => guardar('/restaurantes/mi-perfil', { maps_url: form.maps_url })}>
            {guardando ? '⏳ Guardando...' : '✅ Guardar'}
          </button>
        </Modal>
      )}

      {modal === 'telefono' && (
        <Modal titulo="Teléfono de contacto" onCerrar={cerrarModal}>
          <label style={s.inputLabel}>Número de teléfono</label>
          <input style={s.input} placeholder="10 dígitos" type="tel"
            value={form.telefono || ''}
            onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} />
          <button style={s.btnGuardar} disabled={guardando}
            onClick={() => guardar('/restaurantes/mi-perfil', { telefono: form.telefono })}>
            {guardando ? '⏳ Guardando...' : '✅ Guardar'}
          </button>
        </Modal>
      )}

      {modal === 'horario' && (
        <Modal titulo="Horario de atención" onCerrar={cerrarModal}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={s.inputLabel}>Hora de apertura</label>
              <input style={s.input} type="time"
                value={form.horario_apertura || '09:00'}
                onChange={e => setForm(p => ({ ...p, horario_apertura: e.target.value }))} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.inputLabel}>Hora de cierre</label>
              <input style={s.input} type="time"
                value={form.horario_cierre || '22:00'}
                onChange={e => setForm(p => ({ ...p, horario_cierre: e.target.value }))} />
            </div>
          </div>
          <button style={s.btnGuardar} disabled={guardando}
            onClick={() => guardar('/restaurantes/mi-perfil', {
              horario_apertura: form.horario_apertura,
              horario_cierre: form.horario_cierre
            })}>
            {guardando ? '⏳ Guardando...' : '✅ Guardar'}
          </button>
        </Modal>
      )}

      {modal === 'entrega' && (
        <Modal titulo="Entrega y pedido mínimo" onCerrar={cerrarModal}>
          <label style={s.inputLabel}>Tiempo estimado de entrega (minutos)</label>
          <input style={s.input} type="number" placeholder="30"
            value={form.tiempo_entrega_min || ''}
            onChange={e => setForm(p => ({ ...p, tiempo_entrega_min: parseInt(e.target.value) }))} />
          <label style={s.inputLabel}>Pedido mínimo ($)</label>
          <input style={s.input} type="number" placeholder="0.00" step="0.01"
            value={form.pedido_minimo || ''}
            onChange={e => setForm(p => ({ ...p, pedido_minimo: parseFloat(e.target.value) }))} />
          <button style={s.btnGuardar} disabled={guardando}
            onClick={() => guardar('/restaurantes/mi-perfil', {
              tiempo_entrega_min: form.tiempo_entrega_min,
              pedido_minimo: form.pedido_minimo
            })}>
            {guardando ? '⏳ Guardando...' : '✅ Guardar'}
          </button>
        </Modal>
      )}

      {modal === 'banco' && (
        <Modal titulo="Datos bancarios" onCerrar={cerrarModal}>
          {[
            { key: 'banco_nombre', label: 'Banco', placeholder: 'BBVA, Banamex, HSBC...' },
            { key: 'banco_titular', label: 'Titular de la cuenta', placeholder: 'Nombre completo' },
            { key: 'banco_cuenta', label: 'Número de cuenta', placeholder: '10 dígitos' },
            { key: 'banco_tarjeta', label: 'Número de tarjeta', placeholder: '16 dígitos' },
            { key: 'banco_clabe', label: 'CLABE interbancaria', placeholder: '18 dígitos' },
          ].map(campo => (
            <div key={campo.key}>
              <label style={s.inputLabel}>{campo.label}</label>
              <input style={s.input} placeholder={campo.placeholder}
                value={form[campo.key] || ''}
                onChange={e => setForm(p => ({ ...p, [campo.key]: e.target.value }))} />
            </div>
          ))}
          <button style={s.btnGuardar} disabled={guardando}
            onClick={() => guardar('/restaurantes/mi-perfil/datos-bancarios', {
              banco_nombre: form.banco_nombre,
              banco_titular: form.banco_titular,
              banco_cuenta: form.banco_cuenta,
              banco_tarjeta: form.banco_tarjeta,
              banco_clabe: form.banco_clabe
            })}>
            {guardando ? '⏳ Guardando...' : '✅ Guardar datos bancarios'}
          </button>
        </Modal>
      )}

      <NavInferior activo="perfil" />
    </div>
  )
}

const s = {
  contenedor: {
    background: '#F5F5F5', minHeight: '100vh', maxWidth: '480px',
    margin: '0 auto', fontFamily: "'Nunito',sans-serif", paddingBottom: '80px'
  },
  cargando: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' },

  // Portada
  portadaWrap: { position: 'relative', height: '180px', overflow: 'visible' },
  portadaImg: { width: '100%', height: '180px', objectFit: 'cover' },
  portadaVacia: { width: '100%', height: '180px', background: 'linear-gradient(135deg, #009EE3, #0077B6)' },
  portadaOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: '180px', background: 'rgba(0,0,0,0.2)' },
  btnCambiarPortada: {
    position: 'absolute', top: '12px', right: '12px',
    background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '8px',
    color: '#fff', padding: '7px 12px', fontSize: '12px', fontWeight: '700',
    cursor: 'pointer', zIndex: 2
  },

  // Avatar de perfil
  avatarWrap: {
    position: 'absolute', bottom: '-50px', left: '20px', zIndex: 3,
    display: 'flex', flexDirection: 'column', alignItems: 'center'
  },
  avatarBoton: {
    width: '92px', height: '92px', borderRadius: '50%',
    border: '4px solid #fff', background: '#E8F7FF',
    overflow: 'hidden', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', position: 'relative',
    padding: 0, boxShadow: '0 3px 12px rgba(0,0,0,0.25)'
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' },
  avatarEmoji: { fontSize: '38px' },
  avatarBadge: {
    position: 'absolute', bottom: '2px', right: '2px',
    background: '#009EE3', border: '3px solid #fff',
    borderRadius: '50%', width: '30px', height: '30px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
  },
  avatarHint: {
    fontSize: '10px', color: '#fff', fontWeight: '700',
    marginTop: '4px', textShadow: '0 1px 3px rgba(0,0,0,0.5)',
    textAlign: 'center'
  },

  // Nombre
  nombreSection: {
    paddingTop: '58px', paddingLeft: '20px', paddingBottom: '16px',
    paddingRight: '20px', background: '#fff', borderBottom: '1px solid #F0F0F0'
  },
  nombreGrande: { fontSize: '22px', fontWeight: '900', color: '#333', margin: '0 0 2px' },
  categoriaTag: { fontSize: '13px', color: '#009EE3', fontWeight: '700', margin: '0 0 2px' },
  ciudadTag: { fontSize: '13px', color: '#999', margin: 0 },

  // Secciones
  seccion: { background: '#fff', margin: '10px 0 0', borderTop: '1px solid #F0F0F0' },
  seccionTitulo: {
    fontSize: '12px', fontWeight: '800', color: '#009EE3',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    padding: '14px 16px 8px', margin: 0, borderBottom: '1px solid #F5F5F5'
  },

  // Campos
  campo: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', borderBottom: '1px solid #F5F5F5', cursor: 'pointer'
  },
  campoIzq: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1 },
  campoIcono: { fontSize: '20px', width: '28px', textAlign: 'center', flexShrink: 0 },
  campoLabel: { fontSize: '11px', color: '#999', fontWeight: '600', margin: '0 0 2px' },
  campoValor: { fontSize: '14px', color: '#333', fontWeight: '600', margin: 0 },
  campoVacio: { color: '#CCC', fontWeight: '400', fontSize: '13px' },
  campoFlecha: { color: '#CCC', fontSize: '22px', flexShrink: 0 },

  // Modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100
  },
  modal: {
    background: '#fff', borderRadius: '20px 20px 0 0',
    width: '100%', maxWidth: '480px', maxHeight: '85vh', overflow: 'auto'
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '18px 20px 14px', borderBottom: '1px solid #F0F0F0',
    position: 'sticky', top: 0, background: '#fff', zIndex: 1
  },
  modalTitulo: { fontSize: '17px', fontWeight: '800', color: '#333', margin: 0 },
  modalCerrar: { background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#999' },
  modalBody: { padding: '16px 20px 32px', display: 'flex', flexDirection: 'column', gap: '10px' },
  modalDesc: {
    fontSize: '13px', color: '#666', margin: 0,
    lineHeight: '1.8', whiteSpace: 'pre-line',
    background: '#F5F5F5', borderRadius: '8px', padding: '10px 12px'
  },

  // Inputs
  input: {
    width: '100%', border: '1px solid #E0E0E0', borderRadius: '10px',
    padding: '13px 14px', fontSize: '15px', color: '#333',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    background: '#FAFAFA'
  },
  inputLabel: { fontSize: '12px', fontWeight: '700', color: '#666', display: 'block', marginBottom: '4px' },
  btnGuardar: {
    width: '100%', background: 'linear-gradient(135deg, #009EE3, #0077B6)',
    border: 'none', borderRadius: '10px', padding: '14px',
    color: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer', marginTop: '4px'
  },

  // Categorías
  categoriasGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  catBtn: { border: 'none', borderRadius: '20px', padding: '8px 14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },

  // Maps
  linkMaps: {
    color: '#009EE3', fontSize: '14px', fontWeight: '600',
    textDecoration: 'none', display: 'block', textAlign: 'center', padding: '8px 0'
  },
}