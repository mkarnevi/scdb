"use client";

import { segmentsLabel } from "@/shared/siteConfig";
import { ContentLink } from "@/app/components/ContentLink";
import { ListSearchParms } from "@/backend/content/listHelper";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import BaseDataGrid from "../BaseDataGrid";

interface RecurringSketchesDataGridProps {
  rows: {
    id: number;
    title: string;
    url_slug: string;
    show: { id: number; url_slug: string; title: string };
    sketches___count: number;
  }[];
  searchParams: ListSearchParms;
  totalRowCount: number;
}

export default function RecurringSketchesDataGrid({
  rows,
  searchParams,
  totalRowCount,
}: RecurringSketchesDataGridProps) {
  // Constants
  type RecurringSketchRow = (typeof rows)[number];

  const columns: GridColDef[] = [
    {
      field: "title",
      flex: 1,
      headerName: "Recurring Series",
      renderCell: ({
        row: recurringSketch,
      }: GridRenderCellParams<
        RecurringSketchRow,
        RecurringSketchRow["title"]
      >) => {
        return (
          <ContentLink mui table="recurring-sketch" entry={recurringSketch} />
        );
      },
    },
    {
      field: "show",
      flex: 1,
      headerName: "Show",
      sortable: false,
      filterable: false,
      renderCell: ({
        row,
      }: GridRenderCellParams<
        RecurringSketchRow,
        RecurringSketchRow["show"]
      >) => <ContentLink mui table="show" entry={row.show} />,
    },
    {
      field: "sketches___count",
      headerName: segmentsLabel,
      filterable: false,
      type: "number",
    },
  ];

  return (
    <BaseDataGrid
      basePath="recurring-sketches"
      columns={columns}
      searchParams={searchParams}
      rows={rows}
      totalRowCount={totalRowCount}
    />
  );
}
