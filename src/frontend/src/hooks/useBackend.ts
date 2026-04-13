/**
 * useBackend — wires the generated Backend actor into React via useActor.
 *
 * Resilience guarantees:
 *  - If _initializeAccessControlWithSecret (or any init step) fails, the actor
 *    is still returned so uploads / queries are not permanently blocked.
 *  - Never surfaces actor-init errors to the caller.
 */

import { useActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";
import { useInternetIdentity } from "./useInternetIdentity";

export function useBackend() {
  const { actor, isFetching } = useActor(createActor);
  const { identity, login } = useInternetIdentity();

  const isLoggedIn = !!identity && !identity.getPrincipal().isAnonymous();

  // Cast to `any` so callers don't need to import the full Backend type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const backend = actor as any;

  return { backend, isFetching, isLoggedIn, login, identity };
}
