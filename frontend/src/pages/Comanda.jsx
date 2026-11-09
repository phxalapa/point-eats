import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

import { API_URL as API } from '../services/config'

const ESTADO_COLOR = {
  pendiente: '#FF6B00', confirmado: '#1565C0', preparando: '#6A1B9A',
  listo: '#2E7D32', en_camino: '#00838F', entregado: '#999', cancelado: '#C62828'
}
const ESTADO_EMOJI = {
  pendiente: '🔔', confirmado: '✅', preparando: '👨‍🍳',
  listo: '🎉', en_camino: '🛵', entregado: '📦', cancelado: '❌'
}

export default function Comanda() {
  const { pedidoId } = useParams()
  const navigate = useNavigate()
  const [pedido, setPedido] = useState(null)
  const [tamano, setTamano] = useState('80mm')
  const token = localStorage.getItem('token')

  useEffect(() => { cargar() }, [pedidoId])

  const cargar = async () => {
    try {
      const res = await axios.get(`${API}/pedidos/${pedidoId}/detalle`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPedido(res.data)
    } catch { alert('Error al cargar la comanda') }
  }

  const imprimir = () => {
    window.print()
  }

  if (!pedido) return (
    <div style={s.cargando}>
      <p style={{ color: '#009EE3', fontFamily: 'Nunito,sans-serif' }}>Cargando comanda...</p>
    </div>
  )

  const fechaFormato = (f) => new Date(f).toLocaleString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <>
      {/* ── ESTILOS DE IMPRESIÓN ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #comanda-print, #comanda-print * { visibility: visible !important; }
          #comanda-print {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: ${tamano === '58mm' ? '58mm' : '80mm'} !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: 'Courier New', monospace !important;
            font-size: ${tamano === '58mm' ? '9pt' : '10pt'} !important;
            color: #000 !important;
            background: #fff !important;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        .print-only { display: none; }
        @page {
          margin: 0;
          size: ${tamano} auto;
        }
      `}</style>

      {/* ── CONTROLES (no se imprimen) ── */}
      <div style={s.controles} className="no-print">
        <div style={s.controlesHeader}>
          <button onClick={() => navigate(-1)} style={s.btnVolver}>‹ Volver</button>
          <p style={s.controlesTitulo}>Comanda</p>
          <div style={s.tamanoSelector}>
            {['58mm', '80mm'].map(t => (
              <button
                key={t}
                onClick={() => setTamano(t)}
                style={{ ...s.btnTamano, background: tamano === t ? '#009EE3' : '#F5F5F5', color: tamano === t ? '#fff' : '#666' }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Vista previa de la comanda */}
        <div style={s.previewWrap}>
          <div style={{ ...s.preview, width: tamano === '58mm' ? '58mm' : '80mm' }}>
            <ComandaTicket pedido={pedido} fechaFormato={fechaFormato} />
          </div>
        </div>

        {/* Botón imprimir */}
        <div style={s.botonesAccion}>
          <button onClick={imprimir} style={s.btnImprimir}>
            🖨️ Imprimir comanda
          </button>
          <button onClick={() => navigate(`/panel/chat/${pedidoId}`)} style={s.btnChat}>
            💬 Ir al chat
          </button>
        </div>

        {/* Info impresora */}
        <div style={s.infoBox}>
          <p style={s.infoTitulo}>💡 ¿Cómo imprimir?</p>
          <p style={s.infoTexto}>1. Conecta tu impresora térmica como impresora del sistema</p>
          <p style={s.infoTexto}>2. Selecciona el tamaño correcto (58mm o 80mm)</p>
          <p style={s.infoTexto}>3. Toca "Imprimir comanda" y elige tu impresora térmica</p>
          <p style={s.infoTexto}>4. En configuración de impresión desactiva márgenes y encabezados</p>
        </div>
      </div>

      {/* ── VERSIÓN IMPRIMIBLE ── */}
      <div id="comanda-print" style={{ display: 'none' }} className="print-only">
        <ComandaTicket pedido={pedido} fechaFormato={fechaFormato} />
      </div>
    </>
  )
}

// ── Componente del ticket ──────────────────────────────
function ComandaTicket({ pedido, fechaFormato }) {
  return (
    <div style={t.ticket}>
      {/* Encabezado */}
      <div style={t.encabezado}>
        <p style={t.restauranteNombre}>{pedido.restaurante.nombre}</p>
        {pedido.restaurante.direccion && (
          <p style={t.restauranteDato}>{pedido.restaurante.direccion}</p>
        )}
        {pedido.restaurante.telefono && (
          <p style={t.restauranteDato}>Tel: {pedido.restaurante.telefono}</p>
        )}
      </div>

      <p style={t.separador}>{'─'.repeat(32)}</p>

      {/* Info del pedido */}
      <div style={t.seccion}>
        <p style={t.folio}>FOLIO: {pedido.folio}</p>
        <p style={t.dato}>Fecha: {fechaFormato(pedido.creado_en)}</p>
        <p style={t.dato}>Cliente: {pedido.cliente.nombre}</p>
        {pedido.cliente.telefono && (
          <p style={t.dato}>Tel: {pedido.cliente.telefono}</p>
        )}
        {pedido.direccion_entrega && (
          <p style={t.dato}>Entrega: {pedido.direccion_entrega}</p>
        )}
      </div>

      <p style={t.separador}>{'─'.repeat(32)}</p>

      {/* Items */}
      <div style={t.seccion}>
        <p style={t.itemsHeader}>CANT  DESCRIPCIÓN         PRECIO</p>
        <p style={t.separadorDelgado}>{'·'.repeat(32)}</p>
        {pedido.items.map((item, i) => (
          <div key={i} style={t.itemRow}>
            <div style={t.itemFila1}>
              <span style={t.itemCantidad}>{item.cantidad}x</span>
              <span style={t.itemNombre}>{item.nombre}</span>
              <span style={t.itemPrecio}>${item.subtotal.toFixed(2)}</span>
            </div>
            {item.notas && (
              <p style={t.itemNota}>  * {item.notas}</p>
            )}
          </div>
        ))}
      </div>

      <p style={t.separador}>{'─'.repeat(32)}</p>

      {/* Totales */}
      <div style={t.seccion}>
        <div style={t.totalFila}>
          <span style={t.totalLabel}>Subtotal:</span>
          <span style={t.totalValor}>${pedido.subtotal?.toFixed(2) || pedido.total.toFixed(2)}</span>
        </div>
        <div style={{ ...t.totalFila, ...t.totalGrande }}>
          <span style={t.totalLabelGrande}>TOTAL:</span>
          <span style={t.totalValorGrande}>${pedido.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Notas */}
      {pedido.notas && (
        <>
          <p style={t.separador}>{'─'.repeat(32)}</p>
          <div style={t.seccion}>
            <p style={t.notasTitulo}>NOTAS DEL CLIENTE:</p>
            <p style={t.notasTexto}>{pedido.notas}</p>
          </div>
        </>
      )}

      <p style={t.separador}>{'─'.repeat(32)}</p>

      {/* Estado */}
      <div style={t.seccion}>
        <p style={t.estadoTexto}>Estado: {pedido.estado.toUpperCase()}</p>
      </div>

      <p style={t.separador}>{'─'.repeat(32)}</p>

      {/* Pie */}
      <div style={t.pie}>
        <p style={t.pieTitulo}>¡Gracias por su preferencia!</p>
        <p style={t.pieSubtitulo}>Point Eats</p>
        <p style={t.pieFecha}>{new Date().toLocaleString('es-MX')}</p>
      </div>

      {/* Espacio al final para corte */}
      <div style={{ height: '20mm' }} />
    </div>
  )
}

// ── Estilos pantalla ───────────────────────────────────
const s = {
  cargando: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' },
  controles: { background: '#F5F5F5', minHeight: '100vh', maxWidth: '480px', margin: '0 auto', fontFamily: "'Nunito',sans-serif", paddingBottom: '20px' },
  controlesHeader: { background: 'linear-gradient(135deg, #009EE3, #0077B6)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' },
  btnVolver: { background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer', padding: '0 4px' },
  controlesTitulo: { flex: 1, color: '#fff', fontSize: '17px', fontWeight: '800', margin: 0 },
  tamanoSelector: { display: 'flex', gap: '6px' },
  btnTamano: { border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  previewWrap: { display: 'flex', justifyContent: 'center', padding: '20px 16px 10px', background: '#E0E0E0' },
  preview: { background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', minHeight: '200px' },
  botonesAccion: { display: 'flex', gap: '10px', padding: '16px' },
  btnImprimir: { flex: 2, background: 'linear-gradient(135deg, #009EE3, #0077B6)', border: 'none', borderRadius: '10px', padding: '14px', color: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer' },
  btnChat: { flex: 1, background: '#F5F5F5', border: '2px solid #009EE3', borderRadius: '10px', padding: '14px', color: '#009EE3', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  infoBox: { margin: '0 16px', background: '#fff', borderRadius: '10px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  infoTitulo: { fontSize: '14px', fontWeight: '800', color: '#333', margin: '0 0 8px' },
  infoTexto: { fontSize: '12px', color: '#666', margin: '0 0 4px', lineHeight: '1.5' },
}

// ── Estilos del ticket ─────────────────────────────────
const t = {
  ticket: { fontFamily: "'Courier New', Courier, monospace", fontSize: '10pt', color: '#000', background: '#fff', padding: '4mm 3mm', lineHeight: '1.4' },
  encabezado: { textAlign: 'center', marginBottom: '4px' },
  restauranteNombre: { fontSize: '13pt', fontWeight: 'bold', margin: '0 0 2px', textTransform: 'uppercase' },
  restauranteDato: { fontSize: '8pt', margin: '1px 0' },
  separador: { fontSize: '8pt', letterSpacing: '0', margin: '4px 0', color: '#000', textAlign: 'center' },
  separadorDelgado: { fontSize: '7pt', margin: '3px 0', color: '#666', textAlign: 'center' },
  seccion: { margin: '4px 0' },
  folio: { fontSize: '12pt', fontWeight: 'bold', textAlign: 'center', margin: '4px 0' },
  dato: { fontSize: '8.5pt', margin: '2px 0' },
  itemsHeader: { fontSize: '7.5pt', fontWeight: 'bold', margin: '3px 0 2px', letterSpacing: '0.5px' },
  itemRow: { marginBottom: '3px' },
  itemFila1: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  itemCantidad: { fontSize: '9pt', fontWeight: 'bold', minWidth: '20px' },
  itemNombre: { fontSize: '8.5pt', flex: 1, paddingLeft: '3px', paddingRight: '3px' },
  itemPrecio: { fontSize: '9pt', fontWeight: 'bold', minWidth: '50px', textAlign: 'right' },
  itemNota: { fontSize: '7.5pt', color: '#444', margin: '1px 0 0 20px', fontStyle: 'italic' },
  totalFila: { display: 'flex', justifyContent: 'space-between', margin: '2px 0' },
  totalLabel: { fontSize: '9pt' },
  totalValor: { fontSize: '9pt', fontWeight: 'bold' },
  totalGrande: { borderTop: '1px solid #000', marginTop: '4px', paddingTop: '4px' },
  totalLabelGrande: { fontSize: '12pt', fontWeight: 'bold' },
  totalValorGrande: { fontSize: '12pt', fontWeight: 'bold' },
  notasTitulo: { fontSize: '8.5pt', fontWeight: 'bold', margin: '2px 0' },
  notasTexto: { fontSize: '8.5pt', margin: '2px 0', fontStyle: 'italic' },
  estadoTexto: { fontSize: '10pt', fontWeight: 'bold', textAlign: 'center' },
  pie: { textAlign: 'center', marginTop: '4px' },
  pieTitulo: { fontSize: '9.5pt', fontWeight: 'bold', margin: '2px 0' },
  pieSubtitulo: { fontSize: '8pt', margin: '1px 0' },
  pieFecha: { fontSize: '7pt', color: '#444', margin: '2px 0' },
} 
