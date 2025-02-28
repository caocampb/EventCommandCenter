import { formatTimeForDisplay } from "@/utils/timezone-utils";
import { cn } from "@v1/ui/cn";

// Define the status styles mapping
const statusStyles = {
  pending: "bg-yellow-500/10 border border-yellow-500/20 text-yellow-500",
  "in-progress": "bg-blue-500/10 border border-blue-500/20 text-blue-500",
  complete: "bg-green-500/10 border border-green-500/20 text-green-500",
  cancelled: "bg-red-500/10 border border-red-500/20 text-red-500",
  draft: "bg-gray-500/10 border border-gray-500/20 text-gray-500"
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