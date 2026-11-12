import { createFileRoute } from "@tanstack/react-router";
import { head } from "../head";
import { Results } from "../results";

export const Route = createFileRoute("/de")({
  head: () => head("de"),
  component: () => <Results lang="de" />,
});
