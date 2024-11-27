import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import supabase from './supabaseClient';
import { fetchProfile } from './components/Profile/ProfileManipulation';
import { getTheme } from './components/Functions/getTheme';
import getColors from './components/Functions/getColors';

// Create UserContext
const UserContext = createContext();

// Helper to resolve theme colors with defaults
const resolveThemeColors = (theme) => {
  const defaultTheme = {
    name: "default",
    image: null,
    shadowClass: "background-shadow",
    textClass: "text-black",
    primary: ["gray", 500],
    secondary: ["gray", 400],
    tertiary: ["gray", 300],
    border: ["gray", 500],
  };

  const resolvedTheme = {
    ...defaultTheme,
    ...theme, // Overwrite defaults with provided theme values
  };

  return {
    ...resolvedTheme,
    primaryColor: getColors(resolvedTheme.primary),
    secondaryColor: getColors(resolvedTheme.secondary),
    tertiaryColor: getColors(resolvedTheme.tertiary),
    borderColor: getColors(resolvedTheme.border),
    textColor: resolvedTheme.textClass,
  };
};

// UserProvider component to manage user state globally
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Memoize the theme calculation
  const theme = useMemo(() => {
    if (!profile?.theme) {
      return resolveThemeColors(null); // Default theme
    }
    const userTheme = getTheme(profile.theme); // Synchronous call
    return resolveThemeColors(userTheme);
  }, [profile?.theme]);

  // Fetch the user and profile
  const getUser = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Error getting session:", error);
      return;
    }

    if (session?.user) {
      setUser(session.user);
      const userProfile = await fetchProfile(session.user.id);
      setProfile(userProfile);
    } else {
      setUser(null);
      setProfile(null);
    }

    setLoading(false);
  };

  // Logout function to clear user state
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
    } else {
      setUser(null);
      setProfile(null);
    }
  };

  // Effect to initialize user on mount and listen for auth changes
  useEffect(() => {
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

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