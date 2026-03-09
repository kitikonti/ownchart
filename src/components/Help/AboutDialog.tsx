/**
 * AboutDialog - Displays app info, open-source attribution, and sponsor link.
 *
 * Opened from: Help tab "About" button, or clickable version in StatusBar.
 */

import type { ReactNode } from "react";

import {
  GithubLogo,
  Globe,
  Heart,
  Info,
  ArrowSquareOut,
} from "@phosphor-icons/react";

import OwnChartLogo from "../../assets/logo.svg?react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { useUIStore } from "../../store/slices/uiSlice";
import { APP_CONFIG } from "../../config/appConfig";

interface ExternalLinkProps {
  href: string;
  icon: ReactNode;
  label: string;
  sublabel?: string;
}

/** Link row used within AboutDialog to display icon + label + optional sublabel. */
function ExternalLink({
  href,
  icon,
  label,
  sublabel,
}: ExternalLinkProps): JSX.Element {
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

export function AboutDialog(): JSX.Element | null {
  const { isAboutDialogOpen: isOpen, closeAboutDialog } = useUIStore();

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeAboutDialog}
      title="About"
      icon={<Info size={24} weight="light" className="text-brand-600" />}
      headerStyle="bordered"
      footerStyle="bordered"
      widthClass="max-w-sm"
      contentPadding="px-8 py-6"
      footer={
        <Button variant="secondary" onClick={closeAboutDialog}>
          Close
        </Button>
      }
    >
      {/* Logo + Version */}
      <div className="flex flex-col items-center text-center mb-5">
        <OwnChartLogo
          width={36}
          height={36}
          className="text-brand-600"
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
          label={`Open Source (${APP_CONFIG.license} License)`}
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
