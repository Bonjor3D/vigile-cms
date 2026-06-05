export interface ViewportPreset {
  label: string
  width: number
  height: number
}

export const VIEWPORT_PRESETS: Record<string, ViewportPreset[]> = {
  desktop: [
    { label: 'Full HD', width: 1920, height: 1080 },
    { label: 'HD+', width: 1600, height: 900 },
    { label: 'HD', width: 1366, height: 768 },
  ],
  tablet: [
    { label: 'iPad', width: 768, height: 1024 },
    { label: 'iPad Pro', width: 1024, height: 1366 },
  ],
  mobile: [
    { label: 'iPhone SE', width: 375, height: 667 },
    { label: 'iPhone 14/15 Pro', width: 390, height: 844 },
    { label: 'Samsung Galaxy', width: 360, height: 740 },
    { label: 'iPhone 15 Pro Max', width: 430, height: 932 },
  ],
}

export function getDefaultPreset(bp: string): ViewportPreset {
  const presets = VIEWPORT_PRESETS[bp]
  return presets?.[0] ?? { label: 'Custom', width: 1200, height: 800 }
}
