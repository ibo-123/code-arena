import axios, { AxiosInstance, AxiosError } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  get = <T,>(url: string, params?: Record<string, unknown>) =>
    this.client.get<T>(url, { params }).then((res) => res.data)

  post = <T,>(url: string, data?: unknown) =>
    this.client.post<T>(url, data).then((res) => res.data)

  put = <T,>(url: string, data?: unknown) =>
    this.client.put<T>(url, data).then((res) => res.data)

  delete = <T,>(url: string) =>
    this.client.delete<T>(url).then((res) => res.data)
}

export const api = new ApiClient()
