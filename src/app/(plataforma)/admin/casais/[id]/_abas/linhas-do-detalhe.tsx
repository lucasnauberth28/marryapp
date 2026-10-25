export function LinhasDoDetalhe({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-[170px_1fr]">
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-subgrid gap-1 sm:col-span-2 sm:items-baseline">
          <dt className="text-tinta-suave">{item.label}</dt>
          <dd className="min-w-0 break-words text-tinta">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
