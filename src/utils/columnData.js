export const messageCountsColumns = [
  { header: "Company Name", key: "companyName", width: 25, type: "" },
  { header: "Admin Email", key: "email", width: 25, type: "" },
  { header: "Project Name", key: "projectName", width: 25, type: "" },
  { header: "Phone", key: "phone", width: 20, type: "" },
  { header: "Sent", key: "outbound", width: 15, type: "" },
  { header: "Received", key: "inbound", width: 15, type: "" },
];

export const clientTableColumns = [
  { header: "Email", key: "email", width: 50, type: "" },
  {
    header: "Company Name",
    key: "companyName",
    width: 30,
    type: "",
    capitalize: true,
  },
  {
    header: "User Name",
    key: "userName",
    width: 20,
    type: "",
    capitalize: true,
  },
  { header: "Phone", key: "phone", width: 15, type: "" },
  { header: "Is Active", key: "isActive", width: 10, type: "status" },
  {
    header: "Plan Name",
    key: "planName",
    width: 20,
    type: "",
    capitalize: true,
  },
  { header: "Plan Start Date", key: "planStartDate", width: 20, type: "Date" },
  { header: "Plan Expiry", key: "planExpiry", width: 20, type: "Date" },
  { header: "Plan Remaining Days", key: "remainingDays", width: 20, type: "" },
  { header: "Contacts Limit", key: "contactsLimit", width: 15, type: "" },
  {
    header: "Used Contacts Count",
    key: "usedContactsCount",
    width: 15,
    type: "",
  },
  { header: "Employees Limit", key: "employeeLimit", width: 15, type: "" },

  { header: "Total Employees", key: "totalEmployees", width: 15, type: "" },
  {
    header: "Employee Sales Count",
    key: "employeeSalesCount",
    width: 15,
    type: "",
  },
  {
    header: "Employee Reminder Count",
    key: "employeeReminderCount",
    width: 15,
    type: "",
  },
  { header: "Toggle Limit", key: "toggleLimit", width: 15, type: "" },
];

export const attendeeTableColumns = [
  { header: "Email", key: "email", width: 50, type: "" },
  { header: "Phone", key: "phone", width: 20, type: "" },
  { header: "Time in Session", key: "timeInSession", width: 20, type: "" },
  { header: "Assigned To", key: "isAssigned", width: 20, type: "",capitalize: true, },
  {
    header: "First Name",
    key: "firstName",
    width: 20,
    type: "",
    capitalize: true,
  },
  {
    header: "Last Name",
    key: "lastName",
    width: 20,
    type: "",
    capitalize: true,
  },
  { header: "Status", key: "status", width: 20, type: "" },
  { header: "Gender", key: "gender", width: 20, type: "",capitalize: true, },
  {
    header: "Location",
    key: "location",
    width: 20,
    type: "",
    capitalize: true,
  },
  {
    header: "Source",
    key: "source",
    width: 20,
    type: "",
    default: "Import",
    capitalize: true,
  },
  { header: "Date", key: "createdAt", width: 20, type: "Date" },
  { header: "Tags", key: "tags", width: 20, type: "tag" },
  {
    header: "Enrollments",
    key: "enrollments",
    width: 20,
    type: "chip",
    capitalize: true,
  },
    {
    header: "Registered Webinars",
    key: "registeredCount",
    width: 20,
    type: "",
  },
    {
    header: "Attended Webinars",
    key: "attendedCount",
    width: 20,
    type: "",
  },
];

export const userActivityTableColumns = [
  { header: "Actions", key: "action", width: 50, type: "", capitalize: true },
  { header: "Details", key: "details", width: 50, type: "details" },
  { header: "Date", key: "createdAt", width: 20, type: "Date" },
];

export const groupedAttendeeTableColumns = [
  { header: "Email", key: "_id", width: 50, type: "" },
  {
    header: "Total Time in Session",
    key: "timeInSession",
    width: 20,
    type: "",
  },
  {
    header: "Reminder Assigned",
    key: "reminderAssignedTo",
    width: 20,
    type: "Employee",
  },
  {
    header: "Sales Assigned",
    key: "salesAssignedTo",
    width: 20,
    type: "Employee",
    capitalize: true,
  },
  {
    header: "Reminder Status",
    key: "reminderLastStatus",
    width: 20,
    type: "",
    capitalize: true,
  },
  { header: "Sales Status", key: "salesLastStatus", width: 20, type: "" },
  {
    header: "Registered Webinars",
    key: "registeredWebinarCount",
    width: 20,
    type: "",
  },
  {
    header: "Attended Webinars",
    key: "attendedWebinarCount",
    width: 20,
    type: "",
  },
  {
    header: "Locations",
    key: "locations",
    width: 20,
    type: "chip",
    capitalize: true,
  },
  {
    header: "Sources",
    key: "sources",
    width: 20,
    type: "chip",
    capitalize: true,
  },
  { header: "Tags", key: "tags", width: 20, type: "tag" },
  {
    header: "Enrollments",
    key: "enrollments",
    width: 20,
    type: "chip",
    capitalize: true,
  },
];

