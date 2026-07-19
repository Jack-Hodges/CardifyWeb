import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import supabase from './supabaseClient';
import { fetchProfile } from './components/Profile/ProfileManipulation';
import { getTheme, normalizeBackgroundImage } from './components/Functions/getTheme';
import getColors from './components/Functions/getColors';

// Create UserContext
const UserContext = createContext();

// Helper to resolve theme colors with defaults
const resolveThemeColors = (theme) => {
  const defaultTheme = {
    name: "default",
    image: '#f1ebe0',
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
    ...(theme || {}),
  };

  return {
    ...resolvedTheme,
    image: normalizeBackgroundImage(resolvedTheme.image),
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
  const [isSignUpProcess, setIsSignUpProcess] = useState(false); // Track sign-up process

  // State to track color scheme changes for default theme
  const [colorScheme, setColorScheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Memoize the theme calculation
  const theme = useMemo(() => {
    return resolveThemeColors(getTheme(profile?.theme, colorScheme));
  }, [profile?.theme, colorScheme]);

  // Push theme into CSS so pages don't recompute background strings
  useEffect(() => {
    if (!theme) return;
    if (theme.image) {
      document.documentElement.style.setProperty('--theme-background', theme.image);
    }
    if (theme.color) {
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
        setIsSignUpProcess(false); // Clear sign-up flag when profile is found
      } else {
        // No profile found for the given user ID - redirect to login page
        // But only if we're not in the sign-up process
        if (!isSignUpProcess) {
          console.warn('No profile found for the given user ID. Redirecting to login page.');
          await logout();
          window.location.href = '/';
        }
      }
    } else {
      setUser(null);
      setProfile(null);
      setPopupStates({});
      setPopupStatesLoaded(false);  // Reset state
      setIsSignUpProcess(false); // Clear sign-up flag
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
      
      // Reset theme to default
      const defaultTheme = resolveThemeColors(null);
      document.documentElement.style.setProperty('--theme-border-color', defaultTheme.color);
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', defaultTheme.color);
      }
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

    // Listen for color scheme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleColorSchemeChange = (e) => {
      setColorScheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleColorSchemeChange);

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id).then(userProfile => {
          setUser(session.user);
          setProfile(userProfile);
          setPopupStates(userProfile?.popup_states || {});
          setPopupStatesLoaded(true);  // Mark popup states as loaded
          
          // If no profile is found, redirect to login page
          // But only if we're not in the sign-up process
          if (!userProfile && !isSignUpProcess) {
            console.warn('No profile found for the given user ID. Redirecting to login page.');
            logout().then(() => {
              window.location.href = '/';
            });
          } else if (userProfile) {
            setIsSignUpProcess(false); // Clear sign-up flag when profile is found
          }
        });
      } else {
        setUser(null);
        setProfile(null);
        setPopupStates({});
        setPopupStatesLoaded(false);  // Reset on logout
        setIsSignUpProcess(false); // Clear sign-up flag
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      mediaQuery.removeEventListener('change', handleColorSchemeChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only auth and color-scheme listeners
  }, []);

  // Function to mark that sign-up process has started
  const startSignUpProcess = () => {
    setIsSignUpProcess(true);
  };

  // Function to manually toggle color scheme
  const toggleColorScheme = () => {
    setColorScheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Subscription helpers (Stripe temporarily disabled)
  const upgradeToPro = async () => {
    console.info('Stripe checkout is disabled. Contact hello@flashcardify.app for Pro.');
  };

  const manageBilling = async () => {
    console.info('Stripe billing portal is disabled.');
  };

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        theme,
        popupStates,
        popupStatesLoaded,  // Provide this state to the context
        setUser,
        setProfile,
        loading,
        getUser,
        logout,
        updatePopupState,
        startSignUpProcess,
        upgradeToPro,
        manageBilling,
        toggleColorScheme,
        colorScheme,
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