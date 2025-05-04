'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Invoice } from '@/services/invoice';
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
import { AlertCircle } from "lucide-react";

// Mock initial invoices data. Replace with API call in useEffect.
const initialInvoices: Invoice[] = [
  { ticketNumber: 'T123', bookingReference: 'B456', agentId: 'A001', amount: 150.75, date: '2024-07-01' },
  { ticketNumber: 'T124', bookingReference: 'B457', agentId: 'A002', amount: 230.00, date: '2024-07-05' },
  { ticketNumber: 'T125', bookingReference: 'B458', agentId: 'A001', amount: 99.99, date: '2024-07-10' },
];

export default function Home() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [agentIdFilter, setAgentIdFilter] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate fetching data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Replace with actual API call to fetch invoices
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        setInvoices(initialInvoices);
      } catch (err) {
        setError('Failed to load invoices. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddInvoice = (newInvoice: Invoice) => {
    setInvoices((prevInvoices) => [...prevInvoices, newInvoice]);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const agentMatch = agentIdFilter ? invoice.agentId.toLowerCase().includes(agentIdFilter.toLowerCase()) : true;
      let dateMatch = true;
      if (dateRangeFilter?.from) {
        dateMatch = dateMatch && new Date(invoice.date) >= dateRangeFilter.from;
      }
      if (dateRangeFilter?.to) {
        dateMatch = dateMatch && new Date(invoice.date) <= dateRangeFilter.to;
      }
      return agentMatch && dateMatch;
    });
  }, [invoices, agentIdFilter, dateRangeFilter]);

  const handleClearFilters = () => {
    setAgentIdFilter('');
    setDateRangeFilter(undefined);
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-primary">InvoicePilot</h1>
        <p className="text-muted-foreground">Streamlining your travel agency's invoice management.</p>
      </header>

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
            <InvoiceTable invoices={filteredInvoices} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
