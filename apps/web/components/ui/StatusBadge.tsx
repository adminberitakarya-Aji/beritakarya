'use client';

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_MAP: Record<string, { label: string; dot: string }> = {
  draft:     { label: 'Draft',       dot: 'bg-amber-400' },
  submitted: { label: 'Dikirim',     dot: 'bg-blue-400' },
  review:    { label: 'Review',      dot: 'bg-violet-400' },
  revision:  { label: 'Revisi',      dot: 'bg-orange-400' },
  approved:  { label: 'Disetujui',   dot: 'bg-emerald-400' },
  scheduled: { label: 'Terjadwal',   dot: 'bg-cyan-400' },
  published: { label: 'Terbit',      dot: 'bg-green-500' },
  archived:  { label: 'Arsip',       dot: 'bg-gray-400' },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status] || STATUS_MAP.draft;

  return (
    <span className={cn('status-badge', `status-${status}`, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}
