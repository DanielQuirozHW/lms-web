export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3000'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'

export const PORTAL_MODE = (process.env.NEXT_PUBLIC_PORTAL_MODE ?? 'MARKETPLACE') as
  | 'CORPORATE'
  | 'MARKETPLACE'
  | 'ACADEMIC'
export const isCorporate = PORTAL_MODE === 'CORPORATE'
export const isMarketplace = PORTAL_MODE === 'MARKETPLACE'
export const isAcademic = PORTAL_MODE === 'ACADEMIC'
