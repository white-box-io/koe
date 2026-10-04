import { Archive, Check, FileText } from "lucide-react";
import { useState } from "react";
import { Panel, PanelHeader } from "../../components/panel/Panel";
import { backupFiles, openFile, openFolder } from "../../lib/bridge";
import { useKoe } from "../../state/KoeProvider";
import { fileName, parentFolder } from "../../state/task";
import "./backup.css";

type BackupStatus = { kind: "ready" } | { kind: "saving" } | { kind: "saved"; folder: string } | { kind: "failed"; message: string };

/** Same folder names as Fast Backup: UTC date, local time. */
function timestampFolders() {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0].replace(/:/g, "-");
  return { date, time };
}

export function BackupPanel() {
  const { state } = useKoe();
  const [status, setStatus] = useState<BackupStatus>({ kind: "ready" });
  const files = state.backupFiles;
  const project = state.session?.folder;

  const backUp = async () => {
    if (!project) return;
    setStatus({ kind: "saving" });
    const { date, time } = timestampFolders();
    try {
      const folder = await backupFiles(project, date, time, files);
      setStatus({ kind: "saved", folder });
    } catch (error) {
      setStatus({ kind: "failed", message: String(error) });
    }
  };

  return (
    <Panel width={320}>
      <PanelHeader title="Back up these files" right={<span className="backup__count">{files.length}</span>} />
      <div className="backup__list">
        {files.map((path) => (
          <button key={path} className="backup__file" onClick={() => openFile(path)} title={path}>
            <FileText size={14} className="backup__icon" />
            <span className="backup__name">{fileName(path)}</span>
            <span className="backup__folder">{parentFolder(path)}</span>
          </button>
        ))}
      </div>
      {status.kind === "saved" ? (
        <button className="backup__done" onClick={() => openFolder(status.folder)} title={status.folder}>
          <Check size={13} />
          Backed up · open folder
        </button>
      ) : (
        <button className="backup__button" onClick={backUp} disabled={!project || status.kind === "saving"}>
          <Archive size={13} />
          {status.kind === "saving" ? "Backing up…" : "Back up"}
        </button>
      )}
      {status.kind === "failed" && <div className="backup__error">{status.message}</div>}
    </Panel>
  );
}
