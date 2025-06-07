import { MouseEvent, useEffect, useLayoutEffect, useState } from "react";
import rough from "roughjs";
import getStroke from "perfect-freehand";
import { useHistory } from "./useHistory";
import { Toolbar } from "./components/Toolbar";
import { Canvas } from "./components/Canvas";
import { ActionButtons } from "./components/ActionButtons";
import { ShortcutsPanel } from "./components/ShortcutsPanel";

type SelectedElementType = ElementType & {
  xOffsets?: number[];
  yOffsets?: number[];
  offsetX?: number;
  offsetY?: number;
};
interface ExtendedElementType extends ElementType {
  xOffsets?: number[];
  yOffsets?: number[];
}
export type ElementType = {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: Tools;
  // TODO: add type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  roughElement: any;
  offsetX?: number;
  offsetY?: number;
  position?: string | null;
  points?: { x: number; y: number }[];
  text?: string;
  strokeColor?: string;
  backgroundColor?: string;
  strokeWidth?: number;
  fontSize?: number;
  fontFamily?: string;
};

enum Tools {
  Selection = "selection",
  Line = "line",
  Rectangle = "rectangle",
  Pencil = "pencil",
  Text = "text",
  Circle = "circle",
  Diamond = "diamond",
  Arrow = "arrow",
}

