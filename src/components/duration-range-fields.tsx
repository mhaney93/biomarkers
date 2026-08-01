import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { splitMinutes } from "@/lib/duration";

export function DurationRangeFields({ idPrefix, defaultMinutes }: { idPrefix: string; defaultMinutes?: number | null }) {
  const { hours, minutes } =
    defaultMinutes != null ? splitMinutes(defaultMinutes) : { hours: "", minutes: "" };

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}Hours`}>Hours</Label>
        <Input
          id={`${idPrefix}Hours`}
          name={`${idPrefix}Hours`}
          type="number"
          step="1"
          min="0"
          defaultValue={hours}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}Minutes`}>Minutes</Label>
        <Input
          id={`${idPrefix}Minutes`}
          name={`${idPrefix}Minutes`}
          type="number"
          step="1"
          min="0"
          max="59"
          defaultValue={minutes}
        />
      </div>
    </div>
  );
}
