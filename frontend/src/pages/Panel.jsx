import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { pedidosService, restaurantesService } from '../services/api'

export function NavInferior({ activo }) {
  const navigate = useNavigate()
  const items = [
    { icon: '🏠', label: 'Inicio', ruta: '/panel' },
    { icon: '💬', label: 'Chats', ruta: '/panel/chats' },
    { icon: '📋', label: 'Pedidos', ruta: '/panel/pedidos' },
    { icon: '🍽️', label: 'Menú', ruta: '/panel/menu' },
    { icon: '👤', label: 'Perfil', ruta: '/panel/perfil' },
  ]
  return (
    <div style={e.navInferior}>
      {items.map(item => (
        <button key={item.ruta} onClick={() => navigate(item.ruta)}
          style={{ ...e.navBtn, color: activo === item.label.toLowerCase() ? '#009EE3' : '#999' }}>
          <span style={e.navIcon}>{item.icon}</span>
          <span style={e.navLabel}>{item.label}</span>
        </button>
      ))}
    </div>
  )
}

export function estadoColor(estado) {
  const colores = {
    pendiente: { background: '#FFF3E0', color: '#FF6B00' },
    confirmado: { background: '#E3F2FD', color: '#1565C0' },
    preparando: { background: '#F3E5F5', color: '#6A1B9A' },
    listo: { background: '#E8F5E9', color: '#2E7D32' },
    en_camino: { background: '#E0F7FA', color: '#00838F' },
    entregado: { background: '#F5F5F5', color: '#666' },
    cancelado: { background: '#FFEBEE', color: '#C62828' },
  }
  return colores[estado] || { background: '#F5F5F5', color: '#666' }
}

