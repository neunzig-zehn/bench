import { LANGS, type Task } from "../../src/types";
import { drywallRules } from "./drywall-rules";
import { electricalNewBuild } from "./electrical-new-build";
import { electricalOccupiedRenovation } from "./electrical-occupied-renovation";
import { heatingSmallQuantities } from "./heating-small-quantities";
import { plumbingOldBuilding } from "./plumbing-old-building";
import { ventilationDuctSurface } from "./ventilation-duct-surface";

/** The hours track's tasks, each in German and English. */
export const TASKS: Task[] = [
  electricalNewBuild,
  plumbingOldBuilding,
  heatingSmallQuantities,
  drywallRules,
  ventilationDuctSurface,
  electricalOccupiedRenovation,
].flatMap((task) => LANGS.map(task));
