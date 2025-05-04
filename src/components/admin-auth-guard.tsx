
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton'; // Optional loading state
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';


export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);


 useEffect(() => {
    // Check authentication status. This effect runs after the component mounts.
    // The AuthProvider initializes state from sessionStorage, so this check reflects that.
    if (typeof window !== 'undefined') { // Ensure this runs client-side
      if (!isAuthenticated) {
        console.log('AdminAuthGuard: Not authenticated, redirecting to /login');
        router.replace('/login'); // Use replace to avoid adding login to history stack
      } else {
        setIsCheckingAuth(false); // Authentication confirmed
      }
    }
     // Dependency array includes isAuthenticated and router
  }, [isAuthenticated, router]);

  // While checking or if not authenticated (before redirect completes), show loading or null
  if (isCheckingAuth || !isAuthenticated) {
     return (
      <div className="container mx-auto p-4 md:p-8 space-y-8">
         <Alert>
             <AlertCircle className="h-4 w-4" />
             <AlertTitle>Authenticating...</AlertTitle>
             <AlertDescription>
               Please wait while we verify your access. You will be redirected if necessary.
             </AlertDescription>
         </Alert>
        <div className="space-y-4 mt-8">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
     );
  }

  // If authenticated, render the children (the admin page content)
  return <>{children}</>;
}
