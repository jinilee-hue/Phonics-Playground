import { DESIGN_MODE } from '../designMode'
import { resolveMock } from './designMocks'

/** fetch 래퍼(credentials:'include') + ApiError — studio 포팅(postForm 불필요) */
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (res.ok) {
    return (res.status === 204 ? null : await res.json()) as T
  }
  let detail = `${res.status} ${res.statusText}`
  try {
    const body = await res.json()
    if (typeof body.detail === 'string') detail = body.detail
    else if (Array.isArray(body.detail)) detail = body.detail.map((d: { msg?: string }) => d.msg).join(', ')
  } catch {
    // 본문이 JSON이 아니면 상태 텍스트 유지
  }
  throw new ApiError(res.status, detail)
}

export const api = {
  get<T>(path: string): Promise<T> {
    // 디자인 모드: 백엔드 대신 목업 반환 → /api 프록시 요청 자체를 막아 ECONNREFUSED 방지
    if (DESIGN_MODE) return Promise.resolve(resolveMock('GET', path) as T)
    return fetch(path, { credentials: 'include' }).then((r) => handle<T>(r))
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    if (DESIGN_MODE) return Promise.resolve(resolveMock('POST', path, body) as T)
    return fetch(path, {
      method: 'POST',
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then((r) => handle<T>(r))
  },
}
