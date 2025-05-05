
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Import React Query hooks
import { Invoice, getInvoices, saveInvoice } from '@/services/invoice';
import { InvoiceForm } from '@/components/invoice-form';
import { InvoiceTable } from '@/components/invoice-table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePickerWithRange } from '@/components/date-picker-range';
import type { DateRange } from 'react-day-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const INVOICE_QUERY_KEY = 'invoices'; // Define a query key for invoices

export default function Home() {
  // Removed local state for invoices, isLoading, error - managed by React Query
  const [agentIdFilter, setAgentIdFilter] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);
  const { toast } = useToast();
  const queryClient = useQueryClient(); // Get query client instance

  // Fetch data using React Query
  const { data: invoices = [], isLoading, error: queryError } = useQuery<Invoice[], Error>({
      queryKey: [INVOICE_QUERY_KEY],
      queryFn: getInvoices, // Use the service function directly
  });

  // Mutation for adding an invoice
  const addInvoiceMutation = useMutation({
      mutationFn: saveInvoice,
      onSuccess: (savedInvoice) => {
          // Invalidate and refetch the invoices query to show the new data
          queryClient.invalidateQueries({ queryKey: [INVOICE_QUERY_KEY] });
          toast({
            title: "Invoice Added",
            description: `Invoice ${savedInvoice.ticketNumber} saved successfully.`,
          });
          // Form reset is handled within InvoiceForm
      },
      onError: (error) => {
           console.error('Error saving invoice:', error);
           toast({
             title: "Error Saving Invoice",
             description: "Failed to save the new invoice. Please try again.",
             variant: "destructive",
           });
      }
  });


  // Use the mutation in the handler
  const handleAddInvoice = useCallback(async (newInvoiceData: Omit<Invoice, 'id'>) => {
      addInvoiceMutation.mutate(newInvoiceData);
  }, [addInvoiceMutation]);


  const filteredInvoices = useMemo(() => {
    // Filter logic remains the same, using data from React Query
    return invoices.filter((invoice) => {
      const agentMatch = agentIdFilter ? invoice.agentId.toLowerCase().includes(agentIdFilter.toLowerCase()) : true;

      let dateMatch = true;
      if (dateRangeFilter?.from) {
        try {
          // Assuming invoice.date is 'YYYY-MM-DD'
          // Create date objects at midnight UTC to avoid timezone issues in comparison
          const fromDate = new Date(dateRangeFilter.from.setUTCHours(0, 0, 0, 0));
          const invoiceDate = new Date(new Date(invoice.date).setUTCHours(0, 0, 0, 0));
          dateMatch = dateMatch && invoiceDate >= fromDate;
        } catch (e) { /* Ignore invalid dates */ }
      }
      if (dateRangeFilter?.to) {
        try {
          const toDate = new Date(dateRangeFilter.to.setUTCHours(23, 59, 59, 999)); // Include whole 'to' day
          const invoiceDate = new Date(new Date(invoice.date).setUTCHours(0, 0, 0, 0));
          dateMatch = dateMatch && invoiceDate <= toDate;
        } catch (e) { /* Ignore invalid dates */ }
      }

      return agentMatch && dateMatch;
    });
  }, [invoices, agentIdFilter, dateRangeFilter]);

  const handleClearFilters = () => {
    setAgentIdFilter('');
    setDateRangeFilter(undefined);
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 relative">
       <div className="absolute top-4 right-4 md:top-8 md:right-8">
        <Link href="/login" passHref>
          <Button variant="outline">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Admin Login
          </Button>
        </Link>
      </div>

      <header className="text-center pt-10">
        <h1 className="text-3xl font-bold text-primary">InvoicePilot</h1>
        <p className="text-muted-foreground">Streamlining your travel agency's invoice management.</p>
      </header>

      {/* Pass the correct handler, form handles its own loading state */}
      <InvoiceForm onAddInvoice={handleAddInvoice} />

      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="agentIdFilter">Filter by Agent ID</Label>
              <Input
                id="agentIdFilter"
                placeholder="Enter Agent ID"
                value={agentIdFilter}
                onChange={(e) => setAgentIdFilter(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Filter by Date Range</Label>
              <DatePickerWithRange
                date={dateRangeFilter}
                onDateChange={setDateRangeFilter}
                className="mt-1"
              />
            </div>
             <Button variant="outline" onClick={handleClearFilters} className="w-full md:w-auto">
                Clear Filters
              </Button>
          </div>

          {isLoading ? ( // Use isLoading from React Query
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : queryError ? ( // Use error from React Query
             <Alert variant="destructive">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               {/* Display the actual error message */}
               <AlertDescription>{queryError.message || 'Failed to load invoices.'}</AlertDescription>
             </Alert>
          ) : (
            <InvoiceTable invoices={filteredInvoices} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

