import { useMutation } from "@tanstack/react-query";
import {
  getAdvanceFilterCount,
  type AdvanceFilterBody,
  type AdvanceFilterCountResponse,
} from "@/api/modules/attendeesApi";

export const useAdvanceFilterCount = () => {
  return useMutation<AdvanceFilterCountResponse, unknown, AdvanceFilterBody>({
    mutationFn: (body: AdvanceFilterBody) => getAdvanceFilterCount(body),
  });
};


