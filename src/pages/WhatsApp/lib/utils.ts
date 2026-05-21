import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Toast utility functions
export const toastUtils = {
  success: (message: string) => {
    toast.success(message);
  },
  error: (
    message: unknown,
    fallbackMessage: string = "Something went wrong"
  ) => {
    if(Array.isArray(message) && message.length > 0) {
      message = message[0];
    }

    if (typeof message !== "string") {
      message = fallbackMessage;
    }
    if (typeof message === "string") toast.error(message);
  },
  warning: (message: string) => {
    toast.warning(message);
  },
  info: (message: string) => {
    toast.info(message);
  },
};
