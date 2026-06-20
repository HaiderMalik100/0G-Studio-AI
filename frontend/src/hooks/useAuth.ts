import { useEffect, useState } from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { getNonce, verifySignature } from "../services/api";

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

  const [token, setToken] = useState<string | null>(
    localStorage.getItem("jwt")
  );

  const login = async () => {
    if (!address) return;

    const { data } = await getNonce(address);
    const signature = await signMessageAsync({ message: data.nonce });

    const res = await verifySignature(address, signature);

    localStorage.setItem("jwt", res.data.token);
    setToken(res.data.token);
  };

  useEffect(() => {
    if (isConnected && !token) login();
  }, [isConnected, address]);

  const logout = () => {
    localStorage.removeItem("jwt");
    setToken(null);
    disconnect();
  };

  return { token, address, isConnected, logout };
}