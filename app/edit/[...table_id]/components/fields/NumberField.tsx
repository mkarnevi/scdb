import { FieldCms, isFieldEmpty, NumberFieldCms } from "@/backend/cms/cmsTypes";
import { useForceUpdate } from "@/app/hooks/useForceUpdate";
import { formatTimecode, parseTimecode } from "@/shared/timecode";
import { TextField } from "@mui/material";
import { useState } from "react";

interface NumberFieldProps {
  field: NumberFieldCms;
  index: number;
  inTable: boolean;
  loading: boolean;
  setFieldValue: (field: FieldCms, index: number, value: number | null) => void;
}

export default function NumberField(props: NumberFieldProps) {
  return props.field.timecode ? (
    <TimecodeField {...props} />
  ) : (
    <PlainNumberField {...props} />
  );
}

function PlainNumberField({
  field,
  index,
  inTable,
  loading,
  setFieldValue,
}: NumberFieldProps) {
  // Constants
  const hasError = !field.optional && isFieldEmpty(field, index);

  // Hooks
  const forceUpdate = useForceUpdate();

  // Event Handlers
  function handleChange_field(
    field: NumberFieldCms,
    index: number,
    value: string,
  ) {
    const numberValue = parseInt(value);

    setFieldValue(field, index, numberValue);

    forceUpdate();
  }

  // Rendering
  return (
    <TextField
      disabled={loading}
      error={hasError}
      helperText={field.helperText}
      label={inTable ? "" : field.label}
      onChange={(e) => handleChange_field(field, index, e.target.value)}
      size="small"
      value={field.values?.[index] || ""}
      variant="outlined"
    />
  );
}

/** Edits whole seconds as a timecode, e.g. "1:02:03" or "12:34" */
function TimecodeField({
  field,
  index,
  inTable,
  loading,
  setFieldValue,
}: NumberFieldProps) {
  // Hooks
  const [text, setText] = useState(() => {
    const value = field.values?.[index];
    return value == null || Number.isNaN(value) ? "" : formatTimecode(value);
  });

  // Constants
  const parsed = parseTimecode(text);
  const malformed = Number.isNaN(parsed);
  const hasError = malformed || (!field.optional && isFieldEmpty(field, index));

  // Event Handlers
  function handleChange(value: string) {
    setText(value);
    // Malformed input is stored as NaN so the save is rejected
    setFieldValue(field, index, parseTimecode(value));
  }

  // Rendering
  return (
    <TextField
      disabled={loading}
      error={hasError}
      helperText={malformed ? "Use H:MM:SS, M:SS or seconds" : field.helperText}
      label={inTable ? "" : field.label}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="0:00"
      size="small"
      value={text}
      variant="outlined"
    />
  );
}
