import ReactDOM from "react-dom";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Index } from ".";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Index />
    </QueryClientProvider>
  );
};

ReactDOM.render(<App />, document.getElementById("app"));
