import * as React from 'react'
import * as Icons from 'lucide-react'
import { LucideProps } from 'lucide-react'

export type IconName = keyof typeof Icons

export type IconProps = LucideProps & {
  name: IconName
}

export function Icon({ name, ...props }: IconProps) {
  const Cmp = Icons[name] as React.ComponentType<LucideProps>
  if (!Cmp) {
    console.warn(`Icon "${name}" not found`)
    return null
  }
  return <Cmp {...props} />
}

