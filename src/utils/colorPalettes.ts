/**
 * Curated color palettes for Smart Color Management
 * 27 professionally designed multi-hue palettes in 5 categories
 * Each palette has 8-10 categorically different colors for maximum distinction
 */

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

/**
 * All curated palettes organized by category
 */
export const COLOR_PALETTES: ColorPalette[] = [
  // ═══════════════════════════════════════════════════════
  // CLASSIC — Data Visualization Standards
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
      "#636EFA",
      "#EF553B",
      "#00CC96",
      "#AB63FA",
      "#FFA15A",
      "#19D3F3",
      "#FF6692",
      "#B6E880",
      "#FF97FF",
      "#FECB52",
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
      "#4472C4",
      "#ED7D31",
      "#A5A5A5",
      "#FFC000",
      "#5B9BD5",
      "#70AD47",
      "#264478",
      "#9B57A2",
      "#636363",
      "#EB7E3A",
    ],
  },
  {
    id: "notion-labels",
    name: "Notion Labels",
    category: "professional",
    colors: [
      "#787774",
      "#976D57",
      "#CC782F",
      "#C29343",
      "#548164",
      "#487CA5",
      "#8A67AB",
      "#B35488",
      "#C4554D",
      "#373530",
    ],
  },
  {
    id: "monday",
    name: "Monday.com",
    category: "professional",
    colors: [
      "#00C875",
      "#FDAB3D",
      "#E2445C",
      "#0086C0",
      "#A25DDC",
      "#037F4C",
      "#FFCB00",
      "#FF158A",
      "#579BFC",
      "#CAB641",
    ],
  },

  // ═══════════════════════════════════════════════════════
  // DESIGN — Design Systems
  // ═══════════════════════════════════════════════════════

  {
    id: "material-design",
    name: "Material Design",
    category: "design",
    colors: [
      "#F44336",
      "#E91E63",
      "#9C27B0",
      "#3F51B5",
      "#2196F3",
      "#009688",
      "#4CAF50",
      "#FF9800",
      "#795548",
      "#607D8B",
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
  // ═══════════════════════════════════════════════════════

  {
    id: "bold",
    name: "Bold",
    category: "vibrant",
    colors: [
      "#7F3C8D",
      "#11A579",
      "#3969AC",
      "#F2B701",
      "#E73F74",
      "#80BA5A",
      "#E68310",
      "#008695",
      "#CF1C90",
      "#f97b72",
    ],
  },
  {
    id: "vivid",
    name: "Vivid",
    category: "vibrant",
    colors: [
      "#E58606",
      "#5D69B1",
      "#52BCA3",
      "#99C945",
      "#CC61B0",
      "#24796C",
      "#DAA51B",
      "#2F8AC4",
      "#764E9F",
      "#ED645A",
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
      "#0B6623",
      "#0070C0",
      "#800080",
      "#FFD700",
      "#E0115F",
      "#50C878",
      "#4682B4",
      "#9F1D35",
      "#DAA520",
      "#191970",
    ],
  },
  {
    id: "coral-reef",
    name: "Coral Reef",
    category: "vibrant",
    colors: [
      "#264653",
      "#2A9D8F",
      "#E9C46A",
      "#F4A261",
      "#E76F51",
      "#006D77",
      "#83C5BE",
      "#FFDDD2",
      "#E29578",
      "#8AB17D",
    ],
  },
  {
    id: "spectral",
    name: "Spectral",
    category: "vibrant",
    colors: [
      "#9E0142",
      "#D53E4F",
      "#F46D43",
      "#FDAE61",
      "#FEE08B",
      "#E6F598",
      "#ABDDA4",
      "#66C2A5",
      "#3288BD",
      "#5E4FA2",
    ],
  },

  // ═══════════════════════════════════════════════════════
  // SOFT — Pastels & Colorblind-Safe
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
      "#66C5CC",
      "#F6CF71",
      "#F89C74",
      "#DCB0F2",
      "#87C55F",
      "#9EB9F3",
      "#FE88B1",
      "#C9DB74",
      "#8BE0A4",
      "#B497E7",
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
      "#E69F00",
      "#56B4E9",
      "#009E73",
      "#F0E442",
      "#0072B2",
      "#D55E00",
      "#CC79A7",
      "#000000",
    ],
  },
  {
    id: "paul-tol-muted",
    name: "Paul Tol Muted",
    category: "soft",
    colors: [
      "#CC6677",
      "#332288",
      "#DDCC77",
      "#117733",
      "#88CCEE",
      "#882255",
      "#44AA99",
      "#999933",
      "#AA4499",
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
 * Get palettes by category
 */
export function getPalettesByCategory(
  category: PaletteCategory
): ColorPalette[] {
  return COLOR_PALETTES.filter((p) => p.category === category);
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
 * All palette categories in display order
 */
export const PALETTE_CATEGORIES: PaletteCategory[] = [
  "classic",
  "professional",
  "design",
  "vibrant",
  "soft",
];
