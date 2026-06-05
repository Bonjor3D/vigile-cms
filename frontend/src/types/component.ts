export interface ComponentStyle {
  width?: string
  height?: string
  maxWidth?: string
  aspectRatio?: string
  margin?: string
  padding?: string
  backgroundColor?: string
  color?: string
  fontSize?: string
  fontWeight?: string
  fontFamily?: string
  lineHeight?: string
  letterSpacing?: string
  textAlign?: string
  display?: string
  flexDirection?: string
  flexWrap?: string
  justifyContent?: string
  alignItems?: string
  gap?: string
  gridTemplateColumns?: string
  gridTemplateRows?: string
  position?: string
  top?: string
  right?: string
  bottom?: string
  left?: string
  zIndex?: string
  objectFit?: string
  float?: string
  opacity?: string
  transform?: string
  transition?: string
  boxShadow?: string
  borderRadius?: string
  border?: string
  [key: string]: string | undefined
}

export interface ComponentAnimation {
  type: 'fade' | 'slide' | 'scale' | 'rotate' | 'blur'
  trigger: 'onLoad' | 'onHover' | 'onClick' | 'onScroll' | 'onVisible'
  duration?: number
  delay?: number
  easing?: string
}

export interface ComponentImage {
  src: string
  alt?: string
  title?: string
  lazy?: boolean
  responsiveSources?: { src: string; width: number }[]
}

export interface ComponentButton {
  text?: string
  icon?: string
  action?:
    | { type: 'link'; href: string }
    | { type: 'modal'; modalId: string }
    | { type: 'page'; slug: string }
    | { type: 'api'; endpoint: string; method: string }
    | { type: 'script'; code: string }
    | { type: 'js'; code: string }
}

export interface ComponentSeo {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
}

export interface ComponentNode {
  id: string
  type: string
  tag: string
  text?: string
  children?: ComponentNode[]
  styles?: ComponentStyle
  responsive?: {
    tablet?: ComponentStyle
    mobile?: ComponentStyle
  }
  classNames?: string[]
  attributes?: Record<string, string | boolean | number | undefined>
  src?: string
  alt?: string
  href?: string
  animation?: ComponentAnimation
  image?: ComponentImage
  button?: ComponentButton
  customCss?: string
  customJs?: string
  nodeGraph?: {
    nodes: { id: string; type: string; category: 'css' | 'js'; label: string; x: number; y: number; inputs: any[]; outputs: any[]; params: Record<string, any> }[]
    connections: { id: string; fromNode: string; fromPort: string; toNode: string; toPort: string }[]
  }
  locked?: boolean
  hidden?: boolean
  empty?: boolean
  seo?: ComponentSeo
  slot?: string
}

export interface Page {
  id: string
  title: string
  slug: string
  endpoint?: string
  icon?: string
  visibility: 'published' | 'draft' | 'hidden'
  parentId?: string
  sortOrder: number
  seo?: ComponentSeo
  root: ComponentNode
  templateId?: string
  createdAt: string
  updatedAt: string
}

export interface ThemeVariable {
  name: string
  light: string
  dark: string
}

export interface SiteSettings {
  name: string
  description?: string
  favicon?: string
  globalCss?: string
  globalJs?: string
  themeVariables?: string
  header?: ComponentNode
  footer?: ComponentNode
}

export interface Asset {
  id: string
  fileName: string
  type: 'image' | 'video' | 'audio' | 'document'
  url: string
  size: number
  folder?: string
  tags?: string[]
  createdAt: string
}

export interface Template {
  id: string
  name: string
  type: 'page' | 'section' | 'block'
  root: ComponentNode
  thumbnail?: string
}

export interface Revision {
  id: string
  pageId: string
  snapshot: ComponentNode
  createdAt: string
  message?: string
}

export type { User } from '../entities/User.ts'
