export const roles = {
  SUPER_ADMIN: "66b758464892ce3d994745c5",
  ADMIN: "66b7584c4892ce3d994745c8",
  EMPLOYEE_SALES: "66b758544892ce3d994745cb",
  EMPLOYEE_REMINDER: "66b7585d4892ce3d994745ce",
};

// Function to get role name
export const getRoleNameByID = (roleId) => {
  if (!roleId) return "Unknown Role";

  // 1. Try to see if roleId is already a key (e.g. "EMPLOYEE_SALES")
  if (roles[roleId]) {
    return roleId.replace(/_/g, " ");
  }

  // 2. Try to find by ObjectID
  const roleEntries = Object.entries(roles);
  const matchedRole = roleEntries.find(([roleName, id]) => id === roleId);

  return matchedRole ? matchedRole[0].replace(/_/g, " ") : "Unknown Role";
};

export const isEmployeeId = (roleId) => {
  const roleName = getRoleNameByID(roleId).toUpperCase();
  return roleName.includes("EMPLOYEE");
};