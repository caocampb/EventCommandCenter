'use client';

// We're not using getStatusStyles anymore since we're using CSS variables via Tailwind
export type StatusType = 'confirmed' | 'draft' | 'cancelled' | 'pending';

interface StatusPillProps {
  status: StatusType;
  className?: string;
}

/**
 * A Linear-style status pill that displays event status with appropriate styling
 */
export function StatusPill({ status, className = '' }: StatusPillProps) {
  // Map status to display text (with capitalized first letter)
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  
  // Get the appropriate status classes based on the status
  const statusClasses = {
    confirmed: 'bg-theme-status-confirmed-bg text-theme-status-confirmed-text',
    draft: 'bg-theme-status-draft-bg text-theme-status-draft-text',
    cancelled: 'bg-theme-status-cancelled-bg text-theme-status-cancelled-text',
    pending: 'bg-theme-status-pending-bg text-theme-status-pending-text'
  };
  
  return (
    <span 
      className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${statusClasses[status]} ${className}`}
    >
      {label}
    </span>
  );
} 