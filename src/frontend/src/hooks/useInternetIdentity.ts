/**
 * Thin wrapper around @caffeineai/core-infrastructure's useInternetIdentity.
 *
 * Adds:
 *  - `logout()` helper that calls `clear()` and redirects to root
 *  - `isLoginError` / `loginError` that NEVER surface the "already authenticated"
 *    error (that case is silently treated as success)
 *  - `login()` override that silently skips the II popup when a valid session exists
 */

import { useInternetIdentity as _useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useCallback } from "react";

export function useInternetIdentity() {
  const ctx = _useInternetIdentity();

  // If the library flags "already authenticated" as an error, treat it as idle.
  const isAlreadyAuthenticated =
    ctx.isLoginError &&
    (ctx.loginError?.message?.toLowerCase().includes("already authenticated") ??
      false);

  /**
   * Wrapped login: if the user already has a valid session, silently skip the
   * II popup.  Otherwise delegate to the library's login().
   */
  const login = useCallback(() => {
    // If identity is already set and non-anonymous, nothing to do.
    if (ctx.identity && !ctx.identity.getPrincipal().isAnonymous()) {
      return;
    }
    ctx.login();
  }, [ctx]);

  /**
   * Logout: calls clear() (which calls authClient.logout() + clears state),
   * then removes any residual localStorage keys we use.
   */
  const logout = useCallback(() => {
    ctx.clear();
    // Clear any app-level localStorage to prevent auto-login on next load
    // The library already clears its own IndexedDB delegation store via logout()
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("setting_") || k.startsWith("vibeflow_"))) {
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) {
        localStorage.removeItem(k);
      }
    } catch {
      // ignore storage errors
    }
  }, [ctx]);

  return {
    identity: ctx.identity,
    login,
    logout,
    /** Same as library's clear() — prefer logout() for UI flows */
    clear: ctx.clear,
    loginStatus: ctx.loginStatus,
    isInitializing: ctx.isInitializing,
    isLoginIdle: ctx.isLoginIdle,
    isLoggingIn: ctx.isLoggingIn,
    isLoginSuccess: ctx.isLoginSuccess,
    /** Hide "already authenticated" from the UI — it's not a real error */
    isLoginError: ctx.isLoginError && !isAlreadyAuthenticated,
    loginError: isAlreadyAuthenticated ? undefined : ctx.loginError,
  };
}
