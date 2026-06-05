import { useState, useRef, useEffect } from 'react'
import { useEditorStore } from '../stores/editor.ts'
import { useSettingsStore } from '../stores/settings.ts'
import type { ComponentNode, ComponentAnimation } from '../types/component.ts'

interface StylePanelProps {
  elementId: string
}

type SideKey = 'marginTop' | 'marginRight' | 'marginBottom' | 'marginLeft' | 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft'

const SIDES = ['Top', 'Right', 'Bottom', 'Left'] as const
const SIDE_KEYS: Record<string, [SideKey, SideKey, SideKey, SideKey]> = {
  margin: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
  padding: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
}

const BP_LABELS: Record<string, string> = { desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile' }

export function StylePanel({ elementId }: StylePanelProps) {
  const { currentPage, updateElement, breakpoint } = useEditorStore()

  function findNode(id: string, node: ComponentNode): ComponentNode | null {
    if (node.id === id) return node
    if (node.children) {
      for (const child of node.children) {
        const found = findNode(id, child)
        if (found) return found
      }
    }
    return null
  }

  const node = currentPage ? findNode(elementId, currentPage.root) : null
  if (!node) return <div className="text-xs text-gray-400 p-4">Select an element</div>

  const baseStyles = node.styles || {}
  const tabletOverrides = node.responsive?.tablet || {}
  const mobileOverrides = node.responsive?.mobile || {}

  const isResponsive = breakpoint !== 'desktop'

  const tabletInherited = { ...baseStyles, ...tabletOverrides }
  const mobileInherited = { ...tabletInherited, ...mobileOverrides }

  const activeStyles = breakpoint === 'desktop' ? baseStyles : breakpoint === 'tablet' ? tabletInherited : mobileInherited
  const anim = node.animation

  const setStyle = (key: string, value: string) => {
    if (breakpoint === 'desktop') {
      updateElement(elementId, { styles: { ...baseStyles, [key]: value || undefined } })
    } else if (breakpoint === 'tablet') {
      const inherited = baseStyles[key]
      if (value === inherited || (!value && !inherited)) {
        const { [key]: _, ...rest } = tabletOverrides
        updateElement(elementId, { responsive: { ...node.responsive, tablet: Object.keys(rest).length ? rest : undefined } })
      } else {
        updateElement(elementId, { responsive: { ...node.responsive, tablet: { ...tabletOverrides, [key]: value } } })
      }
    } else {
      const inherited = tabletInherited[key]
      if (value === inherited || (!value && !inherited)) {
        const { [key]: _, ...rest } = mobileOverrides
        updateElement(elementId, { responsive: { ...node.responsive, mobile: Object.keys(rest).length ? rest : undefined } })
      } else {
        updateElement(elementId, { responsive: { ...node.responsive, mobile: { ...mobileOverrides, [key]: value } } })
      }
    }
  }

  const setAnimation = (patch: Partial<ComponentAnimation>) => {
    updateElement(elementId, { animation: { ...anim || { type: 'fade', trigger: 'onLoad' }, ...patch } })
  }

  const clearAnimation = () => {
    updateElement(elementId, { animation: undefined })
  }

  const inp = "w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-colors bg-white"
  const sel = "w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white focus:outline-none focus:border-indigo-400 transition-colors"
  const lbl = "text-[11px] font-medium text-gray-500"
  const group = "bg-white rounded-lg border border-gray-100 p-3 space-y-2.5"

  return (
    <div className="p-3 space-y-3 overflow-auto">
      {isResponsive && (
        <div className="text-[10px] font-medium text-indigo-500 bg-indigo-50 rounded px-2 py-1 text-center">
          Editing {BP_LABELS[breakpoint]} styles (overrides desktop)
        </div>
      )}

      {/* Dimensions */}
      <div className={group}>
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
          Dimensions
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <SideLabel label="Width" value={activeStyles.width} onChange={(v) => setStyle('width', v)} placeholder="auto" />
          <SideLabel label="Height" value={activeStyles.height} onChange={(v) => setStyle('height', v)} placeholder="auto" />
          <SideLabel label="Min Width" value={activeStyles.minWidth} onChange={(v) => setStyle('minWidth', v)} placeholder="—" />
          <SideLabel label="Min Height" value={activeStyles.minHeight} onChange={(v) => setStyle('minHeight', v)} placeholder="—" />
          <SideLabel label="Max Width" value={activeStyles.maxWidth} onChange={(v) => setStyle('maxWidth', v)} placeholder="—" />
          <SideLabel label="Max Height" value={activeStyles.maxHeight} onChange={(v) => setStyle('maxHeight', v)} placeholder="—" />
        </div>
      </div>

      {/* Spacing */}
      <div className={group}>
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 0V4m0 3v3m8-3V4m0 3v3"/></svg>
          Spacing
        </h3>
        <div>
          <span className="text-[10px] font-medium text-gray-400 mb-1 block">Margin</span>
          <SideInputs values={activeStyles} keys={SIDE_KEYS.margin} onChange={setStyle} inputClass={inp} />
        </div>
        <div>
          <span className="text-[10px] font-medium text-gray-400 mb-1 block">Padding</span>
          <SideInputs values={activeStyles} keys={SIDE_KEYS.padding} onChange={setStyle} inputClass={inp} />
        </div>
      </div>

      {/* Typography */}
      <div className={group}>
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M3 8h12M3 12h6m6 0h6M3 16h12m6 0h6"/></svg>
          Typography
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <SideLabel label="Font Family" value={activeStyles.fontFamily} onChange={(v) => setStyle('fontFamily', v)} placeholder="inherit" />
          <SideLabel label="Font Size" value={activeStyles.fontSize} onChange={(v) => setStyle('fontSize', v)} placeholder="16px" />
          <SideLabel label="Font Weight" value={activeStyles.fontWeight} onChange={(v) => setStyle('fontWeight', v)} placeholder="400" />
          <SideLabel label="Line Height" value={activeStyles.lineHeight} onChange={(v) => setStyle('lineHeight', v)} placeholder="1.5" />
          <SideLabel label="Letter Spacing" value={activeStyles.letterSpacing} onChange={(v) => setStyle('letterSpacing', v)} placeholder="normal" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="Color" value={activeStyles.color} onChange={(v) => setStyle('color', v)} inputClass={inp} />
          <ColorField label="BG Color" value={activeStyles.backgroundColor} onChange={(v) => setStyle('backgroundColor', v)} inputClass={inp} />
        </div>
        <div>
          <label className={`${lbl} block mb-0.5`}>Text Align</label>
          <div className="flex rounded border border-gray-200 overflow-hidden text-xs">
            {[
              { key: 'left', icon: '⫷' },
              { key: 'center', icon: '⫿' },
              { key: 'right', icon: '⫸' },
              { key: 'justify', icon: '⇔' },
            ].map(({ key, icon }) => (
              <button
                key={key}
                onClick={() => setStyle('textAlign', key)}
                className={`flex-1 py-1.5 transition-colors ${
                  activeStyles.textAlign === key ? 'bg-indigo-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Background */}
      <div className={group}>
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          Background
        </h3>
        <ColorField label="Color" value={activeStyles.backgroundColor} onChange={(v) => setStyle('backgroundColor', v)} inputClass={inp} />
        <label className={`${lbl} block mb-0.5`}>
          Image URL
          <input type="text" value={activeStyles.backgroundImage || ''} onChange={(e) => setStyle('backgroundImage', e.target.value || '')} className={inp} placeholder="url(...)" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className={`${lbl} block mb-0.5`}>
            Repeat
            <select value={activeStyles.backgroundRepeat || ''} onChange={(e) => setStyle('backgroundRepeat', e.target.value)} className={sel}>
              <option value="">Default</option>
              <option value="no-repeat">No Repeat</option>
              <option value="repeat">Repeat</option>
              <option value="repeat-x">Repeat X</option>
              <option value="repeat-y">Repeat Y</option>
              <option value="space">Space</option>
              <option value="round">Round</option>
            </select>
          </label>
          <label className={`${lbl} block mb-0.5`}>
            Size
            <select value={activeStyles.backgroundSize || ''} onChange={(e) => setStyle('backgroundSize', e.target.value)} className={sel}>
              <option value="">Default</option>
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="auto">Auto</option>
            </select>
          </label>
          <label className={`${lbl} block mb-0.5`}>
            Position
            <input type="text" value={activeStyles.backgroundPosition || ''} onChange={(e) => setStyle('backgroundPosition', e.target.value)} className={inp} placeholder="center" />
          </label>
        </div>
      </div>

      {/* Layout */}
      <div className={group}>
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
          Layout
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <label className={`${lbl} block mb-0.5`}>
            Display
            <select value={activeStyles.display || ''} onChange={(e) => setStyle('display', e.target.value)} className={sel}>
              <option value="">Default</option>
              <option value="block">Block</option>
              <option value="flex">Flex</option>
              <option value="grid">Grid</option>
              <option value="inline">Inline</option>
              <option value="inline-block">Inline Block</option>
              <option value="inline-flex">Inline Flex</option>
              <option value="none">None</option>
            </select>
          </label>
          <label className={`${lbl} block mb-0.5`}>
            Position
            <select value={activeStyles.position || ''} onChange={(e) => setStyle('position', e.target.value)} className={sel}>
              <option value="">Static</option>
              <option value="relative">Relative</option>
              <option value="absolute">Absolute</option>
              <option value="fixed">Fixed</option>
              <option value="sticky">Sticky</option>
            </select>
          </label>
        </div>

        {(activeStyles.display === 'flex' || activeStyles.display === 'inline-flex') && (
          <div className="border-t border-gray-100 pt-2 space-y-2 mt-2">
            <span className="text-[10px] font-medium text-indigo-500 uppercase tracking-wider">Flex Properties</span>
            <div className="grid grid-cols-2 gap-2">
              <label className={`${lbl} block mb-0.5`}>
                Direction
                <select value={activeStyles.flexDirection || ''} onChange={(e) => setStyle('flexDirection', e.target.value)} className={sel}>
                  <option value="">Default</option>
                  <option value="row">Row</option>
                  <option value="column">Column</option>
                  <option value="row-reverse">Row Reverse</option>
                  <option value="column-reverse">Column Reverse</option>
                </select>
              </label>
              <label className={`${lbl} block mb-0.5`}>
                Wrap
                <select value={activeStyles.flexWrap || ''} onChange={(e) => setStyle('flexWrap', e.target.value)} className={sel}>
                  <option value="">Default</option>
                  <option value="nowrap">No Wrap</option>
                  <option value="wrap">Wrap</option>
                  <option value="wrap-reverse">Wrap Reverse</option>
                </select>
              </label>
              <label className={`${lbl} block mb-0.5`}>
                Justify
                <select value={activeStyles.justifyContent || ''} onChange={(e) => setStyle('justifyContent', e.target.value)} className={sel}>
                  <option value="">Default</option>
                  <option value="flex-start">Start</option>
                  <option value="center">Center</option>
                  <option value="flex-end">End</option>
                  <option value="space-between">Between</option>
                  <option value="space-around">Around</option>
                  <option value="space-evenly">Evenly</option>
                </select>
              </label>
              <label className={`${lbl} block mb-0.5`}>
                Align
                <select value={activeStyles.alignItems || ''} onChange={(e) => setStyle('alignItems', e.target.value)} className={sel}>
                  <option value="">Default</option>
                  <option value="flex-start">Start</option>
                  <option value="center">Center</option>
                  <option value="flex-end">End</option>
                  <option value="stretch">Stretch</option>
                  <option value="baseline">Baseline</option>
                </select>
              </label>
              <label className={`${lbl} block mb-0.5`}>
                Align Content
                <select value={activeStyles.alignContent || ''} onChange={(e) => setStyle('alignContent', e.target.value)} className={sel}>
                  <option value="">Default</option>
                  <option value="flex-start">Start</option>
                  <option value="center">Center</option>
                  <option value="flex-end">End</option>
                  <option value="stretch">Stretch</option>
                  <option value="space-between">Between</option>
                  <option value="space-around">Around</option>
                </select>
              </label>
              <SideLabel label="Gap" value={activeStyles.gap} onChange={(v) => setStyle('gap', v)} placeholder="0" />
            </div>
          </div>
        )}

        {activeStyles.display === 'grid' && (
          <div className="border-t border-gray-100 pt-2 space-y-2 mt-2">
            <span className="text-[10px] font-medium text-indigo-500 uppercase tracking-wider">Grid Properties</span>
            <div className="grid grid-cols-2 gap-2">
              <SideLabel label="Columns" value={activeStyles.gridTemplateColumns} onChange={(v) => setStyle('gridTemplateColumns', v)} placeholder="auto" />
              <SideLabel label="Rows" value={activeStyles.gridTemplateRows} onChange={(v) => setStyle('gridTemplateRows', v)} placeholder="auto" />
              <label className={`${lbl} block mb-0.5`}>
                Justify Items
                <select value={activeStyles.justifyItems || ''} onChange={(e) => setStyle('justifyItems', e.target.value)} className={sel}>
                  <option value="">Default</option>
                  <option value="start">Start</option>
                  <option value="center">Center</option>
                  <option value="end">End</option>
                  <option value="stretch">Stretch</option>
                </select>
              </label>
              <label className={`${lbl} block mb-0.5`}>
                Align Items
                <select value={activeStyles.alignItems || ''} onChange={(e) => setStyle('alignItems', e.target.value)} className={sel}>
                  <option value="">Default</option>
                  <option value="start">Start</option>
                  <option value="center">Center</option>
                  <option value="end">End</option>
                  <option value="stretch">Stretch</option>
                </select>
              </label>
              <SideLabel label="Gap" value={activeStyles.gap} onChange={(v) => setStyle('gap', v)} placeholder="0" />
            </div>
          </div>
        )}

        {(activeStyles.position === 'absolute' || activeStyles.position === 'fixed' || activeStyles.position === 'sticky') && (
          <div className="border-t border-gray-100 pt-2 space-y-2 mt-2">
            <span className="text-[10px] font-medium text-indigo-500 uppercase tracking-wider">Position</span>
            <div className="grid grid-cols-2 gap-2">
              <SideLabel label="X (Left)" value={activeStyles.left} onChange={(v) => setStyle('left', v)} placeholder="auto" />
              <SideLabel label="Y (Top)" value={activeStyles.top} onChange={(v) => setStyle('top', v)} placeholder="auto" />
            </div>
            <details className="group">
              <summary className="text-[10px] text-gray-400 cursor-pointer hover:text-gray-600 transition-colors select-none list-none flex items-center gap-1">
                <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                Advanced
              </summary>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <SideLabel label="Right" value={activeStyles.right} onChange={(v) => setStyle('right', v)} placeholder="auto" />
                <SideLabel label="Bottom" value={activeStyles.bottom} onChange={(v) => setStyle('bottom', v)} placeholder="auto" />
              </div>
            </details>
            <SideLabel label="Z-Index" value={activeStyles.zIndex} onChange={(v) => setStyle('zIndex', v)} placeholder="auto" />
          </div>
        )}
      </div>

      {/* Border & Radius */}
      <div className={group}>
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"/></svg>
          Border & Radius
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <label className={`${lbl} block mb-0.5`}>
            Style
            <select value={activeStyles.borderStyle || ''} onChange={(e) => setStyle('borderStyle', e.target.value)} className={sel}>
              <option value="">None</option>
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
              <option value="double">Double</option>
              <option value="groove">Groove</option>
              <option value="ridge">Ridge</option>
            </select>
          </label>
          <SideLabel label="Width" value={activeStyles.borderWidth} onChange={(v) => setStyle('borderWidth', v)} placeholder="1px" />
          <ColorField label="Color" value={activeStyles.borderColor} onChange={(v) => setStyle('borderColor', v)} inputClass={inp} />
          <SideLabel label="Radius" value={activeStyles.borderRadius} onChange={(v) => setStyle('borderRadius', v)} placeholder="0" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SideLabel label="Top Radius" value={activeStyles.borderTopLeftRadius} onChange={(v) => setStyle('borderTopLeftRadius', v)} placeholder="0" />
          <SideLabel label="Top Right" value={activeStyles.borderTopRightRadius} onChange={(v) => setStyle('borderTopRightRadius', v)} placeholder="0" />
          <SideLabel label="Bottom Left" value={activeStyles.borderBottomLeftRadius} onChange={(v) => setStyle('borderBottomLeftRadius', v)} placeholder="0" />
          <SideLabel label="Bottom Right" value={activeStyles.borderBottomRightRadius} onChange={(v) => setStyle('borderBottomRightRadius', v)} placeholder="0" />
        </div>
      </div>

      {/* Shadow */}
      <div className={group}>
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          Shadow
        </h3>
        <SideLabel label="Box Shadow" value={activeStyles.boxShadow} onChange={(v) => setStyle('boxShadow', v)} placeholder="none" />
        <SideLabel label="Text Shadow" value={activeStyles.textShadow} onChange={(v) => setStyle('textShadow', v)} placeholder="none" />
        <SideLabel label="Opacity" value={activeStyles.opacity} onChange={(v) => setStyle('opacity', v)} placeholder="1" />
      </div>

      {/* Transform */}
      <div className={group}>
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11V7a4 4 0 014-4h2a4 4 0 014 4v4M5 21h14a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2z"/></svg>
          Transform
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <SideLabel label="Rotate" value={activeStyles.rotate} onChange={(v) => setStyle('rotate', v)} placeholder="0deg" />
          <SideLabel label="Scale" value={activeStyles.scale} onChange={(v) => setStyle('scale', v)} placeholder="1" />
          <SideLabel label="Translate X" value={activeStyles.translateX} onChange={(v) => setStyle('translateX', v)} placeholder="0" />
          <SideLabel label="Translate Y" value={activeStyles.translateY} onChange={(v) => setStyle('translateY', v)} placeholder="0" />
          <SideLabel label="Skew X" value={activeStyles.skewX} onChange={(v) => setStyle('skewX', v)} placeholder="0deg" />
          <SideLabel label="Skew Y" value={activeStyles.skewY} onChange={(v) => setStyle('skewY', v)} placeholder="0deg" />
        </div>
        <SideLabel label="Transform Origin" value={activeStyles.transformOrigin} onChange={(v) => setStyle('transformOrigin', v)} placeholder="center" />
      </div>

      {/* Filter */}
      <div className={group}>
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
          Filter
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <SideLabel label="Blur" value={activeStyles.blur} onChange={(v) => setStyle('blur', v)} placeholder="0" />
          <SideLabel label="Brightness" value={activeStyles.brightness} onChange={(v) => setStyle('brightness', v)} placeholder="1" />
          <SideLabel label="Contrast" value={activeStyles.contrast} onChange={(v) => setStyle('contrast', v)} placeholder="1" />
          <SideLabel label="Saturate" value={activeStyles.saturate} onChange={(v) => setStyle('saturate', v)} placeholder="1" />
          <SideLabel label="Hue Rotate" value={activeStyles.hueRotate} onChange={(v) => setStyle('hueRotate', v)} placeholder="0deg" />
          <SideLabel label="Sepia" value={activeStyles.sepia} onChange={(v) => setStyle('sepia', v)} placeholder="0" />
        </div>
      </div>

      {/* Overflow & Visibility */}
      <div className={group}>
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          Overflow & Visibility
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <label className={`${lbl} block mb-0.5`}>
            Overflow X
            <select value={activeStyles.overflowX || ''} onChange={(e) => setStyle('overflowX', e.target.value)} className={sel}>
              <option value="">Default</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
              <option value="scroll">Scroll</option>
              <option value="auto">Auto</option>
            </select>
          </label>
          <label className={`${lbl} block mb-0.5`}>
            Overflow Y
            <select value={activeStyles.overflowY || ''} onChange={(e) => setStyle('overflowY', e.target.value)} className={sel}>
              <option value="">Default</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
              <option value="scroll">Scroll</option>
              <option value="auto">Auto</option>
            </select>
          </label>
          <label className={`${lbl} block mb-0.5`}>
            Cursor
            <select value={activeStyles.cursor || ''} onChange={(e) => setStyle('cursor', e.target.value)} className={sel}>
              <option value="">Default</option>
              <option value="pointer">Pointer</option>
              <option value="grab">Grab</option>
              <option value="col-resize">Col Resize</option>
              <option value="row-resize">Row Resize</option>
              <option value="move">Move</option>
              <option value="not-allowed">Not Allowed</option>
              <option value="wait">Wait</option>
              <option value="text">Text</option>
            </select>
          </label>
        </div>
      </div>

      {/* Animation */}
      <div className={group}>
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Animation
        </h3>
        <select
          value={anim?.type || ''}
          onChange={(e) => e.target.value ? setAnimation({ type: e.target.value as ComponentAnimation['type'] }) : clearAnimation()}
          className={sel}
        >
          <option value="">No Animation</option>
          <option value="fade">Fade In</option>
          <option value="slide">Slide In</option>
          <option value="scale">Scale In</option>
          <option value="rotate">Rotate In</option>
          <option value="blur">Blur In</option>
        </select>

        {anim && (
          <div className="space-y-2 border-t border-gray-100 pt-2">
            <label className={`${lbl} block mb-0.5`}>
              Trigger
              <select value={anim.trigger} onChange={(e) => setAnimation({ trigger: e.target.value as ComponentAnimation['trigger'] })} className={sel}>
                <option value="onLoad">On Load</option>
                <option value="onHover">On Hover</option>
                <option value="onClick">On Click</option>
                <option value="onVisible">On Scroll Into View</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <SideLabel label="Duration (s)" value={String(anim.duration ?? 0.3)} onChange={(v) => setAnimation({ duration: parseFloat(v) || 0.3 })} placeholder="0.3" type="number" />
              <SideLabel label="Delay (s)" value={String(anim.delay ?? 0)} onChange={(v) => setAnimation({ delay: parseFloat(v) || 0 })} placeholder="0" type="number" />
            </div>
            <label className={`${lbl} block mb-0.5`}>
              Easing
              <select value={anim.easing || 'easeOut'} onChange={(e) => setAnimation({ easing: e.target.value })} className={sel}>
                <option value="ease">Ease</option>
                <option value="ease-in">Ease In</option>
                <option value="ease-out">Ease Out</option>
                <option value="ease-in-out">Ease In Out</option>
                <option value="linear">Linear</option>
                <option value="bounce">Bounce</option>
              </select>
            </label>
          </div>
        )}
      </div>

      {/* Transition */}
      <div className={group}>
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          Transition
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <SideLabel label="Property" value={activeStyles.transitionProperty} onChange={(v) => setStyle('transitionProperty', v)} placeholder="all" />
          <SideLabel label="Duration (s)" value={activeStyles.transitionDuration} onChange={(v) => setStyle('transitionDuration', v)} placeholder="0.3s" />
          <SideLabel label="Timing" value={activeStyles.transitionTimingFunction} onChange={(v) => setStyle('transitionTimingFunction', v)} placeholder="ease" />
          <SideLabel label="Delay (s)" value={activeStyles.transitionDelay} onChange={(v) => setStyle('transitionDelay', v)} placeholder="0s" />
        </div>
      </div>

      {/* Misc */}
      <div className={group}>
        <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          Misc
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <SideLabel label="Object Fit" value={activeStyles.objectFit} onChange={(v) => setStyle('objectFit', v)} placeholder="fill" />
          <SideLabel label="Float" value={activeStyles.float} onChange={(v) => setStyle('float', v)} placeholder="none" />
          <SideLabel label="Aspect Ratio" value={activeStyles.aspectRatio} onChange={(v) => setStyle('aspectRatio', v)} placeholder="auto" />
        </div>
      </div>
    </div>
  )
}

function SideLabel({ label, value, onChange, placeholder, type }: {
  label: string
  value?: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="text-[11px] font-medium text-gray-500 block">
      {label}
      <input type={type || 'text'} value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-colors bg-white" placeholder={placeholder} />
    </label>
  )
}

function ColorField({ label, value, onChange, inputClass }: {
  label: string
  value?: string
  onChange: (v: string) => void
  inputClass: string
}) {
  const themeVars = useSettingsStore((s) => s.themeVars)
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false)
    }
    if (showPicker) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [showPicker])

  return (
    <label className="text-[11px] font-medium text-gray-500 block">
      {label}
      <div className="flex gap-1.5">
        <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} className="w-8 h-[30px] rounded border border-gray-200 cursor-pointer p-0.5 shrink-0" />
        <div ref={pickerRef} className="relative">
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="w-7 h-[30px] rounded border border-gray-200 hover:border-indigo-300 bg-white text-[10px] text-gray-400 hover:text-indigo-500 flex items-center justify-center shrink-0 transition-colors"
            title="Insert theme variable"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
          </button>
          {showPicker && themeVars.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1 max-h-48 overflow-auto">
              {themeVars.map((v) => (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => { onChange(`var(--${v.name})`); setShowPicker(false) }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="w-4 h-4 rounded border border-gray-200 shrink-0" style={{ backgroundColor: v.light }} />
                  <span className="w-4 h-4 rounded border border-gray-300 shrink-0" style={{ backgroundColor: v.dark }} />
                  <span className="font-mono">--{v.name}</span>
                </button>
              ))}
            </div>
          )}
          {showPicker && themeVars.length === 0 && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-2 px-3 text-xs text-gray-400">
              No theme variables defined
            </div>
          )}
        </div>
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className={inputClass} placeholder="transparent" />
      </div>
    </label>
  )
}

function SideInputs({ values, keys, onChange, inputClass }: {
  values: Record<string, string | undefined>
  keys: [SideKey, SideKey, SideKey, SideKey]
  onChange: (key: string, value: string) => void
  inputClass: string
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {SIDES.map((side, i) => (
        <div key={side} className="flex flex-col items-center">
          <span className="text-[9px] text-gray-400 mb-0.5">{side[0]}</span>
          <input
            type="text"
            value={values[keys[i]] || ''}
            onChange={(e) => onChange(keys[i], e.target.value)}
            className="w-full px-1.5 py-1 border border-gray-200 rounded text-[11px] text-center focus:outline-none focus:border-indigo-400 transition-colors bg-white"
            placeholder="0"
          />
        </div>
      ))}
    </div>
  )
}
