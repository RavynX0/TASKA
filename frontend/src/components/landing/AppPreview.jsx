export default function AppPreview() {
  return (
    <div className="rounded-2xl border border-border-soft bg-white p-3 shadow-lg">
      <div className="mb-3 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-2">
          <div className="h-16 rounded-xl bg-surface-dark" />
          <div className="h-8 rounded-lg bg-canvas" />
          <div className="h-8 rounded-lg bg-canvas" />
        </div>
        <div className="space-y-2">
          <div className="h-8 rounded-lg bg-primary-soft" />
          <div className="h-8 rounded-lg bg-canvas" />
          <div className="h-24 rounded-lg bg-canvas" />
        </div>
      </div>
    </div>
  );
}
