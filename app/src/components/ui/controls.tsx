import { ChevronDown, Check } from "lucide-react";
import { useState, type ReactNode } from "react";
import "./controls.css";

export function Toggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button className={`toggle ${on ? "toggle--on" : ""}`} role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span className="toggle__knob" />
    </button>
  );
}

type ButtonProps = { kind?: "primary" | "secondary"; onClick?: () => void; disabled?: boolean; grow?: boolean; children: ReactNode };

export function Button({ kind = "primary", onClick, disabled, grow, children }: ButtonProps) {
  return (
    <button className={`button button--${kind} ${grow ? "button--grow" : ""}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Keycap({ label, selected, onClick }: { label: string; selected?: boolean; onClick?: () => void }) {
  return (
    <button className={`keycap ${selected ? "keycap--selected" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="row">
      <span className="row__label">{label}</span>
      {children}
    </div>
  );
}

type ChoiceOption<T> = { value: T; label: string; hint?: string };

type ChoiceProps<T> = {
  value: T;
  options: ChoiceOption<T>[];
  onChange: (value: T) => void;
  icon?: ReactNode;
  wide?: boolean;
};

/** A dropdown that unfolds inside the panel, so it never needs its own window. */
export function Choice<T extends string | number | null>({ value, options, onChange, icon, wide }: ChoiceProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  return (
    <div className={`choice ${wide ? "choice--wide" : ""}`}>
      <button className="choice__button" onClick={() => setIsOpen(!isOpen)}>
        {icon}
        <span className="choice__value">{selected?.label ?? "Choose"}</span>
        <ChevronDown size={13} className={`choice__chevron ${isOpen ? "choice__chevron--open" : ""}`} />
      </button>
      {isOpen && (
        <div className="choice__list">
          {options.map((option) => (
            <button
              key={String(option.value)}
              className="choice__option"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span className="choice__option-text">
                {option.label}
                {option.hint && <span className="choice__hint">{option.hint}</span>}
              </span>
              {option.value === value && <Check size={13} className="choice__check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type SliderProps = { value: number; min: number; max: number; step: number; onChange: (value: number) => void; format: (value: number) => string };

export function Slider({ value, min, max, step, onChange, format }: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className="slider">
      <input
        className="slider__input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ "--fill": `${percent}%` } as React.CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="slider__value">{format(value)}</span>
    </div>
  );
}

export function StepDots({ active, total }: { active: number; total: number }) {
  return (
    <div className="step-dots">
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={`step-dots__dot ${index === active ? "step-dots__dot--active" : ""}`} />
      ))}
    </div>
  );
}

export function LevelMeter({ level }: { level: number }) {
  const segments = 22;
  const lit = Math.round(level * segments);
  return (
    <div className="meter">
      {Array.from({ length: segments }, (_, index) => (
        <span
          key={index}
          className={`meter__segment ${index < lit ? (index < 14 ? "meter__segment--good" : "meter__segment--loud") : ""}`}
        />
      ))}
    </div>
  );
}
