import React from "react";

type ActionButtonsProps = {
  onUndo: () => void;
  onRedo: () => void;
};

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onUndo, onRedo }) => (
  <div className="action-buttons">
    <button className="action-button" onClick={onUndo}>
      Undo
    </button>
    <button className="action-button" onClick={onRedo}>
      Redo
    </button>
  </div>
); 