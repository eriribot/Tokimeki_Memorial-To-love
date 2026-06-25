export function resolveAssetPath(src) {
  if (!src || !src.startsWith('/')) return src

  const base = globalThis.window?.__WEBGAME_ASSET_BASE__
  if (!base) return src

  return `${base.replace(/\/?$/, '/')}${src.replace(/^\//, '')}`
}
