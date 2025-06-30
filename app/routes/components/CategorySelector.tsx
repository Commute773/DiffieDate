import { CATEGORIES } from "./IdentityPanel";

export function CategorySelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-6">
      <label className="mr-2 font-semibold" htmlFor="category">
        Like Category:
      </label>
      <select
        id="category"
        className="border px-2 py-1 rounded bg-white dark:bg-gray-950"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
