import { useQuery } from "@tanstack/react-query";
import { getEmployees, type Employee } from "@/api/modules/employeesApi";

const EMPLOYEES_QUERY_KEY = "employees";

export type EmployeeRoleFilter = "EMPLOYEE_REMINDER" | "EMPLOYEE_SALES";

interface UseEmployeesOptions {
  roleFilter?: EmployeeRoleFilter;
}

export const useEmployees = ({ roleFilter }: UseEmployeesOptions = {}) => {
  return useQuery<Employee[], Error>({
    queryKey: [EMPLOYEES_QUERY_KEY, roleFilter],
    queryFn: async () => {
      // Always request only active employees from the backend
      const { employees } = await getEmployees({
        page: 1,
        limit: 200,
        filters: { isActive: "active" },
      });

      if (!roleFilter) {
        return employees;
      }

      return employees.filter((emp) => emp.role === roleFilter);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};


