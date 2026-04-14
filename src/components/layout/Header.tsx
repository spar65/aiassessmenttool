/**
 * Header Component for AI Assessment Tool
 *
 * Consistent header with logo, in-app Assessment/Evaluation links,
 * and optional "Powered by" link to main platform.
 *
 * @version 0.9.0 — Phase 4: Added Assessment/Evaluation in-app links
 */
"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

const inAppLinks = [
  { href: "/configure", label: "Assessment" },
  { href: "/evaluate", label: "Evaluation" },
];

interface HeaderProps {
  /** Show back button instead of full header */
  showBackButton?: boolean;
  /** Custom back button URL (default: /) */
  backUrl?: string;
  /** Hide "Powered by" link */
  hidePoweredBy?: boolean;
}

export function Header({
  showBackButton = false,
  backUrl = "/",
  hidePoweredBy = false,
}: HeaderProps) {
  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {showBackButton ? (
          <Link
            href={backUrl}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>
        ) : (
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="https://www.aiassesstech.com/logo-64.png"
              alt="AI Assess Tech"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-bold gradient-text">
              AI Assessment Tool
            </span>
          </Link>
        )}

        {/* Right side */}
        <div className="flex items-center space-x-6">
          {/* In-app nav links */}
          {!showBackButton && (
            <>
              {inAppLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-green-400 hover:text-green-300 transition-colors hidden sm:inline"
                >
                  {link.label}
                </Link>
              ))}
              <span className="w-px h-4 bg-white/20 hidden sm:inline-block" aria-hidden="true" />
            </>
          )}

          {showBackButton ? (
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="https://www.aiassesstech.com/logo-64.png"
                alt="AI Assess Tech"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-sm font-medium text-gray-300 hidden sm:inline">
                AI Assessment Tool
              </span>
            </Link>
          ) : !hidePoweredBy ? (
            <a
              href="https://www.aiassesstech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Powered by AI Assess Tech
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}
