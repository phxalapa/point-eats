import { useState, useEffect, useRef } from 'react'
import { restaurantesService } from '../services/api'
import { NavInferior } from './Panel'
import axios from 'axios'

import { API_URL as API } from '../services/config'

export default function PanelMenu() {
  const [menu, setMenu] = useState({})
  const [mostrarForm, setMostrarForm] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const fileRef = useRef(null)
  const token = localStorage.getItem('token')

  const [form, setForm] = useState({
    nombre: '', descripcion: '', precio: '', categoria: '', destacado: false, foto_url: ''
  })

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try {
      const res = await restaurantesService.menu(1)
      setMenu(res.data.menu)
    } catch {}
  }

  const subirFoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSubiendo(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('carpeta', 'menu')
      const res = await axios.post(`${API}/media/subir-imagen`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      setForm(prev => ({ ...prev, foto_url: res.data.url }))
    } catch { alert('Error al subir foto') }
    finally { setSubiendo(false); e.target.value = '' }
  }

  const guardar = async () => {
    if (!form.nombre || !form.precio || !form.categoria) { alert('Completa nombre, precio y categoría'); return }
    setCargando(true)
    try {
      await restaurantesService.agregarPlatillo({
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio: parseFloat(form.precio),
        categoria: form.categoria,
        destacado: form.destacado,
        foto_url: form.foto_url || null
      })
      setForm({ nombre: '', descripcion: '', precio: '', categoria: '', destacado: false, foto_url: '' })
      setMostrarForm(false)
      await cargar()
    } catch { alert('Error al guardar') }
    finally { setCargando(false) }
  }

  return (
    <div style={e.contenedor}>
      <div style={e.header}>
        <p style={e.headerTitulo}>🍽️ Mi Menú</p>
        <button onClick={() => setMostrarForm(!mostrarForm)} style={e.btnAgregar}>
          {mostrarForm ? '✕ Cancelar' : '+ Agregar platillo'}
        </button>
      </div>

      {/* Formulario nuevo platillo */}
      {mostrarForm && (
        <div style={e.form}>
          <p style={e.formTitulo}>Nuevo platillo</p>

          <input style={e.input} placeholder="Nombre del platillo *" value={form.nombre} onChange={ev => setForm(p => ({ ...p, nombre: ev.target.value }))} />
          <input style={e.input} placeholder="Descripción breve" value={form.descripcion} onChange={ev => setForm(p => ({ ...p, descripcion: ev.target.value }))} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <input style={{ ...e.input, flex: 1 }} placeholder="Precio *" type="number" value={form.precio} onChange={ev => setForm(p => ({ ...p, precio: ev.target.value }))} />
            <input style={{ ...e.input, flex: 1 }} placeholder="Categoría *" value={form.categoria} onChange={ev => setForm(p => ({ ...p, categoria: ev.target.value }))} />
          </div>

          {/* Foto */}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={subirFoto} />
          <button onClick={() => fileRef.current?.click()} style={e.btnFoto} disabled={subiendo}>
            {subiendo ? '⏳ Subiendo...' : form.foto_url ? '✅ Foto cargada — cambiar' : '📷 Subir foto del platillo'}
          </button>
          {form.foto_url && <img src={form.foto_url} style={e.preview} alt="preview" />}

          <div style={e.checkRow}>
            <input type="checkbox" checked={form.destacado} onChange={ev => setForm(p => ({ ...p, destacado: ev.target.checked }))} id="dest" />
            <label htmlFor="dest" style={e.checkLabel}>⭐ Marcar como popular (aparece primero)</label>
          </div>

          <button onClick={guardar} style={e.btnGuardar} disabled={cargando}>
            {cargando ? '⏳ Guardando...' : '✅ Guardar platillo'}
          </button>
        </div>
      )}

      {/* Lista del menú */}
      <div style={e.lista}>
        {Object.entries(menu).map(([cat, platillos]) => (
          <div key={cat}>
            <p style={e.catLabel}>{cat}</p>
            {platillos.map(p => (
              <div key={p.id} style={e.platilloCard}>
                <div style={e.platilloImgWrap}>
                  {p.foto_url
                    ? <img src={p.foto_url} style={e.platilloImg} alt={p.nombre} />
                    : <span style={{ fontSize: '24px' }}>🍽️</span>
                  }
                </div>
                <div style={e.platilloInfo}>
                  <p style={e.platilloNombre}>{p.destacado ? '⭐ ' : ''}{p.nombre}</p>
                  <p style={e.platilloDesc}>{p.descripcion}</p>
                  <p style={e.platilloPrecio}>${p.precio.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
        {Object.keys(menu).length === 0 && (
          <p style={e.vacio}>No hay platillos. ¡Agrega el primero!</p>
        )}
      </div>

      <NavInferior activo="menú" />
    </div>
  )
}

const e = {
  contenedor: { background: '#F5F5F5', minHeight: '100vh', maxWidth: '480px', margin: '0 auto', fontFamily: "'Nunito',sans-serif", paddingBottom: '70px' },
  header: { background: 'linear-gradient(135deg, #009EE3, #0077B6)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitulo: { color: '#fff', fontSize: '20px', fontWeight: '800', margin: 0 },
  btnAgregar: { background: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', color: '#009EE3', fontSize: '13px', fontWeight: '800', cursor: 'pointer' },
  form: { background: '#fff', margin: '12px 16px', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  formTitulo: { fontSize: '16px', fontWeight: '800', color: '#333', margin: '0 0 14px' },
  input: { width: '100%', border: '1px solid #E0E0E0', borderRadius: '8px', padding: '11px 14px', fontSize: '14px', color: '#333', outline: 'none', marginBottom: '10px', fontFamily: 'inherit', boxSizing: 'border-box' },
  btnFoto: { width: '100%', border: '2px dashed #009EE3', borderRadius: '8px', padding: '12px', background: '#F0F8FF', color: '#009EE3', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginBottom: '10px' },
  preview: { width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' },
  checkRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' },
  checkLabel: { fontSize: '13px', color: '#666', cursor: 'pointer' },
  btnGuardar: { width: '100%', background: 'linear-gradient(135deg, #009EE3, #0077B6)', border: 'none', borderRadius: '8px', padding: '13px', color: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer' },
  lista: { padding: '12px 16px' },
  catLabel: { fontSize: '12px', fontWeight: '800', color: '#009EE3', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '12px 0 8px' },
  platilloCard: { background: '#fff', borderRadius: '10px', padding: '12px', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  platilloImgWrap: { width: '56px', height: '56px', borderRadius: '10px', background: '#E8F7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  platilloImg: { width: '100%', height: '100%', objectFit: 'cover' },
  platilloInfo: { flex: 1 },
  platilloNombre: { fontSize: '14px', fontWeight: '700', color: '#333', margin: '0 0 2px' },
  platilloDesc: { fontSize: '12px', color: '#999', margin: '0 0 2px' },
  platilloPrecio: { fontSize: '14px', fontWeight: '800', color: '#009EE3', margin: 0 },
  vacio: { textAlign: 'center', color: '#ccc', padding: '40px', fontSize: '14px' },
} 
