import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from './supabaseClient';
import { fetchProfile } from './components/Profile/ProfileManipulation';
import { getTheme } from './components/Functions/getTheme';

// Create UserContext
const UserContext = createContext();

// Create a UserProvider component to manage user state globally
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // Add profile state
  const [loading, setLoading] = useState(true); // Loading state to indicate session fetching
  const [theme, setTheme] = useState(null); // Set the theme state

  // Define a function to get the user session
  const getUser = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
    }

    if (session?.user) {
      setUser(session.user); // Set user if session exists
      const userProfile = await fetchProfile(session.user.id); // Fetch the profile
      setProfile(userProfile); // Set the profile in state
      const getUserTheme = await getTheme(userProfile?.theme); // Get the theme
      setTheme(getUserTheme); // Set the theme in state
    } else {
      setUser(null); // Clear the user if no session exists
      setProfile(null); // Clear profile if no user
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
      setProfile(null); // Clear profile on logout
    }
  };

  useEffect(() => {
    // Fetch the session when the component mounts
    getUser();

    // Subscribe to auth state changes (e.g., login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile); // Fetch profile on auth state change
      } else {
        setProfile(null); // Clear profile if no session
      }
    });

    // Cleanup listener when the component unmounts
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, profile, theme, setUser, loading, getUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUser = () => {
  return useContext(UserContext);
};