export default function Loading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-8 w-1/2 rounded bg-sky-100" />
      <div className="h-32 rounded-lg border border-cream-200 bg-cream-100" />
      <div className="flex flex-col gap-2">
        <div className="h-12 rounded-md border border-sky-300 bg-sky-100" />
        <div className="h-12 rounded-md border border-sky-300 bg-sky-100" />
        <div className="h-12 rounded-md border border-sky-300 bg-sky-100" />
        <div className="h-12 rounded-md border border-sky-300 bg-sky-100" />
      </div>
    </div>
  );
}
