import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as ReactDOM from "react-dom/client";
import AppRoutes from "./AppRoutes";
import { Auth0Provider } from "@auth0/auth0-react";
import { SpotifyAuthContextProvider } from "./context/SpotifyAuthcontext";

const auth0Domain = process.env.AUTH0_DOMAIN ?? "";
const auth0ClientId = process.env.AUTH0_CLIENT_ID ?? "";
const queryClient = new QueryClient();

const App = () => {
  return (
    <React.StrictMode>
      <Auth0Provider
        domain={auth0Domain}
        clientId={auth0ClientId}
        authorizationParams={{
          redirect_uri: `${window.location.href}login`,
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
