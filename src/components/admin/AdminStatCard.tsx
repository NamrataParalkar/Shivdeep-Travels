interface AdminStatCardProps {
  label: string;
  value: string | number;
  color: "purple" | "pink" | "yellow" | "green" | "orange" | "rose" | "indigo";
}

export function AdminStatCard({ label, value, color }: AdminStatCardProps) {
  const colorClasses = {
    purple: {
      bg: "from-purple-50 to-purple-100/50",
      border: "border-purple-400",
      text: "text-purple-600",
    },
    pink: {
      bg: "from-pink-50 to-pink-100/50",
      border: "border-pink-400",
      text: "text-pink-600",
    },
    yellow: {
      bg: "from-yellow-50 to-yellow-100/50",
      border: "border-yellow-400",
      text: "text-yellow-600",
    },
    green: {
      bg: "from-green-50 to-green-100/50",
      border: "border-green-400",
      text: "text-green-600",
    },
    orange: {
      bg: "from-orange-50 to-orange-100/50",
      border: "border-orange-400",
      text: "text-orange-600",
    },
    rose: {
      bg: "from-rose-50 to-rose-100/50",
      border: "border-rose-400",
      text: "text-rose-600",
    },
    indigo: {
      bg: "from-indigo-50 to-indigo-100/50",
      border: "border-indigo-400",
      text: "text-indigo-600",
    },
  };

  const styles = colorClasses[color];

  return (
    <div
      className={`bg-gradient-to-br ${styles.bg} rounded-2xl shadow-lg p-8 border-2 ${styles.border}`}
    >
      <p className="text-gray-600 text-sm font-medium mb-2">{label}</p>
      <p className={`text-4xl font-bold ${styles.text}`}>{value}</p>
    </div>
  );
}
