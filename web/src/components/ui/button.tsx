import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				primary: "bg-blue-400 text-white hover:bg-blue-500",
				secondary: "bg-bg-elevated text-text-primary hover:bg-gray-700 ring-1 ring-border-default",
				ghost: "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
				danger: "bg-red-500/15 text-red-400 hover:bg-red-500/25 ring-1 ring-red-500/30",
			},
			size: {
				sm: "h-7 px-3 text-xs",
				md: "h-9 px-4",
				lg: "h-10 px-5",
				icon: "h-9 w-9 p-0",
			},
		},
		defaultVariants: { variant: "primary", size: "md" },
	}
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
	const Comp = asChild ? Slot : "button";
	return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
