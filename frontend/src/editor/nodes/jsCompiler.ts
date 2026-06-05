import type { VisualNode, NodeConnection } from './nodeDefinitions.ts'

export function compileJS(nodes: VisualNode[], connections: NodeConnection[]): string {
  const jsNodes = nodes.filter((n) => n.category === 'js')
  if (jsNodes.length === 0) return ''

  const allNodes = nodes

  const nodeMap = new Map(jsNodes.map((n) => [n.id, n]))
  const connByFrom = new Map<string, NodeConnection[]>()
  const connByTo = new Map<string, NodeConnection[]>()
  for (const conn of connections) {
    if (!connByFrom.has(conn.fromNode)) connByFrom.set(conn.fromNode, [])
    connByFrom.get(conn.fromNode)!.push(conn)
    if (!connByTo.has(conn.toNode)) connByTo.set(conn.toNode, [])
    connByTo.get(conn.toNode)!.push(conn)
  }

  function getConnectedValue(nodeId: string, portId: string): string | null {
    const conns = connByTo.get(nodeId)
    if (!conns) return null
    const conn = conns.find((c) => c.toPort === portId)
    if (!conn) return null
    const source = allNodes.find((n) => n.id === conn.fromNode)
    if (!source) return null
    if (source.type === 'reroute') return getConnectedValue(source.id, 'in')
    if (source.type === 'js-variable') return source.params.name || 'undefined'
    if (source.type === 'js-query') return `document.querySelector('${source.params.selector}')`
    if (source.params.value !== undefined) return JSON.stringify(source.params.value)
    return null
  }

  function pval(node: VisualNode, key: string): string {
    const connected = getConnectedValue(node.id, key)
    return connected ?? String(node.params[key] ?? '')
  }

  // Find input values for a node port
  function getInputValue(nodeId: string, portId: string): string | null {
    const conns = connByTo.get(nodeId)
    if (!conns) return null
    const conn = conns.find((c) => c.toPort === portId)
    if (!conn) return null
    const fromNode = nodeMap.get(conn.fromNode)
    if (!fromNode) return null
    return generateValueNode(fromNode, conn.fromPort)
  }

  function generateValueNode(node: VisualNode, portId: string): string {
    const params = node.params
    switch (node.type) {
      case 'js-query':
        return `document.querySelector('${pval(node, 'selector') || params.selector}')`
      case 'js-get-attr': {
        const el = getInputValue(node.id, 'element')
        return `${el || 'element'}.${pval(node, 'attr') || params.attr}`
      }
      case 'js-variable':
        return params.name
      case 'js-math': {
        const a = getInputValue(node.id, 'a') || params.a || '0'
        const b = getInputValue(node.id, 'b') || params.b || '0'
        const opMap: Record<string, string> = { '+': '+', '-': '-', '*': '*', '/': '/', '%': '%', 'pow': '**' }
        return `(${a} ${opMap[params.op] || '+'} ${b})`
      }
      case 'js-string': {
        const a = getInputValue(node.id, 'a') || params.a || "''"
        const b = getInputValue(node.id, 'b') || params.b || "''"
        if (params.op === 'template') return `\`\$\{${a}\}\$\{${b}\}\``
        return `(${a} + ${b})`
      }
      case 'js-logic': {
        const a = getInputValue(node.id, 'a') || 'false'
        const b = getInputValue(node.id, 'b') || 'false'
        if (params.op === 'NOT') return `(!${a})`
        if (params.op === 'AND') return `(${a} && ${b})`
        return `(${a} || ${b})`
      }
      case 'js-event':
        return 'event'
      case 'js-timer':
        return `${params.type === 'timeout' ? 'setTimeout' : 'setInterval'}`
      case 'js-fetch':
        return 'responseData'
      case 'js-dom-create':
        return 'newElement'
      default:
        return JSON.stringify(params.value ?? '')
    }
  }

  function generateExecBlock(nodeId: string, visited: Set<string>, indent: string): string {
    if (visited.has(nodeId)) return ''
    visited.add(nodeId)

    const node = nodeMap.get(nodeId)
    if (!node) return ''

    const params = node.params
    const lines: string[] = []
    const nextIndent = indent + '  '

    switch (node.type) {
      case 'js-event': {
        const selector = pval(node, 'selector') || params.selector || '.element'
        const eventType = params.eventType || 'click'
        const body = generateExecBlockFromPort(nodeId, 'execOut', new Set(visited), nextIndent)
        lines.push(`document.querySelector('${selector}').addEventListener('${eventType}', (event) => {`)
        if (body) lines.push(body)
        lines.push('});')
        break
      }
      case 'js-set-attr': {
        const val = getInputValue(node.id, 'value') || params.value || "''"
        const sel = pval(node, 'selector') || params.selector || '.target'
        const attr = pval(node, 'attr') || params.attr || 'textContent'
        lines.push(`document.querySelector('${sel}').${attr} = ${val};`)
        const next = generateExecBlockFromPort(nodeId, 'execOut', visited, indent)
        if (next) lines.push(next)
        break
      }
      case 'js-console': {
        const val = getInputValue(node.id, 'value') || params.value || "''"
        lines.push(`console.${params.level || 'log'}(${val});`)
        const next = generateExecBlockFromPort(nodeId, 'execOut', visited, indent)
        if (next) lines.push(next)
        break
      }
      case 'js-condition': {
        const a = getInputValue(node.id, 'a') || params.a || 'false'
        const b = getInputValue(node.id, 'b') || params.b || 'false'
        lines.push(`if (${a} ${params.operator || '==='} ${b}) {`)
        const trueBody = generateExecBlockFromPort(nodeId, 'execTrue', new Set(visited), nextIndent)
        if (trueBody) lines.push(trueBody)
        const falseBody = generateExecBlockFromPort(nodeId, 'execFalse', new Set(visited), nextIndent)
        if (falseBody) {
          lines.push('} else {')
          lines.push(falseBody)
        }
        lines.push('}')
        break
      }
      case 'js-variable': {
        const init = getInputValue(node.id, 'init') || params.initValue || 'undefined'
        lines.push(`${params.kind || 'let'} ${params.name} = ${init};`)
        const next = generateExecBlockFromPort(nodeId, 'execOut', visited, indent)
        if (next) lines.push(next)
        break
      }
      case 'js-timer': {
        const ms = pval(node, 'ms') || params.ms || '1000'
        const body = generateExecBlockFromPort(nodeId, 'execOut', new Set(visited), nextIndent)
        if (body) {
          lines.push(`${params.type === 'timeout' ? 'setTimeout' : 'setInterval'}(() => {`)
          lines.push(body)
          lines.push(`}, ${ms});`)
        } else {
          lines.push(`${params.type === 'timeout' ? 'setTimeout' : 'setInterval'}(() => {}, ${ms});`)
        }
        break
      }
      case 'js-fetch': {
        const url = pval(node, 'url') || params.url || 'https://api.example.com/data'
        const method = params.method || 'GET'
        const body = pval(node, 'body') || params.body || ''
        const bodyContent = generateExecBlockFromPort(nodeId, 'execOut', new Set(visited), nextIndent)
        lines.push(`fetch('${url}', {`)
        if (method !== 'GET') {
          lines.push(`  method: '${method}',`)
          if (body) lines.push(`  body: ${JSON.stringify(body)},`)
        }
        lines.push('})')
        lines.push('  .then(r => r.json())')
        if (bodyContent) {
          lines.push('  .then(responseData => {')
          lines.push(bodyContent)
          lines.push('  });')
        } else {
          lines.push('  .then(responseData => {});')
        }
        break
      }
      case 'js-dom-create': {
        const varName = 'newEl_' + node.id.slice(0, 4)
        const tag = pval(node, 'tag') || params.tag || 'div'
        const cls = pval(node, 'className') || params.className || ''
        const text = pval(node, 'textContent') || params.textContent || ''
        lines.push(`const ${varName} = document.createElement('${tag}');`)
        if (cls) lines.push(`${varName}.className = '${cls}';`)
        if (text) lines.push(`${varName}.textContent = '${text}';`)
        const parentConn = connByTo.get(node.id)?.find((c) => c.toPort === 'execIn')
        if (parentConn) {
          lines.push(`document.querySelector('.parent')?.appendChild(${varName});`)
        }
        const next = generateExecBlockFromPort(nodeId, 'execOut', visited, indent)
        if (next) lines.push(next)
        break
      }
      case 'js-function': {
        const name = pval(node, 'name') || params.name || 'myFunction'
        const funcParams = pval(node, 'params') || params.params || ''
        const body = generateExecBlockFromPort(nodeId, 'execOut', new Set(visited), nextIndent)
        const isAsync = params.isAsync ? 'async ' : ''
        lines.push(`${isAsync}function ${name}(${funcParams}) {`)
        if (body) lines.push(body)
        lines.push('}')
        break
      }
      case 'js-return': {
        const val = getInputValue(node.id, 'value') || params.value || ''
        lines.push(`return ${val};`)
        break
      }
      case 'js-raw':
        lines.push(params.code || '')
        const next = generateExecBlockFromPort(nodeId, 'execOut', visited, indent)
        if (next) lines.push(next)
        break
      case 'js-comment':
        lines.push(`// ${params.text || ''}`)
        break
      default:
        break
    }

    return lines.map((l) => indent + l).join('\n')
  }

  function generateExecBlockFromPort(nodeId: string, portId: string, visited: Set<string>, indent: string): string {
    const conns = connByFrom.get(nodeId)
    if (!conns) return ''
    const conn = conns.find((c) => c.fromPort === portId)
    if (!conn) return ''
    return generateExecBlock(conn.toNode, visited, indent)
  }

  const eventNodes = jsNodes.filter((n) => n.type === 'js-event')
  const output: string[] = []

  for (const node of eventNodes) {
    const visited = new Set<string>()
    const block = generateExecBlock(node.id, visited, '')
    if (block) output.push(block)
  }

  const otherRoots = jsNodes.filter((n) => n.type !== 'js-event' && !connByTo.has(n.id))
  for (const node of otherRoots) {
    const visited = new Set<string>()
    const block = generateExecBlock(node.id, visited, '')
    if (block) output.push(block)
  }

  return output.join('\n\n')
}
