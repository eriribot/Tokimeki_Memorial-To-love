/**
 * screenfull 的项目内精简版。
 *
 * 来源：https://github.com/sindresorhus/screenfull
 * 许可证：MIT，完整声明见 ../../THIRD_PARTY_NOTICES.md。
 *
 * 仅保留本项目需要的能力：跨浏览器方法映射、进入、退出、状态读取与事件监听。
 * 没有复制演示、toggle、别名和 raw API，避免把未使用代码带入游戏包。
 */

type FullscreenEventName = 'change' | 'error'
type FullscreenListener = EventListenerOrEventListenerObject

interface FullscreenMethodMap {
  request: string
  exit: string
  element: string
  enabled: string
  change: string
  error: string
}

const methodCandidates: string[][] = [
  ['requestFullscreen', 'exitFullscreen', 'fullscreenElement', 'fullscreenEnabled', 'fullscreenchange', 'fullscreenerror'],
  ['webkitRequestFullscreen', 'webkitExitFullscreen', 'webkitFullscreenElement', 'webkitFullscreenEnabled', 'webkitfullscreenchange', 'webkitfullscreenerror'],
  ['webkitRequestFullScreen', 'webkitCancelFullScreen', 'webkitCurrentFullScreenElement', 'webkitCancelFullScreen', 'webkitfullscreenchange', 'webkitfullscreenerror'],
  ['mozRequestFullScreen', 'mozCancelFullScreen', 'mozFullScreenElement', 'mozFullScreenEnabled', 'mozfullscreenchange', 'mozfullscreenerror'],
  ['msRequestFullscreen', 'msExitFullscreen', 'msFullscreenElement', 'msFullscreenEnabled', 'MSFullscreenChange', 'MSFullscreenError'],
]

/** 从当前浏览器支持的方法组中选出一套完整 API，避免业务组件自行判断前缀。 */
function detectFullscreenMethods(): FullscreenMethodMap | null {
  const fullscreenDocument = document as unknown as Record<string, unknown>

  for (const methods of methodCandidates) {
    if (methods[1] in fullscreenDocument) {
      return {
        request: methods[0],
        exit: methods[1],
        element: methods[2],
        enabled: methods[3],
        change: methods[4],
        error: methods[5],
      }
    }
  }

  return null
}

const methods = detectFullscreenMethods()

function eventName(type: FullscreenEventName): string | null {
  if (!methods) return null
  return type === 'change' ? methods.change : methods.error
}

function on(type: FullscreenEventName, listener: FullscreenListener): void {
  const name = eventName(type)
  if (name) document.addEventListener(name, listener, false)
}

function off(type: FullscreenEventName, listener: FullscreenListener): void {
  const name = eventName(type)
  if (name) document.removeEventListener(name, listener, false)
}

async function request(element: HTMLElement, options?: FullscreenOptions): Promise<void> {
  if (!methods) throw new Error('当前浏览器不支持 Fullscreen API')

  const requestMethod = (element as unknown as Record<string, unknown>)[methods.request]
  if (typeof requestMethod !== 'function') throw new Error('当前元素不能进入全屏')

  await new Promise<void>((resolve, reject) => {
    let settled = false
    const handleChange = () => {
      if (settled) return
      settled = true
      off('change', handleChange)
      resolve()
    }

    // 先监听再调用：兼容不返回 Promise、只派发 fullscreenchange 的旧浏览器。
    on('change', handleChange)

    try {
      const result = requestMethod.call(element, options)
      if (result instanceof Promise) {
        result.then(handleChange).catch(error => {
          off('change', handleChange)
          reject(error)
        })
      }
    } catch (error) {
      off('change', handleChange)
      reject(error)
    }
  })
}

async function exit(): Promise<void> {
  if (!methods || !screenfull.isFullscreen) return

  const fullscreenDocument = document as unknown as Record<string, unknown>
  const exitMethod = fullscreenDocument[methods.exit]
  if (typeof exitMethod !== 'function') return

  await new Promise<void>((resolve, reject) => {
    let settled = false
    const handleChange = () => {
      if (settled) return
      settled = true
      off('change', handleChange)
      resolve()
    }
    on('change', handleChange)

    try {
      const result = exitMethod.call(document)
      if (result instanceof Promise) {
        result.then(handleChange).catch(error => {
          off('change', handleChange)
          reject(error)
        })
      }
    } catch (error) {
      off('change', handleChange)
      reject(error)
    }
  })
}

const screenfull = {
  request,
  exit,
  on,
  off,

  get isEnabled(): boolean {
    if (!methods) return false
    return Boolean((document as unknown as Record<string, unknown>)[methods.enabled])
  },

  get isFullscreen(): boolean {
    if (!methods) return false
    return Boolean((document as unknown as Record<string, unknown>)[methods.element])
  },

  get element(): Element | undefined {
    if (!methods) return undefined
    return ((document as unknown as Record<string, unknown>)[methods.element] as Element | null) ?? undefined
  },
}

export default screenfull
