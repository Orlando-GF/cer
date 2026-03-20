export default function Loading() {
  return (
    <div className="p-6 space-y-8 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded-none" />
      <div className="h-4 w-80 bg-muted/60 rounded-none" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-card border border-border rounded-none" />
        ))}
      </div>
      <div className="h-64 bg-card border border-border rounded-none" />
    </div>
  )
}
