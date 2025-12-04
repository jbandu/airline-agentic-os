interface ProgressBarProps {
  label?: string;
  percentage: number;
  color?: string;
  showLabel?: boolean;
  height?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  label,
  percentage,
  color = '#3B82F6',
  showLabel = true,
  height = 'md',
}: ProgressBarProps) {
  const heightClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  };

  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showLabel && <span className="text-sm font-semibold text-gray-900">{clampedPercentage}%</span>}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClasses[height]}`}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${clampedPercentage}%`,
            backgroundColor: color,
          }}
        ></div>
      </div>
    </div>
  );
}
