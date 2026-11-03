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
      case "/projects":
        return "streams";
      case "/vesting":
      case "/playground":
        return "vesting";
      case "/contract":
        return "contract";
      case "/payroll":
      case "/notes":
        return "payroll";
      case "/claims":
      case "/recipient":
        return "claims";
      case "/architecture":
      case "/skills":
        return "architecture";
      case "/terminal":
        return "terminal";
      case "/settings":
        return "settings";
      case "/sender":
      case "/my-streams":
        return "sender";
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