export default function Panel() {
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState([])
  const [abierto, setAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const nombre = localStorage.getItem('nombre')

  useEffect(() => {
    cargarDatos()
    const iv = setInterval(cargarDatos, 5000)
    return () => clearInterval(iv)
  }, [])

  const cargarDatos = async () => {
    try {
      const res = await pedidosService.misPedidos()
      setPedidos(res.data)
    } catch {}
  }

  const toggleAbierto = async () => {
    setCargando(true)
    try {
      await restaurantesService.toggleAbierto(!abierto)
      setAbierto(!abierto)
    } catch {}
    finally { setCargando(false) }
  }

  const pedidosHoy = pedidos.filter(p => {
    const hoy = new Date().toDateString()
    return new Date(p.creado_en).toDateString() === hoy
  })

  const pendientes = pedidos.filter(p => p.estado === 'pendiente').length
  const totalHoy = pedidosHoy.reduce((s, p) => s + p.total, 0)

  const cerrarSesion = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div style={e.contenedor}>
      <div style={e.header}>
        <div>
          <p style={e.headerSaludo}>Hola, {nombre} 👋</p>
          <p style={e.headerSub}>Panel de control</p>
        </div>
        <button onClick={cerrarSesion} style={e.btnSalir}>Salir</button>
      </div>

      <div style={e.toggleCard}>
        <div>
          <p style={e.toggleTitulo}>Estado del restaurante</p>
          <p style={{ ...e.toggleEstado, color: abierto ? '#00A650' : '#999' }}>
            {abierto ? '🟢 Abierto — recibiendo pedidos' : '🔴 Cerrado'}
          </p>
        </div>
        <button onClick={toggleAbierto} disabled={cargando}
          style={{ ...e.toggleBtn, background: abierto ? '#00A650' : '#ccc' }}>
          <div style={{ ...e.toggleCircle, transform: abierto ? 'translateX(24px)' : 'translateX(0)' }} />
        </button>
      </div>

      <div style={e.metricas}>
        <div style={e.metricaCard}>
          <p style={e.metricaNum}>{pedidosHoy.length}</p>
          <p style={e.metricaLabel}>Pedidos hoy</p>
        </div>
        <div style={{ ...e.metricaCard, background: pendientes > 0 ? '#FFF3E0' : '#F5F5F5' }}>
          <p style={{ ...e.metricaNum, color: pendientes > 0 ? '#FF6B00' : '#333' }}>{pendientes}</p>
          <p style={e.metricaLabel}>Pendientes</p>
        </div>
        <div style={e.metricaCard}>
          <p style={{ ...e.metricaNum, color: '#009EE3' }}>${totalHoy.toFixed(0)}</p>
          <p style={e.metricaLabel}>Ventas hoy</p>
        </div>
      </div>

      <p style={e.seccionTitulo}>Gestión</p>
      <div style={e.accesos}>
        {[
          { icon: '💬', label: 'Chats', ruta: '/panel/chats', color: '#E3F2FD' },
          { icon: '📋', label: 'Pedidos', ruta: '/panel/pedidos', color: '#FFF3E0' },
          { icon: '🍽️', label: 'Mi Menú', ruta: '/panel/menu', color: '#E8F5E9' },
          { icon: '📢', label: 'Promociones', ruta: '/panel/promociones', color: '#FFF8E1' },
          { icon: '👤', label: 'Mi Perfil', ruta: '/panel/perfil', color: '#F3E5F5' },
          { icon: '⚙️', label: 'Config', ruta: '/panel/config', color: '#F5F5F5' },
        ].map(a => (
          <button key={a.ruta} onClick={() => navigate(a.ruta)}
            style={{ ...e.accesoBtn, background: a.color }}>
            <span style={e.accesoIcon}>{a.icon}</span>
            <span style={e.accesoLabel}>{a.label}</span>
          </button>
        ))}
      </div>

      <p style={e.seccionTitulo}>Últimos pedidos</p>
      <div style={e.pedidosList}>
        {pedidos.slice(0, 5).map(p => (
          <div key={p.id} style={e.pedidoItem} onClick={() => navigate(`/panel/chat/${p.id}`)}>
            <div>
              <p style={e.pedidoFolio}>{p.folio}</p>
              <p style={e.pedidoFecha}>{new Date(p.creado_en).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={e.pedidoTotal}>${p.total.toFixed(2)}</p>
              <span style={{ ...e.estadoBadge, ...estadoColor(p.estado) }}>{p.estado}</span>
            </div>
          </div>
        ))}
        {pedidos.length === 0 && <p style={e.vacio}>No hay pedidos aún</p>}
      </div>

      <NavInferior activo="inicio" />
    </div>
  )
}

const e = {
  contenedor: { background: '#F5F5F5', minHeight: '100vh', maxWidth: '480px', margin: '0 auto', fontFamily: "'Nunito','Helvetica Neue',Helvetica,Arial,sans-serif", paddingBottom: '70px' },
  header: { background: 'linear-gradient(135deg, #009EE3, #0077B6)', padding: '20px 20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerSaludo: { color: '#fff', fontSize: '18px', fontWeight: '800', margin: 0 },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: 0 },
  btnSalir: { background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', color: '#fff', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' },
  toggleCard: { background: '#fff', margin: '16px 16px 0', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  toggleTitulo: { fontSize: '15px', fontWeight: '700', color: '#333', margin: '0 0 4px' },
  toggleEstado: { fontSize: '13px', margin: 0, fontWeight: '600' },
  toggleBtn: { width: '52px', height: '28px', borderRadius: '14px', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 },
  toggleCircle: { width: '22px', height: '22px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '3px', left: '3px', transition: 'transform 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
  metricas: { display: 'flex', gap: '10px', padding: '12px 16px' },
  metricaCard: { flex: 1, background: '#F5F5F5', borderRadius: '12px', padding: '14px 10px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  metricaNum: { fontSize: '24px', fontWeight: '900', color: '#333', margin: '0 0 2px' },
  metricaLabel: { fontSize: '11px', color: '#999', margin: 0, fontWeight: '600' },
  seccionTitulo: { fontSize: '13px', fontWeight: '800', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '16px 0 8px', padding: '0 16px' },
  accesos: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '0 16px 8px' },
  accesoBtn: { border: 'none', borderRadius: '12px', padding: '16px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  accesoIcon: { fontSize: '24px' },
  accesoLabel: { fontSize: '14px', fontWeight: '700', color: '#333' },
  pedidosList: { margin: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  pedidoItem: { background: '#fff', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  pedidoFolio: { fontSize: '14px', fontWeight: '700', color: '#333', margin: 0 },
  pedidoFecha: { fontSize: '12px', color: '#999', margin: '2px 0 0' },
  pedidoTotal: { fontSize: '15px', fontWeight: '800', color: '#009EE3', margin: '0 0 4px' },
  estadoBadge: { fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px' },
  vacio: { textAlign: 'center', color: '#ccc', padding: '30px', fontSize: '14px' },
  navInferior: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: '#fff', borderTop: '1px solid #EEE', display: 'flex', zIndex: 50 },
  navBtn: { flex: 1, border: 'none', background: 'none', padding: '10px 0', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
  navIcon: { fontSize: '20px' },
  navLabel: { fontSize: '10px', fontWeight: '700' },
}
