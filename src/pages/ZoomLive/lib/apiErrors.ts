import type { AxiosError } from 'axios'

/**
 * React Query errors from our axios client are usually rejected as a string
 * (`response.data.message`). This normalizes unknown / Error / Axios shapes.
 */
export function getQueryErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim()) {
    return error.trim()
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }
  const ax = error as AxiosError<{ message?: string | string[] }>
  const data = ax.response?.data
  if (data && typeof data === 'object' && data !== null && 'message' in data) {
    const m = data.message
    if (typeof m === 'string' && m.trim()) return m.trim()
    if (Array.isArray(m) && typeof m[0] === 'string' && m[0].trim()) {
      return m[0].trim()
    }
  }
  return fallback
}
