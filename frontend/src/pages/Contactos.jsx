import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { restaurantesService } from '../services/api'

export default function Contactos() {
  const [restaurantes, setRestaurantes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const navigate = useNavigate()
  const nombre = localStorage.getItem('nombre')

  useEffect(() => {
    restaurantesService.listar().then(res => setRestaurantes(res.data))
  }, [])

  const filtrados = restaurantes.filter(r =>
    r.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const cerrarSesion = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div style={e.contenedor}>
      {/* Header estilo MercadoPago */}
      <div style={e.header}>
        <div style={e.headerIzq}>
          <span style={e.headerLogo}>🍽️</span>
          <span style={e.headerTitulo}>Point Eats</span>
        </div>
        <div style={e.headerDer}>
          <span style={e.saludo}>Hola, {nombre}</span>
          <button onClick={cerrarSesion} style={e.botonSalir}>Salir</button>
        </div>
      </div>

      {/* Buscador */}
      <div style={e.buscadorWrap}>
        <div style={e.buscadorContenedor}>
          <span style={e.buscadorIcono}>🔍</span>
          <input
            style={e.buscador}
            placeholder="Buscar restaurante"
            value={busqueda}
            onChange={ev => setBusqueda(ev.target.value)}
          />
        </div>
      </div>

      {/* Título sección */}
      <div style={e.seccion}>
        <p style={e.seccionTitulo}>Restaurantes disponibles</p>
      </div>

      {/* Lista */}
      <div style={e.lista}>
        {filtrados.length === 0 && (
          <div style={e.vacio}>
            <p style={e.vacioTexto}>No hay restaurantes disponibles</p>
          </div>
        )}
        {filtrados.map(r => (
          <div key={r.id} style={e.tarjeta} onClick={() => navigate(`/chat/${r.id}`)}>
            <div style={e.avatarWrap}>
              <div style={e.avatar}>
                {r.foto_url
                  ? <img src={r.foto_url} style={e.avatarImg} alt={r.nombre}/>
                  : <span style={e.avatarEmoji}>🍽️</span>
                }
              </div>
              <span style={{
                ...e.badge,
                background: r.abierto ? '#00A650' : '#CCCCCC'
              }}/>
            </div>

            <div style={e.info}>
              <div style={e.fila}>
                <span style={e.nombre}>{r.nombre}</span>
                <span style={{
                  ...e.estadoTag,
                  background: r.abierto ? '#F0FFF7' : '#F5F5F5',
                  color: r.abierto ? '#00A650' : '#999999'
                }}>
                  {r.abierto ? 'Abierto' : 'Cerrado'}
                </span>
              </div>
              <p style={e.desc}>{r.descripcion || r.categoria}</p>
              <div style={e.fila}>
                <span style={e.meta}>⏱ {r.tiempo_entrega_min} min</span>
                <span style={e.meta}>⭐ {r.calificacion}</span>
                <span style={e.meta}>Mín. ${r.pedido_minimo}</span>
              </div>
            </div>

            <span style={e.flecha}>›</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const e = {
  contenedor: {
    background: '#F5F5F5',
    minHeight: '100vh',
    maxWidth: '480px',
    margin: '0 auto',
    fontFamily: "'Proxima Nova', 'Helvetica Neue', Helvetica, Arial, sans-serif"
  },
  header: {
    background: '#009EE3',
    padding: '14px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 10
  },
  headerIzq: { display: 'flex', alignItems: 'center', gap: '8px' },
  headerLogo: { fontSize: '22px' },
  headerTitulo: { color: '#FFFFFF', fontSize: '18px', fontWeight: '600' },
  headerDer: { display: 'flex', alignItems: 'center', gap: '12px' },
  saludo: { color: 'rgba(255,255,255,0.85)', fontSize: '13px' },
  botonSalir: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: '4px',
    color: '#FFFFFF',
    padding: '6px 12px',
    fontSize: '13px',
    cursor: 'pointer'
  },
  buscadorWrap: { background: '#009EE3', padding: '0 16px 16px' },
  buscadorContenedor: {
    background: '#FFFFFF',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px',
    gap: '8px'
  },
  buscadorIcono: { fontSize: '16px' },
  buscador: {
    flex: 1, border: 'none', outline: 'none',
    fontSize: '15px', color: '#333333', background: 'transparent'
  },
  seccion: { padding: '16px 20px 8px' },
  seccionTitulo: { color: '#666666', fontSize: '13px', margin: 0, fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' },
  lista: { padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  tarjeta: {
    background: '#FFFFFF',
    borderRadius: '6px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
    border: '1px solid #EEEEEE'
  },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: {
    width: '52px', height: '52px', borderRadius: '50%',
    background: '#E8F7FF', display: 'flex',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarEmoji: { fontSize: '24px' },
  badge: {
    position: 'absolute', bottom: '2px', right: '2px',
    width: '13px', height: '13px', borderRadius: '50%',
    border: '2px solid #FFFFFF'
  },
  info: { flex: 1, minWidth: 0 },
  fila: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' },
  nombre: { color: '#333333', fontSize: '16px', fontWeight: '600' },
  estadoTag: {
    fontSize: '11px', fontWeight: '600', padding: '2px 8px',
    borderRadius: '20px', flexShrink: 0
  },
  desc: { color: '#666666', fontSize: '13px', margin: '4px 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  meta: { color: '#999999', fontSize: '12px' },
  flecha: { color: '#CCCCCC', fontSize: '24px', flexShrink: 0 },
  vacio: { textAlign: 'center', padding: '60px 20px' },
  vacioTexto: { color: '#999999', fontSize: '16px' }
}