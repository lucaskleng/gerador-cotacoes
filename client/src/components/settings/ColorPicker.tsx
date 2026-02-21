import { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
}

export default function ColorPicker({ label, value, onChange, description }: ColorPickerProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleHexChange = (hex: string) => {
    setLocalValue(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange(hex);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground/80">{label}</Label>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="w-9 h-9 rounded-md border border-border shadow-sm cursor-pointer shrink-0 transition-shadow hover:shadow-md"
              style={{ backgroundColor: value }}
              title={`Cor: ${value}`}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <input
              ref={inputRef}
              type="color"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setLocalValue(e.target.value);
              }}
              className="w-48 h-32 cursor-pointer border-0 p-0"
            />
          </PopoverContent>
        </Popover>
        <Input
          value={localValue}
          onChange={(e) => handleHexChange(e.target.value)}
          onBlur={() => {
            if (!/^#[0-9A-Fa-f]{6}$/.test(localValue)) {
              setLocalValue(value);
            }
          }}
          className="w-28 font-mono text-xs h-9"
          placeholder="#000000"
        />
      </div>
      {description && (
        <p className="text-[11px] text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
