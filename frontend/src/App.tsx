import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { OfflineBanner } from "./components/OfflineBanner";
import { useFreighter } from "./hooks/useFreighter";
import { useTheme } from "./hooks/useTheme";
import { DashboardPage } from "./pages/DashboardPage";
import { SenderDashboard as SenderDashboardPage } from "./pages/SenderDashboard";

const SenderDashboard = lazy(() =>
  import("./components/SenderDashboard").then((m) => ({ default: m.SenderDashboard })),
);
const RecipientDashboard = lazy(() =>
  import("./components/RecipientDashboard").then((m) => ({ default: m.RecipientDashboard })),
);

function AppContent() {
  const wallet = useFreighter();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (
      path !== "/" &&
      path !== "/sender" &&
      path !== "/recipient" &&
      path !== "/my-streams"
    ) {
      navigate("/");
    }
  }, [location.pathname, navigate]);

  const currentTab =
    location.pathname === "/sender"
      ? "sender"
      : location.pathname === "/recipient"
        ? "recipient"
        : "dashboard";

  const handleOpenCreate = () => {
    window.dispatchEvent(new CustomEvent("stellarflow:open-create"));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0D17] text-gray-900 dark:text-gray-100 transition-colors">
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => navigate(tab === "dashboard" ? "/" : "/" + tab)}
        onOpenCreate={handleOpenCreate}
        wallet={wallet}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <OfflineBanner />

        <Suspense fallback={<div className="py-12 text-center text-gray-400">Loading…</div>}>
          <Routes>
            <Route path="/" element={<DashboardPage wallet={wallet} />} />
            <Route
              path="/sender"
              element={<SenderDashboard senderAddress={wallet.address} onEditStartTime={() => {}} />}
            />
            <Route
              path="/recipient"
              element={<RecipientDashboard recipientAddress={wallet.address} />}
            />
            <Route path="/my-streams" element={<SenderDashboardPage wallet={wallet} />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
