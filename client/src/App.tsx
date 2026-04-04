import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import QuotationList from "./pages/QuotationList";
import QuotationView from "./pages/QuotationView";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import Templates from "./pages/Templates";
import TechnicalProposal from "./pages/TechnicalProposal";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/cotacoes"} component={QuotationList} />
      <Route path={"/cotacao/:id"} component={QuotationView} />
      <Route path={"/editar/:id"} component={QuotationView} />
      <Route path={"/configuracoes"} component={Settings} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/templates"} component={Templates} />
      <Route path={"/proposta-tecnica"} component={TechnicalProposal} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
