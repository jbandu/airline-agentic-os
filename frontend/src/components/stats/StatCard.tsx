import { Link } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: string;
  color?: string;
  link?: string;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
}

export function StatCard({ title, value, icon, color = '#3B82F6', link, subtitle, trend }: StatCardProps) {
  const content = (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              <span className="font-medium">
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="ml-2 text-gray-500">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
