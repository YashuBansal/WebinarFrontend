import z from "zod";
import axiosInstance from "../axios";

const advanceFilterUnitSchema = z.object({
  mode: z.string(),
  operator: z.string(),
  logicOperator: z.string(),
  value: z.array(z.string()),
  field: z.string(),
  fieldType: z.enum(["string", "number", "boolean", "date", "mongodb_id"]),
  isMultiple: z.boolean(),
});

export type AdvanceFilterUnit = z.infer<typeof advanceFilterUnitSchema>;

const advanceFilterCountResponseSchema = z.object({
  data: z.array(z.any()),
  count: z.number(),
  responseType: z.string(),
  message: z.string(),
});

export type AdvanceFilterCountResponse = z.infer<
  typeof advanceFilterCountResponseSchema
>;

export interface AdvanceFilterBody {
  responseType: "count" | "data";
  webinarIds: string[];
  isAttended: boolean;
  units: AdvanceFilterUnit[];
}

export const getAdvanceFilterCount = async (
  body: AdvanceFilterBody
): Promise<AdvanceFilterCountResponse> => {
  const { data } = await axiosInstance.post(
    "/attendees/advance-filters",
    body
  );
  return advanceFilterCountResponseSchema.parse(data);
};


