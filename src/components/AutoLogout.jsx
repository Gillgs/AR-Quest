import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export const AutoLogout = () => {
  const lastActivityRef = useRef(Date.now());
  const isSessionActiveRef = useRef(false);
  const navigate = useNavigate();

  const handleUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      // Only perform logout actions if we believe a session is active.
      if (!isSessionActiveRef.current) return;

      // Double-check there is a session before proceeding
      const { data } = await supabase.auth.getSession();
      const session = data?.session ?? null;
      if (!session) {
        isSessionActiveRef.current = false;
        return;
      }
      // Sign out from Supabase
      await supabase.auth.signOut();
      // Clear any stored user data
      localStorage.clear();
      // Redirect to login (only if not already there)
      try {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          navigate('/login');
          // Dispatch a non-blocking event so the app-level toast can show the message
          try {
            window.dispatchEvent(
              new CustomEvent('app:auto-logout', {
                detail: { message: 'You have been logged out due to inactivity' },
              })
            );
          } catch (e) {
          }
        }
      } catch (navErr) {
        // ignore navigation errors
      }
      isSessionActiveRef.current = false;
    } catch (error) {
    }
  }, [navigate]);

  useEffect(() => {
    // Set up inactivity listeners only when a user is signed in.
    let intervalId = null;
    let listenersAdded = false;
    let subscription = null;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    const setupListeners = () => {
      if (listenersAdded) return;
      events.forEach((ev) => document.addEventListener(ev, handleUserActivity));
      // Check every second for inactivity
      intervalId = setInterval(() => {
        if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT) {
          handleLogout();
        }
      }, 1000);
      listenersAdded = true;
    };

    const removeListeners = () => {
      if (!listenersAdded) return;
      events.forEach((ev) => document.removeEventListener(ev, handleUserActivity));
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      listenersAdded = false;
    };

    // Check current session
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session ?? null;
        if (session) {
          // reset last activity and wire up listeners
          lastActivityRef.current = Date.now();
          isSessionActiveRef.current = true;
          setupListeners();
        } else {
          isSessionActiveRef.current = false;
        }
      } catch (err) {
      }
    })();

    // Subscribe to auth state changes to start/stop the auto-logout when user signs in/out
    try {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
          lastActivityRef.current = Date.now();
          isSessionActiveRef.current = true;
          setupListeners();
        }
        if (event === 'SIGNED_OUT') {
          isSessionActiveRef.current = false;
          removeListeners();
        }
      });
      subscription = data?.subscription ?? null;
    } catch (err) {
      // If onAuthStateChange isn't available or fails, nothing else to do.
    }

    return () => {
      removeListeners();
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [handleLogout, handleUserActivity]);

  // This component doesn't render anything
  return null;
};

export default AutoLogout;
