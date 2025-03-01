'use client';

import { ExportButtonHydration } from '@/components/timeline/export-button-hydration';

export default function TimelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ExportButtonHydration />
      {children}
    </>
  );
} 