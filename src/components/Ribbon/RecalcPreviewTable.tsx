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

/** Map from task ID → display name, built once per render. */
function useTaskNameMap(): Map<string, string> {
  const tasks = useTaskStore((state) => state.tasks);
  return useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tasks) map.set(t.id, t.name || "(unnamed)");
    return map;
  }, [tasks]);
}

export function RecalcPreviewTable({
  result,
  mode,
}: RecalcPreviewTableProps): JSX.Element {
  const nameMap = useTaskNameMap();

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
        <DateAdjustmentTable
          adjustments={result.dateAdjustments}
          nameMap={nameMap}
        />
      )}
      {mode === "keep-positions" && result.durationChanges.length > 0 && (
        <DurationChangeTable
          changes={result.durationChanges}
          nameMap={nameMap}
        />
      )}
      {mode === "keep-positions" && result.lagChanges.length > 0 && (
        <LagChangeTable changes={result.lagChanges} nameMap={nameMap} />
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
  nameMap,
}: {
  adjustments: RecalcResult["dateAdjustments"];
  nameMap: Map<string, string>;
}): JSX.Element {
  const fmt = (d: string): string => formatDate(d, "MMM dd, yyyy");

  return (
    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded text-xs">
      <table className="w-full" aria-label="Task date adjustments">
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
  nameMap,
}: {
  changes: RecalcResult["durationChanges"];
  nameMap: Map<string, string>;
}): JSX.Element {
  return (
    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded text-xs">
      <table className="w-full" aria-label="Task duration changes">
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
  nameMap,
}: {
  changes: RecalcResult["lagChanges"];
  nameMap: Map<string, string>;
}): JSX.Element {
  const dependencies = useDependencyStore((state) => state.dependencies);

  const depLabelMap = useMemo(() => {
    const dm = new Map<string, string>();
    for (const d of dependencies) {
      const from = nameMap.get(d.fromTaskId) ?? d.fromTaskId;
      const to = nameMap.get(d.toTaskId) ?? d.toTaskId;
      dm.set(d.id, `${from} \u2192 ${to}`);
    }
    return dm;
  }, [dependencies, nameMap]);

  return (
    <div className="max-h-32 overflow-y-auto border border-slate-200 rounded text-xs">
      <table className="w-full" aria-label="Dependency lag changes">
        <thead className="bg-slate-50 sticky top-0">
          <tr className="text-left text-slate-500">
            <th className="px-3 py-1.5 font-medium">Dependency</th>
            <th className="px-3 py-1.5 font-medium">Lag</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((ch) => {
            const label = depLabelMap.get(ch.depId) ?? ch.depId;
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
