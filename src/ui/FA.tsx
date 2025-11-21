import React from 'react'

export const byPrefixAndName: any = { fass: {} }

byPrefixAndName.fass['aperture'] = (props: React.SVGProps<SVGSVGElement>) => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width={props.width || 24} height={props.height || 24} viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M12 3 L15.5 8 L12 12 Z" fill="currentColor" />
    <path d="M21 12 L15.5 8 L12 12 Z" fill="currentColor" />
    <path d="M12 21 L8.5 16 L12 12 Z" fill="currentColor" />
    <path d="M3 12 L8.5 16 L12 12 Z" fill="currentColor" />
    <path d="M16.5 15.5 L12 12 L21 12 Z" fill="currentColor" opacity=".9" />
    <path d="M7.5 8.5 L12 12 L3 12 Z" fill="currentColor" opacity=".9" />
  </svg>
)

export function FontAwesomeIcon({ icon, ...rest }: { icon: any } & React.SVGProps<SVGSVGElement>) {
  if (typeof icon === 'function') return icon(rest)
  if (icon && typeof icon === 'object' && icon.svgPath) {
    return (
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width={rest.width || 24} height={rest.height || 24} viewBox={icon.viewBox || '0 0 24 24'} fill="none" {...rest}>
        <path d={icon.svgPath} fill="currentColor" />
      </svg>
    )
  }
  return null
}