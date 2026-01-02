import { ReactNode } from "react";

interface AdminTableProps {
  headers: string[];
  rows: (string | ReactNode)[][];
  accentColor: string;
}

export function AdminTable({ headers, rows, accentColor }: AdminTableProps) {
  const headerBg = {
    purple: "from-purple-100 to-pink-100",
    pink: "from-pink-100 to-purple-100",
    yellow: "from-yellow-100 to-orange-100",
    green: "from-green-100 to-emerald-100",
    orange: "from-orange-100 to-yellow-100",
    rose: "from-rose-100 to-red-100",
    violet: "from-violet-100 to-purple-100",
    indigo: "from-indigo-100 to-purple-100",
    slate: "from-slate-100 to-gray-100",
  };

  const hoverBg = {
    purple: "hover:bg-purple-50",
    pink: "hover:bg-pink-50",
    yellow: "hover:bg-yellow-50",
    green: "hover:bg-green-50",
    orange: "hover:bg-orange-50",
    rose: "hover:bg-rose-50",
    violet: "hover:bg-violet-50",
    indigo: "hover:bg-indigo-50",
    slate: "hover:bg-slate-50",
  };

  const bgKey = accentColor as keyof typeof headerBg;
  const hoverKey = accentColor as keyof typeof hoverBg;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
      <table className="w-full">
        <thead className={`bg-gradient-to-r ${headerBg[bgKey] || headerBg.purple}`}>
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-6 py-4 text-left text-gray-800 font-semibold"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={`border-t border-gray-200 ${hoverBg[hoverKey] || hoverBg.purple} transition`}
            >
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-6 py-4 text-gray-800">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
