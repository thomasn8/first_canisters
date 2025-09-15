import { createContext, useContext, useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { createActor, hello_backend } from "declarations/hello_backend";
import { canisterId } from "declarations/hello_backend/index.js";
import { Principal } from "@dfinity/principal";
import type { ActorSubclass } from "@dfinity/agent";
import type { _SERVICE as HelloService } from "declarations/hello_backend/hello_backend.did";

const identityProvider = "http://uzt4z-lp777-77774-qaabq-cai.localhost:4943/"; // Local
// const identityProvider = 'https://id.ai/' // Mainnet

type IdentityState = {
  actor: ActorSubclass<HelloService>;
  authClient: AuthClient | null;
  isAuthenticated: boolean;
  principal: Principal | null;
};

type IdentityContextType = {
  state: IdentityState;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const IdentityContext = createContext<IdentityContextType>(
  {
    state: {
    actor: hello_backend,
    authClient: null,
    isAuthenticated: false,
    principal: null
  },
  login: async () => {},
  logout: async () => {},
  }
);

export const useIdentity = () => useContext(IdentityContext);

export default function IdentityProvider({ children }: { children: any }): any {
  const [state, setState] = useState<IdentityState>(() => ({
    actor: hello_backend,
    authClient: null,
    isAuthenticated: false,
    principal: null,
  }));

  useEffect(() => {
    updateActor();
  }, []);

  const updateActor = async () => {
    const authClient = await AuthClient.create();
    const identity = authClient.getIdentity();
    const actor = createActor(canisterId, { agentOptions: { identity } });
    const isAuthenticated = await authClient.isAuthenticated();
    const principal = identity.getPrincipal();

    setState((prev) => ({
      ...prev,
      actor,
      authClient,
      isAuthenticated,
      principal,
    }));
  };

  const login = async () => {
    await (state.authClient! as AuthClient).login({
      identityProvider,
      onSuccess: updateActor,
    });
  };

  const logout = async () => {
    await (state.authClient! as AuthClient).logout();
    updateActor();
  };

  return (
    <IdentityContext.Provider value={{ state, login, logout }}>
      {children}
    </IdentityContext.Provider>
  );
}
