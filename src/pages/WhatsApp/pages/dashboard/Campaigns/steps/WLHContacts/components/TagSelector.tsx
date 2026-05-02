import * as React from "react";
import { MultiSelect, type MultiSelectOption } from "./MultiSelect";

interface Tag {
  _id: string;
  name: string;
}

interface TagSelectorProps {
  tags?: Tag[];
  selectedTagNames: string[];
  onSelectionChange: (tagNames: string[]) => void;
  placeholder?: string;
}

export function TagSelector({
  tags = [],
  selectedTagNames,
  onSelectionChange,
  placeholder = "Select tags...",
}: TagSelectorProps) {
  const options: MultiSelectOption[] = React.useMemo(
    () =>
      tags.map((tag) => ({
        id: tag._id,
        label: tag.name,
        value: tag.name,
      })),
    [tags]
  );

  return (
    <MultiSelect
      options={options}
      selectedValues={selectedTagNames}
      onSelectionChange={onSelectionChange}
      placeholder={placeholder}
      searchPlaceholder="Search tags..."
      emptyMessage="No tag found."
    />
  );
}

