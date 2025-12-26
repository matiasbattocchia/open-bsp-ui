interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  isResizing?: boolean;
}

export function ResizeHandle({ onMouseDown, isResizing }: ResizeHandleProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      className={`
        w-1 h-full bg-border hover:bg-primary/50 cursor-col-resize
        transition-colors duration-200 select-none
        ${isResizing ? "bg-primary" : ""}
      `}
      title="Drag to resize"
    />
  );
}
