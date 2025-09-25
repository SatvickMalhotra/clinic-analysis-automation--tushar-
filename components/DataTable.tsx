import React, { useState, useMemo } from 'react';
import { PivotTable } from '../types';
import { SortIcon, SortAscIcon, SortDescIcon } from './icons';

interface DataTableProps {
    data: PivotTable;
}

type SortDirection = 'asc' | 'desc' | null;

const DataTable: React.FC<DataTableProps> = ({ data }) => {
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    const sortedData = useMemo(() => {
        if (!sortColumn || !sortDirection) {
            return data;
        }

        const dataToSort = [...data];
        const totalRow = dataToSort.pop(); // Assume last row is TOTAL

        dataToSort.sort((a, b) => {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            // Handle numeric sorting for 'Rows', 'Claim_Amount', 'Settled_Amount'
            if (['Rows', 'Claim_Amount', 'Settled_Amount'].includes(sortColumn)) {
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            }
            
            // Handle string sorting for other columns
            if (String(aValue).toLowerCase() < String(bValue).toLowerCase()) {
                return sortDirection === 'asc' ? -1 : 1;
            }
            if (String(aValue).toLowerCase() > String(bValue).toLowerCase()) {
                return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });

        if (totalRow) {
            dataToSort.push(totalRow);
        }
        return dataToSort;
    }, [data, sortColumn, sortDirection]);

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortColumn(column);
            setSortDirection('desc'); // Default to descending for new column
        }
    };
    
    if (!data || data.length === 0) {
        return <p className="text-center text-slate-500 py-4">No data to display.</p>;
    }

    const headers = Object.keys(data[0]);

    const formatValue = (value: any) => {
        if (typeof value === 'number') {
            return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
        }
        return value;
    };

    const SortIndicator = ({ column }: { column: string }) => {
        if (sortColumn !== column) return <SortIcon className="w-4 h-4 text-slate-400" />;
        if (sortDirection === 'asc') return <SortAscIcon className="w-4 h-4 text-primary" />;
        return <SortDescIcon className="w-4 h-4 text-primary" />;
    };

    return (
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg border border-slate-200 max-h-[400px]">
            <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                    <tr>
                        {headers.map(header => (
                            <th key={header} scope="col" className="py-3 px-6">
                                <button onClick={() => handleSort(header)} className="flex items-center gap-2 group">
                                    {header.replace(/_/g, ' ')}
                                    <SortIndicator column={header} />
                                </button>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((row, rowIndex) => (
                        <tr key={rowIndex} className={`border-b ${row[headers[0]] === 'TOTAL' ? 'bg-slate-200 font-bold' : 'bg-white hover:bg-slate-50'}`}>
                            {headers.map(header => (
                                <td key={`${rowIndex}-${header}`} className="py-4 px-6">
                                    {formatValue(row[header])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;