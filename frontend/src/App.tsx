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
      case "/projects":
      case "/streams":
        return "projects";
      case "/terminal":
        return "terminal";
      case "/notes":
        return "notes";
      case "/playground":
        return "playground";
      case "/contract":
        return "contract";
      case "/skills":
        return "skills";
      case "/settings":
        return "settings";
      case "/sender":
      case "/my-streams":
        return "sender";
      case "/recipient":
        return "recipient";
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
