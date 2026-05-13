import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/api'

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
      const res = await authService.login(email, password)
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('rol', res.data.rol)
      localStorage.setItem('nombre', res.data.nombre)
      localStorage.setItem('usuario_id', res.data.id)
      if (res.data.rol === 'restaurante') navigate('/panel')
      else navigate('/contactos')
    } catch {
      setError('Email o contraseña incorrectos')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={e.contenedor}>
      <div style={e.tarjeta}>
        <img
          src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/5.21.22/mercadopago/logo__large@2x.png"
          alt="Point Eats"
          style={e.logo}
          onError={ev => ev.target.style.display='none'}
        />
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
    fontFamily: "'Proxima Nova', 'Helvetica Neue', Helvetica, Arial, sans-serif"
  },
  tarjeta: {
    background: '#FFFFFF',
    borderRadius: '6px',
    padding: '40px 32px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.12)',
    textAlign: 'center'
  },
  logo: { height: '34px', marginBottom: '24px' },
  titulo: {
    color: '#009EE3',
    fontSize: '28px',
    fontWeight: '600',
    margin: '0 0 4px'
  },
  subtitulo: {
    color: '#666666',
    fontSize: '16px',
    margin: '0 0 32px'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' },
  campo: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: '#333333', fontSize: '14px', fontWeight: '500' },
  input: {
    border: '1px solid #CCCCCC',
    borderRadius: '6px',
    padding: '12px 14px',
    fontSize: '16px',
    color: '#333333',
    outline: 'none',
    background: '#FFFFFF',
    transition: 'border-color 0.2s'
  },
  boton: {
    background: '#009EE3',
    border: 'none',
    borderRadius: '6px',
    padding: '14px',
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    letterSpacing: '0.3px'
  },
  error: {
    background: '#FFF0F0',
    border: '1px solid #F23D4F',
    borderRadius: '6px',
    padding: '10px 14px',
    color: '#F23D4F',
    fontSize: '14px'
  },
  registro: { color: '#666666', fontSize: '14px', marginTop: '24px' },
  link: { color: '#009EE3', textDecoration: 'none', fontWeight: '500' }
}
