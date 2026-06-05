import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { type ComponentNode, type ComponentAnimation, type ComponentStyle } from '../types/component.ts'
import { ComponentRegistry } from './ComponentRegistry.ts'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableElement } from '../editor/SortableElement.tsx'
import { isHTML } from '../editor/html-utils.ts'

interface RendererProps {
  node: ComponentNode
  className?: string
  editMode?: boolean
}

function styleObjToCss(styles: ComponentStyle): string {
  return Object.entries(styles)
    .filter(([, v]) => v != null)
    .map(([k, v]) => {
      const cssKey = k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())
      return `${cssKey}: ${v}`
    })
    .join(';')
}

function collectResponsiveCss(node: ComponentNode): { tablet: string[]; mobile: string[] } {
  const tablet: string[] = []
  const mobile: string[] = []

  if (node.responsive?.tablet) {
    tablet.push(`[data-element-id="${node.id}"]{${styleObjToCss(node.responsive.tablet)}}`)
  }
  if (node.responsive?.mobile) {
    mobile.push(`[data-element-id="${node.id}"]{${styleObjToCss(node.responsive.mobile)}}`)
  }
  if (node.children) {
    for (const child of node.children) {
      const childResult = collectResponsiveCss(child)
      tablet.push(...childResult.tablet)
      mobile.push(...childResult.mobile)
    }
  }
  return { tablet, mobile }
}

const TAG_MAP: Record<string, React.ElementType> = {
  div: 'div', section: 'section', article: 'article', aside: 'aside',
  main: 'main', nav: 'nav', header: 'header', footer: 'footer',
  h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5', h6: 'h6',
  p: 'p', span: 'span', blockquote: 'blockquote', code: 'code',
  pre: 'pre', small: 'small', img: 'img', video: 'video', audio: 'audio',
  iframe: 'iframe', button: 'button', a: 'a', input: 'input',
  textarea: 'textarea', ul: 'ul', ol: 'ol', li: 'li', hr: 'hr',
}

function getAnimationProps(anim: ComponentAnimation) {
  const duration = anim.duration ?? 0.3
  const delay = anim.delay ?? 0

  const variants: Record<string, { initial: object; animate: object; whileHover?: object; whileTap?: object }> = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    },
    slide: {
      initial: { opacity: 0, x: -40 },
      animate: { opacity: 1, x: 0 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
    },
    rotate: {
      initial: { opacity: 0, rotate: -10 },
      animate: { opacity: 1, rotate: 0 },
    },
    blur: {
      initial: { opacity: 0, filter: 'blur(8px)' },
      animate: { opacity: 1, filter: 'blur(0px)' },
    },
  }

  const preset = variants[anim.type] || variants.fade

  const base = {
    initial: preset.initial,
    animate: preset.animate,
    transition: { duration, delay, ease: anim.easing || 'easeOut' },
  }

  if (anim.trigger === 'onHover') {
    return { ...base, whileHover: preset.animate, initial: false, animate: false }
  }

  if (anim.trigger === 'onClick') {
    return { ...base, whileTap: preset.animate, initial: false, animate: false }
  }

  if (anim.trigger === 'onVisible') {
    return { ...base, initial: preset.initial, whileInView: preset.animate, viewport: { once: true } }
  }

  return base
}

function getMotionTag(tag: string) {
  const map: Record<string, any> = {
    div: motion.div, section: motion.section, article: motion.article,
    main: motion.main, nav: motion.nav, header: motion.header, footer: motion.footer,
    p: motion.p, span: motion.span, h1: motion.h1, h2: motion.h2, h3: motion.h3,
    h4: motion.h4, h5: motion.h5, h6: motion.h6,
    blockquote: motion.blockquote, button: motion.button, a: motion.a,
    ul: motion.ul, ol: motion.ol, li: motion.li,
  }
  return map[tag] || motion.div
}

