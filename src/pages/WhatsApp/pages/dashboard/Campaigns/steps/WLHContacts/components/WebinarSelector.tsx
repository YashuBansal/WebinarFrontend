import * as React from "react";
import { MultiSelect, type MultiSelectOption } from "./MultiSelect";

interface Webinar {
  _id: string;
  webinarName: string;
}

interface WebinarSelectorProps {
  webinars?: Webinar[];
  selectedWebinarIds: string[];
  onSelectionChange: (webinarIds: string[]) => void;
  placeholder?: string;
}

export function WebinarSelector({
  webinars = [],
  selectedWebinarIds,
  onSelectionChange,
  placeholder = "Select webinars...",
}: WebinarSelectorProps) {
  const options: MultiSelectOption[] = React.useMemo(
    () =>
      webinars.map((webinar) => ({
        id: webinar._id,
        label: webinar.webinarName,
        value: webinar._id,
      })),
    [webinars]
  );

  const getDisplayLabel = React.useCallback(
    (webinarId: string) => {
      const webinar = webinars.find((w) => w._id === webinarId);
      return webinar?.webinarName || webinarId;
    },
    [webinars]
  );

  return (
    <MultiSelect
      options={options}
      selectedValues={selectedWebinarIds}
      onSelectionChange={onSelectionChange}
      placeholder={placeholder}
      searchPlaceholder="Search webinars..."
      emptyMessage="No webinar found."
      getDisplayLabel={getDisplayLabel}
    />
  );
}

