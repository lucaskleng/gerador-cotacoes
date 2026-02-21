/*
 * Quotation Store — Zustand
 * Design: Clean Commerce / Swiss Design Corporativo
 * Manages all wizard state: steps, customer info, line items, formatting, etc.
 */

import { create } from "zustand";
import { nanoid } from "nanoid";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QuotationInfo {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany: string;
  customerCNPJ: string;
  customerAddress: string;
  reference: string;
  validityDays: number;
  createdAt: string;
  notes: string;
}

export interface LineItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export interface CommercialConditions {
  paymentTerms: string;
  deliveryTime: string;
  freight: string;
  freightValue: number;
  warranty: string;
}

export interface FormattingTexts {
  headerText: string;
  introNotes: string;
  commercialNotes: string;
  technicalNotes: string;
  closingNotes: string;
  footerText: string;
}

export interface QuotationState {
  // Wizard navigation
  currentStep: number;
  completedSteps: number[];

  // Step 1: Basic info
  info: QuotationInfo;

  // Step 2: Line items
  items: LineItem[];
  conditions: CommercialConditions;

  // Step 3: Formatting texts
  texts: FormattingTexts;

  // Computed
  subtotal: number;
  totalDiscount: number;
  grandTotal: number;

  // Actions
  setStep: (step: number) => void;
  markStepComplete: (step: number) => void;
  updateInfo: (info: Partial<QuotationInfo>) => void;
  addItem: () => void;
  updateItem: (id: string, updates: Partial<LineItem>) => void;
  removeItem: (id: string) => void;
  duplicateItem: (id: string) => void;
  updateConditions: (conditions: Partial<CommercialConditions>) => void;
  updateTexts: (texts: Partial<FormattingTexts>) => void;
  recalculate: () => void;
  resetQuotation: () => void;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const defaultInfo: QuotationInfo = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  customerCompany: "",
  customerCNPJ: "",
  customerAddress: "",
  reference: "",
  validityDays: 30,
  createdAt: new Date().toISOString().split("T")[0],
  notes: "",
};

const defaultConditions: CommercialConditions = {
  paymentTerms: "30 dias",
  deliveryTime: "15 dias úteis",
  freight: "CIF",
  freightValue: 0,
  warranty: "12 meses",
};

const defaultTexts: FormattingTexts = {
  headerText:
    "PROPOSTA COMERCIAL\nKL Engenharia Ltda.\nCNPJ: 00.000.000/0001-00",
  introNotes:
    'Prezado(a) ${customerName},\n\nConforme solicitação, temos o prazer de apresentar nossa proposta comercial referente ao projeto "${reference}".\n\nSegue abaixo o detalhamento dos itens e condições comerciais.',
  commercialNotes:
    "• Condição de Pagamento: ${paymentTerms}\n• Prazo de Entrega: ${deliveryTime}\n• Frete: ${freight}\n• Garantia: ${warranty}\n• Validade da Proposta: ${validityDays} dias",
  technicalNotes:
    "Todos os equipamentos e serviços descritos nesta proposta atendem às normas técnicas vigentes (ABNT, NR-10, NR-12) e serão executados por profissionais habilitados.",
  closingNotes:
    "Ficamos à disposição para quaisquer esclarecimentos.\n\nAtenciosamente,\nEquipe Comercial\nKL Engenharia",
  footerText:
    "KL Engenharia Ltda. | Tel: (00) 0000-0000 | contato@klengenharia.com.br",
};

// ─── Helper ──────────────────────────────────────────────────────────────────

function createEmptyItem(): LineItem {
  return {
    id: nanoid(8),
    description: "",
    unit: "un",
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    subtotal: 0,
  };
}

function calculateItemSubtotal(item: LineItem): number {
  const base = item.quantity * item.unitPrice;
  const disc = base * (item.discount / 100);
  return base - disc;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useQuotationStore = create<QuotationState>((set, get) => ({
  currentStep: 1,
  completedSteps: [],
  info: { ...defaultInfo },
  items: [createEmptyItem()],
  conditions: { ...defaultConditions },
  texts: { ...defaultTexts },
  subtotal: 0,
  totalDiscount: 0,
  grandTotal: 0,

  setStep: (step) => set({ currentStep: step }),

  markStepComplete: (step) =>
    set((state) => ({
      completedSteps: state.completedSteps.includes(step)
        ? state.completedSteps
        : [...state.completedSteps, step],
    })),

  updateInfo: (info) =>
    set((state) => ({
      info: { ...state.info, ...info },
    })),

  addItem: () =>
    set((state) => ({
      items: [...state.items, createEmptyItem()],
    })),

  updateItem: (id, updates) =>
    set((state) => {
      const items = state.items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        updated.subtotal = calculateItemSubtotal(updated);
        return updated;
      });
      const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
      const totalDiscount = items.reduce((sum, i) => {
        const base = i.quantity * i.unitPrice;
        return sum + base * (i.discount / 100);
      }, 0);
      const freightValue = state.conditions.freightValue || 0;
      return {
        items,
        subtotal,
        totalDiscount,
        grandTotal: subtotal + freightValue,
      };
    }),

  removeItem: (id) =>
    set((state) => {
      const items = state.items.filter((item) => item.id !== id);
      if (items.length === 0) items.push(createEmptyItem());
      const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
      const totalDiscount = items.reduce((sum, i) => {
        const base = i.quantity * i.unitPrice;
        return sum + base * (i.discount / 100);
      }, 0);
      const freightValue = state.conditions.freightValue || 0;
      return {
        items,
        subtotal,
        totalDiscount,
        grandTotal: subtotal + freightValue,
      };
    }),

  duplicateItem: (id) =>
    set((state) => {
      const source = state.items.find((i) => i.id === id);
      if (!source) return {};
      const newItem = { ...source, id: nanoid(8) };
      return { items: [...state.items, newItem] };
    }),

  updateConditions: (conditions) =>
    set((state) => {
      const updated = { ...state.conditions, ...conditions };
      return {
        conditions: updated,
        grandTotal: state.subtotal + (updated.freightValue || 0),
      };
    }),

  updateTexts: (texts) =>
    set((state) => ({
      texts: { ...state.texts, ...texts },
    })),

  recalculate: () =>
    set((state) => {
      const items = state.items.map((item) => ({
        ...item,
        subtotal: calculateItemSubtotal(item),
      }));
      const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
      const totalDiscount = items.reduce((sum, i) => {
        const base = i.quantity * i.unitPrice;
        return sum + base * (i.discount / 100);
      }, 0);
      const freightValue = state.conditions.freightValue || 0;
      return {
        items,
        subtotal,
        totalDiscount,
        grandTotal: subtotal + freightValue,
      };
    }),

  resetQuotation: () =>
    set({
      currentStep: 1,
      completedSteps: [],
      info: { ...defaultInfo },
      items: [createEmptyItem()],
      conditions: { ...defaultConditions },
      texts: { ...defaultTexts },
      subtotal: 0,
      totalDiscount: 0,
      grandTotal: 0,
    }),
}));
