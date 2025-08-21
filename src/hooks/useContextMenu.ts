import { useEffect, useCallback, useState } from "react";

type AnchorPoint = {
  x: number;
  y: number;
};

const useContextMenu = () => {
  const [target, setTarget] = useState<Node>();
  const [anchorPoint, setAnchorPoint] = useState<AnchorPoint>({ x: 0, y: 0 });
  const [isShown, setIsShow] = useState(false);

  const handleContextMenu = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();

      if (event.target instanceof Node) {
        setTarget(event.target);
        setAnchorPoint({ x: event.pageX, y: event.pageY });
        setIsShow(true);
      }
    },
    [setTarget, setAnchorPoint, setIsShow],
  );

  const handleClick = useCallback(() => {
    if (isShown) {
      setIsShow(false);
    }
  }, [isShown]);

  useEffect(() => {
    document.addEventListener("click", handleClick);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  });

  return { target, anchorPoint, isShown };
};

export { useContextMenu };
