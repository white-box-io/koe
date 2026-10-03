import { ExternalLink, Eye, FilePlus, Pencil } from "lucide-react";
import { openFile } from "../../lib/bridge";
import type { TouchedFile } from "../../lib/types";
import { fileName, parentFolder } from "../../state/task";

const ICONS = { read: Eye, edit: Pencil, write: Pencil, new: FilePlus };

export function FileRow({ file, busy, showCounts }: { file: TouchedFile; busy?: boolean; showCounts?: boolean }) {
  const Icon = ICONS[file.action];
  return (
    <button className={`file-row ${busy ? "file-row--busy" : ""}`} onClick={() => openFile(file.path, file.snippet || undefined)}>
      <Icon size={13} className={`file-row__icon file-row__icon--${file.action}`} />
      <span className="file-row__name">{fileName(file.path)}</span>
      {!showCounts && <span className="file-row__folder">{parentFolder(file.path)}</span>}
      {showCounts && file.added > 0 && <span className="file-row__added">+{file.added}</span>}
      {showCounts && file.removed > 0 && <span className="file-row__removed">−{file.removed}</span>}
      {busy && (
        <span className="file-row__busy">
          <span />
          <span />
          <span />
        </span>
      )}
      <ExternalLink size={12} className="file-row__open" />
    </button>
  );
}

export function ReadChip({ file }: { file: TouchedFile }) {
  return (
    <button className="read-chip" onClick={() => openFile(file.path)}>
      <Eye size={10} />
      {fileName(file.path)}
    </button>
  );
}
