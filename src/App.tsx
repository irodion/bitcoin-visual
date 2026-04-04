import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import {
  ErrorBoundary,
  LoadingFallback,
  OfflineIndicator,
  UpdateBanner,
  InstallPrompt,
} from "./shared/components/index.ts";

const Landing = lazy(() => import("./pages/Landing"));
const WhyBitcoinExists = lazy(() => import("./modules/00-intro/WhyBitcoinExists"));
const HashPlayground = lazy(() => import("./modules/01-hash/HashPlayground"));
const KeysExplorer = lazy(() => import("./modules/02-keys/KeysExplorer"));
const UTXOBuilder = lazy(() => import("./modules/03-utxo/UTXOBuilder"));
const BlockchainSimulator = lazy(() => import("./modules/04-blockchain/BlockchainSimulator"));
const HDWalletExplorer = lazy(() => import("./modules/05-hd-wallet/HDWalletExplorer"));
const MultisigVault = lazy(() => import("./modules/06-multisig/MultisigVault"));
const OutputDescriptors = lazy(() => import("./modules/08-descriptors/OutputDescriptors"));
const AttackLab = lazy(() => import("./modules/07-attacks/AttackLab"));
const Settings = lazy(() => import("./pages/Settings"));
const Credits = lazy(() => import("./pages/Credits"));

export default function App() {
  return (
    <>
      <OfflineIndicator />
      <UpdateBanner />
      <InstallPrompt />
      <ErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/intro" element={<WhyBitcoinExists />} />
              <Route path="/hash" element={<HashPlayground />} />
              <Route path="/keys" element={<KeysExplorer />} />
              <Route path="/utxo" element={<UTXOBuilder />} />
              <Route path="/blockchain" element={<BlockchainSimulator />} />
              <Route path="/hd-wallet" element={<HDWalletExplorer />} />
              <Route path="/multisig" element={<MultisigVault />} />
              <Route path="/descriptors" element={<OutputDescriptors />} />
              <Route path="/attacks" element={<AttackLab />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/credits" element={<Credits />} />
              <Route
                path="*"
                element={
                  <div className="flex min-h-screen items-center justify-center text-text-secondary">
                    404 — Page not found
                  </div>
                }
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    </>
  );
}
