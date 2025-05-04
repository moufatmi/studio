
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
import { format, parseISO, isValid } from 'date-fns'; // Import parseISO and isValid
import type { Invoice } from '@/services/invoice';
// Assuming saveInvoice exists and works - No need to import it here if parent handles submission
// import { saveInvoice } from '@/services/invoice';
import { smartInvoiceReader } from '@/ai/flows/smart-invoice-reader';
import { useToast } from "@/hooks/use-toast";

// Schema for form validation - no 'id' needed here
const invoiceFormSchema = z.object({
  ticketNumber: z.string().min(1, { message: 'Ticket number is required' }),
  bookingReference: z.string().min(1, { message: 'Booking reference is required' }),
  agentId: z.string().min(1, { message: 'Agent ID is required' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive' }),
  date: z.date({ required_error: 'Date is required' }),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  // Parent component now handles the async saving and provides the data
  onAddInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<void>;
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
      const invoiceData: Omit<Invoice, 'id'> = { // Exclude 'id' when creating
        ...values,
        date: format(values.date, 'yyyy-MM-dd'), // Format date to string for saving
      };
      await onAddInvoice(invoiceData); // Call the parent's handler
      // Success toast is handled by the parent now
      form.reset(); // Reset form after successful submission *handled by parent*
      setFileName(null); // Clear filename display after successful manual submission
    } catch (error) {
      console.error('Error submitting invoice data:', error);
      // Error toast is handled by the parent now
    } finally {
      setIsSubmittingManual(false);
    }
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Don't set filename here yet, wait for extraction start
      handleSmartExtraction(file);
    } else {
      setFileName(null);
    }
      // Clear the file input value right away so the same file can be selected again
       if (fileInputRef.current) {
         fileInputRef.current.value = '';
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

           // More robust date parsing
           try {
              // Attempt to parse the date string (could be various formats)
              // parseISO is good for ISO 8601 format (like YYYY-MM-DDTHH:mm:ssZ)
              // new Date() is more flexible but can be inconsistent
              let parsedDate = parseISO(extractedData.date); // Try ISO first
              if (!isValid(parsedDate)) {
                 // If ISO fails, try the more general Date constructor
                 parsedDate = new Date(extractedData.date);
              }

              if (isValid(parsedDate)) {
                  form.setValue('date', parsedDate);
              } else {
                  console.warn("AI returned an invalid or unparseable date format:", extractedData.date);
                   toast({
                     title: "Date Warning",
                     description: "Could not parse the date from the invoice. Please select it manually.",
                     variant: "default",
                   });
                   form.setValue('date', undefined); // Clear date if invalid
              }
           } catch (dateError) {
              console.error("Error parsing date:", dateError);
               toast({
                 title: "Date Error",
                 description: "Error processing the date from the invoice. Please select it manually.",
                 variant: "default",
               });
               form.setValue('date', undefined); // Clear date on error
           }


           toast({
             title: "Extraction Successful",
             description: "Invoice data extracted. Please review and submit.",
           });
            // Keep filename displayed after successful extraction
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
           // File input already cleared in handleFileChange
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
          // File input already cleared in handleFileChange
       };
     } catch (error) {
       console.error('Error setting up file reader:', error);
       toast({
         title: "Error",
         description: "An unexpected error occurred while reading the file.",
         variant: "destructive",
       });
       setIsExtracting(false);
        setFileName(null); // Clear filename on failure
        // File input already cleared in handleFileChange
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
                    <Label htmlFor="invoice-upload" className="text-base font-medium text-primary flex items-center gap-2 cursor-pointer">
                      <Wand2 className="h-5 w-5" />
                      Smart Invoice Reader
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload an invoice image or PDF to automatically fill the form.
                      {fileName && <span className="ml-2 font-medium text-foreground"> ({fileName})</span>}
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
                 accept="image/*,.pdf" // Accept images and PDFs
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
                      <Input placeholder="e.g., TK123456" {...field} disabled={isExtracting || isSubmittingManual}/>
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
                      <Input placeholder="e.g., BKREF789" {...field} disabled={isExtracting || isSubmittingManual}/>
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
                      <Input placeholder="e.g., AGENT007" {...field} disabled={isExtracting || isSubmittingManual}/>
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
                      <Input type="number" step="0.01" placeholder="e.g., 199.99" {...field} disabled={isExtracting || isSubmittingManual}/>
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
                             disabled={isExtracting || isSubmittingManual}
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
                            date > new Date() || date < new Date('1900-01-01') || isExtracting || isSubmittingManual
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
