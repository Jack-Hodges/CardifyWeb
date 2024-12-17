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
    color: 'rgba(3,15,64,1)',
    shadowClass: "background-shadow",
    textClass: "text-gray-700 dark:text-gray-200",
    primary: ["green", 500],
    secondary: ["purple", 500],
    tertiary: ["orange", 500],
    border: ["green", 500],
    shadow: false,
  };

  const resolvedTheme = {
    ...defaultTheme,
    ...theme,
  };

  return {
    ...resolvedTheme,
    primaryColor: getColors(resolvedTheme.primary),
    secondaryColor: getColors(resolvedTheme.secondary),
    tertiaryColor: getColors(resolvedTheme.tertiary),
    borderColor: getColors(resolvedTheme.border),
    textColor: resolvedTheme.textClass,
    shadow: resolvedTheme.shadow,
    color: resolvedTheme.color,
  };
};

// UserProvider component to manage user state globally
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [popupStates, setPopupStates] = useState({});
  const [popupStatesLoaded, setPopupStatesLoaded] = useState(false); // New state
  const [loading, setLoading] = useState(true);

  // Memoize the theme calculation
  const theme = useMemo(() => {
    if (!profile?.theme) {
      return resolveThemeColors(null); // Default theme
    }
    const userTheme = getTheme(profile.theme); // Synchronous call
    return resolveThemeColors(userTheme);
  }, [profile?.theme]);

  // Update CSS variables whenever the theme changes
  useEffect(() => {
    if (theme && theme.color) {
      document.documentElement.style.setProperty('--theme-border-color', theme.color);
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme.color);
      }
    }
  }, [theme]);

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

      if (userProfile) {
        setProfile(userProfile);
        setPopupStates(userProfile.popup_states || {});  // Initialize popup states
        setPopupStatesLoaded(true);  // Mark popup states as loaded
      }
    } else {
      setUser(null);
      setProfile(null);
      setPopupStates({});
      setPopupStatesLoaded(false);  // Reset state
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
      setPopupStates({});
      setPopupStatesLoaded(false);  // Reset on logout
    }
  };

  // Update popup state in Supabase and locally
  const updatePopupState = async (popupKey, dismissed) => {
    try {
      const updatedStates = { ...popupStates, [popupKey]: dismissed };
      const { error } = await supabase
        .from('profiles')
        .update({ popup_states: updatedStates })
        .eq('id', user?.id);

      if (error) {
        console.error("Error updating popup states:", error);
      } else {
        setPopupStates(updatedStates);  // Update locally if successful
      }
    } catch (err) {
      console.error("Unexpected error updating popup states:", err);
    }
  };

  // Effect to initialize user on mount and listen for auth changes
  useEffect(() => {
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id).then(userProfile => {
          setUser(session.user);
          setProfile(userProfile);
          setPopupStates(userProfile?.popup_states || {});
          setPopupStatesLoaded(true);  // Mark popup states as loaded
        });
      } else {
        setUser(null);
        setProfile(null);
        setPopupStates({});
        setPopupStatesLoaded(false);  // Reset on logout
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        theme,
        popupStates,
        popupStatesLoaded,  // Provide this state to the context
        setUser,
        loading,
        getUser,
        logout,
        updatePopupState,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the UserContext
export const useUser = () => {
  return useContext(UserContext);
};