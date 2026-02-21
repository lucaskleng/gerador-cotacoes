/**
 * Formatting utilities for the Quotation Generator
 * Design: Clean Commerce — values always in BRL with tabular alignment
 */

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T12:00:00");
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T12:00:00");
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

/**
 * Interpolate template variables like ${customerName} with actual values
 */
export function interpolateTemplate(
  template: string,
  variables: Record<string, string | number>
): string {
  return template.replace(/\$\{(\w+)\}/g, (match, key) => {
    const value = variables[key];
    if (value === undefined) return match;
    return String(value);
  });
}

export function generateQuotationNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 9999)).padStart(4, "0");
  return `COT-${year}${month}-${random}`;
}
