const DIST_BUNDLE_URL = /\/dist\/[^/?#]+\/(?:index\.html)?(?:[?#].*)?$/i;

function normalizeBase(base: string): string {
  return base.replace(/\/?$/, '/');
}

function findLoadedBundleUrl(): string | null {
  const resources = globalThis.performance?.getEntriesByType?.('resource') ?? [];

  for (let index = resources.length - 1; index >= 0; index -= 1) {
    const resourceUrl = resources[index]?.name;
    if (resourceUrl && DIST_BUNDLE_URL.test(resourceUrl)) {
      return resourceUrl;
    }
  }

  const currentUrl = globalThis.location?.href;
  return currentUrl && DIST_BUNDLE_URL.test(currentUrl) ? currentUrl : null;
}

export function initializeAssetBase(): string {
  const explicitBase = globalThis.window?.__WEBGAME_ASSET_BASE__;
  if (explicitBase) {
    return normalizeBase(explicitBase);
  }

  const bundleUrl = findLoadedBundleUrl();
  const inferredBase = bundleUrl ? new URL('../', bundleUrl).href : '../';

  if (globalThis.window) {
    globalThis.window.__WEBGAME_ASSET_BASE__ = inferredBase;
  }

  return inferredBase;
}

export function resolveAssetPath(src: string): string {
  if (!src || !src.startsWith('/')) return src;

  const base = globalThis.window?.__WEBGAME_ASSET_BASE__ || initializeAssetBase();
  return `${normalizeBase(base)}${src.replace(/^\//, '')}`;
}

export function installRuntimeFonts(): void {
  if (!globalThis.document) return;

  const styleId = 'tolove-runtime-fonts';
  const style = document.getElementById(styleId) ?? document.createElement('style');
  style.id = styleId;
  style.textContent = `
@font-face {
  font-family: 'Tokimeki Seurat';
  src: url(${JSON.stringify(resolveAssetPath('/font/FOT-SeuratPro-M.otf'))}) format('opentype');
  font-style: normal;
  font-weight: 500;
  font-display: swap;
}

@font-face {
  font-family: 'Tokimeki Arial';
  src: url(${JSON.stringify(resolveAssetPath('/font/Arial.ttf'))}) format('truetype');
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}
`;

  if (!style.isConnected) {
    document.head.append(style);
  }
}
