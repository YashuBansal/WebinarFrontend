import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

/**
 * Same structure as `frontend UI New/src/app/components/MultiSelectDropdown.tsx`
 * (same props, same JSX tree / styles / behaviour; JS + legacy path).
 */
export function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder,
  label,
}) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeItem = (option, e) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== option));
  };

  return (
    <div ref={dropdownRef} className="relative">
      <label
        className="block mb-1.5"
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "13px",
          fontWeight: 600,
          color: theme === "dark" ? "#f1f5f9" : "#1e293b",
        }}
      >
        {label}
      </label>

      {/* Selected Items Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-lg border transition-all duration-300 cursor-pointer min-h-[50px]"
        style={{
          backgroundColor: theme === "dark" ? "#374151" : "white",
          borderColor: isOpen
            ? "#3b82f6"
            : theme === "dark"
              ? "#4b5563"
              : "#e5e7eb",
          color: theme === "dark" ? "#f1f5f9" : "#64748b",
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          fontWeight: 500,
          boxShadow: isOpen ? "0 0 0 2px rgba(59, 130, 246, 0.2)" : "none",
        }}
      >
        <div className="flex flex-wrap gap-2 items-center">
          {selected.length === 0 ? (
            <span style={{ color: "#94a3b8" }}>{placeholder}</span>
          ) : (
            selected.map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md"
                style={{
                  backgroundColor: theme === "dark" ? "#1f2937" : "#f1f5f9",
                  color: theme === "dark" ? "#f1f5f9" : "#1e293b",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                {item}
                <button
                  type="button"
                  onClick={(e) => removeItem(item, e)}
                  className="hover:bg-red-500/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
          <ChevronDown
            className={`w-4 h-4 ml-auto transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            style={{ color: theme === "dark" ? "#94a3b8" : "#64748b" }}
          />
        </div>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 rounded-lg border shadow-lg overflow-hidden"
          style={{
            backgroundColor: theme === "dark" ? "#374151" : "white",
            borderColor: theme === "dark" ? "#4b5563" : "#e5e7eb",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {options.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <div
                key={option}
                onClick={() => toggleOption(option)}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                style={{
                  backgroundColor: isSelected
                    ? theme === "dark"
                      ? "rgba(59, 130, 246, 0.15)"
                      : "rgba(59, 130, 246, 0.1)"
                    : "transparent",
                  color: theme === "dark" ? "#f1f5f9" : "#1e293b",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor =
                      theme === "dark"
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.03)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <div
                  className="w-5 h-5 rounded border flex items-center justify-center transition-all"
                  style={{
                    borderColor: isSelected
                      ? "#3b82f6"
                      : theme === "dark"
                        ? "#4b5563"
                        : "#d1d5db",
                    backgroundColor: isSelected ? "#3b82f6" : "transparent",
                  }}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "14px",
                    fontWeight: isSelected ? 600 : 500,
                  }}
                >
                  {option}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
