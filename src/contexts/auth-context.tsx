
"use client";

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  type AuthError
} from 'firebase/auth';
import { useRouter }  from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<User | null>;
  signUpWithEmail: (email: string, pass: string) => Promise<User | null>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      setCurrentUser(userCredential.user);
      toast({ title: "Login Successful", description: "Welcome back!" });
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error signing in:", authError);
      toast({ title: "Login Failed", description: authError.message, variant: "destructive" });
      setCurrentUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      setCurrentUser(userCredential.user);
      toast({ title: "Signup Successful", description: "Welcome to HatchWise!" });
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error signing up:", authError);
      toast({ title: "Signup Failed", description: authError.message, variant: "destructive" });
      setCurrentUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setCurrentUser(null);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login'); // Redirect to login after sign out
    } catch (error) {
      const authError = error as AuthError;
      console.error("Error signing out:", authError);
      toast({ title: "Logout Failed", description: authError.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signOutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
