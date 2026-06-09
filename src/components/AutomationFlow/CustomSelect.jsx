import React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';

/**
 * Premium Dropdown Select Component that leverages the pre-existing Radix DropdownMenu UI component.
 * Uses a Radix React Portal under the hood, ensuring zero clipping or translate scaling issues in React Flow.
 */
export default function CustomSelect({ value, onChange, options, className = "" }) {
  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className={`relative w-full nodrag ${className}`}>
      <DropdownMenu>
        {/* Trigger Button */}
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between bg-slate-50 text-slate-850 dark:bg-slate-950/80 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer text-left"
          >
            <span className="truncate mr-2">{selectedOption?.label || "No fields available"}</span>
            <svg
              className="h-4 w-4 text-slate-500 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </DropdownMenuTrigger>

        {/* Floating Portal Menu Content */}
        <DropdownMenuContent 
          className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl p-1 z-[9999]"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-slate-400 dark:text-slate-500 select-none text-center">
              No fields available
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => onChange({ target: { value: opt.value } })}
                  className={`w-full text-left px-3 py-2.5 text-xs transition-colors flex items-center justify-between rounded-lg cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 text-blue-500 shrink-0 ml-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
