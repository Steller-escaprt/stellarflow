import { useCallback, useEffect, useState } from "react";
import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
  signAuthEntry,
  signMessage,
} from "@stellar/freighter-api";
import { Keypair, Networks, TransactionBuilder } from "@stellar/stellar-sdk";
import { getAuthChallenge, verifyAuthToken } from "../services/auth";
import { setAuthToken } from "../services/api";

export type WalletStatus = "idle" | "connecting" | "connected" | "error";

export interface FreighterState {
  /** Whether the Freighter extension is installed in the browser. */
  installed: boolean;
  /** Whether the user has authorized this app in Freighter. */
  allowed: boolean;
  /** The connected wallet's Stellar public key, or null if not connected. */
  address: string | null;
  status: WalletStatus;
  /** Human-readable error message, or null when there is no error. */
  error: string | null;
  connect: () => Promise<void>;
  connectDemo?: () => Promise<void>;
  disconnect: () => void;
  /**
   * Sign an arbitrary action payload via Freighter's signMessage.
   * The payload is JSON-serialised, UTF-8 encoded, then base64'd before signing.
   * Returns the base64 signature string from Freighter.
   */
  signAction: (payload: Record<string, unknown>) => Promise<string>;
}

const STORAGE_KEY = "stellar_stream_auth_token";
const DEMO_SECRET_KEY = "stellarflow_demo_secret";

export function useFreighter(): FreighterState {
  const [installed, setInstalled] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<WalletStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // On mount: detect extension or restore demo / already-allowed session.
  useEffect(() => {
    let cancelled = false;

    async function detect() {
      try {
        const { isConnected: connected } = await isConnected();
        if (cancelled) return;

        if (connected) {
          setInstalled(true);
          const { isAllowed: permitted } = await isAllowed();
          if (cancelled) return;

          if (permitted) {
            const { address: pk } = await getAddress();
            const storedToken = localStorage.getItem(STORAGE_KEY);
            if (cancelled) return;
            if (pk && storedToken) {
              setAuthToken(storedToken);
              setAllowed(true);
              setAddress(pk);
              setStatus("connected");
              return;
            }
          }
        } else {
          setInstalled(false);
        }

        // If Freighter is not connected, restore any active demo session
        const storedDemoSecret = localStorage.getItem(DEMO_SECRET_KEY);
        const storedToken = localStorage.getItem(STORAGE_KEY);
        if (!cancelled && storedDemoSecret && storedToken) {
          try {
            const kp = Keypair.fromSecret(storedDemoSecret);
            setAuthToken(storedToken);
            setAllowed(true);
            setAddress(kp.publicKey());
            setStatus("connected");
          } catch {
            localStorage.removeItem(DEMO_SECRET_KEY);
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch {
        // Extension not available — check for demo session
        const storedDemoSecret = localStorage.getItem(DEMO_SECRET_KEY);
        const storedToken = localStorage.getItem(STORAGE_KEY);
        if (!cancelled && storedDemoSecret && storedToken) {
          try {
            const kp = Keypair.fromSecret(storedDemoSecret);
            setAuthToken(storedToken);
            setAllowed(true);
            setAddress(kp.publicKey());
            setStatus("connected");
          } catch {
            localStorage.removeItem(DEMO_SECRET_KEY);
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      }
    }

    void detect();
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setStatus("connecting");
    try {
      const { address: pk } = await requestAccess();
      if (!pk) throw new Error("Freighter did not return an account address.");

      setInstalled(true);

      // 1. Fetch challenge
      const challengeXdr = await getAuthChallenge(pk);

      // 2. Sign auth entry challenge using Freighter
      const { signedAuthEntry: signedChallenge } = await signAuthEntry(challengeXdr);
      if (!signedChallenge) {
        throw new Error("Freighter did not return a signed challenge.");
      }

      // 3. Trade signed challenge for real JWT
      const token = await verifyAuthToken(signedChallenge);

      localStorage.removeItem(DEMO_SECRET_KEY);
      localStorage.setItem(STORAGE_KEY, token);
      setAuthToken(token);

      setAllowed(true);
      setAddress(pk);
      setStatus("connected");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to connect to Freighter.";
      const friendly = msg.toLowerCase().includes("user declined")
        ? "Connection cancelled — please approve the request in Freighter."
        : msg;

      localStorage.removeItem(STORAGE_KEY);
      setAuthToken(null);
      setError(friendly);
      setStatus("error");
    }
  }, []);

  const connectDemo = useCallback(async () => {
    setError(null);
    setStatus("connecting");
    try {
      let kp: Keypair;
      const stored = localStorage.getItem(DEMO_SECRET_KEY);
      if (stored) {
        try {
          kp = Keypair.fromSecret(stored);
        } catch {
          kp = Keypair.random();
          localStorage.setItem(DEMO_SECRET_KEY, kp.secret());
        }
      } else {
        kp = Keypair.random();
        localStorage.setItem(DEMO_SECRET_KEY, kp.secret());
      }

      // 1. Fetch SEP-10 challenge
      const challengeXdr = await getAuthChallenge(kp.publicKey());

      // 2. Sign SEP-10 challenge with demo keypair
      const tx = TransactionBuilder.fromXDR(challengeXdr, Networks.TESTNET);
      tx.sign(kp);
      const signedChallenge = tx.toXDR();

      // 3. Exchange signed challenge for real SEP-10 JWT
      const token = await verifyAuthToken(signedChallenge);

      localStorage.setItem(STORAGE_KEY, token);
      setAuthToken(token);

      setAllowed(true);
      setAddress(kp.publicKey());
      setStatus("connected");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to connect demo wallet.";
      localStorage.removeItem(STORAGE_KEY);
      setAuthToken(null);
      setError(msg);
      setStatus("error");
    }
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DEMO_SECRET_KEY);
    setAuthToken(null);
    setAddress(null);
    setAllowed(false);
    setStatus("idle");
    setError(null);
  }, []);

  const signAction = useCallback(
    async (payload: Record<string, unknown>): Promise<string> => {
      const storedDemoSecret = localStorage.getItem(DEMO_SECRET_KEY);
      if (storedDemoSecret) {
        try {
          const kp = Keypair.fromSecret(storedDemoSecret);
          const json = JSON.stringify(payload);
          const sig = kp.sign(Buffer.from(json, "utf-8"));
          return Buffer.from(sig).toString("base64");
        } catch {
          // fallback
        }
      }
      const json = JSON.stringify(payload);
      const base64 = btoa(unescape(encodeURIComponent(json)));
      const { signedMessage } = await signMessage(base64, {
        address: address ?? undefined,
      });
      if (!signedMessage) {
        throw new Error("Freighter did not return a signature.");
      }
      return Buffer.from(signedMessage).toString("base64");
    },
    [address],
  );

  return { installed, allowed, address, status, error, connect, connectDemo, disconnect, signAction };
}
