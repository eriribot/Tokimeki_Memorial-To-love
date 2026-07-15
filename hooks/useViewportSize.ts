import { useEffect, useState } from 'react'

/** 当前用户真正可见的视口尺寸，单位为 CSS 像素。 */
export interface ViewportSize {
  width: number
  height: number
}

/**
 * 读取可用区域时取三者中的较小值：
 * - VisualViewport：手机地址栏、底栏和缩放后的可见范围；
 * - innerWidth/innerHeight：普通桌面浏览器内容区域；
 * - screen.availWidth/availHeight：扣除 Windows 任务栏等系统保留区域后的屏幕范围。
 */
function measureViewport(): ViewportSize {
  const visualViewport = window.visualViewport
  const layoutWidth = visualViewport?.width ?? window.innerWidth
  const layoutHeight = visualViewport?.height ?? window.innerHeight
  const screenWidth = window.screen.availWidth || layoutWidth
  const screenHeight = window.screen.availHeight || layoutHeight

  return {
    width: Math.max(1, Math.floor(Math.min(layoutWidth, screenWidth))),
    height: Math.max(1, Math.floor(Math.min(layoutHeight, screenHeight))),
  }
}

/**
 * 基于 react-div-100vh 的测量模式，并改用 VisualViewport 处理现代移动浏览器。
 * resize、横竖屏和全屏事件会在下一帧合并更新，避免一次切换触发多次 React 重排。
 */
export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>(() => measureViewport())

  useEffect(() => {
    let animationFrame = 0

    const update = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(() => {
        const nextSize = measureViewport()
        setSize(current =>
          current.width === nextSize.width && current.height === nextSize.height ? current : nextSize,
        )
      })
    }

    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    document.addEventListener('fullscreenchange', update)
    window.visualViewport?.addEventListener('resize', update)

    update()

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      document.removeEventListener('fullscreenchange', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [])

  return size
}
