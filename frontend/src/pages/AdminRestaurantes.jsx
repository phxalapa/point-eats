import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminNav } from './Admin'
import axios from 'axios'

const API = 'http://127.0.0.1:8000'

export default function AdminRestaurantes() {
  const navigate = useNavigate()
  const [restaurantes, setRestaurantes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState(null)
  const [cargando, setCargando] = useState(false)
  const token = localStorage.getItem('token')

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    try {
      const res = await axios.get(`${API}/admin/restaurantes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRestaurantes(res.data)
    } catch { alert('Error al cargar') }
  }

  const suspender = async (usuarioId, activo) => {
    try {
      await axios.patch(`${API}/admin/usuarios/${usuarioId}/suspender`,
        { activo, motivo: activo ? 'Reactivado por admin' : 'Suspendido por admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      await cargar()
      setSeleccionado(null)
    } catch { alert('Error') }
  }

  const impersonar = async (usuarioId, nombre) => {
    if (!confirm(`¿Entrar al panel de ${nombre}?`)) return
    setCargando(true)
    try {
      const res = await axios.post(`${API}/admin/impersonar/${usuarioId}`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      // Guardar token actual del admin
      localStorage.setItem('admin_token_backup', token)
      localStorage.setItem('admin_nombre_backup', localStorage.getItem('nombre'))
      // Entrar como restaurante
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('rol', res.data.rol)
      localStorage.setItem('nombre', res.data.nombre)
      localStorage.setItem('usuario_id', res.data.id)
      localStorage.setItem('es_impersonacion', 'true')
      navigate('/panel')
    } catch { alert('Error al impersonar') }
    finally { setCargando(false) }
  }

  const filtrados = restaurantes.filter(r =>
    r.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.ciudad?.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.email?.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div style={s.contenedor}>
      <div style={s.header}>
        <button onClick={() => navigate('/admin')} style={s.btnVolver}>‹</button>
        <p style={s.headerTitulo}>🍽️ Restaurantes</p>
        <span style={s.headerCount}>{restaurantes.length}</span>
      </div>

      <div style={s.buscadorWrap}>
        <input style={s.buscador} placeholder="🔍 Buscar restaurante, ciudad o email..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      <div style={s.lista}>
        {filtrados.map(r => (
          <div key={r.id} style={{ ...s.card, opacity: r.activo ? 1 : 0.6 }}>
            <div style={s.cardTop}>
              <div style={s.avatarWrap}>
                {r.foto_url
                  ? <img src={r.foto_url} style={s.avatarImg} alt={r.nombre} />
                  : <span style={s.avatarEmoji}>🍽️</span>
                }
                <span style={{ ...s.estadoPunto, background: r.abierto ? '#00A650' : '#ccc' }} />
              </div>
              <div style={s.cardInfo}>
                <p style={s.cardNombre}>{r.nombre}</p>
                <p style={s.cardSub}>{r.categoria} · {r.ciudad}</p>
                <p style={s.cardEmail}>{r.email}</p>
              </div>
              {!r.activo && <span style={s.badgeSuspendido}>SUSPENDIDO</span>}
            </div>

            <div style={s.cardMetricas}>
              <div style={s.metrica}>
                <p style={s.metricaNum}>{r.total_pedidos}</p>
                <p style={s.metricaLabel}>Pedidos</p>
              </div>
              <div style={s.metrica}>
                <p style={{ ...s.metricaNum, color: '#009EE3' }}>${r.total_ventas.toFixed(0)}</p>
                <p style={s.metricaLabel}>Ventas</p>
              </div>
              <div style={s.metrica}>
                <p style={s.metricaNum}>⭐ {r.calificacion}</p>
                <p style={s.metricaLabel}>Rating</p>
              </div>
            </div>

            <div style={s.cardAcciones}>
              <button
                onClick={() => impersonar(r.usuario_id, r.nombre)}
                style={s.btnImpersonar}
                disabled={cargando || !r.activo}
              >
                {cargando ? '⏳' : '🔑 Entrar al panel'}
              </button>
              <button
                onClick={() => suspender(r.usuario_id, !r.activo)}
                style={{ ...s.btnSuspender, background: r.activo ? '#FFEBEE' : '#E8F5E9', color: r.activo ? '#C62828' : '#2E7D32' }}
              >
                {r.activo ? '🚫 Suspender' : '✅ Activar'}
              </button>
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div style={s.vacio}>
            <p style={{ fontSize: '40px' }}>🍽️</p>
            <p style={s.vacioTexto}>No hay restaurantes</p>
          </div>
        )}
      </div>

      <AdminNav activo="restaurantes" />
    </div>
  )
}

const s = {
  contenedor: { background: '#F5F5F5', minHeight: '100vh', maxWidth: '480px', margin: '0 auto', fontFamily: "'Nunito',sans-serif", paddingBottom: '80px' },
  header: { background: 'linear-gradient(135deg, #1A1A2E, #16213E)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' },
  btnVolver: { background: 'none', border: 'none', color: '#fff', fontSize: '28px', cursor: 'pointer', padding: '0 4px' },
  headerTitulo: { flex: 1, color: '#fff', fontSize: '18px', fontWeight: '800', margin: 0 },
  headerCount: { background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '12px', padding: '3px 10px', fontSize: '13px', fontWeight: '700' },
  buscadorWrap: { padding: '12px 16px', background: '#fff', borderBottom: '1px solid #EEE' },
  buscador: { width: '100%', border: '1px solid #E0E0E0', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#F9F9F9' },
  lista: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  card: { background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' },
  cardTop: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatarImg: { width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover' },
  avatarEmoji: { width: '52px', height: '52px', borderRadius: '50%', background: '#E8F7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', display: 'flex' },
  estadoPunto: { position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #fff' },
  cardInfo: { flex: 1, minWidth: 0 },
  cardNombre: { fontSize: '16px', fontWeight: '800', color: '#333', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardSub: { fontSize: '12px', color: '#009EE3', fontWeight: '700', margin: '0 0 2px' },
  cardEmail: { fontSize: '11px', color: '#999', margin: 0 },
  badgeSuspendido: { background: '#FFEBEE', color: '#C62828', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', flexShrink: 0 },
  cardMetricas: { display: 'flex', gap: '8px', background: '#F9F9F9', borderRadius: '10px', padding: '10px', marginBottom: '12px' },
  metrica: { flex: 1, textAlign: 'center' },
  metricaNum: { fontSize: '16px', fontWeight: '900', color: '#333', margin: '0 0 2px' },
  metricaLabel: { fontSize: '10px', color: '#999', fontWeight: '600', margin: 0 },
  cardAcciones: { display: 'flex', gap: '8px' },
  btnImpersonar: { flex: 2, background: 'linear-gradient(135deg, #1A1A2E, #16213E)', border: 'none', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '13px', fontWeight: '800', cursor: 'pointer' },
  btnSuspender: { flex: 1, border: 'none', borderRadius: '8px', padding: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  vacio: { textAlign: 'center', padding: '60px 20px' },
  vacioTexto: { color: '#ccc', fontSize: '16px', margin: '8px 0 0' },
} 
