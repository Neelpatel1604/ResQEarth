'use client'

import * as React from 'react'
import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { DisasterThreat, PreventionAction } from '@/lib/map/dummy-data'
import { cn } from '@/lib/utils'

interface ParameterControlsProps {
  disaster: DisasterThreat
  actions: PreventionAction[]
  onParameterChange?: (params: {
    budget: number
    riskReduction: number
    effectiveness: number
  }) => void
}

export function ParameterControls({
  disaster,
  actions,
  onParameterChange,
}: ParameterControlsProps) {
  const totalCost = useMemo(
    () => actions.reduce((sum, action) => sum + action.cost, 0),
    [actions]
  )

  const totalEffectiveness = useMemo(() => {
    const baseEffectiveness = actions.reduce(
      (sum, action) => sum + (action.effectiveness || 0),
      0
    )
    // Cap at 100%
    return Math.min(baseEffectiveness, 100)
  }, [actions])

  const calculatedRiskReduction = useMemo(() => {
    // Calculate risk reduction based on effectiveness
    const reduction = (totalEffectiveness / 100) * disaster.risk_percentage
    return Math.min(reduction, disaster.risk_percentage)
  }, [totalEffectiveness, disaster.risk_percentage])

  const finalRisk = useMemo(() => {
    return Math.max(0, disaster.risk_percentage - calculatedRiskReduction)
  }, [disaster.risk_percentage, calculatedRiskReduction])

  const [budget, setBudget] = useState(totalCost)
  const [riskReduction, setRiskReduction] = useState(calculatedRiskReduction)

  // Update risk reduction when effectiveness changes
  useEffect(() => {
    setRiskReduction(calculatedRiskReduction)
  }, [calculatedRiskReduction])

  // Update budget when actions change
  useEffect(() => {
    setBudget(totalCost)
  }, [totalCost])

  // Update parent when parameters change
  useEffect(() => {
    onParameterChange?.({
      budget,
      riskReduction,
      effectiveness: totalEffectiveness,
    })
  }, [budget, riskReduction, totalEffectiveness, onParameterChange])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parameter Controls</CardTitle>
        <CardDescription>Adjust parameters to see real-time effects</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budget Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="budget">Budget</Label>
            <span className="text-sm font-medium">${budget.toLocaleString()}</span>
          </div>
          <Slider
            id="budget"
            min={0}
            max={Math.max(totalCost * 2, 100000)}
            step={1000}
            value={budget}
            onValueChange={setBudget}
          />
        </div>

        {/* Risk Reduction Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Risk Reduction</Label>
            <span className="text-sm font-medium">{riskReduction.toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${(riskReduction / disaster.risk_percentage) * 100}%` }}
            />
          </div>
        </div>

        {/* Effectiveness Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Total Effectiveness</Label>
            <span className="text-sm font-medium">{totalEffectiveness.toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-green-500 transition-all"
              style={{ width: `${totalEffectiveness}%` }}
            />
          </div>
        </div>

        {/* Risk Comparison */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Initial Risk</span>
            <span className="font-medium text-destructive">
              {disaster.risk_percentage.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Final Risk</span>
            <span
              className={cn(
                'font-medium',
                finalRisk < 5 ? 'text-green-500' : finalRisk < 30 ? 'text-yellow-500' : 'text-destructive'
              )}
            >
              {finalRisk.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Risk Reduction</span>
            <span className="text-primary">{calculatedRiskReduction.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

