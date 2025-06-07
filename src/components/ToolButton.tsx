import React from "react";

type ToolButtonProps = React.PropsWithChildren<{
  active?: boolean;
  onClick?: () => void;
  htmlFor?: string;
  asLabel?: boolean;
  className?: string;
  style?: React.CSSProperties;
}>;

export const ToolButton: React.FC<ToolButtonProps> = ({
  active,
  onClick,
  htmlFor,
  asLabel,
  className = "",
  style,
  children,
}) => {
  const baseClass = `tool-button${active ? " active" : ""} ${className}`;
  if (asLabel && htmlFor) {
    return (
      <label htmlFor={htmlFor} className={baseClass} style={style}>
        {children}
      </label>
    );
  }
  return (
    <button type="button" className={baseClass} style={style} onClick={onClick}>
      {children}
    </button>
  );
}; 