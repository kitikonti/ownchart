/**
 * Curated color palettes for Smart Color Management
 * 27 professionally designed multi-hue palettes in 5 categories
 * Each palette has 8-10 categorically different colors for maximum distinction
 *
 * Sources:
 * - Classic: Tableau Public, D3.js (ISC license), Observable Plot
 * - Professional: Highcharts, Plotly, Apache ECharts, Google Charts,
 *   MS Office, Notion, Monday.com
 * - Design: Google Material Design, Tailwind CSS, Ant Design,
 *   IBM Carbon Design System
 * - Vibrant: Datawrapper, colorbrewer2.org, custom curated
 * - Soft: Datawrapper, D3.js (ISC), Okabe & Ito (2008), Paul Tol (SRON)
 */

import { toPaletteId, type PaletteId } from "../types/branded.types";

/**
 * Palette category for organization in UI
 */
export type PaletteCategory =
  | "classic"
  | "professional"
  | "design"
  | "vibrant"
  | "soft";

/**
 * Color palette definition
 */
export interface ColorPalette {
  id: string;
  name: string;
  category: PaletteCategory;
  colors: string[]; // 8-10 categorical hex colors
}

/** Default palette ID used when switching to theme mode without a selection */
export const DEFAULT_PALETTE_ID: PaletteId = toPaletteId("tableau-10");

/**
 * All curated palettes organized by category
 */
