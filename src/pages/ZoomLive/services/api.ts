import apiClient from '@zoom/lib/axios'

export type Paginated<T> = {
  results: T[]
  total: number
  page: number
  limit: number
}

export async function apiGet<T>(path: string, params?: Record<string, any>): Promise<T> {
  const response = await apiClient.get<T>(path, { params })
  return response.data
}

export async function apiPost<T>(path: string, body?: any): Promise<T> {
  const response = await apiClient.post<T>(path, body)
  return response.data
}

export async function apiPut<T>(path: string, body?: any): Promise<T> {
  const response = await apiClient.put<T>(path, body)
  return response.data
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await apiClient.delete<T>(path)
  return response.data
}

export async function apiPatch<T>(path: string, body?: any): Promise<T> {
  const response = await apiClient.patch<T>(path, body)
  return response.data
}

