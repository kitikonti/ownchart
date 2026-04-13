/**
 * Unified preview table for working-days recalculation.
 *
 * Adapts columns based on recalc mode:
 * - keep-durations: Task | Start (old→new) | End (old→new)
 * - keep-positions: Task | Duration (old→new), plus lag changes below
 */

import { useMemo } from "react";
import { useTaskStore } from "@/store/slices/taskSlice";
import { useDependencyStore } from "@/store/slices/dependencySlice";
import { formatDate } from "@/utils/dateUtils";
import type {
  RecalcMode,
  RecalcResult,
} from "@/utils/graph/computeWorkingDaysRecalc";

interface RecalcPreviewTableProps {
  result: RecalcResult;
  mode: RecalcMode;
}

export function RecalcPreviewTable({
  result,
  mode,
}: RecalcPreviewTableProps): JSX.Element {
  const total =
    result.dateAdjustments.length +
    result.durationChanges.length +
    result.lagChanges.length;

  if (total === 0) {
    return (
      <p className="text-sm text-slate-500 italic">
        No changes needed for the current selection.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <SummaryLine result={result} />
      {mode === "keep-durations" && result.dateAdjustments.length > 0 && (
        <DateAdjustmentTable adjustments={result.dateAdjustments} />
      )}
      {mode === "keep-positions" && result.durationChanges.length > 0 && (
        <DurationChangeTable changes={result.durationChanges} />
      )}
      {mode === "keep-positions" && result.lagChanges.length > 0 && (
        <LagChangeTable changes={result.lagChanges} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

function SummaryLine({ result }: { result: RecalcResult }): JSX.Element {
  const parts: string[] = [];
  if (result.dateAdjustments.length > 0) {
    const n = result.dateAdjustments.length;
    parts.push(`${n} task${n !== 1 ? "s" : ""} will move`);
  }
  if (result.durationChanges.length > 0) {
    const n = result.durationChanges.length;
    parts.push(`${n} duration${n !== 1 ? "s" : ""} will change`);
  }
  if (result.lagChanges.length > 0) {
    const n = result.lagChanges.length;
    parts.push(`${n} lag${n !== 1 ? "s" : ""} will change`);
  }
  return <p className="text-xs text-slate-600">{parts.join(", ")}</p>;
}

// ---------------------------------------------------------------------------
// Date adjustment table (keep-durations mode)
// ---------------------------------------------------------------------------

function DateAdjustmentTable({
  adjustments,
}: {
  adjustments: RecalcResult["dateAdjustments"];
}): JSX.Element {
  const tasks = useTaskStore((state) => state.tasks);
  const nameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tasks) map.set(t.id, t.name || "(unnamed)");
    return map;
  }, [tasks]);

  const fmt = (d: string): string => formatDate(d, "MMM dd, yyyy");

  return (
    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded text-xs">
      <table className="w-full">
        <thead className="bg-slate-50 sticky top-0">
          <tr className="text-left text-slate-500">
            <th className="px-3 py-1.5 font-medium">Task</th>
            <th className="px-3 py-1.5 font-medium">Start</th>
            <th className="px-3 py-1.5 font-medium">End</th>
          </tr>
        </thead>
        <tbody>
          {adjustments.map((adj) => (
            <tr key={adj.taskId} className="border-t border-slate-100">
              <td
                className="px-3 py-1.5 text-slate-700 truncate max-w-[160px]"
                title={nameMap.get(adj.taskId) ?? adj.taskId}
              >
                {nameMap.get(adj.taskId) ?? adj.taskId}
              </td>
              <td className="px-3 py-1.5 text-slate-600 whitespace-nowrap">
                <DateCell
                  oldVal={adj.oldStartDate}
                  newVal={adj.newStartDate}
                  fmt={fmt}
                />
              </td>
              <td className="px-3 py-1.5 text-slate-600 whitespace-nowrap">
                <DateCell
                  oldVal={adj.oldEndDate}
                  newVal={adj.newEndDate}
                  fmt={fmt}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DateCell({
  oldVal,
  newVal,
  fmt,
}: {
  oldVal: string;
  newVal: string;
  fmt: (d: string) => string;
}): JSX.Element {
  if (oldVal === newVal) return <>{fmt(oldVal)}</>;
  return (
    <>
      <span className="line-through text-slate-400">{fmt(oldVal)}</span>
      {" \u2192 "}
      {fmt(newVal)}
    </>
  );
}

// ---------------------------------------------------------------------------
// Duration change table (keep-positions mode)
// ---------------------------------------------------------------------------

function DurationChangeTable({
  changes,
}: {
  changes: RecalcResult["durationChanges"];
}): JSX.Element {
  const tasks = useTaskStore((state) => state.tasks);
  const nameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tasks) map.set(t.id, t.name || "(unnamed)");
    return map;
  }, [tasks]);

  return (
    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded text-xs">
      <table className="w-full">
        <thead className="bg-slate-50 sticky top-0">
          <tr className="text-left text-slate-500">
            <th className="px-3 py-1.5 font-medium">Task</th>
            <th className="px-3 py-1.5 font-medium">Duration</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((ch) => (
            <tr key={ch.taskId} className="border-t border-slate-100">
              <td
                className="px-3 py-1.5 text-slate-700 truncate max-w-[160px]"
                title={nameMap.get(ch.taskId) ?? ch.taskId}
              >
                {nameMap.get(ch.taskId) ?? ch.taskId}
              </td>
              <td className="px-3 py-1.5 text-slate-600 whitespace-nowrap">
                <span className="line-through text-slate-400">
                  {ch.oldDuration}d
                </span>
                {" \u2192 "}
                {ch.newDuration}d
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lag change table (keep-positions mode)
// ---------------------------------------------------------------------------

function LagChangeTable({
  changes,
}: {
  changes: RecalcResult["lagChanges"];
}): JSX.Element {
  const tasks = useTaskStore((state) => state.tasks);
  const dependencies = useDependencyStore((state) => state.dependencies);

  const depMap = useMemo(() => {
    const nm = new Map<string, string>();
    for (const t of tasks) nm.set(t.id, t.name || "(unnamed)");
    const dm = new Map<string, { from: string; to: string }>();
    for (const d of dependencies) {
      dm.set(d.id, {
        from: nm.get(d.fromTaskId) ?? d.fromTaskId,
        to: nm.get(d.toTaskId) ?? d.toTaskId,
      });
    }
    return dm;
  }, [tasks, dependencies]);

  return (
    <div className="max-h-32 overflow-y-auto border border-slate-200 rounded text-xs">
      <table className="w-full">
        <thead className="bg-slate-50 sticky top-0">
          <tr className="text-left text-slate-500">
            <th className="px-3 py-1.5 font-medium">Dependency</th>
            <th className="px-3 py-1.5 font-medium">Lag</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((ch) => {
            const dep = depMap.get(ch.depId);
            const label = dep ? `${dep.from} \u2192 ${dep.to}` : ch.depId;
            return (
              <tr key={ch.depId} className="border-t border-slate-100">
                <td
                  className="px-3 py-1.5 text-slate-700 truncate max-w-[200px]"
                  title={label}
                >
                  {label}
                </td>
                <td className="px-3 py-1.5 text-slate-600 whitespace-nowrap">
                  <span className="line-through text-slate-400">
                    {ch.oldLag}d
                  </span>
                  {" \u2192 "}
                  {ch.newLag}d
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
