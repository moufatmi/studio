
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getInvoices, updateInvoice, deleteInvoice, Invoice } from '@/services/invoice';
import { AdminInvoiceTable } from '@/components/admin-invoice-table';
import { EditInvoiceDialog } from '@/components/edit-invoice-dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, AlertCircle, Trash2, Edit } from "lucide-react";

export default function AdminPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInvoices();
      setInvoices(data);
    } catch (err) {
      setError('Failed to load invoices. Please try again later.');
      console.error(err);
       toast({
         title: "Error",
         description: "Failed to load invoices.",
         variant: "destructive",
       });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsEditDialogOpen(true);
  };

  const handleDeleteRequest = (invoiceId: string) => {
    setDeletingInvoiceId(invoiceId);
    // The AlertDialog will be triggered by the button click in the table
  };

  const confirmDelete = async () => {
    if (!deletingInvoiceId) return;

    try {
      await deleteInvoice(deletingInvoiceId);
      setInvoices((prevInvoices) => prevInvoices.filter((inv) => inv.id !== deletingInvoiceId));
      toast({
        title: "Invoice Deleted",
        description: `Invoice (ID: ${deletingInvoiceId}) has been deleted.`,
      });
    } catch (err) {
      console.error('Error deleting invoice:', err);
      toast({
        title: "Error Deleting Invoice",
        description: "Could not delete the invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingInvoiceId(null); // Close the confirmation dialog implicitly
    }
  };

  const handleUpdate = async (updatedInvoice: Invoice) => {
    if (!updatedInvoice.id) return; // Should have ID for update

    try {
      await updateInvoice(updatedInvoice);
      setInvoices((prevInvoices) =>
        prevInvoices.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv))
      );
      toast({
        title: "Invoice Updated",
        description: `Invoice ${updatedInvoice.ticketNumber} updated successfully.`,
      });
      setIsEditDialogOpen(false); // Close the dialog on success
      setEditingInvoice(null);
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: "Error Updating Invoice",
        description: "Could not update the invoice. Please try again.",
        variant: "destructive",
      });
      // Keep dialog open on error
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const searchTerm = filter.toLowerCase();
    return (
      invoice.ticketNumber.toLowerCase().includes(searchTerm) ||
      invoice.bookingReference.toLowerCase().includes(searchTerm) ||
      invoice.agentId.toLowerCase().includes(searchTerm) ||
      invoice.amount.toString().includes(searchTerm) ||
      invoice.date.includes(searchTerm)
    );
  });

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage all travel agency invoices.</p>
      </header>

       {/* Add New Invoice (Optional for Admin page, could redirect or open modal) */}
       {/* <Button onClick={() => console.log("Navigate to add page or open modal")}>
        <PlusCircle className="mr-2" /> Add New Invoice
       </Button> */}

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

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Data</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <AdminInvoiceTable
              invoices={filteredInvoices}
              onEdit={handleEdit}
              onDeleteRequest={handleDeleteRequest}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditInvoiceDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        invoice={editingInvoice}
        onSave={handleUpdate}
      />

      {/* Delete Confirmation Dialog (Managed by AlertDialogTrigger in the table) */}
       <AlertDialog open={!!deletingInvoiceId} onOpenChange={(open) => !open && setDeletingInvoiceId(null)}>
            {/* Trigger is inside AdminInvoiceTable */}
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the invoice
                    (ID: {deletingInvoiceId}) and remove its data.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeletingInvoiceId(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className={/* Using default destructive styling via theme */ ""}>
                    Yes, delete invoice
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </div>
  );
}
