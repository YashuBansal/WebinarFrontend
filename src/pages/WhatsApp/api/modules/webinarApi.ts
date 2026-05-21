import z from "zod";
import axiosInstance from "../axios";
import type { WlhFiltersSelection } from "@/schemas/campaignSchema";

const webinarSchema = z.object({
  _id: z.string(),
  webinarName: z.string(),
  webinarDate: z.string().optional().nullable(),
});

type Webinar = z.infer<typeof webinarSchema>;

const getAllWebinarsResponseSchema = z.array(webinarSchema);

const getAttendeeCountResponseSchema = z.object({
  message: z.string(),
  data: z.number(),
  success: z.boolean(),
});

const getAllWebinars = async (): Promise<Webinar[]> => {
  try {
    const { data } = await axiosInstance.get("/webinar/all");
    const webinars = getAllWebinarsResponseSchema.parse(data);
    return webinars;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getAttendeeCount = async (
  filters: WlhFiltersSelection
): Promise<{ message: string; data: number; success: boolean }> => {
  const { data } = await axiosInstance.post(`/webinar/attendee-count`, filters);
  const count = getAttendeeCountResponseSchema.parse(data);
  return count;
};

export { getAllWebinars, getAttendeeCount };
