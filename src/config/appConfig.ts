/**
 * Centralized app metadata configuration.
 * Single source of truth for app name, URLs, and branding.
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
export const APP_CONFIG = {
  name: "OwnChart",
  tagline:
    "Privacy-first, offline Gantt chart for project planning. Own your data.",
  license: "MIT",
  appUrl: "https://ownchart.app",
  githubUrl: "https://github.com/kitikonti/ownchart",
  sponsorUrl: "https://github.com/sponsors/kitikonti",
  websiteUrl: "https://wimmer.dev",
  fileExtension: ".ownchart",
} as const;
