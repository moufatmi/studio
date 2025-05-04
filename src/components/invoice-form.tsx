'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, Loader2, Wand2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Invoice } from '@/services/invoice';
import { saveInvoice } from '@/services/invoice'; // Assuming saveInvoice exists and works
import { smartInvoiceReader } from '@/ai/flows/smart-invoice-reader';
import { useToast } from "@/hooks/use-toast";

const invoiceFormSchema = z.object({
  ticketNumber: z.string().min(1, { message: 'Ticket number is required' }),
  bookingReference: z.string().min(1, { message: 'Booking reference is required' }),
  agentId: z.string().min(1, { message: 'Agent ID is required' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive' }),
  date: z.date({ required_error: 'Date is required' }),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  onAddInvoice: (invoice: Invoice) => void;
}

export function InvoiceForm({ onAddInvoice }: InvoiceFormProps) {
  const { toast } = useToast();
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      ticketNumber: '',
      bookingReference: '',
      agentId: '',
      amount: 0,
      date: undefined,
    },
  });

  const handleManualSubmit = async (values: InvoiceFormValues) => {
    setIsSubmittingManual(true);
    try {
      const invoiceData: Invoice = {
        ...values,
        date: format(values.date, 'yyyy-MM-dd'),
      };
      await saveInvoice(invoiceData); // Call the save function
      onAddInvoice(invoiceData); // Update the local state
      toast({
        title: "Invoice Added",
        description: `Invoice ${invoiceData.ticketNumber} saved successfully.`,
      });
      form.reset(); // Reset form after successful submission
    } catch (error) {
      console.error('Error saving invoice:', error);
       toast({
         title: "Error",
         description: "Failed to save invoice. Please try again.",
         variant: "destructive",
       });
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      handleSmartExtraction(file);
    } else {
      setFileName(null);
    }
  };

  const handleSmartExtraction = async (file: File) => {
     if (!file) return;
     setIsExtracting(true);
     setFileName(file.name); // Show filename while processing

     try {
       const reader = new FileReader();
       reader.readAsDataURL(file);
       reader.onloadend = async () => {
         const base64data = reader.result as string;

         try {
           const extractedData = await smartInvoiceReader({ invoiceDataUri: base64data });

           // Populate form fields with extracted data
           form.setValue('ticketNumber', extractedData.ticketNumber);
           form.setValue('bookingReference', extractedData.bookingReference);
           form.setValue('agentId', extractedData.agentId);
           form.setValue('amount', extractedData.amount);
           // Attempt to parse the date string from AI - needs robust handling
           try {
             const parsedDate = new Date(extractedData.date);
              if (!isNaN(parsedDate.getTime())) {
                  form.setValue('date', parsedDate);
              } else {
                  console.warn("AI returned an invalid date format:", extractedData.date);
                   toast({
                     title: "Warning",
                     description: "Could not parse the date from the invoice. Please select manually.",
                     variant: "default", // Use default variant for warnings
                   });
                   form.setValue('date', undefined); // Clear date if invalid
              }
           } catch (dateError) {
              console.error("Error parsing date:", dateError);
               toast({
                 title: "Warning",
                 description: "Error processing the date from the invoice. Please select manually.",
                 variant: "default",
               });
               form.setValue('date', undefined); // Clear date on error
           }


           toast({
             title: "Extraction Successful",
             description: "Invoice data extracted. Please review and submit.",
           });
         } catch (aiError) {
           console.error('Error during AI extraction:', aiError);
           toast({
             title: "Extraction Failed",
             description: "Could not extract data from the file. Please enter manually.",
             variant: "destructive",
           });
           form.reset(); // Reset form on extraction failure
           setFileName(null); // Clear filename on failure
         } finally {
           setIsExtracting(false);
           // Clear the file input value so the same file can be selected again if needed
           if (fileInputRef.current) {
             fileInputRef.current.value = '';
           }
         }
       };
       reader.onerror = (error) => {
         console.error('Error reading file:', error);
         toast({
           title: "File Read Error",
           description: "Could not read the selected file.",
           variant: "destructive",
         });
         setIsExtracting(false);
         setFileName(null); // Clear filename on failure
         if (fileInputRef.current) {
             fileInputRef.current.value = '';
         }
       };
     } catch (error) {
       console.error('Error setting up file reader:', error);
       toast({
         title: "Error",
         description: "An unexpected error occurred.",
         variant: "destructive",
       });
       setIsExtracting(false);
        setFileName(null); // Clear filename on failure
       if (fileInputRef.current) {
           fileInputRef.current.value = '';
       }
     }
   };


  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Add New Invoice</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleManualSubmit)}>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 p-4 border rounded-lg bg-secondary/30">
                <div className='flex-grow'>
                    <Label htmlFor="invoice-upload" className="text-base font-medium text-primary flex items-center gap-2">
                      <Wand2 className="h-5 w-5" />
                      Smart Invoice Reader
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload an invoice image or PDF to automatically fill the form.
                      {fileName && !isExtracting && <span className="ml-2 font-medium text-foreground">Selected: {fileName}</span>}
                      {isExtracting && <span className="ml-2 font-medium text-foreground flex items-center gap-1"><Loader2 className="animate-spin h-4 w-4"/> Processing: {fileName}</span>}
                    </p>
                </div>

               <Button
                 type="button"
                 variant="outline"
                 onClick={() => fileInputRef.current?.click()}
                 disabled={isExtracting}
                 className="w-full sm:w-auto"
               >
                 {isExtracting ? (
                   <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     Extracting...
                   </>
                 ) : (
                   <>
                     <Upload className="mr-2 h-4 w-4" /> Upload File
                   </>
                 )}
               </Button>
               <input
                 type="file"
                 id="invoice-upload"
                 ref={fileInputRef}
                 onChange={handleFileChange}
                 accept="image/*,.pdf"
                 className="hidden"
                 disabled={isExtracting}
               />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ticketNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticket Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., TK123456" {...field} disabled={isExtracting}/>
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
                      <Input placeholder="e.g., BKREF789" {...field} disabled={isExtracting}/>
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
                      <Input placeholder="e.g., AGENT007" {...field} disabled={isExtracting}/>
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
                      <Input type="number" step="0.01" placeholder="e.g., 199.99" {...field} disabled={isExtracting}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-2"> {/* Add pt-2 for alignment */}
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
                             disabled={isExtracting}
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
                            date > new Date() || date < new Date('1900-01-01') || isExtracting
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
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full md:w-auto" disabled={isSubmittingManual || isExtracting}>
               {isSubmittingManual ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   Saving...
                 </>
               ) : (
                 'Add Invoice Manually'
               )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
