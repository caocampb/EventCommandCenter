'use client';

import { getStatusStyles } from '@/styles/colors';

export type StatusType = 'confirmed' | 'draft' | 'cancelled' | 'pending';

interface StatusPillProps {
  status: StatusType;
  className?: string;
}

/**
 * A Linear-style status pill that displays event status with appropriate styling
 */
export function StatusPill({ status, className = '' }: StatusPillProps) {
  const styles = getStatusStyles(status);
  
  // Map status to display text (with capitalized first letter)
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  
  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full transition-colors ${className}`}
      style={{ 
        backgroundColor: styles.background,
        color: styles.color
      }}
    >
      {label}
    </span>
  );
} 