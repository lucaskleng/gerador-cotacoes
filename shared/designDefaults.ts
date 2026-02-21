/**
 * Default values for design settings.
 * Used when a user has no saved settings yet.
 * Shared between client and server.
 */

export interface CompanyBranding {
  companyName: string;
  companySubtitle: string;
  logoUrl: string;
  cnpj: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

export interface PlatformTheme {
  primaryColor: string;
  primaryForeground: string;
  backgroundColor: string;
  cardColor: string;
  foregroundColor: string;
  mutedColor: string;
  borderColor: string;
}

export interface ProposalDesign {
  headerBgColor: string;
  headerTextColor: string;
  accentColor: string;
  bodyBgColor: string;
  bodyTextColor: string;
  tableBorderColor: string;
  tableHeaderBgColor: string;
  tableHeaderTextColor: string;
  tableStripedBg: string;
  titleFont: string;
  bodyFont: string;
  monoFont: string;
  fontSize: string;
  showLogo: boolean;
  showBorderLines: boolean;
  headerLayout: string;
  paperSize: string;
}

export interface DesignSettingsData {
  company: CompanyBranding;
  platformTheme: PlatformTheme;
  proposalDesign: ProposalDesign;
}

export const DEFAULT_COMPANY: CompanyBranding = {
  companyName: "Sua Empresa",
  companySubtitle: "Soluções Profissionais",
  logoUrl: "",
  cnpj: "",
  phone: "",
  email: "",
  website: "",
  address: "",
};

export const DEFAULT_PLATFORM_THEME: PlatformTheme = {
  primaryColor: "#0D7377",
  primaryForeground: "#FFFFFF",
  backgroundColor: "#FAFAF8",
  cardColor: "#FFFFFF",
  foregroundColor: "#1A1A2E",
  mutedColor: "#6B7280",
  borderColor: "#E5E5E0",
};

export const DEFAULT_PROPOSAL_DESIGN: ProposalDesign = {
  headerBgColor: "#0D7377",
  headerTextColor: "#FFFFFF",
  accentColor: "#0D7377",
  bodyBgColor: "#FFFFFF",
  bodyTextColor: "#1A1A2E",
  tableBorderColor: "#E5E5E0",
  tableHeaderBgColor: "#0D7377",
  tableHeaderTextColor: "#FFFFFF",
  tableStripedBg: "#F9FAFB",
  titleFont: "DM Sans",
  bodyFont: "DM Sans",
  monoFont: "DM Mono",
  fontSize: "medium",
  showLogo: true,
  showBorderLines: true,
  headerLayout: "left",
  paperSize: "A4",
};

export const DEFAULT_DESIGN_SETTINGS: DesignSettingsData = {
  company: DEFAULT_COMPANY,
  platformTheme: DEFAULT_PLATFORM_THEME,
  proposalDesign: DEFAULT_PROPOSAL_DESIGN,
};

/** Available font options for the proposal */
export const FONT_OPTIONS = [
  { value: "DM Sans", label: "DM Sans" },
  { value: "Inter", label: "Inter" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Poppins", label: "Poppins" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Source Sans 3", label: "Source Sans 3" },
  { value: "Nunito", label: "Nunito" },
  { value: "PT Sans", label: "PT Sans" },
];

export const MONO_FONT_OPTIONS = [
  { value: "DM Mono", label: "DM Mono" },
  { value: "JetBrains Mono", label: "JetBrains Mono" },
  { value: "Fira Code", label: "Fira Code" },
  { value: "Source Code Pro", label: "Source Code Pro" },
  { value: "IBM Plex Mono", label: "IBM Plex Mono" },
  { value: "Roboto Mono", label: "Roboto Mono" },
];

/** Preset color themes for quick selection */
export const COLOR_PRESETS = [
  {
    name: "Teal Corporativo",
    primary: "#0D7377",
    accent: "#0D7377",
    headerBg: "#0D7377",
  },
  {
    name: "Azul Profissional",
    primary: "#1E40AF",
    accent: "#1E40AF",
    headerBg: "#1E40AF",
  },
  {
    name: "Grafite Elegante",
    primary: "#374151",
    accent: "#374151",
    headerBg: "#1F2937",
  },
  {
    name: "Verde Floresta",
    primary: "#166534",
    accent: "#166534",
    headerBg: "#14532D",
  },
  {
    name: "Vinho Executivo",
    primary: "#7F1D1D",
    accent: "#991B1B",
    headerBg: "#7F1D1D",
  },
  {
    name: "Roxo Moderno",
    primary: "#6D28D9",
    accent: "#7C3AED",
    headerBg: "#5B21B6",
  },
  {
    name: "Laranja Vibrante",
    primary: "#C2410C",
    accent: "#EA580C",
    headerBg: "#9A3412",
  },
  {
    name: "Azul Marinho",
    primary: "#1E3A5F",
    accent: "#1E3A5F",
    headerBg: "#0F2440",
  },
];