export function Renderer({ node, className, editMode }: RendererProps) {
  const def = ComponentRegistry.get(node.type)
  const Tag = TAG_MAP[node.tag] || 'div'
  const MotionTag = getMotionTag(node.tag)

  const mergedClassName = [
    node.classNames?.join(' '),
    node.locked ? 'vigile-locked' : '',
    node.hidden ? 'vigile-hidden' : '',
    className,
  ].filter(Boolean).join(' ')

  const style = { ...def?.defaultStyles, ...node.styles } as React.CSSProperties

  const htmlAttrs = { ...node.attributes, 'data-element-id': node.id }
  const mediaSrc = node.src || (node.attributes?.src as string) || ''

  const renderSpecialTag = () => {
    if (node.tag === 'img') {
      if (!mediaSrc) {
        return (
          <div className={mergedClassName} style={{ ...style, width: style.width || '540px', height: style.height || '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '1px dashed #d1d5db', color: '#9ca3af', fontSize: '13px', overflow: 'hidden' }} {...htmlAttrs}>
            <div className="flex flex-col items-center gap-1 pointer-events-none">
              <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span>No image</span>
            </div>
          </div>
        )
      }
      return <img src={mediaSrc} alt={node.alt || (node.attributes?.alt as string) || ''} className={mergedClassName} style={style} {...htmlAttrs} />
    }
    if (node.tag === 'a') return <a href={node.href} className={mergedClassName} style={style} {...htmlAttrs}>{node.text}{renderChildren(node, editMode)}</a>
    if (node.tag === 'input') return <input className={mergedClassName} style={style} {...htmlAttrs} />
    if (node.tag === 'textarea') return <textarea className={mergedClassName} style={style} {...htmlAttrs} />
    if (node.tag === 'video') {
      if (!mediaSrc) return <div className={mergedClassName} style={{ ...style, width: style.width || '540px', height: style.height || '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '1px dashed #d1d5db', color: '#9ca3af', fontSize: '13px', overflow: 'hidden' }} {...htmlAttrs}><div className="flex flex-col items-center gap-1 pointer-events-none"><svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.553A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h10a1 1 0 001-1V7a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1z"/></svg><span>No video</span></div></div>
      return <video src={mediaSrc} className={mergedClassName} style={style} {...htmlAttrs} />
    }
    if (node.tag === 'audio') return <audio src={mediaSrc} className={mergedClassName} style={style} {...htmlAttrs} />
    if (node.tag === 'iframe') {
      if (!mediaSrc) return <div className={mergedClassName} style={{ ...style, width: style.width || '540px', height: style.height || '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '1px dashed #d1d5db', color: '#9ca3af', fontSize: '13px', overflow: 'hidden' }} {...htmlAttrs}><div className="flex flex-col items-center gap-1 pointer-events-none"><svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg><span>No iframe</span></div></div>
      return <iframe src={mediaSrc} className={mergedClassName} style={style} {...htmlAttrs} />
    }
    if (node.tag === 'hr') return <hr className={mergedClassName} style={style} {...htmlAttrs} />
    return null
  }

  const special = renderSpecialTag()
  if (special) return special

  const isBlockHtml = node.text ? isHTML(node.text) && /^<(\w+)\b/.test(node.text.trim()) : false

  if (node.animation && !editMode) {
    const animProps = getAnimationProps(node.animation) as any
    if (node.text && !node.children?.length) {
      if (isBlockHtml) {
        return <motion.div className={mergedClassName} style={style} data-element-id={node.id} {...animProps} dangerouslySetInnerHTML={{ __html: node.text }} />
      }
      return (
        <MotionTag className={mergedClassName} style={style} {...htmlAttrs} {...animProps}>
          {node.text}
        </MotionTag>
      )
    }
    return (
      <MotionTag className={mergedClassName} style={style} {...htmlAttrs} {...animProps}>
        {renderChildren(node, editMode)}
      </MotionTag>
    )
  }

  if (node.text && !node.children?.length) {
    if (isBlockHtml) {
      return <div className={mergedClassName} style={style} data-element-id={node.id} dangerouslySetInnerHTML={{ __html: node.text }} />
    }
    return <Tag className={mergedClassName} style={style} {...htmlAttrs}>{node.text}</Tag>
  }

  const hasContent = node.text || (node.children && node.children.length > 0)
  const isEmpty = editMode && !hasContent && !node.empty && !['img', 'input', 'textarea', 'video', 'audio', 'iframe', 'hr'].includes(node.tag)

  return (
    <Tag className={mergedClassName} style={style} {...htmlAttrs} data-empty={isEmpty ? 'true' : undefined}>
      {isEmpty && (
        <div className="vigile-empty-placeholder" contentEditable={false}>
          {node.type} — click to add content
        </div>
      )}
      {renderChildren(node, editMode)}
    </Tag>
  )
}

export function ResponsiveStyles({ node }: { node: ComponentNode }) {
  const css = useMemo(() => {
    const { tablet, mobile } = collectResponsiveCss(node)
    const parts: string[] = []
    if (tablet.length) parts.push(`@media (max-width: 768px){${tablet.join('')}}`)
    if (mobile.length) parts.push(`@media (max-width: 375px){${mobile.join('')}}`)
    return parts.join('')
  }, [node])

  if (!css) return null
  return <style>{css}</style>
}

function renderChildren(node: ComponentNode, editMode?: boolean) {
  if (!node.children?.length) return null

  if (editMode) {
    return (
      <SortableContext items={node.children.map(c => c.id)} strategy={verticalListSortingStrategy}>
        {node.children.map(child => (
          <SortableElement key={child.id} id={child.id}>
            <Renderer node={child} editMode />
          </SortableElement>
        ))}
      </SortableContext>
    )
  }

  return node.children.map(child => <Renderer key={child.id} node={child} />)
}
