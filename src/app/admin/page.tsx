
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Import React Query hooks
import { getInvoices, updateInvoice, deleteInvoice, Invoice } from '@/services/invoice';
import { AdminInvoiceTable } from '@/components/admin-invoice-table';
import { EditInvoiceDialog } from '@/components/edit-invoice-dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, AlertCircle, Trash2, Edit, LogOut, Home } from "lucide-react";
import { AdminAuthGuard } from '@/components/admin-auth-guard';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

const ADMIN_INVOICE_QUERY_KEY = 'adminInvoices'; // Define a query key for admin invoices

function AdminPageContent() {
  // Removed local state for invoices, isLoading, error - managed by React Query
  const [filter, setFilter] = useState<string>('');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);

  const { toast } = useToast();
  const { logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient(); // Get query client instance

  // Fetch data using React Query
  const { data: invoices = [], isLoading, error: queryError } = useQuery<Invoice[], Error>({
      queryKey: [ADMIN_INVOICE_QUERY_KEY], // Use a specific key for admin if needed, or reuse 'invoices'
      queryFn: getInvoices,
  });

  // Mutation for updating an invoice
  const updateInvoiceMutation = useMutation({
      mutationFn: updateInvoice,
      onSuccess: (_, updatedInvoice) => { // First arg is void based on service, second is the input
          // Invalidate and refetch the invoices query
          queryClient.invalidateQueries({ queryKey: [ADMIN_INVOICE_QUERY_KEY] });
          toast({
              title: "Invoice Updated",
              description: `Invoice ${updatedInvoice.ticketNumber} updated successfully.`,
          });
          setIsEditDialogOpen(false); // Close the dialog on success
          setEditingInvoice(null);
      },
      onError: (error, updatedInvoice) => {
          console.error('Error updating invoice:', error);
          toast({
              title: "Error Updating Invoice",
              description: "Could not update the invoice. Please try again.",
              variant: "destructive",
          });
          // Keep dialog open on error
      },
  });

  // Mutation for deleting an invoice
  const deleteInvoiceMutation = useMutation({
      mutationFn: deleteInvoice,
      onSuccess: (_, invoiceId) => { // First arg is void, second is invoiceId
          // Invalidate and refetch the invoices query
          queryClient.invalidateQueries({ queryKey: [ADMIN_INVOICE_QUERY_KEY] });
          toast({
              title: "Invoice Deleted",
              description: `Invoice (ID: ${invoiceId}) has been deleted.`,
          });
      },
      onError: (error, invoiceId) => {
          console.error('Error deleting invoice:', error);
          toast({
              title: "Error Deleting Invoice",
              description: "Could not delete the invoice. Please try again.",
              variant: "destructive",
          });
      },
  });


  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsEditDialogOpen(true);
  };

  // Trigger the delete mutation
  const handleDeleteConfirm = async (invoiceId: string) => {
    deleteInvoiceMutation.mutate(invoiceId);
  };

  // Trigger the update mutation
  const handleUpdate = async (updatedInvoice: Invoice) => {
    if (!updatedInvoice.id) return;
    updateInvoiceMutation.mutate(updatedInvoice);
  };

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    router.push('/login');
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const searchTerm = filter.toLowerCase();
      return (
        invoice.ticketNumber.toLowerCase().includes(searchTerm) ||
        invoice.bookingReference.toLowerCase().includes(searchTerm) ||
        invoice.agentId.toLowerCase().includes(searchTerm) ||
        invoice.amount.toString().includes(searchTerm) ||
        invoice.date.includes(searchTerm)
      );
    });
  }, [invoices, filter]);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header className="flex justify-between items-center mb-8">
        <div className="text-center flex-grow">
           <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
           <p className="text-muted-foreground">Manage all travel agency invoices.</p>
        </div>
         <div className="flex space-x-2">
             <Link href="/" passHref>
               <Button variant="outline">
                 <Home className="mr-2 h-4 w-4" />
                 Home
               </Button>
             </Link>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label htmlFor="filterInput">Filter Invoices</Label>
            <Input
              id="filterInput"
              placeholder="Search by Ticket No, Booking Ref, Agent ID, Amount, or Date..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="mt-1"
            />
          </div>

          {isLoading ? ( // Use isLoading from React Query
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : queryError ? ( // Use error from React Query
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Data</AlertTitle>
              <AlertDescription>{queryError.message || 'Failed to load invoices.'}</AlertDescription>
            </Alert>
          ) : (
            <AdminInvoiceTable
              invoices={filteredInvoices}
              onEdit={handleEdit}
              onDeleteConfirm={handleDeleteConfirm}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog - Pass the handleUpdate mutation trigger */}
      <EditInvoiceDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        invoice={editingInvoice}
        onSave={handleUpdate} // Pass the mutation trigger function
      />

    </div>
  );
}


// Export the main component wrapped in the guard
export default function AdminPage() {
  return (
     <AdminAuthGuard>
        <AdminPageContent />
      </AdminAuthGuard>
  );
}
