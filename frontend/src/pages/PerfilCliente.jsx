import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = 'http://127.0.0.1:8000'

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

export default function PerfilCliente() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState(null)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const fotoRef = useRef(null)
  const token = localStorage.getItem('token')
  const usuarioId = localStorage.getItem('usuario_id')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try {
      const res = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsuario(res.data)
    } catch { alert('Error al cargar perfil') }
  }

  const abrirModal = (seccion, datos) => {
    setForm(datos)
    setModal(seccion)
  }

  const cerrarModal = () => { setModal(null); setForm({}) }

  const guardar = async (datos) => {
    setGuardando(true)
    try {
      await axios.patch(`${API}/auth/perfil`, datos, {
        headers: { Authorization: `Bearer ${token}` }
      })
      localStorage.setItem('nombre', datos.nombre || usuario.nombre)
      await cargar()
      cerrarModal()
    } catch { alert('Error al guardar') }
    finally { setGuardando(false) }
  }

  const subirFoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSubiendoFoto(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('carpeta', 'clientes')
      const res = await axios.post(`${API}/media/subir-imagen`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      await axios.patch(`${API}/auth/perfil`, { foto_url: res.data.url }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      await cargar()
    } catch { alert('Error al subir foto') }
    finally { setSubiendoFoto(false); e.target.value = '' }
  }

  const cerrarSesion = () => {
    localStorage.clear()
    navigate('/login')
  }

  if (!usuario) return (
    <div style={s.cargando}>
      <p style={{ color: '#009EE3', fontFamily: 'Nunito,sans-serif' }}>Cargando...</p>
    </div>
  )

  return (
    <div style={s.contenedor}>

      {/* Header */}
      <div style={s.header}>
        <button onClick={() => navigate('/contactos')} style={s.btnVolver}>‹</button>
        <p style={s.headerTitulo}>Mi perfil</p>
        <button onClick={cerrarSesion} style={s.btnSalir}>Salir</button>
      </div>

      {/* Avatar */}
      <div style={s.avatarSection}>
        <input ref={fotoRef} type="file" accept="image/*"
          style={{ display: 'none' }} onChange={subirFoto} />
        <button onClick={() => fotoRef.current?.click()}
          style={s.avatarBtn} disabled={subiendoFoto}>
          {usuario.foto_url
            ? <img src={usuario.foto_url} style={s.avatarImg} alt="foto" />
            : <span style={s.avatarLetra}>{usuario.nombre?.charAt(0).toUpperCase()}</span>
          }
          <div style={s.avatarBadge}>
            {subiendoFoto ? '⏳' : '📷'}
          </div>
        </button>
        <p style={s.avatarNombre}>{usuario.nombre}</p>
        <p style={s.avatarEmail}>{usuario.email}</p>
        <p style={s.avatarHint}>Toca la foto para cambiarla</p>
      </div>

      {/* Datos personales */}
      <div style={s.seccion}>
        <p style={s.seccionTitulo}>👤 Datos personales</p>
        <CampoEditable icono="✏️" label="Nombre completo" valor={usuario.nombre}
          placeholder="Tu nombre completo"
          onEditar={() => abrirModal('nombre', { nombre: usuario.nombre || '' })} />
        <CampoEditable icono="📱" label="Número de celular" valor={usuario.telefono}
          placeholder="10 dígitos"
          onEditar={() => abrirModal('telefono', { telefono: usuario.telefono || '' })} />
      </div>

      {/* Dirección */}
      <div style={s.seccion}>
        <p style={s.seccionTitulo}>📍 Mi dirección</p>
        <CampoEditable icono="🏠" label="Dirección de entrega"
          valor={usuario.direccion}
          placeholder="Calle, número, colonia, ciudad"
          onEditar={() => abrirModal('direccion', { direccion: usuario.direccion || '' })} />
      </div>

      {/* Accesos rápidos */}
      <div style={s.seccion}>
        <p style={s.seccionTitulo}>📋 Mi actividad</p>
        <div style={s.campo} onClick={() => navigate('/historial')}>
          <div style={s.campoIzq}>
            <span style={s.campoIcono}>🧾</span>
            <div>
              <p style={s.campoLabel}>Historial de pedidos</p>
              <p style={s.campoValor}>Ver todos mis pedidos</p>
            </div>
          </div>
          <span style={s.campoFlecha}>›</span>
        </div>
      </div>

      {/* Modales */}
      {modal === 'nombre' && (
        <Modal titulo="Nombre completo" onCerrar={cerrarModal}>
          <label style={s.inputLabel}>Nombre completo</label>
          <input style={s.input} placeholder="Tu nombre completo"
            value={form.nombre || ''}
            onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
          <button style={s.btnGuardar} disabled={guardando}
            onClick={() => guardar({ nombre: form.nombre })}>
            {guardando ? '⏳ Guardando...' : '✅ Guardar'}
          </button>
        </Modal>
      )}

      {modal === 'telefono' && (
        <Modal titulo="Número de celular" onCerrar={cerrarModal}>
          <label style={s.inputLabel}>Celular (10 dígitos)</label>
          <input style={s.input} type="tel" placeholder="000 000 0000"
            value={form.telefono || ''}
            onChange={e => setForm(p => ({ ...p, telefono: e.target.value.replace(/\D/g, '').slice(0, 10) }))} />
          <button style={s.btnGuardar} disabled={guardando}
            onClick={() => guardar({ telefono: form.telefono })}>
            {guardando ? '⏳ Guardando...' : '✅ Guardar'}
          </button>
        </Modal>
      )}

      {modal === 'direccion' && (
        <Modal titulo="Dirección de entrega" onCerrar={cerrarModal}>
          <label style={s.inputLabel}>Dirección completa</label>
          <textarea style={{ ...s.input, height: '80px', resize: 'vertical' }}
            placeholder="Calle, número, colonia, ciudad..."
            value={form.direccion || ''}
            onChange={e => setForm(p => ({ ...p, direccion: e.target.value }))} />
          <p style={s.hint}>Esta dirección se usará por defecto en tus pedidos</p>
          <button style={s.btnGuardar} disabled={guardando}
            onClick={() => guardar({ direccion: form.direccion })}>
            {guardando ? '⏳ Guardando...' : '✅ Guardar'}
          </button>
        </Modal>
      )}
    </div>
  )
}

