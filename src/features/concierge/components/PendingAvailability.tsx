export function PendingAvailability({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg my-2 max-w-[85%] mx-auto shadow-sm">
      <div className="animate-spin w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full" />
      <span className="text-slate-800 text-sm font-medium">{message}</span>
    </div>
  );
}