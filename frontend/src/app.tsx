import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as ReactDOM from "react-dom/client";
import AppRoutes from "./AppRoutes";
import { Auth0Provider } from "@auth0/auth0-react";
import { SpotifyAuthContextProvider } from "./context/SpotifyAuthcontext";

const queryClient = new QueryClient();

const App = () => {
  return (
    <React.StrictMode>
      <Auth0Provider
        domain="dev-3tozp8qy1u0rfxfm.us.auth0.com"
        clientId="vlvk6JVXllIpfJEElGtEZnjmfG5NvVo3"
        authorizationParams={{
          redirect_uri: "http://localhost:8080/login",
          audience: "https://playmanbackend.com"
        }}
      >
        <QueryClientProvider client={queryClient}>
          <SpotifyAuthContextProvider>
            <AppRoutes />
          </SpotifyAuthContextProvider>
        </QueryClientProvider>
      </Auth0Provider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("app")!).render(<App />);
