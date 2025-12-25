/**
 * Header Component for AI Assessment Tool
 *
 * Consistent header with logo linking to landing page
 * and optional "Powered by" link to main platform.
 *
 * @version 0.7.9
 */
"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

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
          // Back button mode (for sub-pages)
          <Link
            href={backUrl}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>
        ) : (
          // Full logo mode (for main pages)
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

        {/* Right side - Logo for back button mode, or Powered By link */}
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
    </header>
  );
}

