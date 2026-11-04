interface DocumentTypeBarProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}

const TIPOS = [
  { code: 'CC', label: 'Cédula de Ciudadanía' },
  { code: 'TI', label: 'Tarjeta de Identidad' },
  { code: 'CE', label: 'Cédula de Extranjería' },
] as const;

export default function DocumentTypeBar({ value, onChange, disabled, id }: DocumentTypeBarProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-required
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white [&:focus-visible]:outline-none [&:focus-visible]:ring-2 [&:focus-visible]:ring-offset-1"
    >
      {TIPOS.map((tipo) => (
        <option key={tipo.code} value={tipo.code}>
          {tipo.label}
        </option>
      ))}
    </select>
  );
}
