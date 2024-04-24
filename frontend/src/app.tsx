import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as ReactDOM from "react-dom/client";
import AppRoutes from "./AppRoutes";
import { PlaybackContextProvider } from "./context/PlaybackContext";

const queryClient = new QueryClient();

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <PlaybackContextProvider>
          <AppRoutes />
        </PlaybackContextProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("app")!).render(<App />);
