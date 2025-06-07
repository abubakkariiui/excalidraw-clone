import React from "react";
import { ToolButton } from "./ToolButton";

type ToolbarProps = {
  tool: string;
  setTool: (tool: string) => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (w: number) => void;
  fontSize: number;
  setFontSize: (s: number) => void;
  fontFamily: string;
  setFontFamily: (f: string) => void;
  onClear: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onShowShortcuts: () => void;
  zoom: number;
  setZoom: (z: number) => void;
};

export const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  setTool,
  strokeColor,
  setStrokeColor,
  backgroundColor,
  setBackgroundColor,
  strokeWidth,
  setStrokeWidth,
  fontSize,
  setFontSize,
  fontFamily,
  setFontFamily,
  onClear,
  onExport,
  onImport,
  onShowShortcuts,
  zoom,
  setZoom,
}) => (
  <div className="toolbar">
    <div className="tool-group">
      {[
        { id: "selection", label: "Selection" },
        { id: "line", label: "Line" },
        { id: "rectangle", label: "Rectangle" },
        { id: "circle", label: "Circle" },
        { id: "diamond", label: "Diamond" },
        { id: "arrow", label: "Arrow" },
        { id: "pencil", label: "Pencil" },
        { id: "text", label: "Text" },
      ].map(({ id, label }) => (
        <React.Fragment key={id}>
          <input
            type="radio"
            name={id}
            id={id}
            className="tool-radio"
            checked={tool === id}
            onChange={() => setTool(id)}
          />
          <ToolButton asLabel htmlFor={id} active={tool === id}>
            {label}
          </ToolButton>
        </React.Fragment>
      ))}
    </div>
    <div className="tool-group">
      <ToolButton>
        <span>Stroke:</span>
        <input
          type="color"
          value={strokeColor}
          onChange={(e) => setStrokeColor(e.target.value)}
        />
      </ToolButton>
      <ToolButton>
        <span>Fill:</span>
        <input
          type="color"
          value={backgroundColor}
          onChange={(e) => setBackgroundColor(e.target.value)}
        />
      </ToolButton>
      <ToolButton>
        <span>Width:</span>
        <input
          type="range"
          min="1"
          max="10"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
        />
      </ToolButton>
      <ToolButton>
        <span>Font:</span>
        <input
          type="number"
          min="8"
          max="72"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
        />
      </ToolButton>
      <ToolButton>
        <span>Font:</span>
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
        >
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
        </select>
      </ToolButton>
    </div>
    <div className="tool-group">
      <ToolButton onClick={onClear}>Clear Canvas</ToolButton>
      <ToolButton onClick={onExport}>Export</ToolButton>
      <input
        type="file"
        accept=".json"
        onChange={onImport}
        style={{ display: "none" }}
        id="import-file"
      />
      <ToolButton asLabel htmlFor="import-file">Import</ToolButton>
      <ToolButton onClick={onShowShortcuts}>Shortcuts</ToolButton>
    </div>
    <div className="tool-group">
      <ToolButton onClick={() => setZoom(Math.min(zoom + 10, 200))}>+</ToolButton>
      <ToolButton>{zoom}%</ToolButton>
      <ToolButton onClick={() => setZoom(Math.max(zoom - 10, 50))}>-</ToolButton>
    </div>
  </div>
); 