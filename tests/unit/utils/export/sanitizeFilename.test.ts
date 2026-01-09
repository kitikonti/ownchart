/**
 * Unit tests for sanitizeFilename.ts
 */

import { describe, it, expect } from "vitest";
import { sanitizeFilename } from "../../../../src/utils/export/sanitizeFilename";

describe("sanitizeFilename", () => {
  describe("basic functionality", () => {
    it("returns simple names unchanged", () => {
      expect(sanitizeFilename("MyProject")).toBe("MyProject");
    });

    it("preserves numbers", () => {
      expect(sanitizeFilename("Project2024")).toBe("Project2024");
    });

    it("preserves mixed case", () => {
      expect(sanitizeFilename("MyProjectName")).toBe("MyProjectName");
    });
  });

  describe("whitespace handling", () => {
    it("replaces spaces with hyphens", () => {
      expect(sanitizeFilename("My Project")).toBe("My-Project");
    });

    it("replaces multiple spaces with single hyphen", () => {
      expect(sanitizeFilename("My   Project")).toBe("My-Project");
    });

    it("replaces tabs with hyphens", () => {
      expect(sanitizeFilename("My\tProject")).toBe("My-Project");
    });

    it("replaces newlines with hyphens", () => {
      expect(sanitizeFilename("My\nProject")).toBe("My-Project");
    });

    it("handles mixed whitespace", () => {
      expect(sanitizeFilename("My \t\n Project")).toBe("My-Project");
    });
  });

  describe("invalid character removal", () => {
    it("removes forward slashes", () => {
      expect(sanitizeFilename("My/Project")).toBe("MyProject");
    });

    it("removes backslashes", () => {
      expect(sanitizeFilename("My\\Project")).toBe("MyProject");
    });

    it("removes colons", () => {
      expect(sanitizeFilename("Project: Test")).toBe("Project-Test");
    });

    it("removes asterisks", () => {
      expect(sanitizeFilename("Project*Test")).toBe("ProjectTest");
    });

    it("removes question marks", () => {
      expect(sanitizeFilename("Project?")).toBe("Project");
    });

    it("removes double quotes", () => {
      expect(sanitizeFilename('Project "Test"')).toBe("Project-Test");
    });

    it("removes angle brackets", () => {
      expect(sanitizeFilename("Project<Test>")).toBe("ProjectTest");
    });

    it("removes pipes", () => {
      expect(sanitizeFilename("Project|Test")).toBe("ProjectTest");
    });

    it("removes multiple invalid characters", () => {
      expect(sanitizeFilename('File: <Test> | "Name"?')).toBe("File-Test-Name");
    });
  });

  describe("hyphen normalization", () => {
    it("collapses multiple hyphens", () => {
      expect(sanitizeFilename("My--Project")).toBe("My-Project");
    });

    it("removes leading hyphens", () => {
      expect(sanitizeFilename("-MyProject")).toBe("MyProject");
    });

    it("removes trailing hyphens", () => {
      expect(sanitizeFilename("MyProject-")).toBe("MyProject");
    });

    it("removes both leading and trailing hyphens", () => {
      expect(sanitizeFilename("--MyProject--")).toBe("MyProject");
    });

    it("handles hyphens created from invalid char removal", () => {
      expect(sanitizeFilename(": My Project :")).toBe("My-Project");
    });
  });

  describe("length truncation", () => {
    it("truncates names longer than 50 characters", () => {
      const longName = "A".repeat(60);
      expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(50);
    });

    it("preserves names exactly 50 characters", () => {
      const exactName = "A".repeat(50);
      expect(sanitizeFilename(exactName)).toBe(exactName);
    });

    it("removes trailing hyphens after truncation", () => {
      const name = "A".repeat(49) + " B";
      const result = sanitizeFilename(name);
      expect(result.endsWith("-")).toBe(false);
    });
  });

  describe("empty/invalid input handling", () => {
    it("returns untitled for empty string", () => {
      expect(sanitizeFilename("")).toBe("untitled");
    });

    it("returns untitled for whitespace-only string", () => {
      expect(sanitizeFilename("   ")).toBe("untitled");
    });

    it("returns untitled for string with only invalid characters", () => {
      expect(sanitizeFilename("/:*?")).toBe("untitled");
    });
  });

  describe("unicode preservation", () => {
    it("preserves German umlauts", () => {
      expect(sanitizeFilename("Übersicht")).toBe("Übersicht");
    });

    it("preserves French accents", () => {
      expect(sanitizeFilename("Résumé")).toBe("Résumé");
    });

    it("preserves Chinese characters", () => {
      expect(sanitizeFilename("项目")).toBe("项目");
    });

    it("preserves emoji", () => {
      expect(sanitizeFilename("Project 🚀")).toBe("Project-🚀");
    });
  });

  describe("real-world examples", () => {
    it("handles typical project names", () => {
      expect(sanitizeFilename("Website Redesign 2024")).toBe(
        "Website-Redesign-2024"
      );
    });

    it("handles project names with version numbers", () => {
      expect(sanitizeFilename("App v2.0.1")).toBe("App-v2.0.1");
    });

    it("handles company names with special chars", () => {
      expect(sanitizeFilename("Acme Corp: Q4 Project")).toBe(
        "Acme-Corp-Q4-Project"
      );
    });
  });
});
