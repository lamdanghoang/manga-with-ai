'use client';
import { useEffect, useRef } from 'react';
import { useAccount, useConnect, useConnectors } from 'wagmi';

export function useAutoConnect(onFail?: () => void) {
  const { isConnected } = useAccount();
  const connectors = useConnectors();
  const { connect } = useConnect();
  const tried = useRef(false);

  useEffect(() => {
    if (isConnected || tried.current) return;
    tried.current = true;

    // If user logged out, don't auto-connect
    if (localStorage.getItem('logged_out')) {
      onFail?.();
      return;
    }

    if (connectors.length > 0) {
      connect(
        { connector: connectors[0] },
        { onError: () => onFail?.() }
      );
    } else {
      onFail?.();
    }
  }, []);
}