export const employeeTableColumns = [
  { header: "Email", key: "email", width: 50, type: "" },
  { header: "User Name", key: "userName", width: 20, type: "", capitalize: true },
  { header: "Is Active", key: "isActive", width: 10, type: "status" },
  { header: "Role", key: "role", width: 20, type: "" },
  { header: "Phone", key: "phone", width: 15, type: "" },
  { header: "Valid Call Time(Sec)", key: "validCallTime", width: 20, type: "" },
  {
    header: "Daily Contact Limit",
    key: "dailyContactLimit",
    width: 20,
    type: "",
  },
  {
    header: "Daily Contact Count",
    key: "dailyContactCount",
    width: 20,
    type: "",
  },
  {
    header: "Inactivity Time(Sec)",
    key: "inactivityTime",
    width: 20,
    type: "",
  },
  { header: "Tags", key: "tags", width: 20, type: "chip" },
];

export const locationTableColumns = [
  { header: "Name", key: "name", width: 50, type: "capitalize" },
  { header: "State", key: "state", width: 50, type: "capitalize" },
  { header: "Previous Name", key: "previousName", width: 20, type: "" },
  {
    header: "Is Verified",
    key: "isVerified",
    width: 10,
    type: "superAdminApproval",
    title: "note",
  },
  { header: "Admin", key: "adminEmail", width: 20, type: "" },
  {
    header: "Is Admin Verified",
    key: "isAdminVerified",
    width: 10,
    type: "adminApproval",
    title: "adminNote",
  },
  { header: "Employee", key: "employeeEmail", width: 20, type: "" },
];

export const webinarTableColumns = [
  { header: "Webinar Name", key: "webinarName", width: 50, type: "" },
  { header: "Webinar Date", key: "webinarDate", width: 20, type: "Date" },
  {
    header: "Total Registrations",
    key: "totalRegistrations",
    width: 10,
    type: "",
  },
  {
    header: "Total Participants",
    key: "totalParticipants",
    width: 15,
    type: "",
  },
  { header: "Total Attendees", key: "totalAttendees", width: 20, type: "" },
  { header: "Total Un Attended", key: "totalUnAttended", width: 20, type: "" },
];

export const productTableColumns = [
  { header: "Name", key: "name", width: 50, type: "" },
  // { header: "Unique Id", key: "uniqueId", width: 50, type: "" },
  { header: "Price", key: "price", width: 20, type: "" },
  {
    header: "Level",
    key: "level",
    width: 10,
    type: "",
  },
  {
    header: "Tag",
    key: "tag",
    width: 10,
    type: "",
  },
  { header: "Description", key: "description", width: 20, type: "" },
];

export const pullbacksTableColumns = [
  { header: "Email", key: "attendeeEmail", width: 50, type: "" },
  { header: "Assigned To", key: "assignedTo", width: 20, type: "", capitalize: true },
  { header: "Reason", key: "requestReason", width: 20, type: "", capitalize: true },
];

export const enrollmentsColumn = [
  { header: "E-Mail", key: "attendee", width: 50, type: "" },
  {
    header: "Product",
    key: "productName",
    width: 20,
    type: "",
  },
  {
    header: "Assign Type",
    key: "assignType",
    width: 20,
    type: "",
  },
  {
    header: "Assigned By",
    key: "assignedBy",
    width: 20,
    type: "role",
    default: "API" 
    , capitalize: true
  },
  {
    header: "Level",
    key: "productLevel",
    width: 20,
    type: "",
  },
  {
    header: "Price",
    key: "price",
    width: 20,
    type: "",
  },
  { header: "Enrollment Date", key: "createdAt", width: 20, type: "Date" },
];

export const productEnrollmentsColumn = [
  { header: "E-Mail", key: "attendee", width: 50, type: "" },
  {
    header: "Webinar",
    key: "webinarName",
    width: 20,
    type: "",
  },
  {
    header: "Product",
    key: "productName",
    width: 20,
    type: "",
  },
  {
    header: "Level",
    key: "productLevel",
    width: 20,
    type: "",
  },
  {
    header: "Price",
    key: "price",
    width: 20,
    type: "",
  },
  { header: "Date", key: "createdAt", width: 20, type: "Date" },
];

export const allAttendeesSortByOptions = [
  { value: "_id", label: "Email" },
  { value: "registeredWebinarCount", label: "Registered Webinar Count" },
  { value: "attendedWebinarCount", label: "Attended Webinar Count" },
  { value: "timeInSession", label: "Time in Session" },
];

export const webinarAttendeesSortByOptions = [
  { value: "createdAt", label: "Date" },
  { value: "email", label: "Email" },
];

export const salesAttendeesSortByOptions = [
  { value: "timeInSession", label: "Time in Session" },
  { value: "email", label: "Email" },
  { value: "createdAt", label: "Date" },
];

export const states = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const unionTerritories = [
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];