export default function App() {
  const { elements, setElements, undo, redo } = useHistory([]);
  const [action, setAction] = useState("none");
  const [tool, setTool] = useState<Tools>(Tools.Line);
  const [selectedElement, setSelectedElement] = useState<ElementType | null>();
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [zoom, setZoom] = useState(100);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const generator = rough.generator();

  const exportToJSON = () => {
    const jsonString = JSON.stringify(elements);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "drawing.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const elements = JSON.parse(e.target?.result as string);
          setElements(elements);
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  const cursorForPosition = (position: string) => {
    switch (position) {
      case "topLeft":
      case "bottomRight":
        return "nwse-resize";
      case "topRight":
      case "bottomLeft":
        return "nesw-resize";
      case "start":
      case "end":
        return "move";
      case "inside":
        return "move";
      default:
        return "default";
    }
  };

  const resizedCoordinates = (
    clientX: number,
    clientY: number,
    position: string,
    coordinates: { x1: number; y1: number; x2: number; y2: number }
  ) => {
    const { x1, y1, x2, y2 } = coordinates;

    switch (position) {
      case "start":
      case "topLeft":
        return {
          x1: clientX,
          y1: clientY,
          x2,
          y2,
        };
      case "topRight":
        return {
          x1,
          y1: clientY,
          x2: clientX,
          y2,
        };
      case "bottomLeft":
        return {
          x1: clientX,
          y1,
          x2,
          y2: clientY,
        };
      case "end":
      case "bottomRight":
        return {
          x1,
          y1,
          x2: clientX,
          y2: clientY,
        };
      default:
        return coordinates;
    }
  };

  const createElement = (
    id: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    type: Tools
  ): ElementType => {
    switch (type) {
      case Tools.Line:
      case Tools.Rectangle:
      case Tools.Circle:
      case Tools.Diamond:
      case Tools.Arrow: {
        let roughElement;
        switch (type) {
          case Tools.Line:
            roughElement = generator.line(x1, y1, x2, y2, {
              stroke: strokeColor,
              strokeWidth,
            });
            break;
          case Tools.Rectangle:
            roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1, {
              stroke: strokeColor,
              strokeWidth,
              fill: backgroundColor,
            });
            break;
          case Tools.Circle:
            const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            roughElement = generator.circle(x1, y1, radius * 2, {
              stroke: strokeColor,
              strokeWidth,
              fill: backgroundColor,
            });
            break;
          case Tools.Diamond:
            const centerX = (x1 + x2) / 2;
            const centerY = (y1 + y2) / 2;
            const width = Math.abs(x2 - x1);
            const height = Math.abs(y2 - y1);
            roughElement = generator.polygon(
              [
                [centerX, y1],
                [x2, centerY],
                [centerX, y2],
                [x1, centerY],
              ],
              {
                stroke: strokeColor,
                strokeWidth,
                fill: backgroundColor,
              }
            );
            break;
          case Tools.Arrow:
            const arrowLength = 20;
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const arrowX1 = x2 - arrowLength * Math.cos(angle - Math.PI / 6);
            const arrowY1 = y2 - arrowLength * Math.sin(angle - Math.PI / 6);
            const arrowX2 = x2 - arrowLength * Math.cos(angle + Math.PI / 6);
            const arrowY2 = y2 - arrowLength * Math.sin(angle + Math.PI / 6);
            roughElement = generator.line(x1, y1, x2, y2, {
              stroke: strokeColor,
              strokeWidth,
            });
            // Add arrow head
            const arrowHead1 = generator.line(x2, y2, arrowX1, arrowY1, {
              stroke: strokeColor,
              strokeWidth,
            });
            const arrowHead2 = generator.line(x2, y2, arrowX2, arrowY2, {
              stroke: strokeColor,
              strokeWidth,
            });
            return {
              id,
              x1,
              y1,
              x2,
              y2,
              type,
              roughElement: [roughElement, arrowHead1, arrowHead2],
              strokeColor,
              strokeWidth,
            };
        }
        return {
          id,
          x1,
          y1,
          x2,
          y2,
          type,
          roughElement,
          strokeColor,
          backgroundColor,
          strokeWidth,
        };
      }
      case Tools.Text: {
        return {
          id,
          x1,
          y1,
          x2,
          y2,
          type,
          roughElement: null,
          text: "",
          strokeColor,
          fontSize,
          fontFamily,
        };
      }
      case Tools.Pencil: {
        return {
          id,
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0,
          type,
          points: [{ x: x1, y: y1 }],
          roughElement: null,
          strokeColor,
          strokeWidth,
        };
      }
      default:
        throw new Error(`Type not recognised: ${type}`);
    }
  };

  type Point = { x: number; y: number };

  const distance = (a: Point, b: Point) =>
    Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

  const nearPoint = (
    x: number,
    y: number,
    x1: number,
    y1: number,
    name: string
  ) => {
    return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
  };

  const onLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x: number,
    y: number,
    maxDistance: number = 1
  ): string | null => {
    const a: Point = { x: x1, y: y1 };
    const b: Point = { x: x2, y: y2 };
    const c: Point = { x, y };
    const offset = distance(a, b) - (distance(a, c) + distance(b, c));
    return Math.abs(offset) < maxDistance ? "inside" : null;
  };

  const positionWithinElement = (
    x: number,
    y: number,
    element: ElementType
  ) => {
    const { type, x1, x2, y1, y2 } = element;
    switch (type) {
      case Tools.Line: {
        const on = onLine(x1, y1, x2, y2, x, y);
        const start = nearPoint(x, y, x1, y1, "start");
        const end = nearPoint(x, y, x2, y2, "end");
        return start || end || on;
      }
      case Tools.Rectangle: {
        const topLeft = nearPoint(x, y, x1, y1, "topLeft");
        const topRight = nearPoint(x, y, x2, y1, "topRight");
        const bottomLeft = nearPoint(x, y, x1, y2, "bottomLeft");
        const bottomRight = nearPoint(x, y, x2, y2, "bottomRight");
        const inside =
          x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
        return topLeft || topRight || bottomLeft || bottomRight || inside;
      }
      case Tools.Pencil: {
        const betweenAnyPoint = element.points!.some((point, index) => {
          const nextPoint = element.points![index + 1];
          if (!nextPoint) return false;
          return (
            onLine(point.x, point.y, nextPoint.x, nextPoint.y, x, y, 5) != null
          );
        });
        return betweenAnyPoint ? "inside" : null;
      }
      default:
        throw new Error(`Type not recognised: ${type}`);
    }
  };

  const adjustElementCoordinates = (element: ElementType) => {
    const { type, x1, y1, x2, y2 } = element;

    if (type === Tools.Rectangle) {
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      return { x1: minX, y1: minY, x2: maxX, y2: maxY };
    } else {
      if (x1 < x2 || (x1 === x2 && y1 < y2)) {
        return { x1, y1, x2, y2 };
      } else {
        return { x1: x2, y1: y2, x2: x1, y2: y1 };
      }
    }
  };

  const getElementAtPosition = (
    x: number,
    y: number,
    elements: ElementType[]
  ) => {
    return elements
      .map((element) => ({
        ...element,
        position: positionWithinElement(x, y, element),
      }))
      .find((element) => element.position !== null);
  };

  const getSvgPathFromStroke = (stroke: [number, number][]) => {
    if (!stroke.length) return "";

    const d = stroke.reduce(
      (
        acc: string[],
        [x0, y0]: [number, number],
        i: number,
        arr: [number, number][]
      ) => {
        const [x1, y1] = arr[(i + 1) % arr.length];
        acc.push(
          x0.toString(),
          y0.toString(),
          ((x0 + x1) / 2).toString(),
          ((y0 + y1) / 2).toString()
        );
        return acc;
      },
      ["M", ...stroke[0].map((num) => num.toString()), "Q"]
    );

    d.push("Z");
    return d.join(" ");
  };

  const drawElement = (
    roughCanvas: any,
    context: CanvasRenderingContext2D,
    element: ElementType
  ) => {
    if (
      ["line", "rectangle", "circle", "diamond", "arrow"].includes(element.type)
    ) {
      if (Array.isArray(element.roughElement)) {
        element.roughElement.forEach((el) => {
          if (el) roughCanvas.draw(el);
        });
      } else if (element.roughElement) {
        roughCanvas.draw(element.roughElement);
      }
      return;
    }
    if (element.type === "text") {
      if (element.text) {
        context.font = `${element.fontSize}px ${element.fontFamily}`;
        context.fillStyle = element.strokeColor || "#000000";
        context.fillText(element.text, element.x1, element.y1);
      }
      return;
    }
    if (element.type === "pencil") {
      if (!element.points) {
        throw new Error("Pencil element points are undefined");
      }
      const strokePoints = getStroke(element.points);
      const formattedPoints: [number, number][] = strokePoints.map((point) => {
        if (point.length !== 2) {
          throw new Error(
            `Expected point to have exactly 2 elements, got ${point.length}`
          );
        }
        return [point[0], point[1]];
      });
      const stroke = getSvgPathFromStroke(formattedPoints);
      context.fillStyle = element.strokeColor || "#000000";
      context.fill(new Path2D(stroke));
      return;
    }
    // Fallback: do nothing
  };

  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    context.clearRect(0, 0, canvas.width, canvas.height);

    const roughCanvas = rough.canvas(canvas);

    elements.forEach((element) => drawElement(roughCanvas, context, element));
  }, [elements]);

  useEffect(() => {
    const undoRedoFunction = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === "z") {
          if (event.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (event.key === "y") {
          redo();
        }
      }
    };

    document.addEventListener("keydown", undoRedoFunction);
    return () => {
      document.removeEventListener("keydown", undoRedoFunction);
    };
  }, [undo, redo]);

  const updateElement = (
    id: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    type: Tools
  ) => {
    const elementsCopy = [...elements];
    switch (type) {
      case Tools.Line:
      case Tools.Rectangle:
      case Tools.Circle:
      case Tools.Diamond:
      case Tools.Arrow: {
        elementsCopy[id] = createElement(id, x1, y1, x2, y2, type);
        break;
      }
      case Tools.Pencil: {
        const existingPoints = elementsCopy[id].points || [];
        elementsCopy[id].points = [...existingPoints, { x: x2, y: y2 }];
        break;
      }
      case Tools.Text: {
        // For text, update position if needed
        elementsCopy[id] = {
          ...elementsCopy[id],
          x1,
          y1,
          x2,
          y2,
        };
        break;
      }
      default:
        throw new Error(`Type not recognised: ${type}`);
    }
    setElements(elementsCopy, true);
  };

  const adjustmentRequired = (type: Tools) =>
    ["line", "rectangle"].includes(type);

  const handleMouseDown = (event: MouseEvent<HTMLCanvasElement>) => {
    const { clientX, clientY } = event;
    const canvas = event.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (tool === Tools.Selection) {
      const element = getElementAtPosition(x, y, elements);

      if (element) {
        let selectedElement: SelectedElementType = { ...element };

        if (element.type === "pencil" && element.points) {
          const xOffsets = element.points.map((point) => x - point.x);
          const yOffsets = element.points.map((point) => y - point.y);
          selectedElement = { ...selectedElement, xOffsets, yOffsets };
        } else {
          const offsetX = x - selectedElement.x1;
          const offsetY = y - selectedElement.y1;
          selectedElement = { ...selectedElement, offsetX, offsetY };
        }

        setSelectedElement(selectedElement);
        setElements((prevState) => prevState);

        if (element.position === "inside") {
          setAction("moving");
        } else {
          setAction("resizing");
        }
      }
    } else if (tool === Tools.Text) {
      const id = elements.length;
      const newElement = createElement(id, x, y, x, y, tool);
      setElements((prevState) => [...prevState, newElement]);
      setSelectedElement(newElement);
      const text = prompt("Enter text:");
      if (text) {
        const elementsCopy = [...elements];
        elementsCopy[id] = {
          ...elementsCopy[id],
          text,
        };
        setElements(elementsCopy, true);
      }
    } else {
      const id = elements.length;
      const newElement = createElement(id, x, y, x, y, tool);
      setElements((prevState) => [...prevState, newElement]);
      setSelectedElement(newElement);
      setAction("drawing");
    }
  };

  const handleMouseMove = (event: MouseEvent<HTMLCanvasElement>) => {
    const { clientX, clientY } = event;
    const canvas = event.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (tool === Tools.Selection) {
      const element = getElementAtPosition(x, y, elements);

      if (element && element.position) {
        (event.target as HTMLElement).style.cursor = cursorForPosition(
          element.position
        );
      } else {
        (event.target as HTMLElement).style.cursor = "default";
      }
    }

    if (action === "drawing") {
      const index = elements.length - 1;
      const { x1, y1 } = elements[index];
      updateElement(index, x1, y1, x, y, tool);
    } else if (action === "moving" && selectedElement) {
      if (
        selectedElement.type === "pencil" &&
        "points" in selectedElement &&
        "xOffsets" in selectedElement &&
        "yOffsets" in selectedElement
      ) {
        const extendedElement = selectedElement as ExtendedElementType;
        const newPoints = extendedElement.points!.map((_, index) => ({
          x: x - extendedElement.xOffsets![index],
          y: y - extendedElement.yOffsets![index],
        }));
        const elementsCopy = [...elements];
        elementsCopy[extendedElement.id] = {
          ...elementsCopy[extendedElement.id],
          points: newPoints,
        };
        setElements(elementsCopy, true);
      } else {
        const { id, x1, x2, y1, y2, type, offsetX, offsetY } =
          selectedElement as ExtendedElementType;
        const safeOffsetX = offsetX ?? 0;
        const safeOffsetY = offsetY ?? 0;
        const newX1 = x - safeOffsetX;
        const newY1 = y - safeOffsetY;
        const newX2 = newX1 + (x2 - x1);
        const newY2 = newY1 + (y2 - y1);

        updateElement(id, newX1, newY1, newX2, newY2, type);
      }
    } else if (
      action === "resizing" &&
      selectedElement &&
      selectedElement.position
    ) {
      const { id, type, position, ...coordinates } =
        selectedElement as ExtendedElementType;

      if (typeof position === "string") {
        const { x1, y1, x2, y2 } = resizedCoordinates(
          x,
          y,
          position,
          coordinates
        );
        updateElement(id, x1, y1, x2, y2, type);
      }
    }
  };

  const handleMouseUp = () => {
    if (selectedElement) {
      const index = selectedElement.id;
      const { id, type } = elements[index];
      if (
        (action === "drawing" || action === "resizing") &&
        adjustmentRequired(type)
      ) {
        const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index]);
        updateElement(id, x1, y1, x2, y2, type);
      }
    }

    setAction("none");
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case "z":
          if (event.shiftKey) {
            redo();
          } else {
            undo();
          }
          break;
        case "y":
          redo();
          break;
        case "s":
          event.preventDefault();
          exportToJSON();
          break;
      }
    } else if (event.key === "Delete" && selectedElement) {
      const elementsCopy = elements.filter((el) => el.id !== selectedElement.id);
      setElements(elementsCopy, true);
      setSelectedElement(null);
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [undo, redo, selectedElement]);

  return (
    <div>
      <Toolbar
        tool={tool}
        setTool={(t) => setTool(t as Tools)}
        strokeColor={strokeColor}
        setStrokeColor={setStrokeColor}
        backgroundColor={backgroundColor}
        setBackgroundColor={setBackgroundColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        fontSize={fontSize}
        setFontSize={setFontSize}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        onClear={() => setElements([])}
        onExport={exportToJSON}
        onImport={importFromJSON}
        onShowShortcuts={() => setShowShortcuts(true)}
        zoom={zoom}
        setZoom={setZoom}
      />
      {showShortcuts && (
        <ShortcutsPanel onClose={() => setShowShortcuts(false)} />
      )}
      <ActionButtons onUndo={undo} onRedo={redo} />
      <Canvas
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        zoom={zoom}
      />
    </div>
  );
}
