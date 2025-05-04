'use server';
/**
 * @fileOverview This file defines a Genkit flow for extracting invoice data from an image or PDF.
 *
 * - smartInvoiceReader - A function that takes an image/PDF data URI and returns the extracted invoice data.
 * - SmartInvoiceReaderInput - The input type for the smartInvoiceReader function.
 * - SmartInvoiceReaderOutput - The return type for the smartInvoiceReader function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SmartInvoiceReaderInputSchema = z.object({
  invoiceDataUri: z
    .string()
    .describe(
      'The invoice image or PDF as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'      
    ),
});
export type SmartInvoiceReaderInput = z.infer<typeof SmartInvoiceReaderInputSchema>;

const SmartInvoiceReaderOutputSchema = z.object({
  ticketNumber: z.string().describe('The ticket number from the invoice.'),
  bookingReference: z.string().describe('The booking reference from the invoice.'),
  agentId: z.string().describe('The agent ID from the invoice.'),
  amount: z.number().describe('The amount from the invoice.'),
  date: z.string().describe('The date from the invoice.'),
});
export type SmartInvoiceReaderOutput = z.infer<typeof SmartInvoiceReaderOutputSchema>;

export async function smartInvoiceReader(input: SmartInvoiceReaderInput): Promise<SmartInvoiceReaderOutput> {
  return smartInvoiceReaderFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartInvoiceReaderPrompt',
  input: {
    schema: z.object({
      invoiceDataUri: z
        .string()
        .describe(
          'The invoice image or PDF as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'          
        ),
    }),
  },
  output: {
    schema: z.object({
      ticketNumber: z.string().describe('The ticket number from the invoice.'),
      bookingReference: z.string().describe('The booking reference from the invoice.'),
      agentId: z.string().describe('The agent ID from the invoice.'),
      amount: z.number().describe('The amount from the invoice.'),
      date: z.string().describe('The date from the invoice.'),
    }),
  },
  prompt: `You are an expert data extraction AI, specialized in extracting information from invoices.  The invoice data will be provided as an image. Extract the following information from the invoice:\n\n- Ticket Number\n- Booking Reference\n- Agent ID\n- Amount\n- Date\n\nInvoice Image: {{media url=invoiceDataUri}}`,
});

const smartInvoiceReaderFlow = ai.defineFlow<
  typeof SmartInvoiceReaderInputSchema,
  typeof SmartInvoiceReaderOutputSchema
>(
  {
    name: 'smartInvoiceReaderFlow',
    inputSchema: SmartInvoiceReaderInputSchema,
    outputSchema: SmartInvoiceReaderOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
