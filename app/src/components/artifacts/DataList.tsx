'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataListConfig } from '@/types/artifact';

interface DataListProps {
  config: DataListConfig;
}

export default function DataList({ config }: DataListProps) {
  const { title, items, fields, emptyMessage = 'No items yet' } = config;

  // Format field names for display (e.g., "created_at" -> "Created At")
  const formatFieldName = (field: string) => {
    return field
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format cell value for display
  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-foreground/60 text-sm">
            {emptyMessage}
          </div>
        ) : (
          <div className="rounded-md border border-accent-beige">
            <Table>
              <TableHeader>
                <TableRow>
                  {fields.map((field) => (
                    <TableHead key={field} className="text-xs font-medium">
                      {formatFieldName(field)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    {fields.map((field) => (
                      <TableCell key={field} className="text-sm">
                        {formatCellValue(item[field])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

