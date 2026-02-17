/**
 * AboutDialog - Displays app info, open-source attribution, and sponsor link.
 *
 * Opened from: Help tab "About" button, or clickable version in StatusBar.
 */

import {
  GithubLogo,
  Globe,
  Heart,
  Info,
  ArrowSquareOut,
} from "@phosphor-icons/react";

import OwnChartLogo from "../../assets/logo.svg?react";
import { Modal } from "../common/Modal";
import { useUIStore } from "../../store/slices/uiSlice";
import { APP_CONFIG } from "../../config/appConfig";

export function AboutDialog(): JSX.Element | null {
  const isOpen = useUIStore((state) => state.isAboutDialogOpen);
  const closeAboutDialog = useUIStore((state) => state.closeAboutDialog);

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeAboutDialog}
      title="About"
      icon={<Info size={24} weight="light" className="text-brand-600" />}
      headerStyle="figma"
      footerStyle="figma"
      widthClass="max-w-sm"
      contentPadding="px-8 py-6"
      footer={
        <button
          onClick={closeAboutDialog}
          className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded hover:bg-neutral-50 transition-colors"
        >
          Close
        </button>
      }
    >
      {/* Logo + Version */}
      <div className="flex flex-col items-center text-center mb-5">
        <OwnChartLogo
          width={36}
          height={36}
          style={{ color: "#0F6CBD" }}
          aria-hidden="true"
        />
        <h3 className="mt-3 text-lg font-semibold text-neutral-900">
          {APP_CONFIG.name}
        </h3>
        <span className="text-sm text-neutral-500">
          Version {__APP_VERSION__}
        </span>
        <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
          {APP_CONFIG.tagline}
        </p>
      </div>

      <hr className="border-neutral-200 mb-4" />

      {/* Open Source + Links */}
      <div className="space-y-3">
        <ExternalLink
          href={APP_CONFIG.githubUrl}
          icon={<GithubLogo size={18} weight="regular" />}
          label="Open Source (MIT License)"
          sublabel="GitHub Repository"
        />
        <ExternalLink
          href={APP_CONFIG.websiteUrl}
          icon={<Globe size={18} weight="regular" />}
          label={APP_CONFIG.websiteUrl.replace("https://", "")}
        />
      </div>

      <hr className="border-neutral-200 my-4" />

      {/* Sponsor */}
      <ExternalLink
        href={APP_CONFIG.sponsorUrl}
        icon={<Heart size={18} weight="fill" className="text-red-500" />}
        label="Support this project"
        sublabel="GitHub Sponsors"
      />
    </Modal>
  );
}

/** Small reusable link row */
function ExternalLink({
  href,
  icon,
  label,
  sublabel,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
}): JSX.Element {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 group py-1 rounded -mx-1 px-1 hover:bg-neutral-50 transition-colors"
    >
      <span className="mt-0.5 text-neutral-500 group-hover:text-neutral-700 flex-shrink-0">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
          {label}
        </span>
        {sublabel && (
          <span className="flex items-center gap-1 text-xs text-neutral-400 group-hover:text-brand-600">
            {sublabel}
            <ArrowSquareOut size={11} weight="regular" />
          </span>
        )}
      </div>
    </a>
  );
}
