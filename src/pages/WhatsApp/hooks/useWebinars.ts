import { useQuery } from "@tanstack/react-query";
import { getAllWebinars, getAttendeeCount } from "../api/modules/webinarApi";
import type { WlhFiltersSelection } from "@/schemas/campaignSchema";

const WEBINARS_QUERY_KEY = "webinars";

export const useWebinars = () => {

  return useQuery({
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnWindowFocus: false,
    queryKey: [WEBINARS_QUERY_KEY],
    queryFn: () => getAllWebinars(),
  });
};

export const useGetAttendeeCount = (filters: WlhFiltersSelection | null) => {
  const enabled = Boolean(filters?.webinarIds && filters.webinarIds.length > 0);

  return useQuery({
    queryKey: [WEBINARS_QUERY_KEY, "attendee-count", filters],
    queryFn: () => getAttendeeCount(filters as WlhFiltersSelection),
    enabled,
  });
};