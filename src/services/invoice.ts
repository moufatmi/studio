import { db } from '@/lib/firebase'; // Import the initialized Firestore instance
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy, // Optional: For sorting
  Timestamp, // Import Timestamp if you store dates as Firestore Timestamps
} from 'firebase/firestore';

/**
 * Represents invoice data.
 */
export interface Invoice {
  /**
   * Unique identifier for the invoice (provided by Firestore).
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
   * The date of the invoice (stored as YYYY-MM-DD string).
   * Consider using Firestore Timestamp for richer date/time queries if needed.
   */
  date: string; // Keep as string based on existing usage, but Timestamp is an option
}

// Reference to the 'invoices' collection in Firestore
const invoicesCollectionRef = collection(db, 'invoices');

/**
 * Asynchronously fetches all invoices from Firestore.
 *
 * @returns A promise that resolves with an array of all invoices.
 */
export async function getInvoices(): Promise<Invoice[]> {
  try {
    // Optional: Order invoices by date or another field
    const q = query(invoicesCollectionRef, orderBy('date', 'desc')); // Example ordering
    const querySnapshot = await getDocs(q); // Use q here if ordering, else invoicesCollectionRef

    const invoices = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Invoice, 'id'>), // Spread the document data
    }));
    console.log('Fetched invoices from Firestore:', invoices);
    return invoices;
  } catch (error) {
    console.error("Error fetching invoices from Firestore:", error);
    throw new Error("Failed to fetch invoices."); // Re-throw or handle as needed
  }
}


/**
 * Asynchronously saves a new invoice to Firestore.
 *
 * @param invoiceData The invoice data to save (without an id).
 * @returns A promise that resolves with the newly created invoice including its Firestore-generated id.
 */
export async function saveInvoice(invoiceData: Omit<Invoice, 'id'>): Promise<Invoice> {
   try {
      // Firestore automatically generates an ID
      const docRef = await addDoc(invoicesCollectionRef, {
          ...invoiceData,
          // Optionally add a created timestamp
          // createdAt: serverTimestamp(),
      });
      console.log('Saved new invoice to Firestore with ID:', docRef.id);
      // Return the original data along with the new ID
      return { id: docRef.id, ...invoiceData };
   } catch (error) {
        console.error("Error saving invoice to Firestore:", error);
        throw new Error("Failed to save invoice.");
   }
}

/**
 * Asynchronously updates an existing invoice in Firestore.
 *
 * @param invoice The invoice data to update (must include id).
 * @returns A promise that resolves when the invoice data is updated.
 * @throws Error if the invoice id is missing or if the update fails.
 */
export async function updateInvoice(invoice: Invoice): Promise<void> {
    if (!invoice.id) {
      throw new Error("Invoice ID is required for update.");
    }
    const invoiceDocRef = doc(db, 'invoices', invoice.id);
    // Exclude 'id' from the data being updated
    const { id, ...invoiceData } = invoice;

    try {
      await updateDoc(invoiceDocRef, invoiceData);
      console.log('Updated invoice in Firestore with ID:', id);
    } catch (error) {
      console.error("Error updating invoice in Firestore:", error);
      throw new Error("Failed to update invoice.");
    }
}

/**
 * Asynchronously deletes an invoice from Firestore by its ID.
 *
 * @param invoiceId The ID of the invoice to delete.
 * @returns A promise that resolves when the invoice is deleted.
 * @throws Error if the invoiceId is missing or if the delete operation fails.
 */
export async function deleteInvoice(invoiceId: string): Promise<void> {
    if (!invoiceId) {
      throw new Error("Invoice ID is required for deletion.");
    }
    const invoiceDocRef = doc(db, 'invoices', invoiceId);

    try {
      await deleteDoc(invoiceDocRef);
      console.log('Deleted invoice from Firestore with ID:', invoiceId);
    } catch (error) {
      console.error("Error deleting invoice from Firestore:", error);
      // Consider checking for 'not-found' errors if needed
      throw new Error("Failed to delete invoice.");
    }
}
