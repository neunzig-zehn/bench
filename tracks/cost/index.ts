import { LANGS, type Task } from "../../src/types";
import { changeOrderPricing } from "./change-order-pricing";
import { historicPriceEstimate } from "./historic-price-estimate";
import { supplierOfferPricing } from "./supplier-offer";
import { unitPriceBuildUp } from "./unit-price-build-up";

/** The cost track's tasks, each in German and in English. */
export const TASKS: Task[] = [supplierOfferPricing, unitPriceBuildUp, historicPriceEstimate, changeOrderPricing].flatMap((task) =>
  LANGS.map((lang) => task(lang)),
);
