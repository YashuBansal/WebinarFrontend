export type ConditionField =
  | "email"
  | "firstName"
  | "lastName"
  | "phone"
  | "timeInSession"
  | "gender"
  | "location"
  | "profession"
  | "assignedTo"
  | "status"
  | "source"
  | "tags"
  | "registeredCount"
  | "attendedCount";
export type ConditionOperator =
  | "equals"
  | "contains"
  | "starts_with"
  | "ends_with"
  | "greater_than_or_equal"
  | "less_than_or_equal";
export type ConditionMode = "include" | "exclude";
export type ConditionLogic = "AND" | "OR";

export type FilterCondition = {
  id: string;
  mode: ConditionMode;
  field: ConditionField;
  operator: ConditionOperator;
  logicOperator: ConditionLogic;
  value: string | string[]; // Can be string for email or array for tags
};

export const FIELD_CONFIG: Record<
  ConditionField,
  { label: string; placeholder: string; helperText: string }
> = {
  email: {
    label: "Email",
    placeholder: "e.g. user@example.com, another@example.com",
    helperText: "Separate multiple emails with commas.",
  },
  firstName: {
    label: "First Name",
    placeholder: "e.g. John",
    helperText: "Filter attendees by first name.",
  },
  lastName: {
    label: "Last Name",
    placeholder: "e.g. Doe",
    helperText: "Filter attendees by last name.",
  },
  phone: {
    label: "Phone",
    placeholder: "e.g. +15551234567",
    helperText: "Filter attendees by phone number.",
  },
  timeInSession: {
    label: "Time in Session (minutes)",
    placeholder: "e.g. 30",
    helperText: "Filter attendees by time spent in the webinar.",
  },
  gender: {
    label: "Gender",
    placeholder: "e.g. male, female",
    helperText: "Filter attendees by gender.",
  },
  location: {
    label: "Location",
    placeholder: "e.g. New York",
    helperText: "Filter attendees by location or city.",
  },
  profession: {
    label: "Profession",
    placeholder: "e.g. Engineer, Doctor",
    helperText: "Filter attendees by profession.",
  },
  assignedTo: {
    label: "Assigned To",
    placeholder: "Select employees...",
    helperText: "Filter attendees assigned to one or more team members.",
  },
  status: {
    label: "Status",
    placeholder: "e.g. hot, warm, cold",
    helperText: "Filter attendees by lead status.",
  },
  source: {
    label: "Source",
    placeholder: "e.g. Facebook, Google",
    helperText: "Filter attendees by lead source.",
  },
  tags: {
    label: "Tags",
    placeholder: "Select tags...",
    helperText: "Select one or more tags.",
  },
  registeredCount: {
    label: "Registered Count",
    placeholder: "e.g. 10",
    helperText: "Filter attendees by registered count.",
  },
  attendedCount: {
    label: "Attended Count",
    placeholder: "e.g. 10",
    helperText: "Filter attendees by attended count.",
  },
};

export const OPERATOR_OPTIONS: { value: ConditionOperator; label: string }[] = [
  { value: "equals", label: "Equals" },
  { value: "contains", label: "Contains" },
  { value: "starts_with", label: "Starts with" },
  { value: "ends_with", label: "Ends with" },
  { value: "greater_than_or_equal", label: "Greater than or equal" },
  { value: "less_than_or_equal", label: "Less than or equal" },
];

export const FIELD_OPERATOR_CONFIG: Record<ConditionField, ConditionOperator[]> =
  {
    // String-like fields
    email: [
      "equals",
      "contains",
      "starts_with",
      "ends_with",
    ],
    firstName: [
      "equals",
      "contains",
      "starts_with",
      "ends_with",
    ],
    lastName: [
      "equals",
      "contains",
      "starts_with",
      "ends_with",
    ],
    phone: [
      "equals",
      "contains",
      "starts_with",
      "ends_with",
    ],
    gender: [
      "equals",
      "contains",
      "starts_with",
      "ends_with",
    ],
    location: [
      "equals",
      "contains",
      "starts_with",
      "ends_with",
    ],
    profession: [
      "equals",
      "contains",
      "starts_with",
      "ends_with",
    ],
    status: [
      "equals",
      "contains",
      "starts_with",
      "ends_with",
    ],
    source: [
      "equals",
      "contains",
      "starts_with",
      "ends_with",
    ],
    tags: [
      "equals",
      "contains",
      "starts_with",
      "ends_with",
    ],
    registeredCount: [
      "equals",
      "greater_than_or_equal",
      "less_than_or_equal",
    ],
    attendedCount: [
      "equals",
      "greater_than_or_equal",
      "less_than_or_equal",
    ],
    // Numeric fields
    timeInSession: [
      "equals",
      "greater_than_or_equal",
      "less_than_or_equal",
    ],

    // MongoDB ID field
    assignedTo: ["equals"],

  };

export const LOGIC_OPTIONS: ConditionLogic[] = ["AND", "OR"];

