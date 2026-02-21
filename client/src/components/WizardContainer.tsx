/*
 * WizardContainer — Orchestrates the 4-step quotation wizard
 * Design: Clean Commerce / Swiss Design
 * AnimatePresence for smooth step transitions
 */

import { useQuotationStore } from "@/store/quotationStore";
import { AnimatePresence } from "framer-motion";
import Step1CreateQuotation from "./steps/Step1CreateQuotation";
import Step2DetailItems from "./steps/Step2DetailItems";
import Step3FormatTexts from "./steps/Step3FormatTexts";
import Step4Preview from "./steps/Step4Preview";

export default function WizardContainer() {
  const currentStep = useQuotationStore((s) => s.currentStep);

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {currentStep === 1 && <Step1CreateQuotation key="step1" />}
        {currentStep === 2 && <Step2DetailItems key="step2" />}
        {currentStep === 3 && <Step3FormatTexts key="step3" />}
        {currentStep === 4 && <Step4Preview key="step4" />}
      </AnimatePresence>
    </div>
  );
}
