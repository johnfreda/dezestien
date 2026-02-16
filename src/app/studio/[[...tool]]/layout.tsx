'use client'

import { useEffect } from 'react'

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      #sanity-studio-wrapper {
        height: 100vh !important;
        max-height: 100vh !important;
        overflow: hidden !important;
        margin: 0;
      }

      [data-ui="Navbar"] {
        position: sticky !important;
        top: 0 !important;
        z-index: 1000 !important;
      }

      /* Pane footer sticky onderaan — publish/discard knoppen */
      [data-testid="pane-footer"],
      [data-testid="document-panel-footer"],
      [data-ui="PaneFooter"],
      [data-testid="document-actions"],
      [data-testid="document-actions"] > div {
        position: sticky !important;
        bottom: 0 !important;
        z-index: 1000 !important;
        background: var(--card-bg-color, #101112) !important;
        border-top: 1px solid var(--card-border-color, #272a2e) !important;
        flex-shrink: 0 !important;
      }

      [data-testid="action-Publish"],
      button[data-testid="action-Publish"] {
        position: relative !important;
        z-index: 1001 !important;
        visibility: visible !important;
        opacity: 1 !important;
      }

      /* Document panel: intern scrollen */
      [data-testid="document-pane"],
      [data-testid="document-panel"] {
        display: flex !important;
        flex-direction: column !important;
        max-height: 100% !important;
        overflow: hidden !important;
      }

      [data-testid="document-panel-scroller"] {
        flex: 1 !important;
        overflow-y: auto !important;
        min-height: 0 !important;
      }

      [data-testid="form-view"] {
        overflow-y: auto !important;
      }
    `
    document.head.appendChild(style)

    // MutationObserver: forceer sticky op footer-elementen als CSS selectors niet matchen
    const footerSelectors = [
      '[data-testid="pane-footer"]',
      '[data-testid="document-panel-footer"]',
      '[data-ui="PaneFooter"]',
      '[data-testid="document-actions"]',
    ]

    const observer = new MutationObserver(() => {
      const wrapper = document.getElementById('sanity-studio-wrapper')
      if (!wrapper) return

      for (const sel of footerSelectors) {
        const el = wrapper.querySelector(sel) as HTMLElement | null
        if (el && getComputedStyle(el).position !== 'sticky') {
          el.style.position = 'sticky'
          el.style.bottom = '0'
          el.style.zIndex = '1000'
          el.style.background = 'var(--card-bg-color, #101112)'
          el.style.borderTop = '1px solid var(--card-border-color, #272a2e)'
        }
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.head.removeChild(style)
      observer.disconnect()
    }
  }, [])

  return (
    <div id="sanity-studio-wrapper" style={{ height: '100vh', maxHeight: '100vh', overflow: 'hidden', margin: 0 }}>
      {children}
    </div>
  )
}
