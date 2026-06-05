import type { ComponentNode, ComponentStyle } from '../types/component.ts'

export class ComponentRegistry {
  private static elements = new Map<string, ElementDefinition>()

  static register(def: ElementDefinition) {
    this.elements.set(def.type, def)
  }

  static get(type: string): ElementDefinition | undefined {
    return this.elements.get(type)
  }

  static getAll(): ElementDefinition[] {
    return Array.from(this.elements.values())
  }

  static getDefaultStyles(tag: string): ComponentStyle {
    const defaults: Record<string, ComponentStyle> = {
      div: { display: 'block', padding: '0px', margin: '0px' },
      section: { display: 'block', padding: '16px', margin: '0px' },
      h1: { fontSize: '32px', fontWeight: '700', margin: '0px' },
      h2: { fontSize: '24px', fontWeight: '700', margin: '0px' },
      h3: { fontSize: '20px', fontWeight: '600', margin: '0px' },
      p: { fontSize: '16px', lineHeight: '1.5', margin: '0px' },
      span: { fontSize: '16px' },
      img: { maxWidth: '100%', height: 'auto' },
      button: { padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #d1d5db' },
      a: { color: '#6366f1', textDecoration: 'underline' },
      ul: { padding: '0 0 0 24px', margin: '0px' },
      ol: { padding: '0 0 0 24px', margin: '0px' },
      li: { margin: '0px' },
      nav: { display: 'block' },
      main: { display: 'block' },
      aside: { display: 'block' },
      article: { display: 'block' },
      header: { display: 'block' },
      footer: { display: 'block' },
      blockquote: { borderLeft: '4px solid #d1d5db', padding: '8px 16px', margin: '8px 0' },
      code: { fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '3px' },
      pre: { fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '4px' },
      small: { fontSize: '14px' },
      input: { padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' },
      textarea: { padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' },
    }
    return defaults[tag] || {}
  }

  static getDefaultText(tag: string): string | undefined {
    const texts: Record<string, string> = {
      h1: 'Heading',
      h2: 'Heading',
      h3: 'Heading',
      p: 'Paragraph text',
      span: 'Text',
      button: 'Button',
      a: 'Link text',
      li: 'List item',
      blockquote: 'Quote',
      small: 'Small text',
      label: 'Label',
    }
    return texts[tag]
  }
}

export interface ElementDefinition {
  type: string
  tag: string
  label: string
  category: 'text' | 'container' | 'media' | 'interactive' | 'lists' | 'layout'
  icon?: string
  defaultChildren?: ComponentNode[]
  defaultStyles?: ComponentStyle
  defaultText?: string
  draggable?: boolean
  resizable?: boolean
  editable?: boolean
}

export function registerDefaultElements() {
  const elements: ElementDefinition[] = [
    { type: 'paragraph', tag: 'p', label: 'Paragraph', category: 'text' },
    { type: 'heading1', tag: 'h1', label: 'Heading 1', category: 'text' },
    { type: 'heading2', tag: 'h2', label: 'Heading 2', category: 'text' },
    { type: 'heading3', tag: 'h3', label: 'Heading 3', category: 'text' },
    { type: 'span', tag: 'span', label: 'Span', category: 'text' },
    { type: 'blockquote', tag: 'blockquote', label: 'Quote', category: 'text' },
    { type: 'code', tag: 'code', label: 'Code', category: 'text' },
    { type: 'pre', tag: 'pre', label: 'Preformatted', category: 'text' },
    { type: 'small', tag: 'small', label: 'Small', category: 'text' },

    { type: 'div', tag: 'div', label: 'Div', category: 'container' },
    { type: 'section', tag: 'section', label: 'Section', category: 'container' },
    { type: 'article', tag: 'article', label: 'Article', category: 'container' },
    { type: 'aside', tag: 'aside', label: 'Aside', category: 'container' },
    { type: 'main', tag: 'main', label: 'Main', category: 'container' },
    { type: 'nav', tag: 'nav', label: 'Nav', category: 'container' },
    { type: 'header', tag: 'header', label: 'Header', category: 'container' },
    { type: 'footer', tag: 'footer', label: 'Footer', category: 'container' },

    { type: 'image', tag: 'img', label: 'Image', category: 'media', defaultStyles: { maxWidth: '100%' } },
    { type: 'video', tag: 'video', label: 'Video', category: 'media' },
    { type: 'audio', tag: 'audio', label: 'Audio', category: 'media' },
    { type: 'iframe', tag: 'iframe', label: 'Iframe', category: 'media' },

    { type: 'button', tag: 'button', label: 'Button', category: 'interactive' },
    { type: 'link', tag: 'a', label: 'Link', category: 'interactive' },
    { type: 'input', tag: 'input', label: 'Input', category: 'interactive' },
    { type: 'textarea', tag: 'textarea', label: 'Textarea', category: 'interactive' },

    { type: 'unordered-list', tag: 'ul', label: 'Unordered List', category: 'lists' },
    { type: 'ordered-list', tag: 'ol', label: 'Ordered List', category: 'lists' },
    { type: 'list-item', tag: 'li', label: 'List Item', category: 'lists' },

    { type: 'flex-container', tag: 'div', label: 'Flex Container', category: 'layout', defaultStyles: { display: 'flex', gap: '8px' } },
    { type: 'grid-container', tag: 'div', label: 'Grid Container', category: 'layout', defaultStyles: { display: 'grid', gap: '8px' } },
    { type: 'spacer', tag: 'div', label: 'Spacer', category: 'layout', defaultStyles: { height: '24px' } },
    { type: 'divider', tag: 'hr', label: 'Divider', category: 'layout' },
  ]

  elements.forEach((el) => ComponentRegistry.register(el))
}
