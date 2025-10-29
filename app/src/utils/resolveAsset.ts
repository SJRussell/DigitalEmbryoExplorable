const normalize = (value: string, ensureTrailingSlash: boolean) => {
  if (ensureTrailingSlash) return value.endsWith('/') ? value : `${value}/`
  return value.startsWith('/') ? value.slice(1) : value
}

export const resolveAssetUrl = (relativePath: string) => {
  const base = import.meta.env.BASE_URL ?? '/'
  const normalizedBase = normalize(base, true)
  const normalizedPath = normalize(relativePath, false)
  return `${normalizedBase}${normalizedPath}`
}
