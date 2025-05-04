
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { getInvoices, updateInvoice, deleteInvoice, Invoice } from '@/services/invoice';
import { AdminInvoiceTable } from '@/components/admin-invoice-table';
import { EditInvoiceDialog } from '@/components/edit-invoice-dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Remove AlertDialog imports as it's moved to the table component
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, AlertCircle, Trash2, Edit, LogOut, Home } from "lucide-react"; // Added LogOut, Home
import { AdminAuthGuard } from '@/components/admin-auth-guard'; // Import the guard
import { useAuth } from '@/context/auth-context'; // Import useAuth
import Link from 'next/link'; // Import Link

function AdminPageContent() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  // Removed deletingInvoiceId state

  const { toast } = useToast();
  const { logout } = useAuth(); // Get logout function
  const router = useRouter(); // Get router instance

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

  // This function is now called AFTER confirmation in the table component
  const handleDeleteConfirm = async (invoiceId: string) => {
    try {
      await deleteInvoice(invoiceId);
      setInvoices((prevInvoices) => prevInvoices.filter((inv) => inv.id !== invoiceId));
      toast({
        title: "Invoice Deleted",
        description: `Invoice (ID: ${invoiceId}) has been deleted.`,
      });
    } catch (err) {
      console.error('Error deleting invoice:', err);
      toast({
        title: "Error Deleting Invoice",
        description: "Could not delete the invoice. Please try again.",
        variant: "destructive",
      });
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

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    router.push('/login'); // Redirect to login page after logout
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
              onDeleteConfirm={handleDeleteConfirm} // Pass the confirmation handler
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

      {/* Delete Confirmation Dialog is now inside AdminInvoiceTable */}

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

