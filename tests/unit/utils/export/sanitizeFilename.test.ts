import { describe, it, expect } from "vitest";
import { sanitizeFilename } from "../../../../src/utils/export/sanitizeFilename";

describe("sanitizeFilename", () => {
  describe("basic functionality", () => {
    it("should return the name unchanged if valid", () => {
      expect(sanitizeFilename("MyProject")).toBe("MyProject");
    });

    it("should replace spaces with hyphens", () => {
      expect(sanitizeFilename("My Project")).toBe("My-Project");
      expect(sanitizeFilename("My  Project")).toBe("My-Project");
    });

    it("should collapse multiple hyphens into one", () => {
      expect(sanitizeFilename("My--Project")).toBe("My-Project");
      expect(sanitizeFilename("My---Project")).toBe("My-Project");
    });

    it("should remove leading and trailing hyphens", () => {
      expect(sanitizeFilename("-MyProject-")).toBe("MyProject");
      expect(sanitizeFilename("--MyProject--")).toBe("MyProject");
    });
  });

  describe("invalid characters", () => {
    it("should remove forward slashes", () => {
      expect(sanitizeFilename("Project/Client")).toBe("ProjectClient");
    });

    it("should remove backslashes", () => {
      expect(sanitizeFilename("Project\\Client")).toBe("ProjectClient");
    });

    it("should remove colons", () => {
      expect(sanitizeFilename("Project:Phase1")).toBe("ProjectPhase1");
    });

    it("should remove asterisks", () => {
      expect(sanitizeFilename("Project*Important")).toBe("ProjectImportant");
    });

    it("should remove question marks", () => {
      expect(sanitizeFilename("Project?")).toBe("Project");
    });

    it("should remove double quotes", () => {
      expect(sanitizeFilename('Project "Alpha"')).toBe("Project-Alpha");
    });

    it("should remove angle brackets", () => {
      expect(sanitizeFilename("Project<Test>")).toBe("ProjectTest");
    });

    it("should remove pipe characters", () => {
      expect(sanitizeFilename("Project|Client")).toBe("ProjectClient");
    });

    it("should handle multiple invalid characters", () => {
      expect(sanitizeFilename("Pro/ject:Te*st?")).toBe("ProjectTest");
    });
  });

  describe("unicode characters", () => {
    it("should preserve German umlauts", () => {
      expect(sanitizeFilename("Projektübersicht")).toBe("Projektübersicht");
    });

    it("should preserve French accents", () => {
      expect(sanitizeFilename("Café Project")).toBe("Café-Project");
    });

    it("should preserve Japanese characters", () => {
      expect(sanitizeFilename("プロジェクト")).toBe("プロジェクト");
    });

    it("should preserve Chinese characters", () => {
      expect(sanitizeFilename("项目计划")).toBe("项目计划");
    });

    it("should preserve emojis", () => {
      expect(sanitizeFilename("Project 🚀")).toBe("Project-🚀");
    });
  });

  describe("length limits", () => {
    it("should truncate names longer than 50 characters", () => {
      const longName = "A".repeat(60);
      expect(sanitizeFilename(longName).length).toBe(50);
    });

    it("should not truncate names at or below 50 characters", () => {
      const exactName = "A".repeat(50);
      expect(sanitizeFilename(exactName).length).toBe(50);
      expect(sanitizeFilename(exactName)).toBe(exactName);
    });

    it("should remove trailing hyphen after truncation", () => {
      // "A" * 49 + " B" becomes "A" * 49 + "-B", truncated to "A" * 49 + "-"
      // The trailing hyphen should be removed
      const name = "A".repeat(49) + " B";
      const result = sanitizeFilename(name);
      expect(result.endsWith("-")).toBe(false);
      expect(result).toBe("A".repeat(49));
    });
  });

  describe("empty and whitespace handling", () => {
    it('should return "untitled" for empty string', () => {
      expect(sanitizeFilename("")).toBe("untitled");
    });

    it('should return "untitled" for whitespace only', () => {
      expect(sanitizeFilename("   ")).toBe("untitled");
      expect(sanitizeFilename("\t\n")).toBe("untitled");
    });

    it('should return "untitled" for null-ish values', () => {
      expect(sanitizeFilename(null as unknown as string)).toBe("untitled");
      expect(sanitizeFilename(undefined as unknown as string)).toBe("untitled");
    });

    it('should return "untitled" if only invalid characters', () => {
      expect(sanitizeFilename("///")).toBe("untitled");
      expect(sanitizeFilename("***")).toBe("untitled");
    });
  });

  describe("edge cases", () => {
    it("should handle mixed valid and invalid characters", () => {
      expect(sanitizeFilename("My/Pro*ject: Test")).toBe("MyProject-Test");
    });

    it("should handle numbers", () => {
      expect(sanitizeFilename("Project 2026")).toBe("Project-2026");
    });

    it("should handle hyphens in original name", () => {
      expect(sanitizeFilename("my-project-name")).toBe("my-project-name");
    });

    it("should handle underscores (they are valid)", () => {
      expect(sanitizeFilename("my_project_name")).toBe("my_project_name");
    });

    it("should handle dots (they are valid)", () => {
      expect(sanitizeFilename("project.v2")).toBe("project.v2");
    });
  });
});
