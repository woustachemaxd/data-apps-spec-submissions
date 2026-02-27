import { InboxIcon } from "lucide-react";

interface EmptyStateProps {
    message?: string;
    icon?: React.ReactNode;
}

export default function EmptyState({
    message = "No data found for this period",
    icon,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            {icon ?? <InboxIcon className="h-12 w-12 mb-3 opacity-40" />}
            <p className="text-sm">{message}</p>
        </div>
    );
}
