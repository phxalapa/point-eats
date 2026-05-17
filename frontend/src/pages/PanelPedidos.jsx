import { useState, useEffect } from 'react'
import { pedidosService } from '../services/api'
import { NavInferior, estadoColor } from './Panel'

const ESTADOS = ['pendiente', 'confirmado', 'preparando', 'listo', 'en_camino', 'entregado']
const EMOJIS = { pendiente: '🔔', confirmado: '✅', preparando: '👨‍🍳', listo: '🎉', en_camino: '🛵', entregado: '✅', cancelado: '❌' }

export default function PanelPedidos() {
  const [pedidos, setPedidos] = useState([])
  const [filtro, setFiltro] = useState('activos')
  const [cambiando, setCambiando] = useState(null)

  useEffect(() => {
    cargar()
    const iv = setInterval(cargar, 3000)
    return () => clearInterval(iv)
  }, [])

  const cargar = async () => {
    try {
      const res = await pedidosService.misPedidos()
      setPedidos(res.data)
    } catch {}
  }

  const cambiarEstado = async (pedidoId, nuevoEstado) => {
    setCambiando(pedidoId)
    try {
      await pedidosService.cambiarEstado(pedidoId, nuevoEstado)
      await cargar()
    } catch {}
    finally { setCambiando(null) }
  }

  const activos = pedidos.filter(p => !['entregado', 'cancelado'].includes(p.estado))
  const historial = pedidos.filter(p => ['entregado', 'cancelado'].includes(p.estado))
  const lista = filtro === 'activos' ? activos : historial

  const siguienteEstado = (estado) => {
    const idx = ESTADOS.indexOf(estado)
    return idx < ESTADOS.length - 1 ? ESTADOS[idx + 1] : null
  }

  return (
    <div style={e.contenedor}>
      <div style={e.header}>
        <p style={e.headerTitulo}>📋 Pedidos</p>
        <div style={e.tabs}>
          <button onClick={() => setFiltro('activos')} style={{ ...e.tab, ...(filtro === 'activos' ? e.tabActivo : {}) }}>
            Activos {activos.length > 0 && <span style={e.badge}>{activos.length}</span>}
          </button>
          <button onClick={() => setFiltro('historial')} style={{ ...e.tab, ...(filtro === 'historial' ? e.tabActivo : {}) }}>
            Historial
          </button>
        </div>
      </div>

      <div style={e.lista}>
        {lista.length === 0 && (
          <div style={e.vacio}>
            <p style={{ fontSize: '40px' }}>{filtro === 'activos' ? '🎉' : '📦'}</p>
            <p style={e.vacioTexto}>{filtro === 'activos' ? 'No hay pedidos activos' : 'Sin historial'}</p>
          </div>
        )}
        {lista.map(p => (
          <div key={p.id} style={e.card}>
            <div style={e.cardHeader}>
              <div>
                <p style={e.folio}>{p.folio}</p>
                <p style={e.fecha}>{new Date(p.creado_en).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={e.total}>${p.total.toFixed(2)}</p>
                <span style={{ ...e.estadoBadge, ...estadoColor(p.estado) }}>
                  {EMOJIS[p.estado]} {p.estado}
                </span>
              </div>
            </div>

            {/* Barra de progreso */}
            {!['entregado', 'cancelado'].includes(p.estado) && (
              <div style={e.progreso}>
                {ESTADOS.map((est, i) => (
                  <div key={est} style={{ ...e.progresoStep, background: ESTADOS.indexOf(p.estado) >= i ? '#009EE3' : '#E0E0E0' }} />
                ))}
              </div>
            )}

            {/* Acciones */}
            {siguienteEstado(p.estado) && (
              <div style={e.acciones}>
                <button
                  onClick={() => cambiarEstado(p.id, siguienteEstado(p.estado))}
                  disabled={cambiando === p.id}
                  style={e.btnAvanzar}
                >
                  {cambiando === p.id ? '⏳ Actualizando...' : `${EMOJIS[siguienteEstado(p.estado)]} → ${siguienteEstado(p.estado).toUpperCase()}`}
                </button>
                {p.estado === 'pendiente' && (
                  <button onClick={() => cambiarEstado(p.id, 'cancelado')} style={e.btnCancelar}>
                    ❌ Cancelar
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <NavInferior activo="pedidos" />
    </div>
  )
}

const e = {
  contenedor: { background: '#F5F5F5', minHeight: '100vh', maxWidth: '480px', margin: '0 auto', fontFamily: "'Nunito',sans-serif", paddingBottom: '70px' },
  header: { background: 'linear-gradient(135deg, #009EE3, #0077B6)', padding: '16px 20px 20px' },
  headerTitulo: { color: '#fff', fontSize: '20px', fontWeight: '800', margin: '0 0 12px' },
  tabs: { display: 'flex', gap: '8px' },
  tab: { flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  tabActivo: { background: '#fff', color: '#009EE3' },
  badge: { background: '#FF6B00', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '11px', marginLeft: '4px' },
  lista: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  vacio: { textAlign: 'center', padding: '60px 20px' },
  vacioTexto: { color: '#ccc', fontSize: '15px', margin: 0 },
  card: { background: '#fff', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' },
  folio: { fontSize: '16px', fontWeight: '800', color: '#333', margin: 0 },
  fecha: { fontSize: '12px', color: '#999', margin: '2px 0 0' },
  total: { fontSize: '18px', fontWeight: '900', color: '#009EE3', margin: '0 0 4px' },
  estadoBadge: { fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '10px', display: 'inline-block' },
  progreso: { display: 'flex', gap: '3px', marginBottom: '12px' },
  progresoStep: { flex: 1, height: '4px', borderRadius: '2px' },
  acciones: { display: 'flex', gap: '8px' },
  btnAvanzar: { flex: 1, background: 'linear-gradient(135deg, #009EE3, #0077B6)', border: 'none', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '13px', fontWeight: '800', cursor: 'pointer' },
  btnCancelar: { background: '#FFEBEE', border: 'none', borderRadius: '8px', padding: '10px 14px', color: '#C62828', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
} 
