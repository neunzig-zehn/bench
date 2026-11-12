import type { Task } from "./types";
import { TASKS as docs } from "../tracks/docs";
import { TASKS as plans } from "../tracks/plans";
import { TASKS as calc } from "../tracks/calc";
import { TASKS as hours } from "../tracks/hours";
import { TASKS as cost } from "../tracks/cost";
import { TASKS as dialog } from "../tracks/dialog";

/** Every task, by track in the benchmark's order. */
export const ALL_TASKS: Task[] = [...docs, ...plans, ...calc, ...hours, ...cost, ...dialog];
