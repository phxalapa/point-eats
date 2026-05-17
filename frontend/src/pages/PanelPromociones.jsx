import { useState, useEffect, useRef } from 'react'
import { NavInferior } from './Panel'
import axios from 'axios'

const API = 'http://127.0.0.1:8000'

export default function PanelPromociones() {
  const [promociones, setPromociones] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({ titulo: '', descripcion: '', precio_promo: '', tipo: 'imagen', media_url: '', tiene_boton_agregar: true })
  const fileRef = useRef(null)
  const token = localStorage.getItem('token')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try {
      const res = await axios.get(`${API}/promociones/restaurante/1`)
      setPromociones(res.data)
    } catch {}
  }

  const subirMedia = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSubiendo(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const esVideo = file.type.startsWith('video/')
      const endpoint = esVideo ? `${API}/media/subir-video` : `${API}/media/subir-imagen`
      if (!esVideo) fd.append('carpeta', 'promociones')
      const res = await axios.post(endpoint, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      setForm(prev => ({ ...prev, media_url: res.data.url, tipo: esVideo ? 'video' : 'imagen' }))
    } catch { alert('Error al subir archivo') }
    finally { setSubiendo(false); e.target.value = '' }
  }

  const guardar = async () => {
    if (!form.titulo || !form.media_url) { alert('Agrega título y archivo'); return }
    setGuardando(true)
    try {
      await axios.post(`${API}/promociones/`, {
        titulo: form.titulo,
        descripcion: form.descripcion,
        tipo: form.tipo,
        media_url: form.media_url,
        precio_promo: form.precio_promo ? parseFloat(form.precio_promo) : null,
        tiene_boton_agregar: form.tiene_boton_agregar
      }, { headers: { Authorization: `Bearer ${token}` } })
      setForm({ titulo: '', descripcion: '', precio_promo: '', tipo: 'imagen', media_url: '', tiene_boton_agregar: true })
      setMostrarForm(false)
      await cargar()
    } catch { alert('Error al guardar promoción') }
    finally { setGuardando(false) }
  }

  const togglePromo = async (id) => {
    try {
      await axios.patch(`${API}/promociones/${id}/toggle`, {}, { headers: { Authorization: `Bearer ${token}` } })
      await cargar()
    } catch {}
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta promoción?')) return
    try {
      await axios.delete(`${API}/promociones/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      await cargar()
    } catch {}
  }

  return (
    <div style={e.contenedor}>
      <div style={e.header}>
        <p style={e.headerTitulo}>📢 Promociones</p>
        <button onClick={() => setMostrarForm(!mostrarForm)} style={e.btnNueva}>
          {mostrarForm ? '✕' : '+ Nueva'}
        </button>
      </div>

      {mostrarForm && (
        <div style={e.form}>
          <p style={e.formTitulo}>Nueva promoción</p>
          <input style={e.input} placeholder="Título *" value={form.titulo} onChange={ev => setForm(p => ({ ...p, titulo: ev.target.value }))} />
          <input style={e.input} placeholder="Descripción" value={form.descripcion} onChange={ev => setForm(p => ({ ...p, descripcion: ev.target.value }))} />
          <input style={e.input} placeholder="Precio especial (opcional)" type="number" value={form.precio_promo} onChange={ev => setForm(p => ({ ...p, precio_promo: ev.target.value }))} />

          <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={subirMedia} />
          <button onClick={() => fileRef.current?.click()} style={e.btnSubir} disabled={subiendo}>
            {subiendo ? '⏳ Subiendo...' : form.media_url ? `✅ ${form.tipo === 'video' ? 'Video' : 'Imagen'} lista — cambiar` : '📎 Subir imagen o video (máx 30s)'}
          </button>

          {form.media_url && form.tipo === 'imagen' && (
            <img src={form.media_url} style={e.preview} alt="preview" />
          )}
          {form.media_url && form.tipo === 'video' && (
            <video src={form.media_url} style={e.preview} controls />
          )}

          <div style={e.checkRow}>
            <input type="checkbox" checked={form.tiene_boton_agregar} onChange={ev => setForm(p => ({ ...p, tiene_boton_agregar: ev.target.checked }))} id="btn" />
            <label htmlFor="btn" style={e.checkLabel}>🛒 Mostrar botón "Agregar al carrito"</label>
          </div>

          <button onClick={guardar} style={e.btnGuardar} disabled={guardando}>
            {guardando ? '⏳ Guardando...' : '✅ Publicar promoción'}
          </button>
        </div>
      )}

      <div style={e.lista}>
        {promociones.length === 0 && !mostrarForm && (
          <div style={e.vacio}>
            <p style={{ fontSize: '40px' }}>📢</p>
            <p style={e.vacioTexto}>No hay promociones activas</p>
            <p style={{ color: '#ccc', fontSize: '13px' }}>Crea una para atraer más clientes</p>
          </div>
        )}
        {promociones.map(p => (
          <div key={p.id} style={{ ...e.promoCard, opacity: p.activa ? 1 : 0.6 }}>
            {p.tipo === 'imagen'
              ? <img src={p.media_url} style={e.promoMedia} alt={p.titulo} />
              : <video src={p.media_url} style={e.promoMedia} controls />
            }
            <div style={e.promoInfo}>
              <p style={e.promoTitulo}>{p.titulo}</p>
              {p.descripcion && <p style={e.promoDesc}>{p.descripcion}</p>}
              {p.precio_promo && <p style={e.promoPrecio}>🏷️ ${p.precio_promo.toFixed(2)}</p>}
              {p.tiene_boton_agregar && <p style={e.promoBtn}>🛒 Con botón de agregar</p>}
            </div>
            <div style={e.promoAcciones}>
              <button onClick={() => togglePromo(p.id)} style={{ ...e.btnToggle, background: p.activa ? '#E8F5E9' : '#F5F5F5', color: p.activa ? '#2E7D32' : '#999' }}>
                {p.activa ? '✅ Activa' : '⏸️ Pausada'}
              </button>
              <button onClick={() => eliminar(p.id)} style={e.btnEliminar}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      <NavInferior activo="promos" />
    </div>
  )
}

const e = {
  contenedor: { background: '#F5F5F5', minHeight: '100vh', maxWidth: '480px', margin: '0 auto', fontFamily: "'Nunito',sans-serif", paddingBottom: '70px' },
  header: { background: 'linear-gradient(135deg, #009EE3, #0077B6)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitulo: { color: '#fff', fontSize: '20px', fontWeight: '800', margin: 0 },
  btnNueva: { background: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', color: '#009EE3', fontSize: '13px', fontWeight: '800', cursor: 'pointer' },
  form: { background: '#fff', margin: '12px 16px', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  formTitulo: { fontSize: '16px', fontWeight: '800', color: '#333', margin: '0 0 14px' },
  input: { width: '100%', border: '1px solid #E0E0E0', borderRadius: '8px', padding: '11px 14px', fontSize: '14px', color: '#333', outline: 'none', marginBottom: '10px', fontFamily: 'inherit', boxSizing: 'border-box' },
  btnSubir: { width: '100%', border: '2px dashed #009EE3', borderRadius: '8px', padding: '14px', background: '#F0F8FF', color: '#009EE3', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginBottom: '10px' },
  preview: { width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' },
  checkRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' },
  checkLabel: { fontSize: '13px', color: '#666', cursor: 'pointer' },
  btnGuardar: { width: '100%', background: 'linear-gradient(135deg, #009EE3, #0077B6)', border: 'none', borderRadius: '8px', padding: '13px', color: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer' },
  lista: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  vacio: { textAlign: 'center', padding: '60px 20px' },
  vacioTexto: { color: '#ccc', fontSize: '15px', margin: '8px 0 4px' },
  promoCard: { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  promoMedia: { width: '100%', maxHeight: '180px', objectFit: 'cover' },
  promoInfo: { padding: '12px 14px 8px' },
  promoTitulo: { fontSize: '15px', fontWeight: '800', color: '#333', margin: '0 0 2px' },
  promoDesc: { fontSize: '13px', color: '#666', margin: '0 0 4px' },
  promoPrecio: { fontSize: '14px', fontWeight: '800', color: '#009EE3', margin: '0 0 2px' },
  promoBtn: { fontSize: '12px', color: '#00A650', margin: 0 },
  promoAcciones: { display: 'flex', gap: '8px', padding: '0 14px 12px' },
  btnToggle: { flex: 1, border: 'none', borderRadius: '8px', padding: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  btnEliminar: { background: '#FFEBEE', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '16px', cursor: 'pointer' },
} 
