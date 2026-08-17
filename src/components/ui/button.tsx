import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:bg-primary/95",
        outline:
          "border-border bg-background shadow-2xs hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-2xs hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/90 dark:hover:bg-destructive",
        sidecar:
          "bg-[#F3E8BC] text-[#493f13] border border-[#e5d79e] shadow-2xs hover:bg-[#ebdca6] active:bg-[#e4d399]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 min-h-[40px] gap-2 px-4 py-2 text-sm has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        xs: "h-7 min-h-[28px] gap-1.5 rounded-lg px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-9 min-h-[36px] gap-1.5 rounded-lg px-3 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-12 min-h-[48px] gap-2.5 rounded-xl px-5 text-base font-bold has-data-[icon=inline-end]:pr-4.5 has-data-[icon=inline-start]:pl-4.5 [&_svg:not([class*='size-'])]:size-5",
        xl: "h-14 min-h-[56px] gap-3 rounded-2xl px-6 text-lg font-extrabold has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5 [&_svg:not([class*='size-'])]:size-6",
        icon: "size-10 min-size-[40px] rounded-xl",
        "icon-xs": "size-7 min-size-[28px] rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9 min-size-[36px] rounded-lg [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-12 min-size-[48px] rounded-xl [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
