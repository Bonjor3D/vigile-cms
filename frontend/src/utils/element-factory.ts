import type { ComponentNode } from '../types/component.ts'
import { v4 as uuid } from 'uuid'

let counter = 0

export function createElement(type: string, tag: string, overrides: Partial<ComponentNode> = {}): ComponentNode {
  counter++
  return {
    id: uuid(),
    type,
    tag,
    text: '',
    children: [],
    styles: {},
    classNames: [],
    locked: false,
    hidden: false,
    ...overrides,
  }
}

export function createTextElement(type: string, tag: string, text: string): ComponentNode {
  return createElement(type, tag, { text })
}

export function createDefaultPage(title: string, slug: string, endpoint?: string): import('../types/component.ts').Page {
  return {
    id: uuid(),
    title,
    slug,
    endpoint: endpoint || slug,
    visibility: 'published',
    sortOrder: 0,
    root: createDefaultRoot(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function createDefaultRoot(): ComponentNode {
  return createElement('div', 'div', {
    styles: { display: 'block', padding: '0px', margin: '0px', minHeight: '100vh' },
    children: [
      createTextElement('heading1', 'h1', 'Welcome'),
      createTextElement('paragraph', 'p', 'Start editing this page'),
    ],
  })
}

export function createDefaultHeader(): ComponentNode {
  return createElement('div', 'header', {
    styles: { height: '48px', display: 'flex', alignItems: 'center', padding: '0 16px', backgroundColor: '#f3f4f6' },
    children: [
      createTextElement('span', 'span', 'HEADER'),
    ],
  })
}

export function createDefaultFooter(): ComponentNode {
  return createElement('div', 'footer', {
    styles: { height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', backgroundColor: '#f3f4f6', fontSize: '12px', color: '#6b7280' },
    children: [
      createTextElement('small', 'small', 'FOOTER'),
    ],
  })
}
