import axios from 'axios'

import { API_URL as BASE_URL } from './config'

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  registro: (datos) => api.post('/auth/registro', datos),
}

export const restaurantesService = {
  listar: () => api.get('/restaurantes/'),
  menu: (id) => api.get(`/restaurantes/${id}/menu`),
  crearPerfil: (datos) => api.post('/restaurantes/mi-perfil', datos),
  agregarPlatillo: (datos) => api.post('/restaurantes/mi-perfil/platillo', datos),
  toggleAbierto: (abierto) => api.patch('/restaurantes/mi-perfil/estado', { abierto }),
  actualizarDatosBancarios: (datos) => api.patch('/restaurantes/mi-perfil/datos-bancarios', datos),
}

export const pedidosService = {
  crear: (datos) => api.post('/pedidos/', datos),
  misPedidos: () => api.get('/pedidos/mis-pedidos'),
  cambiarEstado: (id, estado) => api.patch(`/pedidos/${id}/estado`, { estado })
}

export const chatService = {
  obtener: (pedidoId) => api.get(`/chat/${pedidoId}`),
  enviar: (pedidoId, contenido) => api.post(`/chat/${pedidoId}`, { contenido })
}

export default api
