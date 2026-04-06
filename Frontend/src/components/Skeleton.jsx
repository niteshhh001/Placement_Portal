// ─── Base Skeleton Block ─────────────────────────────────────────────────────
function SkeletonBlock({ className = "" }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
  );
}

// ─── Job Card Skeleton ───────────────────────────────────────────────────────
export function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-5 w-36" />
            <SkeletonBlock className="h-5 w-16 rounded-full" />
          </div>
          <SkeletonBlock className="h-4 w-48" />
          <div className="flex gap-4 mt-3">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-3 w-32" />
          </div>
        </div>
        <SkeletonBlock className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Jobs List Skeleton ──────────────────────────────────────────────────────
export function JobsListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-4 w-32" />
      </div>
      {/* Filters */}
      <div className="flex gap-3">
        <SkeletonBlock className="h-10 flex-1 rounded-lg" />
        <SkeletonBlock className="h-10 w-36 rounded-lg" />
      </div>
      {/* Cards */}
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Application Card Skeleton ───────────────────────────────────────────────
export function ApplicationCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-4">
          <SkeletonBlock className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-3 w-48" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-6 w-20 rounded-full" />
          <SkeletonBlock className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

// ─── Applications List Skeleton ──────────────────────────────────────────────
export function ApplicationsListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-4 w-32" />
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <ApplicationCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Profile Skeleton ────────────────────────────────────────────────────────
export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-36" />
        <SkeletonBlock className="h-4 w-64" />
      </div>
      {/* Completion bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex justify-between">
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="h-4 w-10" />
        </div>
        <SkeletonBlock className="h-2 w-full rounded-full" />
      </div>
      {/* Basic info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-6">
        <SkeletonBlock className="h-5 w-36" />
        <div className="flex items-center gap-5">
          <SkeletonBlock className="w-16 h-16 rounded-full" />
          <div className="space-y-2">
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="h-4 w-52" />
            <SkeletonBlock className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <SkeletonBlock className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

// ─── Dashboard Stats Skeleton ────────────────────────────────────────────────
export function DashboardStatsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-64" />
        <SkeletonBlock className="h-4 w-48" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <div className="flex justify-between">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-8 w-8 rounded-lg" />
            </div>
            <SkeletonBlock className="h-8 w-16" />
            <SkeletonBlock className="h-3 w-28" />
          </div>
        ))}
      </div>
      {/* Recent */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <SkeletonBlock className="h-5 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="w-8 h-8 rounded-lg" />
              <div className="space-y-1">
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="h-3 w-24" />
              </div>
            </div>
            <SkeletonBlock className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Admin Students Table Skeleton ───────────────────────────────────────────
export function StudentsTableSkeleton({ rows = 8 }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-32" />
          <SkeletonBlock className="h-4 w-48" />
        </div>
        <SkeletonBlock className="h-9 w-36 rounded-lg" />
      </div>
      {/* Filters */}
      <div className="flex gap-3">
        <SkeletonBlock className="h-10 flex-1 rounded-lg" />
        <SkeletonBlock className="h-10 w-36 rounded-lg" />
        <SkeletonBlock className="h-10 w-36 rounded-lg" />
        <SkeletonBlock className="h-10 w-36 rounded-lg" />
      </div>
      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex gap-8">
          {["Student", "Branch", "CGPA", "Backlogs", "Status", "Actions"].map(h => (
            <SkeletonBlock key={h} className="h-3 w-16" />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-8 px-4 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3 flex-1">
              <SkeletonBlock className="w-8 h-8 rounded-full" />
              <div className="space-y-1">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-3 w-20" />
              </div>
            </div>
            <SkeletonBlock className="h-4 w-12" />
            <SkeletonBlock className="h-4 w-10" />
            <SkeletonBlock className="h-4 w-8" />
            <SkeletonBlock className="h-6 w-16 rounded-full" />
            <div className="flex gap-2">
              <SkeletonBlock className="h-4 w-10" />
              <SkeletonBlock className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Admin Dashboard Skeleton ─────────────────────────────────────────────────
export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="h-4 w-64" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-8 w-20" />
            <SkeletonBlock className="h-3 w-24" />
          </div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-48 w-full rounded-lg" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ─── Job Detail Skeleton ─────────────────────────────────────────────────────
export function JobDetailSkeleton() {
  return (
    <div className="max-w-3xl space-y-6">
      <SkeletonBlock className="h-4 w-16" />
      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex justify-between">
          <div className="space-y-2">
            <SkeletonBlock className="h-7 w-48" />
            <SkeletonBlock className="h-4 w-36" />
          </div>
          <SkeletonBlock className="h-10 w-28 rounded-lg" />
        </div>
      </div>
      {/* Details card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <SkeletonBlock className="h-5 w-28" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="h-5 w-32" />
            </div>
          ))}
        </div>
      </div>
      {/* Eligibility card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <SkeletonBlock className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <SkeletonBlock className="h-3 w-28" />
              <SkeletonBlock className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}