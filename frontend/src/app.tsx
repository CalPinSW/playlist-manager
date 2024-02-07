import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfigModule from "../tailwind.config";
import * as ReactDOM from "react-dom/client";
import AppRoutes from "./AppRoutes";

const tailwindConfig = resolveConfig(tailwindConfigModule);

const queryClient = new QueryClient();
const theme = createTheme({
  palette: {
    primary: {
      main: tailwindConfig.theme.colors.primary[500],
      dark: tailwindConfig.theme.colors.primary[200],
      light: tailwindConfig.theme.colors.primary[700],
    },
    secondary: {
      main: tailwindConfig.theme.colors.secondary[500],
      dark: tailwindConfig.theme.colors.secondary[200],
      light: tailwindConfig.theme.colors.secondary[700],
    },
    warning: {
      main: tailwindConfig.theme.colors.warning[500],
      dark: tailwindConfig.theme.colors.warning[200],
      light: tailwindConfig.theme.colors.warning[700],
    },
    text: { primary: tailwindConfig.theme.colors.text.primary },
  },
});

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <AppRoutes />
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("app")!).render(<App />);
