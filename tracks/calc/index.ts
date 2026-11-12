import type { Task } from "../../src/types";
import { cableTray } from "./cable-tray";
import { feederSizing } from "./feeder";
import { heatingLoad } from "./heating-load";
import { offerTotal } from "./offer-total";
import { paintTakeoff } from "./paint-takeoff";
import { pipeCutting } from "./pipe-cutting";

/** The calc track's tasks, each in German and English. */
export const TASKS: Task[] = [...paintTakeoff, ...cableTray, ...feederSizing, ...heatingLoad, ...offerTotal, ...pipeCutting];
