import { Extension, Mark } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import '@tiptap/extension-text-style'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType
      unsetFontSize: () => ReturnType
    }
  }
}

export const FontSize = Mark.create({
  name: 'fontSize',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (el) => el.style.fontSize?.replace('px', '') || null,
        renderHTML: (attrs) => {
          if (!attrs.fontSize) return {}
          return { style: `font-size: ${attrs.fontSize}px` }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: (el) => {
          if (typeof el === 'string') return false
          const fontSize = (el as HTMLElement).style.fontSize
          if (fontSize) return { fontSize: fontSize.replace('px', '') }
          return false
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0]
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ commands }) => {
          return commands.setMark(this.name, { fontSize })
        },
      unsetFontSize:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name)
        },
    }
  },
})

export function setBlockAttr(editor: any, attr: string, value: any) {
  const { state } = editor
  const { $from } = state.selection
  let tr = state.tr

  const cssProp: Record<string, string> = {
    indent: 'padding-left',
    firstLineIndent: 'text-indent',
    lineHeight: 'line-height',
  }

  const prop = cssProp[attr]
  if (!prop) return
  const cssVal = attr === 'lineHeight' ? value : `${value}px`

  const doc = tr.doc
  const resolved = doc.resolve($from.pos)
  for (let d = resolved.depth; d > 0; d--) {
    const node = resolved.node(d)
    if (['paragraph', 'heading'].includes(node.type.name)) {
      const blockPos = resolved.before(d)
      const existing = node.attrs.style || ''
      const others = existing
        .split(';')
        .map((s: string) => s.trim())
        .filter((s: string) => s && !s.startsWith(prop))
        .join('; ')
      const newStyle = [others, `${prop}: ${cssVal}`].filter(Boolean).join('; ')
      tr = tr.setNodeAttribute(blockPos, 'style', newStyle)
      break
    }
  }

  editor.view.dispatch(tr)
}

export const LineHeight = Extension.create({
  name: 'lineHeight',
  addGlobalAttributes() {
    return [{
      types: ['paragraph', 'heading'],
      attributes: {
        lineHeight: { default: null, parseHTML: () => null, renderHTML: () => ({}) },
      },
    }]
  },
})

export const Indent = Extension.create({
  name: 'indent',
  addGlobalAttributes() {
    return [{
      types: ['paragraph', 'heading'],
      attributes: {
        style: {
          default: null,
          parseHTML: (el) => el.getAttribute('style'),
          renderHTML: (attrs) => {
            if (!attrs.style) return {}
            return { style: attrs.style }
          },
        },
      },
    }]
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('indentCopy'),
        appendTransaction: (_transactions, _oldState, newState) => {
          const sel = newState.selection
          if (!sel.empty) return null
          const { $from } = sel
          const blockType = $from.parent.type.name
          if (!['paragraph', 'heading'].includes(blockType)) return null

          let curBlockPos = -1
          for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type.name === blockType) {
              curBlockPos = $from.before(d)
              break
            }
          }
          if (curBlockPos < 0 || $from.parent.attrs.style) return null

          const prevPos = curBlockPos - 1
          if (prevPos < 0) return null

          const prevDoc = newState.doc.resolve(prevPos)
          for (let d = prevDoc.depth; d > 0; d--) {
            if (prevDoc.node(d).type.name === blockType) {
              const prevStyle = prevDoc.node(d).attrs.style
              if (prevStyle) {
                return newState.tr.setNodeAttribute(curBlockPos, 'style', prevStyle)
              }
              break
            }
          }
          return null
        },
      }),
    ]
  },
})
