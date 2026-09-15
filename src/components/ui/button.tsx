import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-[var(--motion-quick)] ease-[var(--ease-out)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-accent text-accent-fg hover:bg-accent/90",
        primary: "bg-accent text-accent-fg hover:bg-accent/90",
        secondary: "bg-raised text-fg hover:bg-raised/80",
        muted: "bg-raised text-fg hover:bg-raised/80",
        outline:
          "bg-transparent text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
        ghost:
          "bg-transparent text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
        danger: "bg-danger text-fg hover:bg-danger/90",
        burn: "bg-danger text-fg hover:bg-danger/90",
      },
      size: {
        default: "h-11 rounded-md px-4 text-sm",
        sm: "h-9 rounded-sm px-3 text-sm",
        md: "h-11 rounded-md px-4 text-sm",
        lg: "h-12 rounded-md px-5 text-base",
        icon: "size-11 rounded-md",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
