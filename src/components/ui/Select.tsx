import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = "", id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s/g, "-");
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
            focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
            disabled:cursor-not-allowed disabled:bg-slate-50
            ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
            ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
