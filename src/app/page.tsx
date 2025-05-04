
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link'; // Import Link
import { Invoice, getInvoices, saveInvoice } from '@/services/invoice'; // Import getInvoices
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
import { AlertCircle, ShieldCheck } from "lucide-react"; // Import ShieldCheck for Admin button
import { useToast } from "@/hooks/use-toast"; // Import useToast

// Remove initial mock data, will fetch from service
// const initialInvoices: Invoice[] = [ ... ];

export default function Home() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [agentIdFilter, setAgentIdFilter] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast(); // Initialize toast

  // Fetch data using the service function
   const fetchData = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedInvoices = await getInvoices();
        setInvoices(fetchedInvoices);
      } catch (err) {
        setError('Failed to load invoices. Please try again later.');
        console.error(err);
        toast({ // Add toast on fetch error
            title: "Error Loading Invoices",
            description: "Could not retrieve invoice data. Please refresh.",
            variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, [toast]); // Add toast dependency


  useEffect(() => {
    fetchData();
  }, [fetchData]); // Use fetchData in dependency array

 const handleAddInvoice = useCallback(async (newInvoiceData: Omit<Invoice, 'id'>) => {
    // No need for setIsSubmitting state here, InvoiceForm handles its own state
    try {
      // Call saveInvoice which now returns the saved invoice with an ID
      const savedInvoice = await saveInvoice(newInvoiceData);
      setInvoices((prevInvoices) => [...prevInvoices, savedInvoice]); // Add the invoice with ID
      toast({
        title: "Invoice Added",
        description: `Invoice ${savedInvoice.ticketNumber} saved successfully.`,
      });
      // The form reset is handled within InvoiceForm itself now
    } catch (error) {
      console.error('Error saving invoice:', error);
       toast({
         title: "Error Saving Invoice",
         description: "Failed to save the new invoice. Please try again.",
         variant: "destructive",
       });
    }
  }, [toast]); // Add toast dependency


  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const agentMatch = agentIdFilter ? invoice.agentId.toLowerCase().includes(agentIdFilter.toLowerCase()) : true;

      // Date filtering logic remains the same
      let dateMatch = true;
       if (dateRangeFilter?.from) {
         try {
           dateMatch = dateMatch && new Date(invoice.date) >= dateRangeFilter.from;
         } catch (e) { /* Ignore invalid dates for filtering */ }
       }
       if (dateRangeFilter?.to) {
         try {
           // Adjust 'to' date to include the whole day
           const toDate = new Date(dateRangeFilter.to);
           toDate.setHours(23, 59, 59, 999);
           dateMatch = dateMatch && new Date(invoice.date) <= toDate;
         } catch (e) { /* Ignore invalid dates for filtering */ }
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
       {/* Admin Button - Positioned Top Right - Links to Login Page */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8">
        <Link href="/login" passHref> {/* Updated href to /login */}
          <Button variant="outline">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Admin Login
          </Button>
        </Link>
      </div>

      <header className="text-center pt-10"> {/* Add padding top to avoid overlap with button */}
        <h1 className="text-3xl font-bold text-primary">InvoicePilot</h1>
        <p className="text-muted-foreground">Streamlining your travel agency's invoice management.</p>
      </header>

       {/* Pass the correct handler */}
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

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
             <Alert variant="destructive">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>{error}</AlertDescription>
             </Alert>
          ) : (
            // Pass invoices (potentially with IDs) to the table
            <InvoiceTable invoices={filteredInvoices} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

