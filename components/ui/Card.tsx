import { type HTMLAttributes } from 'react'

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ')
}

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className, padding = 'md', ...props }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}