import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AboutDialog } from "../../../../src/components/Help/AboutDialog";
import { useUIStore } from "../../../../src/store/slices/uiSlice";
import { APP_CONFIG } from "../../../../src/config/appConfig";

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
