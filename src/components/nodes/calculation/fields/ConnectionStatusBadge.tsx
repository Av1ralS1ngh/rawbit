import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConnectionStatusBadgeProps {
  connected: number;
  total: number;
}

export function ConnectionStatusBadge({ connected, total }: ConnectionStatusBadgeProps) {
  if (total === 0) return null;

  const allConnected = connected === total;
  const noneConnected = connected === 0;
  const partialConnected = connected > 0 && connected < total;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex h-7 items-center rounded-md border px-2 text-xs transition-colors ${
              allConnected
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                : partialConnected
                ? "border-amber-400 bg-amber-500/10 text-amber-500"
                : "border-sky-500 bg-sky-500/10 text-sky-600"
            }`}
          >
            {connected}/{total}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end">
          <div className="text-xs">
            {allConnected && "All inputs connected"}
            {noneConnected && "No inputs connected - using manual values"}
            {partialConnected && "Partial connections - some manual, some connected"}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
