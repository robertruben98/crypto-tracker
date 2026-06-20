interface Props { value: string; onChange: (q: string) => void }

export function SearchBar({ value, onChange }: Props) {
  return (
    <input
      type="search"
      placeholder="Search coin…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Search coin"
    />
  )
}
