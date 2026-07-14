const PAGE_OVERLAY_ATTRIBUTE = 'data-tolove-browser-page-overlay';

export interface BrowserPageOverlay {
  frame: HTMLIFrameElement;
  hostDocument: Document;
  mount: HTMLDivElement;
  ownerDocument: Document;
  destroy: () => void;
}

function findHighestAccessibleWindow(): Window {
  let currentWindow: Window = window;

  while (currentWindow.parent !== currentWindow) {
    try {
      const parentWindow = currentWindow.parent;
      void parentWindow.document.documentElement;
      currentWindow = parentWindow;
    } catch {
      break;
    }
  }

  return currentWindow;
}

function cloneInterfaceStyles(sourceDocument: Document, targetDocument: Document): void {
  sourceDocument.querySelectorAll('style, link[rel="stylesheet"]').forEach(sourceNode => {
    const clonedNode = sourceNode.cloneNode(true) as HTMLStyleElement | HTMLLinkElement;

    if (sourceNode instanceof HTMLLinkElement && clonedNode instanceof HTMLLinkElement) {
      clonedNode.href = sourceNode.href;
    }

    targetDocument.head.append(clonedNode);
  });
}

function restoreInlineStyle(element: HTMLElement, previousStyle: string | null): void {
  if (previousStyle === null) {
    element.removeAttribute('style');
    return;
  }

  element.setAttribute('style', previousStyle);
}

/**
 * Creates a top-level carrier under the highest same-origin page (SillyTavern in
 * normal Tavern Helper usage). React keeps running in the original helper frame
 * and renders into this carrier through a portal, so helper globals and save
 * transports remain available.
 */
export function createBrowserPageOverlay(): BrowserPageOverlay | null {
  const hostWindow = findHighestAccessibleWindow();
  const isNested = window.parent !== window;

  if (isNested && hostWindow === window) {
    return null;
  }

  const hostDocument = hostWindow.document;
  const hostBody = hostDocument.body;
  if (!hostBody) {
    return null;
  }

  hostDocument.querySelectorAll<HTMLIFrameElement>(`iframe[${PAGE_OVERLAY_ATTRIBUTE}]`).forEach(staleFrame => {
    staleFrame.remove();
  });

  const previousHtmlStyle = hostDocument.documentElement.getAttribute('style');
  const previousBodyStyle = hostBody.getAttribute('style');
  const frame = hostDocument.createElement('iframe');
  frame.setAttribute(PAGE_OVERLAY_ATTRIBUTE, 'true');
  frame.setAttribute('allow', 'autoplay; fullscreen');
  frame.setAttribute('aria-label', 'ToLOVE 全屏游戏界面');
  frame.title = 'ToLOVE 全屏游戏界面';
  frame.tabIndex = 0;

  const frameStyles: Record<string, string> = {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    maxWidth: 'none',
    maxHeight: 'none',
    margin: '0',
    padding: '0',
    border: '0',
    borderRadius: '0',
    background: '#000',
    zIndex: '2147483646',
    colorScheme: 'light',
  };

  Object.entries(frameStyles).forEach(([property, value]) => {
    frame.style.setProperty(property.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`), value, 'important');
  });

  hostBody.append(frame);

  const overlayDocument = frame.contentDocument;
  if (!overlayDocument?.head || !overlayDocument.body) {
    frame.remove();
    return null;
  }

  overlayDocument.documentElement.lang = document.documentElement.lang || 'zh-CN';
  overlayDocument.title = 'ToLOVE';
  overlayDocument.head.replaceChildren();
  overlayDocument.body.replaceChildren();
  cloneInterfaceStyles(document, overlayDocument);

  const baseStyle = overlayDocument.createElement('style');
  baseStyle.setAttribute('data-tolove-overlay-base', 'true');
  baseStyle.textContent = `
html,
body {
  width: 100%;
  height: 100%;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  background: #000;
}

#root {
  width: 100%;
  height: 100%;
  min-height: 0 !important;
  overflow: hidden;
}
`;
  overlayDocument.head.append(baseStyle);

  const mount = overlayDocument.createElement('div');
  mount.id = 'root';
  overlayDocument.body.append(mount);

  hostDocument.documentElement.style.setProperty('overflow', 'hidden', 'important');
  hostBody.style.setProperty('overflow', 'hidden', 'important');

  let destroyed = false;
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    frame.remove();
    restoreInlineStyle(hostDocument.documentElement, previousHtmlStyle);
    restoreInlineStyle(hostBody, previousBodyStyle);
  };

  return {
    frame,
    hostDocument,
    mount,
    ownerDocument: overlayDocument,
    destroy,
  };
}
