
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose, // Import DialogClose
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import type { Invoice } from '@/services/invoice';

// Schema for validation within the edit form
const editInvoiceFormSchema = z.object({
  id: z.string().optional(), // Keep ID for update reference
  ticketNumber: z.string().min(1, { message: 'Ticket number is required' }),
  bookingReference: z.string().min(1, { message: 'Booking reference is required' }),
  agentId: z.string().min(1, { message: 'Agent ID is required' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive' }),
  date: z.date({ required_error: 'Date is required' }),
});

type EditInvoiceFormValues = z.infer<typeof editInvoiceFormSchema>;

interface EditInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onSave: (invoice: Invoice) => Promise<void>; // Make onSave async
}

export function EditInvoiceDialog({ isOpen, onOpenChange, invoice, onSave }: EditInvoiceDialogProps) {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<EditInvoiceFormValues>({
    resolver: zodResolver(editInvoiceFormSchema),
    defaultValues: { // Set default values to avoid uncontrolled component warnings
      id: '',
      ticketNumber: '',
      bookingReference: '',
      agentId: '',
      amount: 0,
      date: undefined,
    },
  });

  // Reset form when the invoice prop changes or the dialog opens
  useEffect(() => {
    if (isOpen && invoice) {
        try {
            // Parse the date string (YYYY-MM-DD) into a Date object
            const parsedDate = parse(invoice.date, 'yyyy-MM-dd', new Date());
             if (isNaN(parsedDate.getTime())) {
                 console.error("Invalid date string received:", invoice.date);
                 // Handle invalid date - maybe clear it or show an error
                 form.reset({
                     ...invoice,
                     date: undefined, // Reset date if invalid
                 });
             } else {
                 form.reset({
                     ...invoice,
                     date: parsedDate,
                 });
             }
        } catch (error) {
             console.error("Error parsing date for form reset:", error);
             form.reset({
                 ...invoice,
                 date: undefined, // Reset date on parsing error
             });
        }

    } else if (!isOpen) {
      // Optionally reset when dialog closes if desired
      // form.reset({ ticketNumber: '', bookingReference: '', agentId: '', amount: 0, date: undefined, id: '' });
    }
  }, [invoice, isOpen, form]);

  const handleSaveChanges = async (values: EditInvoiceFormValues) => {
    setIsSaving(true);
    try {
        if (!values.id) { // Should always have an ID when editing
            throw new Error("Invoice ID is missing for update.");
        }
      const updatedInvoiceData: Invoice = {
        ...values,
        id: values.id, // Ensure ID is included
        date: format(values.date, 'yyyy-MM-dd'), // Format date back to string
      };
      await onSave(updatedInvoiceData); // Call the async onSave
      // Dialog closing is handled by the parent component upon successful save
    } catch (error) {
      console.error('Failed to save changes:', error);
      // Error toast is handled by the parent component
    } finally {
      setIsSaving(false);
    }
  };

  // Handle dialog open state changes, especially closing via overlay or X button
  const handleOpenChange = (open: boolean) => {
      if (!open) {
          // Reset form state if dialog is closed without saving
           form.reset({ ticketNumber: '', bookingReference: '', agentId: '', amount: 0, date: undefined, id: '' });
      }
      onOpenChange(open); // Propagate change to parent
  }


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
          <DialogDescription>
            Make changes to the invoice details below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSaveChanges)} className="space-y-4 py-4">
            {/* Keep ID but hide it or make it read-only if necessary */}
            {/* <FormField control={form.control} name="id" render={({ field }) => <Input type="hidden" {...field} />} /> */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ticketNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticket Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., TK123456" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bookingReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking Reference</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., BKREF789" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., AGENT007" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 199.99" {...field} disabled={isSaving} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-2"> {/* Alignment */}
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                            disabled={isSaving}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01') || isSaving
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <DialogFooter>
               <DialogClose asChild>
                 <Button type="button" variant="outline" disabled={isSaving}>
                   Cancel
                 </Button>
               </DialogClose>
               <Button type="submit" disabled={isSaving}>
                 {isSaving ? (
                   <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     Saving...
                   </>
                 ) : (
                   'Save Changes'
                 )}
               </Button>
             </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
