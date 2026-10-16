(() => {
  const cdnUrls = [
    'https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.1/mermaid.min.js',
    'https://unpkg.com/mermaid@10.9.1/dist/mermaid.min.js',
    'https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js'
  ]

  const loadScript = src => new Promise((resolve, reject) => {
    const existing = [...document.scripts].find(script => script.src === src)
    if (existing) existing.remove()

    const script = document.createElement('script')
    script.src = src
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })

  const loadMermaid = async () => {
    if (window.mermaid) return true

    for (const url of cdnUrls) {
      try {
        await loadScript(url)
        if (window.mermaid) return true
      } catch (_) {
        // Try the next CDN.
      }
    }

    return false
  }

  const convertCodeBlocks = () => {
    document.querySelectorAll('#article-container pre > code.mermaid').forEach(code => {
      const wrap = document.createElement('div')
      wrap.className = 'mermaid-wrap'

      const source = document.createElement('pre')
      source.className = 'mermaid-src'
      source.hidden = true
      source.textContent = code.textContent

      wrap.appendChild(source)
      code.parentElement.replaceWith(wrap)
    })
  }

  const renderDiagrams = async () => {
    convertCodeBlocks()

    const wraps = [...document.querySelectorAll('#article-container .mermaid-wrap')]
    if (!wraps.length || !(await loadMermaid())) return

    window.loadMermaid = true
    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default'
    })

    for (const [index, wrap] of wraps.entries()) {
      if (wrap.querySelector('svg')) continue

      const source = wrap.querySelector('.mermaid-src')
      if (!source) continue

      try {
        const result = await window.mermaid.render(`mermaid-fallback-${index}`, source.textContent)
        source.insertAdjacentHTML('afterend', typeof result === 'string' ? result : result.svg)
      } catch (error) {
        console.error(`Mermaid fallback render failed for diagram ${index + 1}:`, error)
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderDiagrams, { once: true })
  } else {
    renderDiagrams()
  }
})()
