import type { Task } from "../../src/types";
import { cableTray } from "./cable-tray";
import { combinedTakeoff } from "./combined-takeoff";
import { pipeRuns } from "./pipe-runs";
import { roomAreas } from "./room-areas";
import { surveyAreas } from "./survey-areas";
import { symbolCount } from "./symbol-count";

/** The plans track's tasks: reading drawings for counts, lengths, and areas. */
export const TASKS: Task[] = [...symbolCount, ...roomAreas, ...cableTray, ...pipeRuns, ...surveyAreas, ...combinedTakeoff];
