/*
 * Home Page — Quotation Generator
 * Design: Clean Commerce / Swiss Design Corporativo
 * DM Sans + DM Mono | Teal accent (#0D7377) | Warm off-white background
 */

import WizardStepper from "@/components/WizardStepper";
import WizardContainer from "@/components/WizardContainer";
import { useQuotationStore } from "@/store/quotationStore";
import { FileText, RotateCcw, LayoutList, LogIn, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { resetQuotation, info, grandTotal } = useQuotationStore();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const handleReset = () => {
    if (
      info.customerName.trim() ||
      grandTotal > 0
    ) {
      if (!window.confirm("Deseja realmente iniciar uma nova cotação? Os dados atuais serão perdidos.")) {
        return;
      }
    }
    resetQuotation();
    toast.info("Cotação reiniciada.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 no-print">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight">
                Quotation Generator
              </h1>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Gerador de Cotações
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground gap-1.5 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova Cotação</span>
            </Button>
            {isAuthenticated ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/cotacoes")}
                  className="gap-1.5 text-xs"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Minhas Cotações</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/configuracoes")}
                  className="text-muted-foreground hover:text-foreground gap-1.5 text-xs"
                  title="Configurações de Design"
                >
                  <Settings className="w-3.5 h-3.5" />
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-1.5 text-xs"
              >
                <a href={getLoginUrl()}>
                  <LogIn className="w-3.5 h-3.5" />
                  Entrar
                </a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Stepper */}
      <div className="border-b border-border/50 bg-card/40 no-print">
        <div className="container">
          <WizardStepper />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container py-6">
        <WizardContainer />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 no-print">
        <div className="container">
          <p className="text-xs text-muted-foreground text-center">
            Quotation Generator &mdash; Sistema de Cotações
          </p>
        </div>
      </footer>
    </div>
  );
}
