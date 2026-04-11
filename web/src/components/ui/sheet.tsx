"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

function SheetOverlay({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
	return (
		<DialogPrimitive.Overlay
			className={cn("fixed inset-0 z-50 bg-black/60 backdrop-blur-sm", className)}
			{...props}
		/>
	);
}

export function SheetContent({
	className,
	children,
	side = "right",
	...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
	side?: "left" | "right";
}) {
	return (
		<DialogPrimitive.Portal>
			<SheetOverlay />
			<DialogPrimitive.Content
				className={cn(
					"fixed inset-y-0 z-50 flex w-96 flex-col bg-bg-surface ring-1 ring-border-default shadow-4",
					side === "right" ? "right-0" : "left-0",
					className
				)}
				{...props}
			>
				{children}
				<DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-text-tertiary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus">
					<X size={16} />
					<span className="sr-only">Cerrar</span>
				</DialogPrimitive.Close>
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	);
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("border-b border-border-default px-6 py-4", className)} {...props} />;
}

export function SheetTitle({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			className={cn("text-sm font-semibold text-text-primary", className)}
			{...props}
		/>
	);
}
