import axios from 'axios'

const API = axios.create({
  baseURL: 'https://crm-backend-4yp0.onrender.com/api',
  withCredentials: true,
})

API.interceptors.request.use(config => {

  const token = localStorage.getItem('crm2_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default API