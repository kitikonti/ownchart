import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AboutDialog, sanitizeHref } from "@/components/Help/AboutDialog";
import { useUIStore } from "@/store/slices/uiSlice";
import { APP_CONFIG } from "@/config/appConfig";

describe("AboutDialog", () => {
  beforeEach(() => {
    useUIStore.setState({ isAboutDialogOpen: false });
  });

  it("renders nothing when closed", () => {
    const { container } = render(<AboutDialog />);
    // Modal returns null when isOpen=false
    expect(container.innerHTML).toBe("");
  });

  it("renders dialog content when open", () => {
    useUIStore.setState({ isAboutDialogOpen: true });
    render(<AboutDialog />);

    expect(screen.getByText(APP_CONFIG.name)).toBeInTheDocument();
    expect(screen.getByText(APP_CONFIG.tagline)).toBeInTheDocument();
  });

  it("displays version string", () => {
    useUIStore.setState({ isAboutDialogOpen: true });
    render(<AboutDialog />);

    expect(screen.getByText(/Version /)).toBeInTheDocument();
  });

  it("renders license from APP_CONFIG", () => {
    useUIStore.setState({ isAboutDialogOpen: true });
    render(<AboutDialog />);

    expect(
      screen.getByText(`Open Source (${APP_CONFIG.license} License)`)
    ).toBeInTheDocument();
  });

  it("renders external links with noopener noreferrer", () => {
    useUIStore.setState({ isAboutDialogOpen: true });
    render(<AboutDialog />);

    const links = screen.getAllByRole("link");
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("renders GitHub, website, and sponsor links", () => {
    useUIStore.setState({ isAboutDialogOpen: true });
    render(<AboutDialog />);

    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));

    expect(hrefs).toContain(APP_CONFIG.githubUrl);
    expect(hrefs).toContain(APP_CONFIG.websiteUrl);
    expect(hrefs).toContain(APP_CONFIG.sponsorUrl);
  });

  it("closes dialog when Close button is clicked", () => {
    useUIStore.setState({ isAboutDialogOpen: true });
    render(<AboutDialog />);

    fireEvent.click(screen.getByText("Close"));

    expect(useUIStore.getState().isAboutDialogOpen).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sanitizeHref — security boundary for external link hrefs
// ---------------------------------------------------------------------------

describe("sanitizeHref", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("passes through https:// URLs unchanged", () => {
    expect(sanitizeHref("https://example.com")).toBe("https://example.com");
  });

  it("passes through http:// URLs unchanged", () => {
    expect(sanitizeHref("http://example.com")).toBe("http://example.com");
  });

  it("blocks javascript: URIs by returning '#'", () => {
    expect(sanitizeHref("javascript:alert(1)")).toBe("#");
  });

  it("blocks data: URIs by returning '#'", () => {
    expect(sanitizeHref("data:text/html,<h1>XSS</h1>")).toBe("#");
  });

  it("blocks empty string by returning '#'", () => {
    expect(sanitizeHref("")).toBe("#");
  });

  it("blocks relative paths by returning '#'", () => {
    expect(sanitizeHref("/some/path")).toBe("#");
  });

  it("blocks protocol-relative URLs by returning '#'", () => {
    expect(sanitizeHref("//example.com")).toBe("#");
  });
});
