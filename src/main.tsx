import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Stale logins from old Supabase projects are cleared in src/integrations/supabase/client.ts

// No StrictMode - prevents double mount issues with Supabase locks
createRoot(document.getElementById("root")!).render(<App />);
