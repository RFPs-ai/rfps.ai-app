"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  allowCustomValue?: boolean;
  className?: string;
  isLoading?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  disabled = false,
  allowCustomValue = false,
  className,
  isLoading = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (selectedValue: string) => {
    onValueChange?.(selectedValue);
    setOpen(false);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && allowCustomValue && inputValue.trim()) {
      // Check if the input matches any existing option
      const matchedOption = options.find(
        (opt) =>
          opt.value.toLowerCase() === inputValue.toLowerCase() ||
          opt.label.toLowerCase() === inputValue.toLowerCase()
      );

      if (matchedOption) {
        handleSelect(matchedOption.value);
      } else {
        // Allow custom value
        handleSelect(inputValue.trim());
      }
    }
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[200px] overflow-hidden rounded-md border bg-popover p-0 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          align="start"
          sideOffset={4}
        >
          <CommandPrimitive className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandPrimitive.Input
                value={inputValue}
                onValueChange={setInputValue}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <CommandPrimitive.List className="max-h-[300px] overflow-y-auto overflow-x-hidden">
              {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <>
                  <CommandPrimitive.Empty className="py-6 text-center text-sm">
                    {emptyText}
                    {allowCustomValue && inputValue.trim() && (
                      <div className="mt-2">
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => handleSelect(inputValue.trim())}
                        >
                          Add &quot;{inputValue.trim()}&quot;
                        </button>
                      </div>
                    )}
                  </CommandPrimitive.Empty>
                  <CommandPrimitive.Group className="p-1">
                    {options.map((option) => (
                      <CommandPrimitive.Item
                        key={option.value}
                        value={`${option.value} ${option.label}`}
                        onSelect={() => handleSelect(option.value)}
                        className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === option.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate">{option.label}</span>
                      </CommandPrimitive.Item>
                    ))}
                  </CommandPrimitive.Group>
                </>
              )}
            </CommandPrimitive.List>
          </CommandPrimitive>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

// NAICS-specific combobox with search functionality
interface NAICSComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  codes: { code: string; description: string }[];
  searchCodes: (query: string) => { code: string; description: string }[];
  isLoading?: boolean;
}

export function NAICSCombobox({
  value,
  onValueChange,
  placeholder = "Search NAICS codes...",
  disabled = false,
  className,
  codes,
  searchCodes,
  isLoading = false,
}: NAICSComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const filteredCodes = React.useMemo(() => {
    return searchCodes(inputValue);
  }, [inputValue, searchCodes]);

  const selectedCode = codes.find((c) => c.code === value);

  const handleSelect = (selectedValue: string) => {
    onValueChange?.(selectedValue);
    setOpen(false);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      // Check if input is a valid NAICS code format (2-6 digits)
      const trimmed = inputValue.trim();
      if (/^\d{2,6}$/.test(trimmed)) {
        handleSelect(trimmed);
      }
    }
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <span className={cn("truncate", !selectedCode && "text-muted-foreground")}>
            {selectedCode
              ? `${selectedCode.code} - ${selectedCode.description}`
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[300px] overflow-hidden rounded-md border bg-popover p-0 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          align="start"
          sideOffset={4}
        >
          <CommandPrimitive
            className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground"
            shouldFilter={false}
          >
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type code or description..."
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
              {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Loading NAICS codes...
                </div>
              ) : filteredCodes.length === 0 ? (
                <div className="py-6 text-center text-sm">
                  No matching NAICS codes.
                  {inputValue.trim() && /^\d{2,6}$/.test(inputValue.trim()) && (
                    <div className="mt-2">
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => handleSelect(inputValue.trim())}
                      >
                        Add code &quot;{inputValue.trim()}&quot;
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-1">
                  {filteredCodes.map((code) => (
                    <div
                      key={code.code}
                      onClick={() => handleSelect(code.code)}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          value === code.code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">
                        <span className="font-mono font-medium">{code.code}</span>
                        <span className="mx-2 text-muted-foreground">-</span>
                        <span>{code.description}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CommandPrimitive>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
