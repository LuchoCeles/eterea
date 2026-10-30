export function ProductInputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number";
  placeholder?: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-2 text-xs font-semibold text-muted-foreground">
      {label}
      <input
        type={type}
        min={type === "number" ? 0 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm font-normal text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}
