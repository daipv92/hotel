interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (item: T) => string;
}

export function Table<T>({ columns, data, rowKey }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 font-medium text-slate-600"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-slate-400"
              >
                Khong co du lieu
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={rowKey(item)} className="hover:bg-slate-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-slate-700">
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
