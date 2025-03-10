'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

type IconLinkButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
};

/**
 * A reusable icon link button component that's fully typed for Next.js
 * Can be styled as primary, secondary, or ghost
 */
export default function IconLinkButton({
  href,
  children,
  className = '',
  icon,
  variant = 'primary',
}: IconLinkButtonProps) {
  // Base styles for all variants
  const baseStyles = "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150";
  
  // Variant-specific styles
  const variantStyles = {
    primary: "bg-theme-primary text-white border-transparent hover:bg-theme-primary-hover active:bg-theme-primary-active",
    secondary: "bg-theme-bg-card text-theme-text-secondary border border-theme-border-subtle hover:bg-theme-bg-hover hover:text-theme-text-primary",
    ghost: "bg-transparent text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text-primary"
  };
  
  return (
    <Link
      href={{ pathname: href }}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="opacity-80">{icon}</span>}
      {children}
    </Link>
  );
} 