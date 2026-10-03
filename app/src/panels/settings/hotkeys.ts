export const HOTKEYS = [
  { value: "right ctrl", label: "Right Ctrl" },
  { value: "right alt", label: "Right Alt" },
  { value: "right shift", label: "Right Shift" },
  { value: "f8", label: "F8" },
  { value: "f9", label: "F9" },
  { value: "f10", label: "F10" },
];

export const hotkeyLabel = (value: string) => HOTKEYS.find((key) => key.value === value)?.label ?? value;
