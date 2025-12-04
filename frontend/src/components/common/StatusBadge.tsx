interface StatusBadgeProps {
  status: 'built' | 'in-progress' | 'planned' | 'active' | 'inactive' | 'draft' | 'completed';
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const statusStyles = {
    built: 'bg-green-100 text-green-800 border-green-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    planned: 'bg-gray-100 text-gray-800 border-gray-200',
    active: 'bg-green-100 text-green-800 border-green-200',
    inactive: 'bg-gray-100 text-gray-600 border-gray-200',
    draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  const statusLabels = {
    built: 'Built',
    'in-progress': 'In Progress',
    planned: 'Planned',
    active: 'Active',
    inactive: 'Inactive',
    draft: 'Draft',
    completed: 'Completed',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${statusStyles[status]} ${sizeClasses[size]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
