
'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import type { Invoice } from '@/services/invoice';

interface InvoiceTableProps {
  invoices: Invoice[];
}

type SortKey = keyof Invoice;
type SortDirection = 'asc' | 'desc';

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedInvoices = useMemo(() => {
    const sorted = [...invoices].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

       if (valA === undefined || valB === undefined) return 0; // Handle potential undefined values


      if (typeof valA === 'number' && typeof valB === 'number') {
        return valA - valB;
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        // Handle dates specifically
        if (sortKey === 'date') {
           try {
               return new Date(valA).getTime() - new Date(valB).getTime();
           } catch (e) {
               return 0; // Fallback if date parsing fails
           }
        }
        // Default string comparison
        return valA.localeCompare(valB);
      }


      return 0; // Default case if types don't match or aren't comparable
    });

    return sortDirection === 'asc' ? sorted : sorted.reverse();
  }, [invoices, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 inline-block" />;
    }
    return sortDirection === 'asc' ?
        <ArrowUpDown className="ml-2 h-4 w-4 text-primary inline-block" data-testid="sort-asc"/> :
        <ArrowUpDown className="ml-2 h-4 w-4 text-primary transform rotate-180 inline-block" data-testid="sort-desc"/>;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

   // Format date string
   const formatDate = (dateString: string) => {
     try {
        // Handle potential invalid date strings more gracefully
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";
       return date.toLocaleDateString('en-US', {
         year: 'numeric',
         month: 'short',
         day: 'numeric',
       });
     } catch (e) {
       console.error("Error formatting date:", dateString, e);
       return "Invalid Date"; // Fallback for invalid date strings
     }
   };


  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Button variant="ghost" onClick={() => handleSort('ticketNumber')} className="px-0 hover:bg-transparent font-medium">
              Ticket Number
              {renderSortIcon('ticketNumber')}
            </Button>
          </TableHead>
          <TableHead>
             <Button variant="ghost" onClick={() => handleSort('bookingReference')} className="px-0 hover:bg-transparent font-medium">
                Booking Reference
               {renderSortIcon('bookingReference')}
             </Button>
          </TableHead>
          <TableHead>
             <Button variant="ghost" onClick={() => handleSort('agentId')} className="px-0 hover:bg-transparent font-medium">
               Agent ID
               {renderSortIcon('agentId')}
             </Button>
          </TableHead>
          <TableHead className="text-right">
             <Button variant="ghost" onClick={() => handleSort('amount')} className="px-0 hover:bg-transparent font-medium">
                Amount
               {renderSortIcon('amount')}
             </Button>
          </TableHead>
          <TableHead>
             <Button variant="ghost" onClick={() => handleSort('date')} className="px-0 hover:bg-transparent font-medium">
               Date
               {renderSortIcon('date')}
             </Button>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedInvoices.length > 0 ? (
          sortedInvoices.map((invoice) => (
            // Use invoice.id as key if available, otherwise fallback
            <TableRow key={invoice.id ?? invoice.ticketNumber} data-testid={`invoice-row-${invoice.id ?? invoice.ticketNumber}`}>
              <TableCell className="font-medium">{invoice.ticketNumber}</TableCell>
              <TableCell>{invoice.bookingReference}</TableCell>
              <TableCell>{invoice.agentId}</TableCell>
              <TableCell className="text-right">{formatCurrency(invoice.amount)}</TableCell>
              <TableCell>{formatDate(invoice.date)}</TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
              No invoices found matching your criteria.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
