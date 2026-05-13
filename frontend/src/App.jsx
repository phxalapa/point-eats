import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Contactos from './pages/Contactos'
import Chat from './pages/Chat'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/contactos" element={
          <ProtectedRoute><Contactos /></ProtectedRoute>
        } />
        <Route path="/chat/:restauranteId" element={
          <ProtectedRoute><Chat /></ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}