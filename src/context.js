import { createContext, useContext } from "react";

// App-wide state (session, org, view, task drawer). Provided by <App />,
// consumed by every view via useApp(). Lives in its own module so views
// don't have to import App.jsx (which imports them back).
export const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);
