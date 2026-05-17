import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError('')
    try {
      const res = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Credenciales incorrectas')
        return
      }

      localStorage.setItem('token', data.access_token)
      localStorage.setItem('rol', data.rol)
      localStorage.setItem('nombre', data.nombre)
      localStorage.setItem('usuario_id', data.id)

      if (data.rol === 'admin') navigate('/admin')
      else if (data.rol === 'restaurante') navigate('/panel')
      else navigate('/contactos')

    } catch (err) {
      setError('Error de conexión. Verifica que el servidor esté corriendo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={e.contenedor}>
      <div style={e.tarjeta}>
        <div style={e.logoWrap}>
          <span style={e.logoEmoji}>🍽️</span>
        </div>
        <h1 style={e.titulo}>Point Eats</h1>
        <p style={e.subtitulo}>Tu comida favorita, como un mensaje</p>

        <form onSubmit={handleLogin} style={e.form}>
          <div style={e.campo}>
            <label style={e.label}>Correo electrónico</label>
            <input
              style={e.input}
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={ev => setEmail(ev.target.value)}
              required
            />
          </div>
          <div style={e.campo}>
            <label style={e.label}>Contraseña</label>
            <input
              style={e.input}
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={ev => setPassword(ev.target.value)}
              required
            />
          </div>
          {error && <div style={e.error}>{error}</div>}
          <button style={e.boton} type="submit" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p style={e.registro}>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" style={e.link}>Crear cuenta</Link>
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
    padding: '40px 32px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
    textAlign: 'center'
  },
  logoWrap: {
    width: '72px', height: '72px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #009EE3, #0077B6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px'
  },
  logoEmoji: { fontSize: '32px' },
  titulo: { color: '#009EE3', fontSize: '28px', fontWeight: '800', margin: '0 0 4px' },
  subtitulo: { color: '#666', fontSize: '15px', margin: '0 0 32px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' },
  campo: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: '#333', fontSize: '14px', fontWeight: '600' },
  input: {
    border: '1px solid #CCCCCC', borderRadius: '8px',
    padding: '13px 14px', fontSize: '16px', color: '#333',
    outline: 'none', background: '#FAFAFA', fontFamily: 'inherit',
    width: '100%', boxSizing: 'border-box'
  },
  boton: {
    background: '#009EE3', border: 'none', borderRadius: '8px',
    padding: '14px', color: '#FFFFFF', fontSize: '16px',
    fontWeight: '700', cursor: 'pointer', marginTop: '8px',
    width: '100%'
  },
  error: {
    background: '#FFF0F0', border: '1px solid #F23D4F',
    borderRadius: '8px', padding: '10px 14px',
    color: '#F23D4F', fontSize: '14px', textAlign: 'center'
  },
  registro: { color: '#666', fontSize: '14px', marginTop: '24px' },
  link: { color: '#009EE3', textDecoration: 'none', fontWeight: '600' }
}
