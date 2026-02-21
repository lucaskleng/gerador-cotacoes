/*
 * useCnpjLookup — Hook para consulta de CNPJ via BrasilAPI
 * Busca dados da empresa automaticamente ao detectar um CNPJ válido (14 dígitos)
 * Endpoint: GET https://brasilapi.com.br/api/cnpj/v1/{cnpj}
 */

import { useState, useCallback, useRef } from "react";

export interface CnpjData {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  uf: string;
  cep: string;
  bairro: string;
  numero: string;
  municipio: string;
  logradouro: string;
  complemento: string;
  ddd_telefone_1: string;
  ddd_telefone_2: string;
  email: string | null;
  situacao_cadastral: number;
  descricao_situacao_cadastral: string;
  descricao_tipo_de_logradouro: string;
  natureza_juridica: string;
  capital_social: number;
  porte: string;
}

interface UseCnpjLookupReturn {
  loading: boolean;
  error: string | null;
  data: CnpjData | null;
  lookup: (cnpj: string) => Promise<CnpjData | null>;
}

function stripCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

function isValidCnpjFormat(cnpj: string): boolean {
  const digits = stripCnpj(cnpj);
  return digits.length === 14;
}

function formatCnpjDisplay(cnpj: string): string {
  const digits = stripCnpj(cnpj);
  if (digits.length !== 14) return cnpj;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

function formatPhone(ddd_phone: string): string {
  if (!ddd_phone || ddd_phone.trim() === "") return "";
  const digits = ddd_phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return ddd_phone;
}

function buildAddress(data: CnpjData): string {
  const parts: string[] = [];
  
  if (data.descricao_tipo_de_logradouro && data.logradouro) {
    parts.push(`${data.descricao_tipo_de_logradouro} ${data.logradouro}`);
  } else if (data.logradouro) {
    parts.push(data.logradouro);
  }
  
  if (data.numero) {
    parts.push(data.numero);
  }
  
  if (data.complemento) {
    parts.push(data.complemento);
  }
  
  let address = parts.join(", ");
  
  if (data.bairro) {
    address += ` — ${data.bairro}`;
  }
  
  if (data.municipio && data.uf) {
    address += `, ${data.municipio}/${data.uf}`;
  }
  
  if (data.cep) {
    const cep = data.cep.replace(/(\d{5})(\d{3})/, "$1-$2");
    address += ` — CEP: ${cep}`;
  }
  
  return address;
}

export function useCnpjLookup(): UseCnpjLookupReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CnpjData | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const lookup = useCallback(async (cnpj: string): Promise<CnpjData | null> => {
    const digits = stripCnpj(cnpj);

    if (!isValidCnpjFormat(cnpj)) {
      setError(null);
      setData(null);
      return null;
    }

    // Abort previous request if still in flight
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${digits}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("CNPJ não encontrado na base da Receita Federal.");
        } else if (response.status === 400) {
          setError("CNPJ inválido. Verifique os dígitos.");
        } else {
          setError("Erro ao consultar CNPJ. Tente novamente.");
        }
        setData(null);
        setLoading(false);
        return null;
      }

      const result: CnpjData = await response.json();
      setData(result);
      setError(null);
      setLoading(false);
      return result;
    } catch (err: any) {
      if (err.name === "AbortError") {
        return null;
      }
      setError("Falha na conexão. Verifique sua internet e tente novamente.");
      setData(null);
      setLoading(false);
      return null;
    }
  }, []);

  return { loading, error, data, lookup };
}

export { stripCnpj, isValidCnpjFormat, formatCnpjDisplay, formatPhone, buildAddress };
