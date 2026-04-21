/*
 * Quotation Store — Zustand
 * Design: Clean Commerce / Swiss Design Corporativo
 * Manages all wizard state: steps, customer info, line items, formatting, etc.
 */

import { create } from "zustand";
import { nanoid } from "nanoid";

// ─── Types ───────────────────────────────────────────────────────────────────

export type QuotationType = "products" | "services";

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

export interface SubItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  code?: string;
  observation?: string;
}

export interface LineItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  subItems: SubItem[];
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

  // Quotation type
  quotationType: QuotationType;

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
  setQuotationType: (type: QuotationType) => void;
  updateInfo: (info: Partial<QuotationInfo>) => void;
  addItem: () => void;
  updateItem: (id: string, updates: Partial<LineItem>) => void;
  removeItem: (id: string) => void;
  duplicateItem: (id: string) => void;
  addSubItem: (itemId: string) => void;
  updateSubItem: (itemId: string, subItemId: string, updates: Partial<SubItem>) => void;
  removeSubItem: (itemId: string, subItemId: string) => void;
  updateConditions: (conditions: Partial<CommercialConditions>) => void;
  updateTexts: (texts: Partial<FormattingTexts>) => void;
  recalculate: () => void;
  resetQuotation: () => void;
  applyTemplate: (template: {
    quotationType: QuotationType;
    validityDays: number;
    conditions: CommercialConditions;
    texts: FormattingTexts;
    defaultItems?: { description: string; unit: string; quantity: number; unitPrice: number; discount: number }[];
  }) => void;
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

const defaultConditionsProducts: CommercialConditions = {
  paymentTerms: "30 dias",
  deliveryTime: "15 dias úteis",
  freight: "CIF",
  freightValue: 0,
  warranty: "12 meses",
};

const defaultConditionsServices: CommercialConditions = {
  paymentTerms: "30/60 dias",
  deliveryTime: "A combinar",
  freight: "Não aplicável",
  freightValue: 0,
  warranty: "90 dias sobre o serviço",
};

const defaultTextsProducts: FormattingTexts = {
  headerText:
    "PROPOSTA COMERCIAL — PRODUTOS\nKL Engenharia Ltda.\nCNPJ: 00.000.000/0001-00",
  introNotes:
    'Prezado(a) ${customerName},\n\nConforme solicitação, temos o prazer de apresentar nossa proposta comercial referente ao fornecimento de materiais/equipamentos para o projeto "${reference}".\n\nSegue abaixo o detalhamento dos itens e condições comerciais.',
  commercialNotes:
    "• Condição de Pagamento: ${paymentTerms}\n• Prazo de Entrega: ${deliveryTime}\n• Frete: ${freight}\n• Garantia: ${warranty}\n• Validade da Proposta: ${validityDays} dias",
  technicalNotes:
    "Todos os equipamentos descritos nesta proposta atendem às normas técnicas vigentes (ABNT, NR-10, NR-12) e possuem certificação de qualidade.",
  closingNotes:
    "Ficamos à disposição para quaisquer esclarecimentos.\n\nAtenciosamente,\nEquipe Comercial\nKL Engenharia",
  footerText:
    "KL Engenharia Ltda. | Tel: (00) 0000-0000 | contato@klengenharia.com.br",
};

const defaultTextsServices: FormattingTexts = {
  headerText:
    "PROPOSTA COMERCIAL — SERVIÇOS\nKL Engenharia Ltda.\nCNPJ: 00.000.000/0001-00",
  introNotes:
    'Prezado(a) ${customerName},\n\nConforme solicitação, temos o prazer de apresentar nossa proposta de prestação de serviços referente ao projeto "${reference}".\n\nSegue abaixo o detalhamento do escopo, valores e condições comerciais.',
  commercialNotes:
    "• Condição de Pagamento: ${paymentTerms}\n• Prazo de Execução: ${deliveryTime}\n• Deslocamento: ${freight}\n• Garantia do Serviço: ${warranty}\n• Validade da Proposta: ${validityDays} dias",
  technicalNotes:
    "Todos os serviços descritos nesta proposta serão executados por profissionais habilitados, em conformidade com as normas técnicas vigentes (ABNT, NR-10, NR-12, NR-35).",
  closingNotes:
    "Ficamos à disposição para quaisquer esclarecimentos.\n\nAtenciosamente,\nEquipe Técnica\nKL Engenharia",
  footerText:
    "KL Engenharia Ltda. | Tel: (00) 0000-0000 | contato@klengenharia.com.br",
};

