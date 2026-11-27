import DateGeneratedFooter from "@/app/footer/DateGeneratedFooter";
import { getRecurringSketchList } from "@/backend/content/recurringSketch";
import { buildPageTitle } from "@/shared/utilities";
import { Metadata } from "next";
import {
  ListPageProps,
  getCachedList,
  parseSearchParams,
} from "../baseListTypes";
import RecurringSketchesDataGrid from "./RecurringSketchesDataGrid";

export const metadata: Metadata = {
  title: buildPageTitle("Recurring Series"),
  description: "A filterable list of recurring sketches and rounds",
};

export default async function RecurringSketchesPage(props: ListPageProps) {
  // URL params
  const searchParams = await parseSearchParams(props.searchParams);

  // Data
  const recurringSketches = await getCachedList(
    "recurring-sketch",
    getRecurringSketchList,
  )(searchParams);

  const rows = recurringSketches.list.map((recurringSketch) => ({
    id: recurringSketch.id,
    title: recurringSketch.title,
    url_slug: recurringSketch.url_slug,
    show: recurringSketch.show,
    sketches___count: recurringSketch._count.sketches,
  }));

  // Rendering
  return (
    <>
      <RecurringSketchesDataGrid
        searchParams={searchParams}
        rows={rows}
        totalRowCount={recurringSketches.count}
      />
      <DateGeneratedFooter
        genDate={recurringSketches.dateGenerated}
        type="data"
      />
    </>
  );
}
