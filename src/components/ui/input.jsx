import React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
