interface Props { value: string; onChange: (q: string) => void }

export function SearchBar({ value, onChange }: Props) {
  return (
    <input
      type="search"
      placeholder="Buscar moneda…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Buscar moneda"
    />
  )
}
