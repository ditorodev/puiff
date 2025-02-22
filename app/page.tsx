"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Menu } from "@/components/menu";
import { Button } from "@/components/ui/button";
interface PlacedComponent {
	id: number;
	type: "input" | "card" | "button" | "textarea";
	position: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	children?: PlacedComponent[];
	parentId?: number;
}

export default function Home() {
	const [isDrawing, setIsDrawing] = useState(false);
	const [isCurrentComponent, setIsCurrentComponent] = useState<number | null>(
		null
	);
	const [selectionBox, setSelectionBox] = useState({
		x: 0,
		y: 0,
		width: 0,
		height: 0,
	});
	const [startPos, setStartPos] = useState({ x: 0, y: 0 });
	const [placedComponents, setPlacedComponents] = useState<PlacedComponent[]>(
		[]
	);
	const [history, setHistory] = useState<PlacedComponent[][]>([[]]);
	const [currentStep, setCurrentStep] = useState(0);
	const canvasRef = useRef<HTMLDivElement>(null);
	const [menuPosition, setMenuPosition] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const [menuVisible, setMenuVisible] = useState(false);
	const [draggedComponent, setDraggedComponent] = useState<number | null>(null);

	// Add components to history when they change
	useEffect(() => {
		if (placedComponents !== history[currentStep]) {
			const newHistory = history.slice(0, currentStep + 1);
			setHistory([...newHistory, placedComponents]);
			setCurrentStep(currentStep + 1);
		}
	}, [placedComponents]);

	// Handle undo keyboard shortcut
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "z") {
				e.preventDefault();
				if (currentStep > 0) {
					setCurrentStep(currentStep - 1);
					setPlacedComponents(history[currentStep - 1]);
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [history, currentStep]);

	const handleMouseDown = (e: React.MouseEvent, parentId?: number) => {
		// Don't create selection box if clicking on a component
		if ((e.target as HTMLElement).closest('[draggable="true"]')) {
			return;
		}

		if (!canvasRef.current) return;
		e.stopPropagation();

		const rect = parentId
			? (e.currentTarget as HTMLElement).getBoundingClientRect()
			: canvasRef.current.getBoundingClientRect();

		const x = parentId ? e.nativeEvent.offsetX : e.clientX - rect.left;
		const y = parentId ? e.nativeEvent.offsetY : e.clientY - rect.top;

		setIsDrawing(true);
		setIsCurrentComponent(parentId ?? null);
		setStartPos({ x, y });
		setSelectionBox({ x, y, width: 0, height: 0 });
	};

	// Set selection box
	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isDrawing) return;
		e.stopPropagation();

		const rect = isCurrentComponent
			? (e.currentTarget as HTMLElement).getBoundingClientRect()
			: canvasRef.current!.getBoundingClientRect();

		const currentX = isCurrentComponent
			? e.nativeEvent.offsetX
			: e.clientX - rect.left;
		const currentY = isCurrentComponent
			? e.nativeEvent.offsetY
			: e.clientY - rect.top;

		setSelectionBox({
			x: Math.min(currentX, startPos.x),
			y: Math.min(currentY, startPos.y),
			width: Math.abs(currentX - startPos.x),
			height: Math.abs(currentY - startPos.y),
		});
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	// drop button component on canvas
	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const componentType = e.dataTransfer.getData("componentType") as
			| "button"
			| "card"
			| "input"
			| "textarea";

		const rect = canvasRef.current!.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const newComponent: PlacedComponent = {
			id: Date.now(),
			type: componentType,
			position: {
				x,
				y,
				width:
					componentType === "button"
						? 100
						: componentType === "input"
						? 200
						: 300,
				height:
					componentType === "button" || componentType === "input" ? 40 : 200,
			},
			children: [],
		};

		setPlacedComponents((prev) => [...prev, newComponent]);
		setMenuVisible(false);
		setSelectionBox({ x: 0, y: 0, width: 0, height: 0 });
	};

	console.log(placedComponents);

	const handleMouseUp = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsDrawing(false);

		if (selectionBox.width < 20 || selectionBox.height < 20) {
			setMenuVisible(false);
			return;
		}

		// Show menu at the end of selection
		setMenuPosition({
			x: selectionBox.x + selectionBox.width + 50,
			y: selectionBox.y + 30,
		});
		setMenuVisible(true);

		// const newComponent: PlacedComponent = {
		// 	type: selectionBox.height <= 40 ? "input" : "card",
		// 	position: { ...selectionBox },
		// 	children: [],
		// 	parentId: isCurrentComponent ?? undefined,
		// 	id: Date.now(),
		// };

		// setPlacedComponents((prev) => {
		// 	if (isCurrentComponent !== null) {
		// 		// Add as child to parent component
		// 		return prev.map((comp) => {
		// 			if (comp.id === isCurrentComponent) {
		// 				return {
		// 					...comp,
		// 					children: [...(comp.children ?? []), newComponent],
		// 				};
		// 			}
		// 			return comp;
		// 		});
		// 	}
		// 	// Add as top-level component
		// 	return [...prev, newComponent];
		// });

		setIsCurrentComponent(null);
	};

	const renderComponent = (component: PlacedComponent) => {
		const isChild = component.parentId !== undefined;

		const handleComponentDragStart = (e: React.DragEvent) => {
			setDraggedComponent(component.id);
			e.stopPropagation();
		};

		const handleComponentDragEnd = (e: React.DragEvent) => {
			if (draggedComponent === component.id) {
				const rect = canvasRef.current!.getBoundingClientRect();
				const x = e.clientX - rect.left - window.scrollX;
				const y = e.clientY - rect.top - window.scrollY;

				setPlacedComponents((prev) =>
					prev.map((comp) =>
						comp.id === component.id
							? { ...comp, position: { ...comp.position, x, y } }
							: comp
					)
				);
				setDraggedComponent(null);
			}
		};

		const componentProps = {
			style: {
				left: `${component.position.x}px`,
				top: `${component.position.y}px`,
				width: `${component.position.width}px`,
				position: isChild ? ("static" as const) : ("absolute" as const),
				cursor: "move",
			},
			className: "absolute",
			draggable: true,
			onDragStart: handleComponentDragStart,
			onDragEnd: handleComponentDragEnd,
		};

		switch (component.type) {
			case "button":
				return (
					<div key={component.id} {...componentProps}>
						<Button className="w-full">Button</Button>
					</div>
				);

			case "input":
				return (
					<div key={component.id} {...componentProps}>
						<Input className="w-full" placeholder="Input" />
					</div>
				);

			case "textarea":
				return (
					<div key={component.id} {...componentProps}>
						<Textarea className="w-full" placeholder="Textarea" />
					</div>
				);

			case "card":
				return (
					<div key={component.id} {...componentProps}>
						<Card className="h-full">
							<CardHeader>
								<CardTitle>Card Title</CardTitle>
								<CardDescription>Card Description</CardDescription>
							</CardHeader>
							<CardContent
								className="relative"
								onDragOver={(e) => {
									e.preventDefault();
									e.stopPropagation();
								}}
								onDrop={(e) => handleDrop(e)}
							>
								{component.children?.map((child) => renderComponent(child))}
								<div className="relative">Content goes here</div>
							</CardContent>
						</Card>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<main className="min-h-screen p-8">
			<div
				ref={canvasRef}
				className="w-full h-[700px] border border-gray-300 relative bg-white"
				onMouseDown={(e) => handleMouseDown(e)}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
			>
				{placedComponents
					.filter((comp) => !comp.parentId)
					.map((component) => renderComponent(component))}

				{(isDrawing || menuVisible) && (
					<div
						className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20"
						style={{
							left: `${selectionBox.x}px`,
							top: `${selectionBox.y}px`,
							width: `${selectionBox.width}px`,
							height: `${selectionBox.height}px`,
						}}
					/>
				)}
			</div>
			<Menu
				position={menuPosition}
				visible={menuVisible}
				selectionBox={selectionBox}
			/>
		</main>
	);
}
