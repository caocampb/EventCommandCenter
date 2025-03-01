import { formatTimeForDisplay } from "@/utils/timezone-utils";
import { cn } from "@v1/ui/cn";
import { colors } from "@/styles/colors";

// Define the status styles mapping
const statusStyles = {
  pending: `bg-[${colors.status.pending.bg}] border border-[${colors.status.pending.text}]/20 text-[${colors.status.pending.text}]`,
  "in-progress": `bg-[${colors.status.inProgress.bg}] border border-[${colors.status.inProgress.text}]/20 text-[${colors.status.inProgress.text}]`,
  complete: `bg-[${colors.status.confirmed.bg}] border border-[${colors.status.confirmed.text}]/20 text-[${colors.status.confirmed.text}]`,
  cancelled: `bg-[${colors.status.cancelled.bg}] border border-[${colors.status.cancelled.text}]/20 text-[${colors.status.cancelled.text}]`,
  draft: `bg-[${colors.status.draft.bg}] border border-[${colors.status.draft.text}]/20 text-[${colors.status.draft.text}]`
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
  
  // ... existing code ...
  
  return (
    // ... existing code ...
      <div className={cn("relative rounded-md p-2", statusStyles[block.status || "draft"])}>
        <div className="font-medium">{block.title}</div>
        <div className="text-xs">{timeDisplay}</div>
        {/* ... existing code ... */}
      </div>
    // ... existing code ...
  );
} 