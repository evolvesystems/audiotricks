/**
 * Modern Table Component
 * Elegant table design with proper spacing and hover effects
 */

import React from 'react';

interface Column {
  key: string;
  header: string;
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
}

interface ModernTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ComponentType<{ className?: string }>;
}

export default function ModernTable({ 
  columns, 
  data, 
  loading = false, 
  emptyMessage = "No data available",
  emptyIcon: EmptyIcon
}: ModernTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-900/5">
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-900/5">
        <div className="flex flex-col items-center justify-center py-20">
          {EmptyIcon && <EmptyIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />}
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-900/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || ''}`}
                  >
                    {column.render 
                      ? column.render(row[column.key], row)
                      : row[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}