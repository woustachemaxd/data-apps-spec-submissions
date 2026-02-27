import { useState } from "react";

export default function GlobalFilters({ onChange }: any) {
  const [days, setDays] = useState(30);

  return (
    <div className="flex gap-4 items-center">
      <span className="text-sm text-muted-foreground">
        Time Range:
      </span>

      {[7, 30, 90].map((d) => (
        <button
          key={d}
          onClick={() => {
            setDays(d);
            onChange(d);
          }}
          className={`px-3 py-1 rounded-lg border
          ${days === d ? "bg-primary text-white" : ""}
        `}
        >
          {d} Days
        </button>
      ))}
    </div>
  );
}