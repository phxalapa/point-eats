import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { API_URL } from '../services/config'

export default function Registro() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    confirmar: ''
  })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const actualizar = (campo, valor) => setForm(p => ({ ...p, [campo]: valor }))

  const validar = () => {
    if (!form.nombre.trim()) return 'El nombre es obligatorio'
    if (form.nombre.trim().split(' ').length < 2) return 'Escribe tu nombre completo'
    if (!form.email.trim()) return 'El correo es obligatorio'
    if (!form.email.includes('@')) return 'El correo no es válido'
    if (!form.telefono.trim()) return 'El celular es obligatorio'
    if (form.telefono.replace(/\D/g, '').length < 10) return 'El celular debe tener 10 dígitos'
    if (!form.password) return 'La contraseña es obligatoria'
    if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
    if (form.password !== form.confirmar) return 'Las contraseñas no coinciden'
    return null
  }

  const handleRegistro = async (e) => {
    e.preventDefault()
    const err = validar()
    if (err) { setError(err); return }

    setCargando(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          email: form.email.trim().toLowerCase(),
          telefono: form.telefono.replace(/\D/g, ''),
          password: form.password,
          rol: 'cliente'
        })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Error al crear la cuenta')
        return
      }

      localStorage.setItem('token', data.access_token)
      localStorage.setItem('rol', data.rol)
      localStorage.setItem('nombre', data.nombre)
      localStorage.setItem('usuario_id', data.id)
      navigate('/contactos')

    } catch {
      setError('Error de conexión. Verifica que el servidor esté corriendo.')
    } finally {
      setCargando(false)
    }
  }

  const formatTelefono = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0,3)} ${digits.slice(3)}`
    return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6)}`
  }

  return (
    <div style={e.contenedor}>
      <div style={e.tarjeta}>

        {/* Logo */}
        <div style={e.logoWrap}>
          <span style={e.logoEmoji}>🍽️</span>
        </div>
        <h1 style={e.titulo}>Crear cuenta</h1>
        <p style={e.subtitulo}>Únete a Point Eats gratis</p>

        <form onSubmit={handleRegistro} style={e.form}>

          {/* Nombre completo */}
          <div style={e.campo}>
            <label style={e.label}>Nombre completo</label>
            <div style={e.inputWrap}>
              <span style={e.inputIcono}>👤</span>
              <input
                style={e.input}
                type="text"
                placeholder="Ej: Juan García López"
                value={form.nombre}
                onChange={ev => actualizar('nombre', ev.target.value)}
                autoComplete="name"
              />
            </div>
          </div>

          {/* Correo */}
          <div style={e.campo}>
            <label style={e.label}>Correo electrónico</label>
            <div style={e.inputWrap}>
              <span style={e.inputIcono}>✉️</span>
              <input
                style={e.input}
                type="email"
                placeholder="ejemplo@correo.com"
                value={form.email}
                onChange={ev => actualizar('email', ev.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Celular */}
          <div style={e.campo}>
            <label style={e.label}>Número de celular</label>
            <div style={e.inputWrap}>
              <span style={e.inputIcono}>📱</span>
              <input
                style={e.input}
                type="tel"
                placeholder="000 000 0000"
                value={form.telefono}
                onChange={ev => actualizar('telefono', formatTelefono(ev.target.value))}
                autoComplete="tel"
              />
            </div>
            <p style={e.hint}>10 dígitos sin espacios ni guiones</p>
          </div>

          {/* Contraseña */}
          <div style={e.campo}>
            <label style={e.label}>Contraseña</label>
            <div style={e.inputWrap}>
              <span style={e.inputIcono}>🔒</span>
              <input
                style={e.input}
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={ev => actualizar('password', ev.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Confirmar contraseña */}
          <div style={e.campo}>
            <label style={e.label}>Confirmar contraseña</label>
            <div style={e.inputWrap}>
              <span style={e.inputIcono}>🔒</span>
              <input
                style={e.input}
                type="password"
                placeholder="Repite tu contraseña"
                value={form.confirmar}
                onChange={ev => actualizar('confirmar', ev.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={e.error}>
              ⚠️ {error}
            </div>
          )}

          {/* Botón */}
          <button style={e.boton} type="submit" disabled={cargando}>
            {cargando ? '⏳ Creando cuenta...' : '🚀 Crear mi cuenta'}
          </button>

        </form>

        <p style={e.loginLink}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={e.link}>Inicia sesión</Link>
        </p>

      </div>
    </div>
  )
}

const e = {
  contenedor: {
    minHeight: '100vh',
    background: '#F5F5F5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "'Nunito','Helvetica Neue',Helvetica,Arial,sans-serif"
  },
  tarjeta: {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '36px 28px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
    textAlign: 'center'
  },
  logoWrap: {
    width: '68px', height: '68px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #009EE3, #0077B6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 14px'
  },
  logoEmoji: { fontSize: '30px' },
  titulo: { color: '#009EE3', fontSize: '26px', fontWeight: '800', margin: '0 0 4px' },
  subtitulo: { color: '#666', fontSize: '14px', margin: '0 0 28px' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' },
  campo: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { color: '#333', fontSize: '13px', fontWeight: '700' },
  inputWrap: {
    display: 'flex', alignItems: 'center',
    border: '1px solid #E0E0E0', borderRadius: '10px',
    background: '#FAFAFA', overflow: 'hidden'
  },
  inputIcono: {
    padding: '0 10px 0 14px', fontSize: '16px', flexShrink: 0
  },
  input: {
    flex: 1, border: 'none', outline: 'none',
    padding: '13px 14px 13px 0',
    fontSize: '15px', color: '#333',
    background: 'transparent', fontFamily: 'inherit'
  },
  hint: { fontSize: '11px', color: '#aaa', margin: '2px 0 0' },
  error: {
    background: '#FFF0F0', border: '1px solid #F23D4F',
    borderRadius: '10px', padding: '12px 14px',
    color: '#C62828', fontSize: '13px', fontWeight: '600',
    textAlign: 'center', lineHeight: '1.5'
  },
  boton: {
    background: 'linear-gradient(135deg, #009EE3, #0077B6)',
    border: 'none', borderRadius: '10px',
    padding: '15px', color: '#FFFFFF',
    fontSize: '16px', fontWeight: '800',
    cursor: 'pointer', marginTop: '4px',
    boxShadow: '0 4px 14px rgba(0,158,227,0.35)'
  },
  loginLink: { color: '#666', fontSize: '14px', marginTop: '20px' },
  link: { color: '#009EE3', textDecoration: 'none', fontWeight: '700' }
} 
