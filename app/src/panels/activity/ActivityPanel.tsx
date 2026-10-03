import { Check, Eye, FilePlus, Pencil } from "lucide-react";
import { Buddy } from "../../components/buddy/Buddy";
import { Panel, SectionLabel } from "../../components/panel/Panel";
import { useNow } from "../../hooks/useNow";
import type { Task } from "../../lib/types";
import { useKoe } from "../../state/KoeProvider";
import { changedFiles, formatDuration, readOnlyFiles } from "../../state/task";
import { FileRow, ReadChip } from "./FileRow";
import "./activity.css";

export function ActivityPanel() {
  const { state } = useKoe();
  const task = state.task;
  if (!task) return <EmptyActivity />;
  return task.finishedAt ? <TaskSummary task={task} /> : <LiveActivity task={task} />;
}

function EmptyActivity() {
  return (
    <Panel width={260}>
      <div className="empty">
        <Buddy face="sleeping" size={48} />
        <span className="empty__title">No tasks yet</span>
        <span className="empty__body">Hold your talk key and ask Claude something. Files it touches will show up here.</span>
      </div>
    </Panel>
  );
}

function LiveActivity({ task }: { task: Task }) {
  const now = useNow(1000);
  return (
    <Panel width={280} tight>
      <div className="activity__header">
        <SectionLabel>Working on</SectionLabel>
        <span className="activity__timer">{formatDuration(now - task.startedAt)}</span>
      </div>
      {task.files.length === 0 ? (
        <div className="empty empty--small">
          <Buddy face="thinking" size={40} />
          <span className="empty__title">Thinking it through</span>
          <span className="empty__body">No files touched yet. They'll appear the moment Claude opens one.</span>
        </div>
      ) : (
        <div className="activity__list">
          {task.files.slice(0, 8).map((file, index) => (
            <FileRow key={file.path} file={file} busy={index === 0} />
          ))}
          {task.files.length > 8 && <span className="activity__more">+{task.files.length - 8} more</span>}
        </div>
      )}
    </Panel>
  );
}

export function TaskSummary({ task, onHover }: { task: Task; onHover?: (on: boolean) => void }) {
  const changed = changedFiles(task);
  const read = readOnlyFiles(task);
  const edited = changed.filter((f) => f.action === "edit" || f.action === "write").length;
  const created = changed.filter((f) => f.action === "new").length;
  return (
    <Panel width={300} onMouseEnter={() => onHover?.(true)} onMouseLeave={() => onHover?.(false)}>
      <div className="summary__top">
        <Buddy face={changed.length ? "done" : "hehe"} size={32} />
        <div className="summary__titles">
          <span className="summary__title">Claude finished</span>
          <span className="summary__meta">
            {task.project} · {formatDuration((task.finishedAt ?? Date.now()) - task.startedAt)}
          </span>
        </div>
      </div>
      {changed.length === 0 && read.length === 0 ? (
        <div className="summary__nothing">
          <Check size={13} />
          Just a chat. No files were changed.
        </div>
      ) : (
        <>
          <div className="summary__stats">
            {edited > 0 && <Stat icon={<Pencil size={11} />} tone="amber" label={`${edited} edited`} />}
            {created > 0 && <Stat icon={<FilePlus size={11} />} tone="green" label={`${created} new`} />}
            {read.length > 0 && <Stat icon={<Eye size={11} />} tone="blue" label={`${read.length} read`} />}
          </div>
          {changed.length > 0 && (
            <div className="activity__list">
              <SectionLabel>Changed</SectionLabel>
              {changed.slice(0, 8).map((file) => (
                <FileRow key={file.path} file={file} showCounts />
              ))}
            </div>
          )}
          {read.length > 0 && (
            <>
              <SectionLabel>Read</SectionLabel>
              <div className="summary__reads">
                {read.slice(0, 6).map((file) => (
                  <ReadChip key={file.path} file={file} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Panel>
  );
}

function Stat({ icon, tone, label }: { icon: React.ReactNode; tone: string; label: string }) {
  return (
    <span className={`stat stat--${tone}`}>
      {icon}
      {label}
    </span>
  );
}
