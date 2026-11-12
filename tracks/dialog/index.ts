import type { Task } from "../../src/types";
import { LANGS } from "../../src/types";
import { feederUnknownLength } from "./feeder";
import { lightingContradictions } from "./lighting";
import { scheduleDecision } from "./schedule";
import { socketsFullySpecified } from "./sockets";
import { wallboxUnitPrice } from "./wallbox";

/** The dialog track's tasks: each in German and in English. */
export const TASKS: Task[] = [wallboxUnitPrice, lightingContradictions, feederUnknownLength, socketsFullySpecified, scheduleDecision].flatMap((task) =>
  LANGS.map((lang) => task(lang)),
);
