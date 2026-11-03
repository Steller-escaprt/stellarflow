import { BrowserRouter, useNavigate, useLocation } from "react-router-dom";
import { useFreighter } from "./hooks/useFreighter";
import { useTheme } from "./hooks/useTheme";
import { StellarFlowOS, WindowId } from "./components/os/StellarFlowOS";

function AppContent() {
  const wallet = useFreighter();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const getWindowFromPath = (path: string): WindowId => {
    switch (path) {
      case "/streams":
        return "streams";
      case "/protocol":
        return "protocol";
      case "/terminal":
        return "terminal";
      case "/sender":
      case "/my-streams":
        return "sender";
      case "/recipient":
        return "recipient";
      case "/contract":
        return "contract";
      case "/settings":
        return "settings";
      case "/":
      default:
        return "home";
    }
  };

  const handleNavigate = (windowId: WindowId) => {
    if (windowId === "home") {
      navigate("/");
    } else {
      navigate(`/${windowId}`);
    }
  };

  return (
    <StellarFlowOS
      wallet={wallet}
      theme={theme}
      onToggleTheme={toggleTheme}
      initialWindow={getWindowFromPath(location.pathname)}
      onNavigate={handleNavigate}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
