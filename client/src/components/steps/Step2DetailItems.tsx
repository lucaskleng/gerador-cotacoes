/*
 * Step 2 — Detalhar Itens
 * Design: Clean Commerce / Swiss Design
 * Grid/Table with reactive subtotal/total calculations
 * Monetary values in DM Mono, right-aligned
 */

import { useQuotationStore } from "@/store/quotationStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Copy,
  Package,
  Truck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

export default function Step2DetailItems() {
  const {
    items,
    conditions,
    subtotal,
    totalDiscount,
    grandTotal,
    addItem,
    updateItem,
    removeItem,
    duplicateItem,
    updateConditions,
    setStep,
    markStepComplete,
  } = useQuotationStore();

  const handleNext = () => {
    const hasValidItem = items.some(
      (i) => i.description.trim() && i.quantity > 0 && i.unitPrice > 0
    );
    if (!hasValidItem) {
      toast.error("Adicione pelo menos um item com descrição, quantidade e preço.");
      return;
    }
    markStepComplete(2);
    setStep(3);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* Items Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Itens da Cotação</CardTitle>
                <CardDescription>
                  Adicione produtos ou serviços. Os totais são calculados automaticamente.
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Adicionar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[1fr_80px_80px_110px_80px_110px_70px] gap-3 px-3 pb-2 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Descrição
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Unid.
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
              Qtd.
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
              Preço Unit.
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
              Desc. %
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
              Subtotal
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
              Ações
            </span>
          </div>

          {/* Items */}
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="border-b border-border/50 last:border-0"
              >
                {/* Desktop Row */}
                <div className="hidden md:grid grid-cols-[1fr_80px_80px_110px_80px_110px_70px] gap-3 py-3 px-3 items-center group hover:bg-muted/30 transition-colors rounded-md">
                  <Input
                    placeholder={`Item ${index + 1} — Ex: Motor Weg 220V`}
                    value={item.description}
                    onChange={(e) =>
                      updateItem(item.id, { description: e.target.value })
                    }
                    className="h-9 text-sm"
                  />
                  <Select
                    value={item.unit}
                    onValueChange={(v) => updateItem(item.id, { unit: v })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="un">un</SelectItem>
                      <SelectItem value="pç">pç</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                      <SelectItem value="m²">m²</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="hr">hr</SelectItem>
                      <SelectItem value="vb">vb</SelectItem>
                      <SelectItem value="cj">cj</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={item.quantity || ""}
                    onChange={(e) =>
                      updateItem(item.id, { quantity: Number(e.target.value) || 0 })
                    }
                    className="h-9 text-sm text-right font-mono"
                  />
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.unitPrice || ""}
                    onChange={(e) =>
                      updateItem(item.id, {
                        unitPrice: Number(e.target.value) || 0,
                      })
                    }
                    className="h-9 text-sm text-right font-mono"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={item.discount || ""}
                    onChange={(e) =>
                      updateItem(item.id, {
                        discount: Number(e.target.value) || 0,
                      })
                    }
                    className="h-9 text-sm text-right font-mono"
                  />
                  <div className="text-right font-mono text-sm font-medium tabular-nums">
                    {formatCurrency(item.subtotal)}
                  </div>
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => duplicateItem(item.id)}
                      className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title="Duplicar"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Mobile Card */}
                <div className="md:hidden p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Item {index + 1}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => duplicateItem(item.id)}
                        className="p-1.5 rounded hover:bg-accent text-muted-foreground"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <Input
                    placeholder="Descrição do item"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(item.id, { description: e.target.value })
                    }
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Qtd.</Label>
                      <Input
                        type="number"
                        min={0}
                        value={item.quantity || ""}
                        onChange={(e) =>
                          updateItem(item.id, {
                            quantity: Number(e.target.value) || 0,
                          })
                        }
                        className="text-right font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Preço Unit.</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPrice || ""}
                        onChange={(e) =>
                          updateItem(item.id, {
                            unitPrice: Number(e.target.value) || 0,
                          })
                        }
                        className="text-right font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Desc. %</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={item.discount || ""}
                        onChange={(e) =>
                          updateItem(item.id, {
                            discount: Number(e.target.value) || 0,
                          })
                        }
                        className="text-right font-mono"
                      />
                    </div>
                  </div>
                  <div className="text-right font-mono text-sm font-medium">
                    Subtotal: {formatCurrency(item.subtotal)}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add item button (bottom) */}
          <button
            onClick={addItem}
            className="w-full py-3 mt-2 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar novo item
          </button>

          {/* Totals Summary */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-8 text-sm">
                <span className="text-muted-foreground">Subtotal dos Itens</span>
                <span className="font-mono tabular-nums w-32 text-right">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex items-center gap-8 text-sm">
                  <span className="text-muted-foreground">Descontos</span>
                  <span className="font-mono tabular-nums w-32 text-right text-destructive">
                    -{formatCurrency(totalDiscount)}
                  </span>
                </div>
              )}
              {conditions.freightValue > 0 && (
                <div className="flex items-center gap-8 text-sm">
                  <span className="text-muted-foreground">Frete ({conditions.freight})</span>
                  <span className="font-mono tabular-nums w-32 text-right">
                    {formatCurrency(conditions.freightValue)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-8 text-base font-semibold pt-2 border-t border-border mt-1">
                <span>Total Geral</span>
                <span className="font-mono tabular-nums w-32 text-right text-primary">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commercial Conditions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Truck className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Condições Comerciais</CardTitle>
              <CardDescription>Pagamento, entrega, frete e garantia</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Condição de Pagamento</Label>
              <Select
                value={conditions.paymentTerms}
                onValueChange={(v) => updateConditions({ paymentTerms: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="À vista">À vista</SelectItem>
                  <SelectItem value="7 dias">7 dias</SelectItem>
                  <SelectItem value="14 dias">14 dias</SelectItem>
                  <SelectItem value="21 dias">21 dias</SelectItem>
                  <SelectItem value="30 dias">30 dias</SelectItem>
                  <SelectItem value="30/60 dias">30/60 dias</SelectItem>
                  <SelectItem value="30/60/90 dias">30/60/90 dias</SelectItem>
                  <SelectItem value="A combinar">A combinar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prazo de Entrega</Label>
              <Select
                value={conditions.deliveryTime}
                onValueChange={(v) => updateConditions({ deliveryTime: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Imediato">Imediato</SelectItem>
                  <SelectItem value="5 dias úteis">5 dias úteis</SelectItem>
                  <SelectItem value="10 dias úteis">10 dias úteis</SelectItem>
                  <SelectItem value="15 dias úteis">15 dias úteis</SelectItem>
                  <SelectItem value="20 dias úteis">20 dias úteis</SelectItem>
                  <SelectItem value="30 dias úteis">30 dias úteis</SelectItem>
                  <SelectItem value="45 dias úteis">45 dias úteis</SelectItem>
                  <SelectItem value="A combinar">A combinar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Frete</Label>
              <Select
                value={conditions.freight}
                onValueChange={(v) => updateConditions({ freight: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CIF">CIF (por conta do vendedor)</SelectItem>
                  <SelectItem value="FOB">FOB (por conta do comprador)</SelectItem>
                  <SelectItem value="Retirada">Retirada no local</SelectItem>
                  <SelectItem value="A combinar">A combinar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor do Frete (R$)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={conditions.freightValue || ""}
                onChange={(e) =>
                  updateConditions({
                    freightValue: Number(e.target.value) || 0,
                  })
                }
                className="font-mono text-right"
              />
            </div>
            <div className="space-y-2">
              <Label>Garantia</Label>
              <Select
                value={conditions.warranty}
                onValueChange={(v) => updateConditions({ warranty: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3 meses">3 meses</SelectItem>
                  <SelectItem value="6 meses">6 meses</SelectItem>
                  <SelectItem value="12 meses">12 meses</SelectItem>
                  <SelectItem value="24 meses">24 meses</SelectItem>
                  <SelectItem value="Conforme fabricante">Conforme fabricante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-2 pb-8">
        <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button onClick={handleNext} size="lg" className="gap-2">
          Continuar para Textos
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
