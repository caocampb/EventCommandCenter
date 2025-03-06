import { formatTimeForDisplay } from "@/utils/timezone-utils";
import { cn } from "@v1/ui/cn";

// Define the status styles mapping using theme classes instead of hardcoded colors
const statusStyles = {
  pending: "bg-theme-status-pending-bg border border-theme-status-pending-text/20 text-theme-status-pending-text",
  "in-progress": "bg-theme-status-pending-bg border border-theme-status-pending-text/20 text-theme-status-pending-text",
  complete: "bg-theme-status-confirmed-bg border border-theme-status-confirmed-text/20 text-theme-status-confirmed-text",
  cancelled: "bg-theme-status-cancelled-bg border border-theme-status-cancelled-text/20 text-theme-status-cancelled-text",
  draft: "bg-theme-status-draft-bg border border-theme-status-draft-text/20 text-theme-status-draft-text"
};

// Simple interface for the block type
interface TimelineBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status?: "pending" | "in-progress" | "complete" | "cancelled" | "draft";
}

export function TimelineBlock({
  block
}: {
  block: TimelineBlock;
}) {
  // Format the start and end times for display
  const displayStartTime = formatTimeForDisplay(block.startTime);
  const displayEndTime = formatTimeForDisplay(block.endTime);
  const timeDisplay = `${displayStartTime} — ${displayEndTime}`;
  
  return (
    <div className={cn("relative rounded-md p-2", statusStyles[block.status || "draft"])}>
      <div className="font-medium">{block.title}</div>
      <div className="text-xs">{timeDisplay}</div>
    </div>
  );
} 