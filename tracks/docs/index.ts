import type { Task } from "../../src/types";
import { contractTermsTasks } from "./contract-terms";
import { datasheetFields } from "./datasheet";
import { gaebLvStructure } from "./gaeb-lv";
import { lvOcrStructure } from "./lv-ocr";
import { offerOcrLines } from "./offer-ocr";
import { offerScanLines } from "./offer-scan";

/** The docs track's tasks, from moderate to hard. */
export const TASKS: Task[] = [...datasheetFields, ...offerOcrLines, ...gaebLvStructure, ...lvOcrStructure, ...contractTermsTasks, ...offerScanLines];
