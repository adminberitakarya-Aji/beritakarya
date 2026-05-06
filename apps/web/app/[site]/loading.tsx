import Skeleton from '../../components/ui/Skeleton';

export default function Loading() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Skeleton */}
      <section className="mb-16 animate-pulse">
        <Skeleton variant="hero" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        {/* Main Feed Skeletons */}
        <div className="lg:col-span-8 flex flex-col gap-12">
          <div className="h-10 w-48 bg-gray-100 rounded-sm mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        </div>

        {/* Sidebar Skeletons */}
        <aside className="lg:col-span-4 flex flex-col gap-12">
          <div className="p-6 bg-gray-50 border border-gray-100 rounded-sm">
            <div className="h-4 w-24 bg-gray-200 mb-6" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-white border border-gray-100" />
              ))}
            </div>
          </div>

          <div>
            <div className="h-6 w-32 bg-gray-100 mb-6" />
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="minimal" />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
