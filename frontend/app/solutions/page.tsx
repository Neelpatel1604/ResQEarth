'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Eye, Loader2 } from 'lucide-react'
import { getSolutions, Solution, deleteSolution } from '@/lib/supabase/solutions'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function SolutionsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [solutions, setSolutions] = useState<Solution[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && user) {
      loadSolutions()
    } else if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  const loadSolutions = async () => {
    try {
      setLoading(true)
      // getSolutions now handles errors gracefully and returns empty array
      const data = await getSolutions(user?.id)
      setSolutions(data)
    } catch (error) {
      // This shouldn't happen now since getSolutions handles errors, but just in case
      console.warn('Error loading solutions:', error)
      setSolutions([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this solution?')) return

    try {
      setDeletingId(id)
      await deleteSolution(id)
      setSolutions(solutions.filter((s) => s.id !== id))
    } catch (error) {
      console.error('Error deleting solution:', error)
      alert('Failed to delete solution. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleView = (solution: Solution) => {
    // Navigate to solution detail or show in modal
    router.push(`/solutions/${solution.id}`)
  }

  const filteredSolutions = solutions.filter((solution) => {
    const matchesSearch =
      searchQuery === '' ||
      solution.disaster_location.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      solution.disaster_id.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = filterType === 'all' || solution.disaster_type === filterType

    return matchesSearch && matchesType
  })

  const getDisasterTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
  }

  const getRiskColor = (risk: number) => {
    if (risk < 5) return 'text-green-500'
    if (risk < 30) return 'text-yellow-500'
    return 'text-destructive'
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading solutions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Saved Solutions</CardTitle>
            <CardDescription>
              View and manage your disaster prevention solutions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <Input
                placeholder="Search by location or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="wildfire">Wildfire</SelectItem>
                  <SelectItem value="flood">Flood</SelectItem>
                  <SelectItem value="thunderstorm">Thunderstorm</SelectItem>
                  <SelectItem value="heatwave">Heatwave</SelectItem>
                  <SelectItem value="volcanic_ash">Volcanic Ash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Solutions Table */}
            {filteredSolutions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {solutions.length === 0
                    ? 'No solutions saved yet. Create your first solution on the map!'
                    : 'No solutions match your filters.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Disaster</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Initial Risk</TableHead>
                    <TableHead>Final Risk</TableHead>
                    <TableHead>Risk Reduction</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSolutions.map((solution) => (
                    <TableRow key={solution.id}>
                      <TableCell className="font-medium">
                        {solution.disaster_id}
                      </TableCell>
                      <TableCell>
                        {solution.disaster_location.name ||
                          `${solution.disaster_location.latitude.toFixed(2)}, ${solution.disaster_location.longitude.toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getDisasterTypeLabel(solution.disaster_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-destructive font-medium">
                          {solution.initial_risk.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn('font-medium', getRiskColor(solution.final_risk))}
                        >
                          {solution.final_risk.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-primary font-medium">
                          {solution.risk_reduction.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        ${solution.total_cost.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {solution.actions?.length || 0} actions
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {solution.created_at
                          ? new Date(solution.created_at).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(solution)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => solution.id && handleDelete(solution.id)}
                            disabled={deletingId === solution.id}
                          >
                            {deletingId === solution.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

