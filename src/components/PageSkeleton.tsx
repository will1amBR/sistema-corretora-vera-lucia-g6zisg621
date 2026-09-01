import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export function PageSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in p-4 sm:p-6">
      {/* Top Header skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64 bg-gray-200" />
          <Skeleton className="h-4 w-96 max-w-full bg-gray-100" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg bg-gray-200" />
          <Skeleton className="h-9 w-32 rounded-lg bg-gray-200" />
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3"
          >
            <Skeleton className="h-3 w-28 bg-gray-200" />
            <Skeleton className="h-8 w-20 bg-gray-300" />
            <Skeleton className="h-3 w-36 bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Grid Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <Skeleton className="h-5 w-48 bg-gray-200" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-48 rounded-xl bg-gray-100" />
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <Skeleton className="h-5 w-40 bg-gray-200" />
          <Skeleton className="h-32 rounded-xl bg-gray-100" />
          <Skeleton className="h-32 rounded-xl bg-gray-100" />
        </div>
      </div>
    </div>
  )
}
