export default function Loading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-24 rounded-lg border border-sky-300 bg-sky-100" />
      <div className="h-32 rounded-lg border border-mint-300 bg-mint-100" />
      <div className="h-28 rounded-lg border border-cream-200 bg-cream-100" />
      <div className="h-32 rounded-lg border border-pink-300 bg-pink-100" />
    </div>
  );
}
