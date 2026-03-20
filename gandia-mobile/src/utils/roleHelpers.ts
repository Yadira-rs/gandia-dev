import { ROLE_NAMES } from '../constants/roles'

export function getRoleName(role: string): string {
  return ROLE_NAMES[role] ?? role
}

export const isProducer = (r: string) => r === 'producer'
export const isMVZ      = (r: string) => r === 'mvz'
export const isUnion    = (r: string) => r === 'union'
export const isExporter = (r: string) => r === 'exporter'
export const isAuditor  = (r: string) => r === 'auditor'
