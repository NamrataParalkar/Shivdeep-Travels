import { ReactNode } from "react";

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  accentColor: string;
}

export function EmptyState({
  message,
  actionLabel,
  onAction,
  icon,
  accentColor,
}: EmptyStateProps) {
  const buttonBg = {
    purple: "bg-purple-500 hover:bg-purple-600",
    pink: "bg-pink-500 hover:bg-pink-600",
    yellow: "bg-yellow-500 hover:bg-yellow-600",
    green: "bg-green-500 hover:bg-green-600",
    orange: "bg-orange-500 hover:bg-orange-600",
    rose: "bg-rose-500 hover:bg-rose-600",
    violet: "bg-violet-500 hover:bg-violet-600",
    indigo: "bg-indigo-500 hover:bg-indigo-600",
    slate: "bg-slate-500 hover:bg-slate-600",
  };

  const bgKey = accentColor as keyof typeof buttonBg;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <p className="text-gray-600 mb-4">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={`inline-flex items-center gap-2 ${buttonBg[bgKey] || buttonBg.purple} text-white px-6 py-3 rounded-full transition`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
