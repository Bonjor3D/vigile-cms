import type { VisualNode, NodeConnection } from './nodeDefinitions.ts'

function getConnectedValue(nodeId: string, portId: string, allNodes: VisualNode[], connections: NodeConnection[]): string | null {
  const conn = connections.find((c) => c.toNode === nodeId && c.toPort === portId)
  if (!conn) return null
  const source = allNodes.find((n) => n.id === conn.fromNode)
  if (!source) return null
  if (source.type === 'reroute') return getConnectedValue(source.id, 'in', allNodes, connections)
  if (source.type === 'css-color') return source.params.value
  if (source.params.value !== undefined) return String(source.params.value)
  if (source.params.initValue !== undefined) return String(source.params.initValue)
  return null
}

export function compileCSS(nodes: VisualNode[], connections: NodeConnection[]): string {
  const cssNodes = nodes.filter((n) => n.category === 'css')
  if (cssNodes.length === 0) return ''

  const allNodes = nodes

  const connMap = new Map<string, NodeConnection[]>()
  for (const conn of connections) {
    if (!connMap.has(conn.fromNode)) connMap.set(conn.fromNode, [])
    connMap.get(conn.fromNode)!.push(conn)
    if (!connMap.has(conn.toNode)) connMap.set(conn.toNode, [])
    connMap.get(conn.toNode)!.push(conn)
  }

  const nodeMap = new Map(cssNodes.map((n) => [n.id, n]))

  const visited = new Set<string>()
  const chains: { selector: string; pseudo: string; media: string; properties: string[] }[] = []

  function pval(node: VisualNode, key: string): string {
    const connected = getConnectedValue(node.id, key, allNodes, connections)
    return connected ?? (node.params[key] ?? '')
  }

  function findChain(nodeId: string, chain: { selector: string; pseudo: string; media: string; properties: string[] }) {
    if (visited.has(nodeId)) return
    visited.add(nodeId)

    const node = nodeMap.get(nodeId)
    if (!node) return

    const params = node.params

    switch (node.type) {
      case 'css-selector':
        chain.selector = pval(node, 'selector') || '.my-class'
        break
      case 'css-pseudo':
        chain.pseudo = pval(node, 'pseudo') || 'hover'
        break
      case 'css-media':
        if (params.maxWidth) chain.media = `(max-width: ${params.maxWidth}px)`
        if (params.minWidth) chain.media = `(min-width: ${params.minWidth}px)${chain.media ? ` and ${chain.media}` : ''}`
        break
      case 'css-color': {
        const val = pval(node, 'value') || params.value || '#000'
        chain.properties.push(`${params.property || 'color'}: ${val};`)
        break
      }
      case 'css-size':
        if (params.width) chain.properties.push(`width: ${pval(node, 'width') || params.width}${params.unit || 'px'};`)
        if (params.height) chain.properties.push(`height: ${pval(node, 'height') || params.height}${params.unit || 'px'};`)
        break
      case 'css-spacing': {
        const mTop = params.marginTop; const mRight = params.marginRight; const mBottom = params.marginBottom; const mLeft = params.marginLeft
        if (mTop || mRight || mBottom || mLeft) {
          if (mTop === mRight && mRight === mBottom && mBottom === mLeft) {
            chain.properties.push(`margin: ${mTop}px;`)
          } else {
            chain.properties.push(`margin: ${mTop}px ${mRight}px ${mBottom}px ${mLeft}px;`)
          }
        }
        const pTop = params.paddingTop; const pRight = params.paddingRight; const pBottom = params.paddingBottom; const pLeft = params.paddingLeft
        if (pTop || pRight || pBottom || pLeft) {
          if (pTop === pRight && pRight === pBottom && pBottom === pLeft) {
            chain.properties.push(`padding: ${pTop}px;`)
          } else {
            chain.properties.push(`padding: ${pTop}px ${pRight}px ${pBottom}px ${pLeft}px;`)
          }
        }
        break
      }
      case 'css-typography':
        if (params.fontSize) chain.properties.push(`font-size: ${params.fontSize}px;`)
        if (params.fontFamily) chain.properties.push(`font-family: ${params.fontFamily};`)
        if (params.fontWeight) chain.properties.push(`font-weight: ${params.fontWeight};`)
        if (params.textAlign) chain.properties.push(`text-align: ${params.textAlign};`)
        if (params.lineHeight) chain.properties.push(`line-height: ${params.lineHeight};`)
        break
      case 'css-background':
        if (params.bgColor || pval(node, 'color')) chain.properties.push(`background: ${pval(node, 'color') || params.bgColor};`)
        if (params.gradient) chain.properties.push(`background: ${params.gradient};`)
        if (params.image || pval(node, 'image')) chain.properties.push(`background-image: url(${pval(node, 'image') || params.image});`)
        break
      case 'css-border':
        if (params.width && params.style) chain.properties.push(`border: ${pval(node, 'width') || params.width}px ${params.style} ${pval(node, 'color') || params.color || '#d1d5db'};`)
        if (params.radius) chain.properties.push(`border-radius: ${params.radius}px;`)
        break
      case 'css-shadow': {
        const inset = params.inset ? 'inset ' : ''
        chain.properties.push(`box-shadow: ${inset}${params.x}px ${params.y}px ${params.blur}px ${params.spread}px ${params.color};`)
        break
      }
      case 'css-flexbox':
        chain.properties.push(`display: flex;`)
        if (params.direction) chain.properties.push(`flex-direction: ${params.direction};`)
        if (params.wrap) chain.properties.push(`flex-wrap: ${params.wrap};`)
        if (params.justify) chain.properties.push(`justify-content: ${params.justify};`)
        if (params.align) chain.properties.push(`align-items: ${params.align};`)
        if (params.gap) chain.properties.push(`gap: ${params.gap}px;`)
        break
      case 'css-grid':
        chain.properties.push(`display: grid;`)
        if (params.columns) chain.properties.push(`grid-template-columns: ${params.columns};`)
        if (params.rows) chain.properties.push(`grid-template-rows: ${params.rows};`)
        if (params.gap) chain.properties.push(`gap: ${params.gap}px;`)
        if (params.template) chain.properties.push(`grid-template-areas: ${params.template};`)
        break
      case 'css-transform': {
        const transforms: string[] = []
        if (params.rotate && params.rotate !== '0') transforms.push(`rotate(${params.rotate}deg)`)
        if (params.scaleX !== '1' || params.scaleY !== '1') transforms.push(`scale(${params.scaleX}, ${params.scaleY})`)
        if (params.translateX !== '0' || params.translateY !== '0') transforms.push(`translate(${params.translateX}px, ${params.translateY}px)`)
        if (params.skewX !== '0' || params.skewY !== '0') transforms.push(`skew(${params.skewX}deg, ${params.skewY}deg)`)
        if (transforms.length > 0) chain.properties.push(`transform: ${transforms.join(' ')};`)
        break
      }
      case 'css-filter': {
        const filters: string[] = []
        if (params.blur && params.blur !== '0') filters.push(`blur(${params.blur}px)`)
        if (params.brightness && params.brightness !== '100') filters.push(`brightness(${params.brightness}%)`)
        if (params.contrast && params.contrast !== '100') filters.push(`contrast(${params.contrast}%)`)
        if (params.grayscale && params.grayscale !== '0') filters.push(`grayscale(${params.grayscale}%)`)
        if (params.hue && params.hue !== '0') filters.push(`hue-rotate(${params.hue}deg)`)
        if (filters.length > 0) chain.properties.push(`filter: ${filters.join(' ')};`)
        break
      }
      case 'css-custom-prop':
        chain.properties.push(`--${params.name}: ${params.value};`)
        break
      case 'css-animation':
        chain.properties.push(`animation: ${params.name} ${params.duration}s ${params.timing} ${params.delay}s ${params.iteration};`)
        break
      case 'css-raw':
        chain.properties.push(params.raw)
        break
    }

    // Follow connections to find next nodes in the chain
    const outConns = connections.filter((c) => c.fromNode === nodeId)
    for (const conn of outConns) {
      findChain(conn.toNode, chain)
    }
  }

  // Start from selector nodes or any node without incoming connections
  const startNodes = cssNodes.filter((n) => !connections.some((c) => c.toNode === n.id))
  if (startNodes.length === 0 && cssNodes.length > 0) {
    // If no clear start, just use all nodes
    for (const node of cssNodes) {
      const chain = { selector: '.sc-' + node.id.slice(0, 8), pseudo: '', media: '', properties: [] as string[] }
      findChain(node.id, chain)
      if (chain.properties.length > 0) chains.push(chain)
    }
  } else {
    for (const node of startNodes) {
      const chain = { selector: '.sc-' + node.id.slice(0, 8), pseudo: '', media: '', properties: [] as string[] }
      findChain(node.id, chain)
      if (chain.properties.length > 0) chains.push(chain)
    }
  }

  // Build output
  const output: string[] = []
  for (const chain of chains) {
    if (chain.properties.length === 0) continue
    const selector = chain.selector + (chain.pseudo ? `:${chain.pseudo}` : '')
    const block = `  ${chain.properties.join('\n  ')}`
    if (chain.media) {
      output.push(`@media ${chain.media} {\n${selector} {\n${block}\n}\n}`)
    } else {
      output.push(`${selector} {\n${block}\n}`)
    }
  }

  return output.join('\n\n')
}
