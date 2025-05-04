
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password?: string) => Promise<boolean>; // Make password optional for potential future methods
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define valid credentials (in real app, fetch from secure source)
const VALID_USERNAME = 'brahim';
const VALID_PASSWORD = 'moussab';

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize state from sessionStorage if available, otherwise default to false
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
     if (typeof window !== 'undefined') {
       return sessionStorage.getItem('isAuthenticated') === 'true';
     }
     return false;
   });


  // Update sessionStorage whenever isAuthenticated changes
   useEffect(() => {
     if (typeof window !== 'undefined') {
       sessionStorage.setItem('isAuthenticated', String(isAuthenticated));
     }
   }, [isAuthenticated]);


  // Login function checks hardcoded credentials
  const login = async (username: string, password?: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      setIsAuthenticated(true);
      return true;
    } else {
      setIsAuthenticated(false); // Ensure state is false on failed login
      return false;
    }
  };

  // Logout function resets state
  const logout = () => {
    setIsAuthenticated(false);
     if (typeof window !== 'undefined') {
        sessionStorage.removeItem('isAuthenticated'); // Clear session storage on logout
     }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// AuthGuard component to protect routes
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Redirect to login if not authenticated and trying to access a protected route (e.g., /admin)
    // Make sure this check only runs client-side
    if (typeof window !== 'undefined' && !isAuthenticated && pathname === '/admin') {
      router.push('/login');
    }
  }, [isAuthenticated, router, pathname]);

  // Render children only if authenticated or if not on the protected route
  // This prevents flashing the protected content before redirect
   if (!isAuthenticated && pathname === '/admin') {
      // Optionally, render a loading state or null while redirecting
      return null; // Or <LoadingSpinner />
    }

  return <>{children}</>;
}
