"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface PlacedComponent {
	id: number;
	type: "input" | "card";
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

	console.log(selectionBox);

	const handleMouseUp = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsDrawing(false);

		if (selectionBox.width < 20 || selectionBox.height < 20) return;

		const newComponent: PlacedComponent = {
			type: selectionBox.height <= 40 ? "input" : "card",
			position: { ...selectionBox },
			children: [],
			parentId: isCurrentComponent ?? undefined,
			id: Date.now(),
		};

		setPlacedComponents((prev) => {
			if (isCurrentComponent !== null) {
				// Add as child to parent component
				return prev.map((comp) => {
					if (comp.id === isCurrentComponent) {
						return {
							...comp,
							children: [...(comp.children ?? []), newComponent],
						};
					}
					return comp;
				});
			}
			// Add as top-level component
			return [...prev, newComponent];
		});

		setIsCurrentComponent(null);
	};

	const renderComponent = (component: PlacedComponent, index: number) => {
		const isChild = component.parentId !== undefined;

		const componentStyle = {
			left: `${component.position.x}px`,
			top: `${component.position.y}px`,
			width: `${component.position.width}px`,
			position: isChild ? ("static" as const) : ("relative" as const),
		};

		if (component.type === "input") {
			return (
				<div
					key={component.id}
					style={componentStyle}
					className="pointer-events-auto"
					onMouseDown={(e) => handleMouseDown(e, component.id)}
					onMouseMove={(e) => {
						e.stopPropagation();
						handleMouseMove(e);
					}}
					onMouseUp={(e) => {
						e.stopPropagation();
						handleMouseUp(e);
					}}
				>
					<Input className="pointer-events-none" placeholder="Input field" />
					{/* {renderChildren(component.children, component.id)} */}
				</div>
			);
		}

		return (
			<div
				key={component.id}
				style={componentStyle}
				className="pointer-events-auto"
				onMouseDown={(e) => handleMouseDown(e, component.id)}
				onMouseMove={(e) => {
					e.stopPropagation();
					handleMouseMove(e);
				}}
				onMouseUp={(e) => {
					e.stopPropagation();
					handleMouseUp(e);
				}}
			>
				<Card className="pointer-events-none h-full">
					<CardHeader>
						<CardTitle>Card Title</CardTitle>
						<CardDescription>Card Description</CardDescription>
					</CardHeader>
					<CardContent className="relative">
						<div className="relative">
							Content goes here
							{renderChildren(component.children, component.id)}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	};

	const renderChildren = (children?: PlacedComponent[], parentId?: number) => {
		if (!children?.length) return null;
		return children.map((child, index) => renderComponent(child, index));
	};

	console.log(placedComponents);

	return (
		<main className="min-h-screen p-8">
			<div
				ref={canvasRef}
				className="w-full h-[700px] border border-gray-300 relative bg-white"
				onMouseDown={(e) => handleMouseDown(e)}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
			>
				{placedComponents
					.filter((comp) => !comp.parentId)
					.map((component, index) => renderComponent(component, index))}

				{isDrawing && (
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
		</main>
	);
}
