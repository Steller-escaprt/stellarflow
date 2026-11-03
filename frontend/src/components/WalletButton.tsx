import { FreighterState } from "../hooks/useFreighter";

interface WalletButtonProps {
  wallet: FreighterState;
}

/** Truncates a Stellar public key to "GABC…WXYZ" format for display. */
function truncateAddress(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function WalletButton({ wallet }: WalletButtonProps) {
  const { installed, address, status, error, connect, disconnect, connectDemo } = wallet;

  if (status === "connected" && address) {
    return (
      <div className="wallet-status flex items-center gap-2">
        <span className="wallet-address" title={address}>
          <span className="wallet-dot wallet-dot--connected" aria-hidden />
          {truncateAddress(address)}
        </span>
        <button
          className="btn-ghost wallet-disconnect"
          type="button"
          onClick={disconnect}
        >
          Disconnect
        </button>
      </div>
    );
  }

  if (status === "connecting") {
    return (
      <button className="btn-primary wallet-btn" type="button" disabled aria-busy>
        Connecting…
      </button>
    );
  }

  return (
    <div className="wallet-status flex items-center gap-2">
      {error && (
        <span className="wallet-error" role="alert">
          {error}
        </span>
      )}
      <button
        className="btn-primary wallet-btn"
        type="button"
        onClick={connect}
        title={
          !installed
            ? "Freighter extension not detected — install it from freighter.app"
            : "Connect your Freighter wallet"
        }
      >
        {!installed ? "Install Freighter" : "Connect Wallet"}
      </button>
      {!installed && connectDemo && (
        <button
          className="btn-ghost wallet-demo-btn text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-primary/30 text-primary dark:text-cyan-400 hover:bg-primary/10 transition-colors"
          type="button"
          onClick={connectDemo}
          title="Connect simulated testnet demo wallet without browser extension"
        >
          Demo Wallet
        </button>
      )}
    </div>
  );
}