export const COLOR_PALETTES: ColorPalette[] = [
  // ═══════════════════════════════════════════════════════
  // CLASSIC — Data Visualization Standards
  // Sources: Tableau Public, D3.js (ISC), Observable Plot
  // ═══════════════════════════════════════════════════════

  {
    id: "tableau-10",
    name: "Tableau 10",
    category: "classic",
    colors: [
      "#4e79a7",
      "#f28e2c",
      "#e15759",
      "#76b7b2",
      "#59a14f",
      "#edc949",
      "#af7aa1",
      "#ff9da7",
      "#9c755f",
      "#bab0ab",
    ],
  },
  {
    id: "d3-category10",
    name: "D3 Category10",
    category: "classic",
    colors: [
      "#1f77b4",
      "#ff7f0e",
      "#2ca02c",
      "#d62728",
      "#9467bd",
      "#8c564b",
      "#e377c2",
      "#7f7f7f",
      "#bcbd22",
      "#17becf",
    ],
  },
  {
    id: "observable-10",
    name: "Observable 10",
    category: "classic",
    colors: [
      "#4269d0",
      "#efb118",
      "#ff725c",
      "#6cc5b0",
      "#3ca951",
      "#ff8ab7",
      "#a463f2",
      "#97bbf5",
      "#9c6b4e",
      "#9498a0",
    ],
  },
  {
    id: "d3-dark2",
    name: "D3 Dark2",
    category: "classic",
    colors: [
      "#1b9e77",
      "#d95f02",
      "#7570b3",
      "#e7298a",
      "#66a61e",
      "#e6ab02",
      "#a6761d",
      "#666666",
    ],
  },

  // ═══════════════════════════════════════════════════════
  // PROFESSIONAL — Charting Libraries & PM Tools
  // Sources: Highcharts, Plotly, Apache ECharts, Google Charts,
  //          MS Office, Notion, Monday.com
  // ═══════════════════════════════════════════════════════

  {
    id: "highcharts",
    name: "Highcharts",
    category: "professional",
    colors: [
      "#2caffe",
      "#544fc5",
      "#00e272",
      "#fe6a35",
      "#6b8abc",
      "#d568fb",
      "#2ee0ca",
      "#fa4b42",
      "#feb56a",
      "#91e8e1",
    ],
  },
  {
    id: "plotly-g10",
    name: "Plotly G10",
    category: "professional",
    colors: [
      "#636efa",
      "#ef553b",
      "#00cc96",
      "#ab63fa",
      "#ffa15a",
      "#19d3f3",
      "#ff6692",
      "#b6e880",
      "#ff97ff",
      "#fecb52",
    ],
  },
  {
    id: "echarts",
    name: "ECharts",
    category: "professional",
    colors: [
      "#5470c6",
      "#91cc75",
      "#fac858",
      "#ee6666",
      "#73c0de",
      "#3ba272",
      "#fc8452",
      "#9a60b4",
      "#ea7ccc",
      "#6dc8ec",
    ],
  },
  {
    id: "google-charts",
    name: "Google Charts",
    category: "professional",
    colors: [
      "#3366cc",
      "#dc3912",
      "#ff9900",
      "#109618",
      "#990099",
      "#0099c6",
      "#dd4477",
      "#66aa00",
      "#b82e2e",
      "#316395",
    ],
  },
  {
    id: "ms-office",
    name: "MS Office",
    category: "professional",
    colors: [
      "#4472c4",
      "#ed7d31",
      "#a5a5a5",
      "#ffc000",
      "#5b9bd5",
      "#70ad47",
      "#264478",
      "#9b57a2",
      "#636363",
      "#eb7e3a",
    ],
  },
  {
    id: "notion-labels",
    name: "Notion Labels",
    category: "professional",
    colors: [
      "#787774",
      "#976d57",
      "#cc782f",
      "#c29343",
      "#548164",
      "#487ca5",
      "#8a67ab",
      "#b35488",
      "#c4554d",
      "#373530",
    ],
  },
  {
    id: "monday",
    name: "Monday.com",
    category: "professional",
    colors: [
      "#00c875",
      "#fdab3d",
      "#e2445c",
      "#0086c0",
      "#a25ddc",
      "#037f4c",
      "#ffcb00",
      "#ff158a",
      "#579bfc",
      "#cab641",
    ],
  },

  // ═══════════════════════════════════════════════════════
  // DESIGN — Design Systems
  // Sources: Google Material Design, Tailwind CSS, Ant Design,
  //          IBM Carbon Design System
  // ═══════════════════════════════════════════════════════

  {
    id: "material-design",
    name: "Material Design",
    category: "design",
    colors: [
      "#f44336",
      "#e91e63",
      "#9c27b0",
      "#3f51b5",
      "#2196f3",
      "#009688",
      "#4caf50",
      "#ff9800",
      "#795548",
      "#607d8b",
    ],
  },
  {
    id: "tailwind-curated",
    name: "Tailwind Curated",
    category: "design",
    colors: [
      "#3b82f6",
      "#ef4444",
      "#22c55e",
      "#f97316",
      "#a855f7",
      "#06b6d4",
      "#eab308",
      "#ec4899",
      "#6366f1",
      "#14b8a6",
    ],
  },
  {
    id: "ant-design",
    name: "Ant Design",
    category: "design",
    colors: [
      "#f5222d",
      "#fa541c",
      "#fa8c16",
      "#52c41a",
      "#13c2c2",
      "#1677ff",
      "#2f54eb",
      "#722ed1",
      "#eb2f96",
      "#faad14",
    ],
  },
  {
    id: "ibm-carbon",
    name: "IBM Carbon",
    category: "design",
    colors: [
      "#6929c4",
      "#1192e8",
      "#005d5d",
      "#9f1853",
      "#fa4d56",
      "#570408",
      "#198038",
      "#002d9c",
    ],
  },

  // ═══════════════════════════════════════════════════════
  // VIBRANT — Bold & Saturated
  // Sources: Datawrapper, colorbrewer2.org, custom curated
  // ═══════════════════════════════════════════════════════

  {
    id: "bold",
    name: "Bold",
    category: "vibrant",
    colors: [
      "#7f3c8d",
      "#11a579",
      "#3969ac",
      "#f2b701",
      "#e73f74",
      "#80ba5a",
      "#e68310",
      "#008695",
      "#cf1c90",
      "#f97b72",
    ],
  },
  {
    id: "vivid",
    name: "Vivid",
    category: "vibrant",
    colors: [
      "#e58606",
      "#5d69b1",
      "#52bca3",
      "#99c945",
      "#cc61b0",
      "#24796c",
      "#daa51b",
      "#2f8ac4",
      "#764e9f",
      "#ed645a",
    ],
  },
  {
    id: "retro-metro",
    name: "Retro Metro",
    category: "vibrant",
    colors: [
      "#ea5545",
      "#f46a9b",
      "#ef9b20",
      "#edbf33",
      "#ede15b",
      "#bdcf32",
      "#87bc45",
      "#27aeef",
      "#b33dc6",
    ],
  },
  {
    id: "dutch-field",
    name: "Dutch Field",
    category: "vibrant",
    colors: [
      "#e60049",
      "#0bb4ff",
      "#50e991",
      "#e6d800",
      "#9b19f5",
      "#ffa300",
      "#dc0ab4",
      "#b3d4ff",
      "#00bfa0",
    ],
  },
  {
    id: "jewel-box",
    name: "Jewel Box",
    category: "vibrant",
    colors: [
      "#0b6623",
      "#0070c0",
      "#800080",
      "#ffd700",
      "#e0115f",
      "#50c878",
      "#4682b4",
      "#9f1d35",
      "#daa520",
      "#191970",
    ],
  },
  {
    id: "coral-reef",
    name: "Coral Reef",
    category: "vibrant",
    colors: [
      "#264653",
      "#2a9d8f",
      "#e9c46a",
      "#f4a261",
      "#e76f51",
      "#006d77",
      "#83c5be",
      "#ffddd2",
      "#e29578",
      "#8ab17d",
    ],
  },
  {
    id: "spectral",
    name: "Spectral",
    category: "vibrant",
    colors: [
      "#9e0142",
      "#d53e4f",
      "#f46d43",
      "#fdae61",
      "#fee08b",
      "#e6f598",
      "#abdda4",
      "#66c2a5",
      "#3288bd",
      "#5e4fa2",
    ],
  },

  // ═══════════════════════════════════════════════════════
  // SOFT — Pastels & Colorblind-Safe
  // Sources: Datawrapper, D3.js (ISC),
  //          Okabe & Ito (2008), Paul Tol (SRON Technical Note)
  // ═══════════════════════════════════════════════════════

  {
    id: "spring-pastels",
    name: "Spring Pastels",
    category: "soft",
    colors: [
      "#fd7f6f",
      "#7eb0d5",
      "#b2e061",
      "#bd7ebe",
      "#ffb55a",
      "#ffee65",
      "#beb9db",
      "#fdcce5",
      "#8bd3c7",
    ],
  },
  {
    id: "pastel-breeze",
    name: "Pastel Breeze",
    category: "soft",
    colors: [
      "#66c5cc",
      "#f6cf71",
      "#f89c74",
      "#dcb0f2",
      "#87c55f",
      "#9eb9f3",
      "#fe88b1",
      "#c9db74",
      "#8be0a4",
      "#b497e7",
    ],
  },
  {
    id: "d3-set2",
    name: "D3 Set2",
    category: "soft",
    colors: [
      "#66c2a5",
      "#fc8d62",
      "#8da0cb",
      "#e78ac3",
      "#a6d854",
      "#ffd92f",
      "#e5c494",
      "#b3b3b3",
    ],
  },
  {
    id: "okabe-ito",
    name: "Okabe-Ito",
    category: "soft",
    colors: [
      "#e69f00",
      "#56b4e9",
      "#009e73",
      "#f0e442",
      "#0072b2",
      "#d55e00",
      "#cc79a7",
      "#000000",
    ],
  },
  {
    id: "paul-tol-muted",
    name: "Paul Tol Muted",
    category: "soft",
    colors: [
      "#cc6677",
      "#332288",
      "#ddcc77",
      "#117733",
      "#88ccee",
      "#882255",
      "#44aa99",
      "#999933",
      "#aa4499",
    ],
  },
];

/**
 * Get palette by ID
 */
export function getPaletteById(id: string): ColorPalette | undefined {
  return COLOR_PALETTES.find((p) => p.id === id);
}

/**
 * Category display names for UI
 */
export const CATEGORY_LABELS: Record<PaletteCategory, string> = {
  classic: "Classic",
  professional: "Professional",
  design: "Design Systems",
  vibrant: "Vibrant",
  soft: "Soft & Accessible",
};

/**
 * All palette categories in display order (derived from CATEGORY_LABELS
 * so adding a new PaletteCategory forces updates in both places)
 */
export const PALETTE_CATEGORIES = Object.keys(
  CATEGORY_LABELS
) as PaletteCategory[];

/**
 * Palettes pre-grouped by category (computed once at module load)
 */
export const PALETTES_BY_CATEGORY = Object.fromEntries(
  PALETTE_CATEGORIES.map((cat) => [
    cat,
    COLOR_PALETTES.filter((p) => p.category === cat),
  ])
) as Record<PaletteCategory, ColorPalette[]>;
