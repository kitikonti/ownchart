/**
 * Unit tests for appConfig — guards against accidental regressions in
 * critical app metadata constants (URL format, file extension, etc.).
 */

import { describe, it, expect } from "vitest";
import { APP_CONFIG } from "@/config/appConfig";

describe("APP_CONFIG", () => {
  it("should have a non-empty app name", () => {
    expect(APP_CONFIG.name.length).toBeGreaterThan(0);
  });

  it("should have a valid appUrl starting with https://", () => {
    expect(APP_CONFIG.appUrl).toMatch(/^https:\/\//);
  });

  it("should have a valid githubUrl pointing to github.com", () => {
    expect(APP_CONFIG.githubUrl).toMatch(/^https:\/\/github\.com\//);
  });

  it("should have a valid sponsorUrl pointing to github.com/sponsors", () => {
    expect(APP_CONFIG.sponsorUrl).toMatch(/^https:\/\/github\.com\/sponsors\//);
  });

  it("should have the correct file extension", () => {
    expect(APP_CONFIG.fileExtension).toBe(".ownchart");
  });

  it("should use the MIT license identifier", () => {
    expect(APP_CONFIG.license).toBe("MIT");
  });

  it("should have a non-empty tagline", () => {
    expect(APP_CONFIG.tagline.length).toBeGreaterThan(0);
  });

  it("should have a valid websiteUrl starting with https://", () => {
    expect(APP_CONFIG.websiteUrl).toMatch(/^https:\/\//);
  });
});
