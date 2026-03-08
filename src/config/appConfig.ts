/**
 * Shape of the centralized app metadata configuration object.
 *
 * Field semantics:
 *   name          — display name of the application
 *   tagline       — short marketing description
 *   license       — SPDX license identifier
 *   appUrl        — public URL of the deployed app
 *   githubUrl     — source repository (owner-specific — update if project is transferred)
 *   sponsorUrl    — GitHub Sponsors link (owner-specific — update if project is transferred)
 *   websiteUrl    — author's personal website (owner-specific — update if project is transferred)
 *   fileExtension — file extension used for saved Gantt projects
 */
export interface AppConfig {
  name: string;
  tagline: string;
  license: string;
  appUrl: string;
  githubUrl: string;
  sponsorUrl: string;
  websiteUrl: string;
  fileExtension: string;
}

/**
 * Centralized app metadata configuration.
 * Single source of truth for app name, URLs, and branding.
 *
 * `satisfies AppConfig` enforces the shape at compile time while `as const`
 * preserves string literal types (e.g. `".ownchart"` rather than `string`),
 * keeping autocomplete and exhaustiveness checks working for consumers.
 */
export const APP_CONFIG = {
  name: "OwnChart",
  tagline:
    "Privacy-first, offline Gantt chart for project planning. Own your data.",
  license: "MIT",
  appUrl: "https://ownchart.app",
  githubUrl: "https://github.com/kitikonti/ownchart", // owner-specific — update if project is transferred
  sponsorUrl: "https://github.com/sponsors/kitikonti", // owner-specific — update if project is transferred
  websiteUrl: "https://wimmer.dev", // owner-specific — update if project is transferred
  fileExtension: ".ownchart",
} as const satisfies AppConfig;
