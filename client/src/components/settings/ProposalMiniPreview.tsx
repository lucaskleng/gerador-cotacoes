import type { CompanyBranding, ProposalDesign } from "../../../../shared/designDefaults";

interface ProposalMiniPreviewProps {
  company: CompanyBranding;
  design: ProposalDesign;
}

/**
 * A miniature preview of the proposal document that updates in real-time
 * as the user changes design settings.
 */
export default function ProposalMiniPreview({ company, design }: ProposalMiniPreviewProps) {
  const fontSizeMap: Record<string, string> = {
    small: "text-[6px]",
    medium: "text-[7px]",
    large: "text-[8px]",
  };
  const baseFontClass = fontSizeMap[design.fontSize] || fontSizeMap.medium;

  const headerAlignClass =
    design.headerLayout === "center"
      ? "text-center items-center"
      : design.headerLayout === "right"
        ? "text-right items-end"
        : "text-left items-start";

  return (
    <div className="w-full max-w-[320px] mx-auto">
      <p className="text-xs font-medium text-muted-foreground mb-2 text-center">
        Preview da Proposta
      </p>
      <div
        className="rounded-lg shadow-lg overflow-hidden border border-border/50"
        style={{
          backgroundColor: design.bodyBgColor,
          fontFamily: design.bodyFont,
          aspectRatio: design.paperSize === "A4" ? "210/297" : "8.5/11",
        }}
      >
        {/* Header */}
        <div
          className={`px-3 py-2.5 flex flex-col ${headerAlignClass}`}
          style={{
            backgroundColor: design.headerBgColor,
            color: design.headerTextColor,
          }}
        >
          <div className="flex items-center gap-2" style={{ flexDirection: design.headerLayout === "right" ? "row-reverse" : "row" }}>
            {design.showLogo && company.logoUrl && (
              <img
                src={company.logoUrl}
                alt="Logo"
                className="w-6 h-6 object-contain rounded"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              />
            )}
            {design.showLogo && !company.logoUrl && (
              <div
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              >
                <span className="text-[6px] font-bold" style={{ color: design.headerTextColor }}>
                  {company.companyName.charAt(0) || "E"}
                </span>
              </div>
            )}
            <div>
              <p className="text-[8px] font-bold leading-tight" style={{ fontFamily: design.titleFont }}>
                {company.companyName || "Sua Empresa"}
              </p>
              {company.companySubtitle && (
                <p className="text-[5px] opacity-80 leading-tight">
                  {company.companySubtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {design.showBorderLines && (
          <div className="h-[2px]" style={{ backgroundColor: design.accentColor }} />
        )}

        {/* Body */}
        <div className={`px-3 py-2 space-y-1.5 ${baseFontClass}`} style={{ color: design.bodyTextColor }}>
          {/* Title */}
          <div className="text-center">
            <p className="text-[9px] font-bold" style={{ fontFamily: design.titleFont, color: design.accentColor }}>
              PROPOSTA COMERCIAL
            </p>
            <p className="text-[5px] opacity-60">Nº COT-2026-0001</p>
          </div>

          {/* Customer info */}
          <div className="rounded px-1.5 py-1" style={{ backgroundColor: design.tableStripedBg }}>
            <p className="text-[5px] font-semibold" style={{ color: design.accentColor }}>
              DADOS DO CLIENTE
            </p>
            <p className="text-[5px] opacity-70">Empresa Exemplo Ltda</p>
          </div>

          {/* Table */}
          <div className="rounded overflow-hidden" style={{ border: `1px solid ${design.tableBorderColor}` }}>
            <div
              className="flex px-1.5 py-0.5"
              style={{
                backgroundColor: design.tableHeaderBgColor,
                color: design.tableHeaderTextColor,
              }}
            >
              <span className="flex-1 text-[5px] font-semibold">Descrição</span>
              <span className="w-8 text-[5px] font-semibold text-right">Qtd</span>
              <span className="w-12 text-[5px] font-semibold text-right">Valor</span>
            </div>
            <div className="flex px-1.5 py-0.5" style={{ backgroundColor: design.bodyBgColor }}>
              <span className="flex-1 text-[5px]">Item de exemplo 1</span>
              <span className="w-8 text-[5px] text-right" style={{ fontFamily: design.monoFont }}>2</span>
              <span className="w-12 text-[5px] text-right" style={{ fontFamily: design.monoFont }}>R$ 1.500</span>
            </div>
            <div className="flex px-1.5 py-0.5" style={{ backgroundColor: design.tableStripedBg }}>
              <span className="flex-1 text-[5px]">Item de exemplo 2</span>
              <span className="w-8 text-[5px] text-right" style={{ fontFamily: design.monoFont }}>5</span>
              <span className="w-12 text-[5px] text-right" style={{ fontFamily: design.monoFont }}>R$ 800</span>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="rounded px-2 py-0.5" style={{ backgroundColor: design.accentColor }}>
              <span className="text-[6px] font-bold" style={{ color: design.headerTextColor, fontFamily: design.monoFont }}>
                TOTAL: R$ 7.000,00
              </span>
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-0.5 pt-0.5">
            <p className="text-[5px] font-semibold" style={{ color: design.accentColor }}>
              CONDIÇÕES COMERCIAIS
            </p>
            <p className="text-[4px] opacity-60">Pagamento: 30/60/90 dias</p>
            <p className="text-[4px] opacity-60">Entrega: 15 dias úteis</p>
          </div>
        </div>

        {/* Footer */}
        {design.showBorderLines && (
          <div className="h-[2px] mt-auto" style={{ backgroundColor: design.accentColor }} />
        )}
        <div className="px-3 py-1" style={{ backgroundColor: design.headerBgColor }}>
          <p className="text-[4px] text-center" style={{ color: design.headerTextColor, opacity: 0.7 }}>
            {company.companyName || "Sua Empresa"} — {company.phone || "(00) 0000-0000"} — {company.email || "contato@empresa.com"}
          </p>
        </div>
      </div>
    </div>
  );
}
