import type { ReactNode } from "react";
import "./panel.css";

type PanelProps = {
  width?: number;
  tight?: boolean;
  fading?: boolean;
  children: ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export function Panel({ width = 300, tight = false, fading = false, children, onMouseEnter, onMouseLeave }: PanelProps) {
  return (
    <div className={`panel ${fading ? "panel--fading" : ""}`} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className={`panel__glass ${tight ? "panel__glass--tight" : ""}`} style={{ width }}>
        {children}
      </div>
    </div>
  );
}

export function PanelHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="panel__header">
      <span className="panel__title">{title}</span>
      {right}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="panel__section-label">{children}</div>;
}
