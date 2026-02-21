/*
 * WizardStepper — Horizontal stepper with Swiss Design aesthetic
 * Minimal dots connected by lines, active step highlighted in teal
 */

import { useQuotationStore } from "@/store/quotationStore";
import { Check, FileText, List, Palette, Eye } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  { id: 1, label: "Criar Cotação", icon: FileText },
  { id: 2, label: "Detalhar Itens", icon: List },
  { id: 3, label: "Formatar Textos", icon: Palette },
  { id: 4, label: "Finalizar", icon: Eye },
];

export default function WizardStepper() {
  const { currentStep, completedSteps, setStep } = useQuotationStore();

  return (
    <nav className="w-full py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between relative">
          {/* Connecting line */}
          <div className="absolute top-5 left-0 right-0 h-px bg-border z-0" />
          <div
            className="absolute top-5 left-0 h-px bg-primary z-0 transition-all duration-500 ease-out"
            style={{
              width: `${((Math.min(currentStep, 4) - 1) / 3) * 100}%`,
            }}
          />

          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = completedSteps.includes(step.id);
            const isAccessible = step.id <= Math.max(currentStep, ...completedSteps, 1);
            const Icon = step.icon;

            return (
              <button
                key={step.id}
                onClick={() => isAccessible && setStep(step.id)}
                disabled={!isAccessible}
                className="relative z-10 flex flex-col items-center gap-2 group"
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1 : 0.9,
                    backgroundColor: isCompleted
                      ? "var(--primary)"
                      : isActive
                        ? "var(--primary)"
                        : "var(--background)",
                  }}
                  transition={{ duration: 0.2 }}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    border-2 transition-colors duration-200
                    ${
                      isCompleted
                        ? "border-primary"
                        : isActive
                          ? "border-primary shadow-sm shadow-primary/20"
                          : isAccessible
                            ? "border-muted-foreground/30 group-hover:border-primary/50"
                            : "border-border"
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-primary-foreground" />
                  ) : (
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? "text-primary-foreground"
                          : isAccessible
                            ? "text-muted-foreground group-hover:text-foreground"
                            : "text-border"
                      }`}
                    />
                  )}
                </motion.div>
                <span
                  className={`text-xs font-medium transition-colors duration-200 whitespace-nowrap ${
                    isActive
                      ? "text-primary"
                      : isCompleted
                        ? "text-foreground"
                        : isAccessible
                          ? "text-muted-foreground group-hover:text-foreground"
                          : "text-border"
                  }`}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
