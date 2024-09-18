import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from './supabaseClient';

// Create UserContext
const UserContext = createContext();

// Create a UserProvider component to manage user state globally
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state to indicate session fetching

  // Define a function to get the user session
  const getUser = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
    }

    if (session?.user) {
      setUser(session.user); // Set user if session exists
    } else {
      setUser(null); // Clear the user if no session exists
    }

    setLoading(false); // Mark loading as complete
  };

  // Define a function to handle user logout
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    } else {
      setUser(null); // Clear the user state on logout
    }
  };

  useEffect(() => {
    // Fetch the session when the component mounts
    getUser();

    // Subscribe to auth state changes (e.g., login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    // Cleanup listener when the component unmounts
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loading, getUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUser = () => {
  return useContext(UserContext);
};