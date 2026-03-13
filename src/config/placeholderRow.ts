/** Special ID for the placeholder row — used by paste logic and selection. */
import { type TaskId, toTaskId } from "@/types/branded.types";

export const PLACEHOLDER_TASK_ID: TaskId = toTaskId("__new_task_placeholder__");
