"use client";

import {
	Card,
	CardContent,
	CardTitle,
	CardDescription,
	CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
interface MenuProps {
	position: { x: number; y: number } | null;
	visible: boolean;
	selectionBox: { width: number; height: number };
}

export function Menu({ position, visible, selectionBox }: MenuProps) {
	const handleDragStart = (
		e: React.DragEvent,
		componentType: "card" | "button" | "input" | "textarea"
	) => {
		e.dataTransfer.setData("componentType", componentType);
	};

	if (!visible || !position) return null;

	const isLargeSelection = selectionBox.height > 50;

	return (
		<Card
			className="fixed w-72 z-50"
			style={{ top: `${position.y}px`, left: `${position.x}px` }}
		>
			<CardHeader>
				<CardTitle>Suggested Components</CardTitle>
				<div className="w-full bg-gray-200 h-0.5 mt-2"></div>
			</CardHeader>
			<CardContent className="space-y-4">
				{isLargeSelection ? (
					<div className="flex flex-col gap-4">
						<Card
							draggable
							onDragStart={(e) => handleDragStart(e, "card")}
							className="w-full cursor-move"
						>
							<CardHeader>
								<CardTitle>Card Title</CardTitle>
								<CardDescription>Card Description</CardDescription>
							</CardHeader>
							<CardContent className="relative">
								<div className="relative">Content goes here</div>
							</CardContent>
						</Card>
						<Textarea
							draggable
							onDragStart={(e) => handleDragStart(e, "textarea")}
							className="w-full cursor-move"
							placeholder="Textarea"
						/>
					</div>
				) : (
					<div className="flex flex-col gap-4">
						<Button
							draggable
							onDragStart={(e) => handleDragStart(e, "button")}
							className="w-1/2 cursor-move"
						>
							Button
						</Button>
						<Input
							draggable
							onDragStart={(e) => handleDragStart(e, "input")}
							className="w-full cursor-move"
							placeholder="Input"
						/>
					</div>
				)}

				{/* <Input className="mt-4" placeholder="Add more details..." /> */}
			</CardContent>
		</Card>
	);
}
