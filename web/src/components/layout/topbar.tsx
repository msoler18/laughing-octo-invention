import { cn } from "@/lib/utils";

interface TopbarProps {
	title: string;
	description?: string;
	actions?: React.ReactNode;
	className?: string;
}

export function Topbar({ title, description, actions, className }: TopbarProps) {
	return (
		<header
			className={cn(
				"flex h-14 shrink-0 items-center gap-4 border-b border-border-default bg-bg-page px-6",
				className,
			)}
		>
			<div className="flex-1 min-w-0">
				<h1 className="text-sm font-semibold text-text-primary truncate">{title}</h1>
				{description && (
					<p className="text-xs text-text-tertiary truncate">{description}</p>
				)}
			</div>
			{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
		</header>
	);
}
