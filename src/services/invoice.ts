/**
 * Represents invoice data.
 */
export interface Invoice {
  /**
   * Unique identifier for the invoice (optional, useful for updates/deletes)
   */
  id?: string;
  /**
   * The ticket number.
   */
  ticketNumber: string;
  /**
   * The booking reference.
   */
  bookingReference: string;
  /**
   * The agent ID.
   */
  agentId: string;
  /**
   * The amount.
   */
  amount: number;
  /**
   * The date of the invoice (YYYY-MM-DD format).
   */
  date: string;
}

// Mock database - In a real app, this would be replaced by API calls to a backend/database
let mockInvoices: Invoice[] = [
  { id: '1', ticketNumber: 'T123', bookingReference: 'B456', agentId: 'A001', amount: 150.75, date: '2024-07-01' },
  { id: '2', ticketNumber: 'T124', bookingReference: 'B457', agentId: 'A002', amount: 230.00, date: '2024-07-05' },
  { id: '3', ticketNumber: 'T125', bookingReference: 'B458', agentId: 'A001', amount: 99.99, date: '2024-07-10' },
  { id: '4', ticketNumber: 'T126', bookingReference: 'B459', agentId: 'A003', amount: 500.00, date: '2024-07-12' },
  { id: '5', ticketNumber: 'T127', bookingReference: 'B460', agentId: 'A002', amount: 120.50, date: '2024-07-15' },
];

let nextId = mockInvoices.length + 1;

/**
 * Asynchronously fetches all invoices.
 *
 * @returns A promise that resolves with an array of all invoices.
 */
export async function getInvoices(): Promise<Invoice[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Fetching invoices:', mockInvoices);
  return [...mockInvoices]; // Return a copy to prevent direct mutation
}


/**
 * Asynchronously saves a new invoice.
 *
 * @param invoice The invoice data to save (without an id).
 * @returns A promise that resolves with the newly created invoice including its id.
 */
export async function saveInvoice(invoice: Omit<Invoice, 'id'>): Promise<Invoice> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  const newInvoice: Invoice = { ...invoice, id: String(nextId++) };
  mockInvoices.push(newInvoice);
  console.log('Saving new invoice:', newInvoice);
  console.log('Current invoices:', mockInvoices);
  return newInvoice;
}

/**
 * Asynchronously updates an existing invoice.
 *
 * @param invoice The invoice data to update (must include id).
 * @returns A promise that resolves when the invoice data is updated.
 * @throws Error if the invoice with the given id is not found.
 */
export async function updateInvoice(invoice: Invoice): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockInvoices.findIndex(inv => inv.id === invoice.id);
    if (index === -1) {
        throw new Error(`Invoice with id ${invoice.id} not found.`);
    }
    mockInvoices[index] = { ...invoice }; // Ensure it's a new object reference
    console.log('Updating invoice:', invoice);
    console.log('Current invoices:', mockInvoices);
}

/**
 * Asynchronously deletes an invoice by its ID.
 *
 * @param invoiceId The ID of the invoice to delete.
 * @returns A promise that resolves when the invoice is deleted.
 * @throws Error if the invoice with the given id is not found.
 */
export async function deleteInvoice(invoiceId: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    const initialLength = mockInvoices.length;
    mockInvoices = mockInvoices.filter(inv => inv.id !== invoiceId);
    if (mockInvoices.length === initialLength) {
        throw new Error(`Invoice with id ${invoiceId} not found for deletion.`);
    }
    console.log('Deleting invoice with id:', invoiceId);
    console.log('Current invoices:', mockInvoices);
}