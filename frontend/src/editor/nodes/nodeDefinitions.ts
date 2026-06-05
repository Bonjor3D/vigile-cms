export type PortDirection = 'input' | 'output'
export type PortType = 'exec' | 'css' | 'selector' | 'color' | 'number' | 'string' | 'boolean'

export interface NodePort {
  id: string
  label: string
  type: PortType
  direction: PortDirection
}

export interface VisualNode {
  id: string
  type: string
  category: 'css' | 'js'
  label: string
  x: number
  y: number
  inputs: NodePort[]
  outputs: NodePort[]
  params: Record<string, any>
}

export interface NodeConnection {
  id: string
  fromNode: string
  fromPort: string
  toNode: string
  toPort: string
}

export interface NodeDefinition {
  type: string
  category: 'css' | 'js'
  label: string
  icon: string
  inputs: NodePort[]
  outputs: NodePort[]
  defaultParams: Record<string, any>
  paramMeta?: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'color' | 'select'
    options?: string[]
    placeholder?: string
  }>
}

export interface CompiledCode {
  css: string
  js: string
}

export const PORT_TYPE_COLORS: Record<string, string> = {
  exec: '#ffffff',
  css: '#3b82f6',
  selector: '#22c55e',
  color: '#ef4444',
  number: '#f97316',
  string: '#eab308',
  boolean: '#a855f7',
}

export const PORT_TYPE_LABELS: Record<string, string> = {
  exec: 'exec',
  css: 'css',
  selector: 'sel',
  color: 'clr',
  number: 'num',
  string: 'str',
  boolean: 'bool',
}
