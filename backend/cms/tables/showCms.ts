import { TableCms } from "../cmsTypes";

const showCms: TableCms = {
  name: "show",
  label: "Show",
  title: ["${title}"],
  fields: [
    {
      label: "Title",
      column: "title",
      type: "string",
    },
    {
      label: "Short Name",
      column: "short_name",
      type: "string",
      optional: true,
    },
    {
      label: "Format",
      column: "format",
      type: "enum",
      enum: "show_format_type",
      helperText:
        "Panel shows call their segments rounds and use Captain/Panellist roles",
    },
    {
      label: "Description",
      column: "description",
      type: "string",
      optional: true,
    },
    {
      label: "Link URLs",
      column: "link_urls",
      type: "list",
      optional: true,
    },
    {
      label: "URL Slug",
      column: "url_slug",
      type: "slug",
      derivedFrom: "title",
    },
  ],
};

export default showCms;
