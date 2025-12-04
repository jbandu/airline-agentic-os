import { Shield, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import type { CertificationStatus, CertificationType } from '../../types';

interface CertificationBadgeProps {
  type: CertificationType;
  status: CertificationStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showType?: boolean;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-gray-100 text-gray-700',
    icon: Clock,
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-700',
    icon: Clock,
  },
  certified: {
    label: 'Certified',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle,
  },
  expired: {
    label: 'Expired',
    color: 'bg-orange-100 text-orange-700',
    icon: AlertTriangle,
  },
  revoked: {
    label: 'Revoked',
    color: 'bg-red-100 text-red-700',
    icon: XCircle,
  },
  renewed: {
    label: 'Renewed',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle,
  },
};

const typeLabels: Record<CertificationType, string> = {
  security: 'Security',
  compliance: 'Compliance',
  performance: 'Performance',
  integration: 'Integration',
  data_privacy: 'Data Privacy',
  accessibility: 'Accessibility',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
};

export function CertificationBadge({
  type,
  status,
  size = 'sm',
  showIcon = true,
  showType = true,
}: CertificationBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const iconSize = iconSizes[size];

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.color} ${sizeClasses[size]}`}
      title={`${typeLabels[type]}: ${config.label}`}
    >
      {showIcon && <Icon size={iconSize} />}
      {showType && <span>{typeLabels[type]}</span>}
      <span className="opacity-70">•</span>
      <span>{config.label}</span>
    </div>
  );
}

interface CertificationStatusIconProps {
  status: CertificationStatus;
  size?: number;
  className?: string;
}

export function CertificationStatusIcon({
  status,
  size = 16,
  className = '',
}: CertificationStatusIconProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const colorClass =
    status === 'certified' || status === 'renewed'
      ? 'text-green-600'
      : status === 'in_progress'
      ? 'text-blue-600'
      : status === 'expired'
      ? 'text-orange-600'
      : status === 'revoked'
      ? 'text-red-600'
      : 'text-gray-600';

  return <Icon size={size} className={`${colorClass} ${className}`} />;
}

interface CertificationListProps {
  certifications: any[];
  maxDisplay?: number;
}

export function CertificationList({ certifications, maxDisplay = 3 }: CertificationListProps) {
  if (!certifications || certifications.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Shield size={12} />
        <span>No certifications</span>
      </div>
    );
  }

  const displayed = certifications.slice(0, maxDisplay);
  const remaining = certifications.length - maxDisplay;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {displayed.map((cert) => (
        <CertificationBadge
          key={cert.id}
          type={cert.certificationType}
          status={cert.status}
          size="sm"
          showType={false}
        />
      ))}
      {remaining > 0 && (
        <span className="text-xs text-gray-500 ml-1">+{remaining} more</span>
      )}
    </div>
  );
}
