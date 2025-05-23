
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"; // Removed AlertDialogTrigger import
import { ArrowUpDown, Edit, Trash2 } from 'lucide-react';
import type { Invoice } from '@/services/invoice';
import { cn } from "@/lib/utils"; // For conditional classes

interface AdminInvoiceTableProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onDeleteConfirm: (invoiceId: string) => void; // Changed to confirm deletion
}

type SortKey = keyof Invoice | 'actions'; // Allow sorting by 'actions' (though it won't do anything)
type SortDirection = 'asc' | 'desc';

export function AdminInvoiceTable({ invoices, onEdit, onDeleteConfirm }: AdminInvoiceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null); // State to hold invoice being confirmed for delete

  const sortedInvoices = useMemo(() => {
     if (sortKey === 'actions') return invoices; // Don't sort by actions column

    const sorted = [...invoices].sort((a, b) => {
      const valA = a[sortKey as keyof Invoice]; // Cast as keyof Invoice since 'actions' is handled
      const valB = b[sortKey as keyof Invoice];

      if (valA === undefined || valB === undefined) return 0; // Handle potential undefined values

      if (typeof valA === 'number' && typeof valB === 'number') {
        return valA - valB;
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        // Handle dates specifically
        if (sortKey === 'date') {
           try {
             // Ensure consistent date comparison
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
     if (key === 'actions') return; // Don't allow sorting actions column

    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

 const renderSortIcon = (key: SortKey) => {
     if (key === 'actions') return null; // No sort icon for actions

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
       return "Invalid Date";
     }
   };

   // This function sets the state to open the dialog
   const handleDeleteRequest = (invoice: Invoice) => {
       setInvoiceToDelete(invoice);
   }

   // This function confirms the deletion and closes the dialog
   const handleConfirmDeleteAction = () => {
       if (invoiceToDelete && invoiceToDelete.id) {
           onDeleteConfirm(invoiceToDelete.id);
       }
       setInvoiceToDelete(null); // Close dialog
   }

   // This function closes the dialog without deleting
   const handleCancelDelete = () => {
       setInvoiceToDelete(null); // Close dialog
   }


  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
             {/* Make table heads clickable buttons for sorting */}
             <TableHead>
               <Button variant="ghost" onClick={() => handleSort('ticketNumber')} className="px-0 hover:bg-transparent font-medium">
                 Ticket Number {renderSortIcon('ticketNumber')}
               </Button>
             </TableHead>
             <TableHead>
               <Button variant="ghost" onClick={() => handleSort('bookingReference')} className="px-0 hover:bg-transparent font-medium">
                 Booking Ref {renderSortIcon('bookingReference')}
               </Button>
             </TableHead>
             <TableHead>
               <Button variant="ghost" onClick={() => handleSort('agentId')} className="px-0 hover:bg-transparent font-medium">
                 Agent ID {renderSortIcon('agentId')}
               </Button>
             </TableHead>
             <TableHead className="text-right">
               <Button variant="ghost" onClick={() => handleSort('amount')} className="px-0 hover:bg-transparent font-medium">
                 Amount {renderSortIcon('amount')}
               </Button>
             </TableHead>
             <TableHead>
               <Button variant="ghost" onClick={() => handleSort('date')} className="px-0 hover:bg-transparent font-medium">
                 Date {renderSortIcon('date')}
               </Button>
             </TableHead>
            <TableHead className="text-right font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedInvoices.length > 0 ? (
            sortedInvoices.map((invoice) => (
              <TableRow key={invoice.id ?? invoice.ticketNumber} data-testid={`invoice-row-${invoice.id}`}>
                <TableCell className="font-medium">{invoice.ticketNumber}</TableCell>
                <TableCell>{invoice.bookingReference}</TableCell>
                <TableCell>{invoice.agentId}</TableCell>
                <TableCell className="text-right">{formatCurrency(invoice.amount)}</TableCell>
                <TableCell>{formatDate(invoice.date)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(invoice)}
                    aria-label={`Edit invoice ${invoice.ticketNumber}`}
                    data-testid={`edit-button-${invoice.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                   {/* Removed AlertDialogTrigger wrapper */}
                   {/* The onClick handler now directly triggers the state change to open the dialog */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteRequest(invoice)} // Set the invoice to be deleted, opening the dialog via state
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    aria-label={`Delete invoice ${invoice.ticketNumber}`}
                    data-testid={`delete-button-${invoice.id}`}
                    disabled={!invoice.id} // Disable if no ID
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {/* Removed closing </AlertDialogTrigger> */}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No invoices found matching your criteria.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog (Remains the same, controlled by invoiceToDelete state) */}
       <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => !open && handleCancelDelete()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the invoice
                    with Ticket Number: {invoiceToDelete?.ticketNumber} (ID: {invoiceToDelete?.id}) and remove its data.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDeleteAction} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    Yes, delete invoice
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}

