export interface ApiResponse<T> {
  data: T
  timestamp: string
}

export interface PaginatedData<T> {
  data: T[]
  meta: PaginationMeta
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>

export interface ApiError {
  statusCode: number
  message: string
  error: string
  path: string
  timestamp: string
}
