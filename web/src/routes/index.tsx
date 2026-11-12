import { createFileRoute } from "@tanstack/react-router";
import { head } from "../head";
import { Results } from "../results";

export const Route = createFileRoute("/")({
  head: () => head("en"),
  component: () => <Results lang="en" />,
});
