import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { currentMonitor, getCurrentWindow, type Monitor } from "@tauri-apps/api/window";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const SNAP_DISTANCE = 24;
const EDGE_GAP = 12;

type Point = { x: number; y: number };
type Area = { left: number; top: number; right: number; bottom: number };

function workArea(monitor: Monitor): Area {
  const scale = monitor.scaleFactor;
  const area = monitor.workArea ?? { position: monitor.position, size: monitor.size };
  const left = area.position.x / scale;
  const top = area.position.y / scale;
  return { left, top, right: left + area.size.width / scale, bottom: top + area.size.height / scale };
}

function snapToEdges(anchor: Point, size: { width: number; height: number }, area: Area): Point {
  let { x, y } = anchor;
  if (x - area.left < SNAP_DISTANCE) x = area.left + EDGE_GAP;
  if (area.right - (x + size.width) < SNAP_DISTANCE) x = area.right - size.width - EDGE_GAP;
  if (y - area.top < SNAP_DISTANCE) y = area.top + EDGE_GAP;
  if (area.bottom - (y + size.height) < SNAP_DISTANCE) y = area.bottom - size.height - EDGE_GAP;
  return { x, y };
}

type LayoutOptions = {
  savedPosition: [number, number] | null | undefined;
  onPositionSaved: (position: [number, number]) => void;
};

/**
 * The window always hugs the widget plus whatever panel is open. The widget's
 * screen spot (the anchor) stays put; panels open up or down, left or right,
 * depending on which side of the screen the widget sits.
 */
export function useWindowLayout({ savedPosition, onPositionSaved }: LayoutOptions) {
  const stage = useRef<HTMLDivElement>(null);
  const widget = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<Point | null>(null);
  const [area, setArea] = useState<Area | null>(null);
  const isDragging = useRef(false);
  const shown = useRef(false);

  useEffect(() => {
    if (savedPosition === undefined) return;
    currentMonitor().then((monitor) => {
      if (!monitor) return;
      const screen = workArea(monitor);
      setArea(screen);
      setAnchor(savedPosition ? { x: savedPosition[0], y: savedPosition[1] } : { x: screen.right - 140, y: screen.bottom - 120 });
    });
  }, [savedPosition === undefined]);

  const opensUp = Boolean(anchor && area && anchor.y > (area.top + area.bottom) / 2);
  const opensLeft = Boolean(anchor && area && anchor.x > (area.left + area.right) / 2);

  const fitWindow = useCallback(() => {
    if (!stage.current || !widget.current || !anchor || isDragging.current) return;
    const width = Math.ceil(stage.current.offsetWidth);
    const height = Math.ceil(stage.current.offsetHeight);
    const left = anchor.x - widget.current.offsetLeft;
    const top = anchor.y - widget.current.offsetTop;
    const window = getCurrentWindow();
    window.setSize(new LogicalSize(width, height));
    window.setPosition(new LogicalPosition(Math.round(left), Math.round(top)));
    if (!shown.current) {
      shown.current = true;
      window.show();
    }
  }, [anchor]);

  useLayoutEffect(() => {
    if (!stage.current) return;
    const observer = new ResizeObserver(() => fitWindow());
    observer.observe(stage.current);
    fitWindow();
    return () => observer.disconnect();
  }, [fitWindow, opensUp, opensLeft]);

  useEffect(() => {
    let settleTimer = 0;
    const stopListening = getCurrentWindow().onMoved(() => {
      if (!isDragging.current) return;
      clearTimeout(settleTimer);
      settleTimer = window.setTimeout(async () => {
        const appWindow = getCurrentWindow();
        const scale = await appWindow.scaleFactor();
        const position = (await appWindow.outerPosition()).toLogical(scale);
        const monitor = await currentMonitor();
        const screen = monitor ? workArea(monitor) : area;
        const widgetBox = widget.current!;
        const dropped = { x: position.x + widgetBox.offsetLeft, y: position.y + widgetBox.offsetTop };
        const snapped = screen ? snapToEdges(dropped, { width: widgetBox.offsetWidth, height: widgetBox.offsetHeight }, screen) : dropped;
        isDragging.current = false;
        if (screen) setArea(screen);
        setAnchor(snapped);
        onPositionSaved([Math.round(snapped.x), Math.round(snapped.y)]);
      }, 350);
    });
    return () => {
      clearTimeout(settleTimer);
      stopListening.then((unlisten) => unlisten());
    };
  }, [area, onPositionSaved]);

  const startDrag = useCallback(() => {
    isDragging.current = true;
    getCurrentWindow().startDragging();
  }, []);

  return { stage, widget, opensUp, opensLeft, startDrag, ready: anchor !== null };
}
