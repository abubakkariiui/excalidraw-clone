import React from "react";

interface CanvasProps {
  width: number;
  height: number;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  zoom: number;
}

export const Canvas: React.FC<CanvasProps> = ({
  width,
  height,
  onMouseDown,
  onMouseUp,
  onMouseMove,
  zoom,
}) => (
  <canvas
    id="canvas"
    width={width}
    height={height}
    onMouseDown={onMouseDown}
    onMouseUp={onMouseUp}
    onMouseMove={onMouseMove}
    style={{
      transform: `scale(${zoom / 100})`,
      transformOrigin: "0 0",
    }}
  >
    Canvas
  </canvas>
); 