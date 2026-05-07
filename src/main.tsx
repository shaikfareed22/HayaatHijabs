import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Clear stale auth from old projects
try {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-') && !key.includes('bcgcxflakiyhqbmcixgv')) {
      localStorage.removeItem(key);
    }
  });
} catch (e) {}

// No StrictMode - prevents double mount issues with Supabase locks
createRoot(document.getElementById("root")!).render(<App />);
