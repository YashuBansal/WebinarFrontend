import z from "zod";
import axiosInstance from "../axios";

const employeeSchema = z.object({
  _id: z.string(),
  userName: z.string(),
  role: z.string(),
});

export type Employee = z.infer<typeof employeeSchema>;

const getEmployeesResponseSchema = z.object({
  result: z.array(employeeSchema),
  totalPages: z.number().optional(),
});

export interface GetEmployeesParams {
  page?: number;
  limit?: number;
  /**
   * Raw filters object forwarded to the WLH backend.
   * For our use-case we typically send: { isActive: "active" }.
   */
  filters?: Record<string, unknown>;
}

export const getEmployees = async ({
  page = 1,
  limit = 100,
  filters = {},
}: GetEmployeesParams = {}): Promise<{
  employees: Employee[];
  totalPages?: number;
}> => {
  const { data } = await axiosInstance.post(
    "/users/employee",
    { filters },
    {
      params: { page, limit },
    }
  );

  const parsed = getEmployeesResponseSchema.parse(data);

  return {
    employees: parsed.result,
    totalPages: parsed.totalPages,
  };
};


