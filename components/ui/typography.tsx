"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textVariants = cva("", {
  variants: {
    variant: {
      "page-title":    "ds-page-title",
      "section-title": "ds-section-title",
      "card-title":    "ds-card-title",
      body:            "ds-body",
      caption:         "ds-caption",
      helper:          "ds-helper",
      label:           "ds-label",
    },
    muted: {
      true: "text-slate-500",
    },
    truncate: {
      true: "truncate",
    },
  },
  defaultVariants: {
    variant: "body",
  },
})

type TextElement = "p" | "span" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "label" | "div"

const VARIANT_TAG: Record<NonNullable<VariantProps<typeof textVariants>["variant"]>, TextElement> = {
  "page-title":    "h1",
  "section-title": "h2",
  "card-title":    "h3",
  body:            "p",
  caption:         "span",
  helper:          "span",
  label:           "label",
}

export interface TextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  as?: TextElement
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ className, variant = "body", muted, truncate, as, ...props }, ref) => {
    const Tag = (as ?? VARIANT_TAG[variant!] ?? "p") as React.ElementType
    return (
      <Tag
        ref={ref as React.Ref<HTMLElement>}
        className={cn(textVariants({ variant, muted, truncate }), className)}
        {...props}
      />
    )
  }
)
Text.displayName = "Text"

export { Text, textVariants }
