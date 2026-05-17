import { useState } from 'react'
import { NavInferior } from './Panel'
import { restaurantesService } from '../services/api'

export default function PanelConfig() {
  const [banco, setBanco] = useState({ banco_nombre: '', banco_titular: '', banco_cuenta: '', banco_tarjeta: '', banco_clabe: '' })
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  const guardarBanco = async () => {
    setGuardando(true)
    try {
      await restaurantesService.actualizarDatosBancarios(banco)
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
    } catch { alert('Error al guardar') }
    finally { setGuardando(false) }
  }

  return (
    <div style={e.contenedor}>
      <div style={e.header}>
        <p style={e.headerTitulo}>⚙️ Configuración</p>
      </div>

      <div style={e.seccion}>
        <p style={e.seccionTitulo}>🏦 Datos bancarios</p>
        <p style={e.seccionDesc}>Estos datos aparecerán en el chat cuando el cliente elija pagar por transferencia.</p>

        {[
          { key: 'banco_nombre', label: 'Nombre del banco', placeholder: 'Ej: BBVA, Banamex, HSBC' },
          { key: 'banco_titular', label: 'Titular de la cuenta', placeholder: 'Nombre completo' },
          { key: 'banco_cuenta', label: 'Número de cuenta', placeholder: '10 dígitos' },
          { key: 'banco_tarjeta', label: 'Número de tarjeta', placeholder: '16 dígitos' },
          { key: 'banco_clabe', label: 'CLABE interbancaria', placeholder: '18 dígitos' },
        ].map(campo => (
          <div key={campo.key} style={e.campo}>
            <label style={e.label}>{campo.label}</label>
            <input
              style={e.input}
              placeholder={campo.placeholder}
              value={banco[campo.key]}
              onChange={ev => setBanco(p => ({ ...p, [campo.key]: ev.target.value }))}
            />
          </div>
        ))}

        <button onClick={guardarBanco} style={e.btnGuardar} disabled={guardando}>
          {guardando ? '⏳ Guardando...' : guardado ? '✅ ¡Guardado!' : '💾 Guardar datos bancarios'}
        </button>
      </div>

      <NavInferior activo="config" />
    </div>
  )
}

const e = {
  contenedor: { background: '#F5F5F5', minHeight: '100vh', maxWidth: '480px', margin: '0 auto', fontFamily: "'Nunito',sans-serif", paddingBottom: '70px' },
  header: { background: 'linear-gradient(135deg, #009EE3, #0077B6)', padding: '16px 20px' },
  headerTitulo: { color: '#fff', fontSize: '20px', fontWeight: '800', margin: 0 },
  seccion: { background: '#fff', margin: '16px', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  seccionTitulo: { fontSize: '16px', fontWeight: '800', color: '#333', margin: '0 0 6px' },
  seccionDesc: { fontSize: '13px', color: '#999', margin: '0 0 16px', lineHeight: '1.5' },
  campo: { marginBottom: '12px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#666', display: 'block', marginBottom: '5px' },
  input: { width: '100%', border: '1px solid #E0E0E0', borderRadius: '8px', padding: '11px 14px', fontSize: '14px', color: '#333', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  btnGuardar: { width: '100%', background: 'linear-gradient(135deg, #009EE3, #0077B6)', border: 'none', borderRadius: '8px', padding: '13px', color: '#fff', fontSize: '15px', fontWeight: '800', cursor: 'pointer', marginTop: '4px' },
} 
