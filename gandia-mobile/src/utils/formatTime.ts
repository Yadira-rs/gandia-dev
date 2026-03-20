export function formatTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)    return 'Ahora'
  if (diff < 3600)  return 'Hace ' + Math.floor(diff / 60) + ' min'
  if (diff < 86400) return 'Hace ' + Math.floor(diff / 3600) + ' h'
  return 'Ayer'
}
