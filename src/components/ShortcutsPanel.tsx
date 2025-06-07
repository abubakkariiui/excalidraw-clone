import React from "react";

type ShortcutsPanelProps = {
  onClose: () => void;
};

export const ShortcutsPanel: React.FC<ShortcutsPanelProps> = ({ onClose }) => (
  <div className="shortcuts-panel">
    <h3>Keyboard Shortcuts</h3>
    <ul>
      <li>Ctrl/Cmd + Z: Undo</li>
      <li>Ctrl/Cmd + Shift + Z: Redo</li>
      <li>Ctrl/Cmd + Y: Redo</li>
      <li>Ctrl/Cmd + S: Export</li>
      <li>Delete: Remove selected element</li>
    </ul>
    <button className="tool-button" onClick={onClose} style={{ marginTop: "1rem" }}>
      Close
    </button>
  </div>
); 