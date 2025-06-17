export function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="space-y-6 sm:space-y-8 animate-pulse">
        {/* Header skeleton */}
        <div>
          <div className="h-10 bg-slate-700 rounded w-48 mb-2"></div>
          <div className="h-6 bg-slate-700 rounded w-96"></div>
        </div>
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-800/40 rounded-lg p-4 h-32"></div>
          ))}
        </div>
        
        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 bg-slate-800/40 rounded-lg p-6 h-96"></div>
          <div className="bg-slate-800/40 rounded-lg p-6 h-96"></div>
        </div>
      </div>
    </div>
  )
}