export function getDefaultConditions(type: QuotationType): CommercialConditions {
  return type === "services" ? { ...defaultConditionsServices } : { ...defaultConditionsProducts };
}

export function getDefaultTexts(type: QuotationType): FormattingTexts {
  return type === "services" ? { ...defaultTextsServices } : { ...defaultTextsProducts };
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function createEmptySubItem(): SubItem {
  return {
    id: nanoid(8),
    description: "",
    quantity: 1,
    unit: "un",
    code: "",
    observation: "",
  };
}

function createEmptyItem(type: QuotationType = "products"): LineItem {
  return {
    id: nanoid(8),
    description: "",
    unit: type === "services" ? "sv" : "un",
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    subtotal: 0,
    subItems: [],
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
  quotationType: "products",
  info: { ...defaultInfo },
  items: [createEmptyItem("products")],
  conditions: { ...defaultConditionsProducts },
  texts: { ...defaultTextsProducts },
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

  setQuotationType: (type) =>
    set((state) => ({
      quotationType: type,
      conditions: getDefaultConditions(type),
      texts: getDefaultTexts(type),
      items: state.items.length === 1 && !state.items[0].description
        ? [createEmptyItem(type)]
        : state.items,
    })),

  updateInfo: (info) =>
    set((state) => ({
      info: { ...state.info, ...info },
    })),

  addItem: () =>
    set((state) => ({
      items: [...state.items, createEmptyItem(state.quotationType)],
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
      if (items.length === 0) items.push(createEmptyItem(state.quotationType));
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
      const newItem = {
        ...source,
        id: nanoid(8),
        subItems: source.subItems.map((si) => ({ ...si, id: nanoid(8) })),
      };
      return { items: [...state.items, newItem] };
    }),

  addSubItem: (itemId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId
          ? { ...item, subItems: [...item.subItems, createEmptySubItem()] }
          : item
      ),
    })),

  updateSubItem: (itemId, subItemId, updates) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              subItems: item.subItems.map((si) =>
                si.id === subItemId ? { ...si, ...updates } : si
              ),
            }
          : item
      ),
    })),

  removeSubItem: (itemId, subItemId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId
          ? { ...item, subItems: item.subItems.filter((si) => si.id !== subItemId) }
          : item
      ),
    })),

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
      quotationType: "products",
      info: { ...defaultInfo },
      items: [createEmptyItem("products")],
      conditions: { ...defaultConditionsProducts },
      texts: { ...defaultTextsProducts },
      subtotal: 0,
      totalDiscount: 0,
      grandTotal: 0,
    }),

  applyTemplate: (template) =>
    set((state) => {
      const items: LineItem[] = template.defaultItems && template.defaultItems.length > 0
        ? template.defaultItems.map((di) => {
            const item: LineItem = {
              id: nanoid(8),
              description: di.description,
              unit: di.unit,
              quantity: di.quantity,
              unitPrice: di.unitPrice,
              discount: di.discount,
              subtotal: 0,
              subItems: [],
            };
            item.subtotal = calculateItemSubtotal(item);
            return item;
          })
        : [createEmptyItem(template.quotationType)];
      const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
      const totalDiscount = items.reduce((sum, i) => {
        const base = i.quantity * i.unitPrice;
        return sum + base * (i.discount / 100);
      }, 0);
      const freightValue = template.conditions.freightValue || 0;
      return {
        quotationType: template.quotationType,
        info: { ...state.info, validityDays: template.validityDays },
        conditions: { ...template.conditions },
        texts: { ...template.texts },
        items,
        subtotal,
        totalDiscount,
        grandTotal: subtotal + freightValue,
      };
    }),
}));
