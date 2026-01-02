import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

interface AdminPageHeaderProps {
  title: string;
  onBack: () => void;
  accentColor: string;
  children?: ReactNode;
}

export function AdminPageHeader({
  title,
  onBack,
  accentColor,
  children,
}: AdminPageHeaderProps) {
  const colorClasses = {
    purple: "bg-white/70 hover:bg-purple-100 text-purple-700 border-purple-200",
    pink: "bg-white/70 hover:bg-pink-100 text-pink-700 border-pink-200",
    yellow: "bg-white/70 hover:bg-yellow-100 text-yellow-700 border-yellow-200",
    green: "bg-white/70 hover:bg-green-100 text-green-700 border-green-200",
    orange: "bg-white/70 hover:bg-orange-100 text-orange-700 border-orange-200",
    rose: "bg-white/70 hover:bg-rose-100 text-rose-700 border-rose-200",
    violet: "bg-white/70 hover:bg-violet-100 text-violet-700 border-violet-200",
    indigo: "bg-white/70 hover:bg-indigo-100 text-indigo-700 border-indigo-200",
    slate: "bg-white/70 hover:bg-slate-100 text-slate-700 border-slate-200",
  };

  const textGradients = {
    purple: "from-purple-600 via-pink-500 to-yellow-400",
    pink: "from-pink-600 via-purple-500 to-pink-400",
    yellow: "from-yellow-600 via-yellow-500 to-orange-400",
    green: "from-green-600 via-green-500 to-emerald-400",
    orange: "from-orange-600 via-orange-500 to-yellow-400",
    rose: "from-rose-600 via-rose-500 to-red-400",
    violet: "from-violet-600 via-violet-500 to-purple-400",
    indigo: "from-indigo-600 via-indigo-500 to-purple-400",
    slate: "from-slate-600 via-slate-500 to-gray-400",
  };

  const bgColor = colorClasses[accentColor as keyof typeof colorClasses] || colorClasses.purple;
  const gradient = textGradients[accentColor as keyof typeof textGradients] || textGradients.purple;

  return (
    <header className="mb-8">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className={`flex items-center gap-2 ${bgColor} px-4 py-2 rounded-full shadow-sm transition backdrop-blur-sm`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={`text-4xl font-extrabold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
          {title}
        </h1>
      </div>
      {children}
    </header>
  );
}
