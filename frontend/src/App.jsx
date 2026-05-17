import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Contactos from './pages/Contactos'
import Chat from './pages/Chat'
import Panel from './pages/Panel'
import PanelPedidos from './pages/PanelPedidos'
import PanelMenu from './pages/PanelMenu'
import PanelPromociones from './pages/PanelPromociones'
import PanelConfig from './pages/PanelConfig'
import PanelChats from './pages/PanelChats'
import PanelChatDetalle from './pages/PanelChatDetalle'
import PanelPerfil from './pages/PanelPerfil'
import Comanda from './pages/Comanda'
import Admin from './pages/Admin'
import AdminRestaurantes from './pages/AdminRestaurantes'
import AdminUsuarios from './pages/AdminUsuarios'
import AdminPedidos from './pages/AdminPedidos'

function ProtectedRoute({ children, rol }) {
  const token = localStorage.getItem('token')
  const userRol = localStorage.getItem('rol')
  if (!token) return <Navigate to="/login" />
  if (rol && userRol !== rol) return <Navigate to="/login" />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/contactos" element={
          <ProtectedRoute rol="cliente"><Contactos /></ProtectedRoute>
        } />
        <Route path="/chat/:restauranteId" element={
          <ProtectedRoute rol="cliente"><Chat /></ProtectedRoute>
        } />
        <Route path="/panel" element={
          <ProtectedRoute rol="restaurante"><Panel /></ProtectedRoute>
        } />
        <Route path="/panel/chats" element={
          <ProtectedRoute rol="restaurante"><PanelChats /></ProtectedRoute>
        } />
        <Route path="/panel/chat/:pedidoId" element={
          <ProtectedRoute rol="restaurante"><PanelChatDetalle /></ProtectedRoute>
        } />
        <Route path="/panel/comanda/:pedidoId" element={
          <ProtectedRoute rol="restaurante"><Comanda /></ProtectedRoute>
        } />
        <Route path="/panel/pedidos" element={
          <ProtectedRoute rol="restaurante"><PanelPedidos /></ProtectedRoute>
        } />
        <Route path="/panel/menu" element={
          <ProtectedRoute rol="restaurante"><PanelMenu /></ProtectedRoute>
        } />
        <Route path="/panel/promociones" element={
          <ProtectedRoute rol="restaurante"><PanelPromociones /></ProtectedRoute>
        } />
        <Route path="/panel/perfil" element={
          <ProtectedRoute rol="restaurante"><PanelPerfil /></ProtectedRoute>
        } />
        <Route path="/panel/config" element={
          <ProtectedRoute rol="restaurante"><PanelConfig /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute rol="admin"><Admin /></ProtectedRoute>
        } />
        <Route path="/admin/restaurantes" element={
          <ProtectedRoute rol="admin"><AdminRestaurantes /></ProtectedRoute>
        } />
        <Route path="/admin/usuarios" element={
          <ProtectedRoute rol="admin"><AdminUsuarios /></ProtectedRoute>
        } />
        <Route path="/admin/pedidos" element={
          <ProtectedRoute rol="admin"><AdminPedidos /></ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}