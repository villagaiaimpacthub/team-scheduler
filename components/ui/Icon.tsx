import * as React from 'react'
import * as Icons from 'lucide-react'

export type IconName = keyof typeof Icons

export type IconProps = React.ComponentProps<Icons.LucideProps> & {
  name: IconName
}

export function Icon({ name, ...props }: IconProps) {
  const Cmp = Icons[name] as React.ComponentType<Icons.LucideProps>
  return <Cmp {...props} />
}
