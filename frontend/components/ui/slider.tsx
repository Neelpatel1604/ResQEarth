'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SliderProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  value?: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value ?? min)

    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value)
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value)
      setInternalValue(newValue)
      onValueChange?.(newValue)
    }

    const percentage = ((internalValue - min) / (max - min)) * 100

    return (
      <div className={cn('relative flex w-full items-center', className)}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={internalValue}
          onChange={handleChange}
          className="sr-only"
          {...props}
        />
        <div className="relative h-2 w-full rounded-full bg-secondary">
          <div
            className="absolute h-2 rounded-full bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div
          className="absolute h-4 w-4 rounded-full border-2 border-primary bg-background shadow-sm transition-all hover:scale-110"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
        <div className="ml-4 text-sm text-muted-foreground min-w-[3rem] text-right">
          {internalValue.toFixed(1)}
        </div>
      </div>
    )
  }
)

Slider.displayName = 'Slider'

export { Slider }

