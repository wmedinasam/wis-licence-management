import React from 'react';
import { AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'expired' | 'expiring_soon';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    active: 'bg-green-900 text-green-200',
    inactive: 'bg-slate-700 text-slate-300',
    expired: 'bg-red-900 text-red-200',
    expiring_soon: 'bg-yellow-900 text-yellow-200',
  };

  const labels = {
    active: 'Activa',
    inactive: 'Inactiva',
    expired: 'Expirada',
    expiring_soon: 'Por Vencer',
  };

  return (
    <span className={`text-xs font-medium px-2 py-1 rounded ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

interface NoDeleteBadgeProps {
  tooltip?: boolean;
}

export function NoDeleteBadge({ tooltip = true }: NoDeleteBadgeProps) {
  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-slate-800 text-slate-400"
      title={tooltip ? 'No se puede eliminar registros' : undefined}
    >
      <AlertCircle className="h-3 w-3" />
      <span>No deletable</span>
    </div>
  );
}
