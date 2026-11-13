import { runQuery } from "@/lib/db";

// Reads the analytics tables and their columns, so the model always sees the real schema.
export async function getSchemaDescription(): Promise<string> {
  const rows = await runQuery<{
    table_name: string;
    column_name: string;
    data_type: string;
  }>(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'analytics'
    ORDER BY table_name, ordinal_position`);

  const tables = new Map<string, string[]>();
  for (const row of rows) {
    const columns = tables.get(row.table_name) ?? [];
    columns.push(`${row.column_name} ${row.data_type}`);
    tables.set(row.table_name, columns);
  }

  return Array.from(tables.entries())
    .map(([name, columns]) => `analytics.${name} (\n  ${columns.join(",\n  ")}\n)`)
    .join("\n\n");
}