import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ')
}

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        // Black on light, white on dark
        default: 'bg-black text-white dark:bg-white dark:text-black hover:opacity-90 focus:ring-[rgb(var(--ring))]',
        secondary: 'bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-foreground))] hover:opacity-95 focus:ring-[rgb(var(--ring))]',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-[rgb(var(--ring))]',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-[rgb(var(--ring))]',
        outline: 'border border-[rgb(var(--border))] bg-[rgb(var(--background))] text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))] focus:ring-[rgb(var(--ring))]',
        ghost: 'bg-transparent hover:bg-[rgb(var(--muted))] text-[rgb(var(--foreground))]',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm rounded-md',
        md: 'px-4 py-2 text-sm rounded-lg',
        lg: 'px-6 py-3 text-base rounded-lg',
        icon: 'h-9 w-9 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

export { buttonVariants }