const s = {
  contenedor: { background: '#F5F5F5', minHeight: '100vh', maxWidth: '480px', margin: '0 auto', fontFamily: "'Nunito',sans-serif", paddingBottom: '30px' },
  cargando: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  header: { background: 'linear-gradient(135deg, #009EE3, #0077B6)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' },
  btnVolver: { background: 'none', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer', padding: '0 4px' },
  headerTitulo: { flex: 1, color: '#fff', fontSize: '18px', fontWeight: '800', margin: 0, textAlign: 'center' },
  btnSalir: { background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', color: '#fff', padding: '6px 12px', fontSize: '13px', cursor: 'pointer' },
  avatarSection: { background: '#fff', padding: '28px 20px 20px', textAlign: 'center', borderBottom: '1px solid #F0F0F0' },
  avatarBtn: { width: '90px', height: '90px', borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg, #009EE3, #0077B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', cursor: 'pointer', position: 'relative', overflow: 'hidden', padding: 0, boxShadow: '0 4px 14px rgba(0,158,227,0.35)' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' },
  avatarLetra: { fontSize: '36px', color: '#fff', fontWeight: '900' },
  avatarBadge: { position: 'absolute', bottom: '2px', right: '2px', background: '#fff', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' },
  avatarNombre: { fontSize: '20px', fontWeight: '800', color: '#333', margin: '0 0 2px' },
  avatarEmail: { fontSize: '13px', color: '#009EE3', margin: '0 0 4px' },
  avatarHint: { fontSize: '11px', color: '#aaa', margin: 0 },
  seccion: { background: '#fff', margin: '10px 0 0', borderTop: '1px solid #F0F0F0' },
  seccionTitulo: { fontSize: '12px', fontWeight: '800', color: '#009EE3', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '14px 16px 8px', margin: 0, borderBottom: '1px solid #F5F5F5' },
  campo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #F5F5F5', cursor: 'pointer' },
  campoIzq: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1 },
  campoIcono: { fontSize: '20px', width: '28px', textAlign: 'center', flexShrink: 0 },
  campoLabel: { fontSize: '11px', color: '#999', fontWeight: '600', margin: '0 0 2px' },
  campoValor: { fontSize: '14px', color: '#333', fontWeight: '600', margin: 0 },
  campoVacio: { color: '#CCC', fontWeight: '400', fontSize: '13px' },
  campoFlecha: { color: '#CCC', fontSize: '22px', flexShrink: 0 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '480px', maxHeight: '85vh', overflow: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px 14px', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, background: '#fff' },
  modalTitulo: { fontSize: '17px', fontWeight: '800', color: '#333', margin: 0 },
  modalCerrar: { background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#999' },
  modalBody: { padding: '16px 20px 32px', display: 'flex', flexDirection: 'column', gap: '10px' },
  inputLabel: { fontSize: '12px', fontWeight: '700', color: '#666', display: 'block', marginBottom: '4px' },
  input: { width: '100%', border: '1px solid #E0E0E0', borderRadius: '10px', padding: '13px 14px', fontSize: '15px', color: '#333', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#FAFAFA' },
  hint: { fontSize: '12px', color: '#aaa', margin: '4px 0 0', lineHeight: '1.5' },
  btnGuardar: { width: '100%', background: 'linear-gradient(135deg, #009EE3, #0077B6)', border: 'none', borderRadius: '10px', padding: '14px', color: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer', marginTop: '4px' },
} 
