export function buildFilterHref(
  basePath: string,
  current: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>
): string {
  const merged = { ...current, ...overrides }
  const params = new URLSearchParams()
  Object.entries(merged).forEach(([k, v]) => {
    if (v !== undefined && v !== "") params.set(k, v)
  })
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}