import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Library from "@/pages/Library";
import BookDetail from "@/pages/BookDetail";
import Feedback from "@/pages/Feedback";
import Admin from "@/pages/Admin";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/library" component={Library} />
      <Route path="/books/:id" component={BookDetail} />
      <Route path="/feedback" component={Feedback} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
