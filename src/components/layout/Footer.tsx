/**
 * Footer Component for AI Assessment Tool
 *
 * Consistent footer with copyright and navigation links.
 * Matches the design aesthetic of the landing page.
 *
 * @version 0.7.9
 */
"use client";

interface FooterProps {
  /** Show minimal footer (just copyright) */
  minimal?: boolean;
}

export function Footer({ minimal = false }: FooterProps) {
  const currentYear = new Date().getFullYear();

  if (minimal) {
    return (
      <footer className="border-t border-white/10 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          © {currentYear} AI Assess Tech. All rights reserved.
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-white/10 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <div className="text-center sm:text-left">
          <p>© {currentYear} AI Assess Tech. All rights reserved.</p>
          <p className="text-xs mt-1 text-gray-600">
            Patent Pending · Responsible AI Assessment Technology
          </p>
        </div>
        <nav className="flex items-center space-x-6">
          <a
            href="https://www.aiassesstech.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Privacy
          </a>
          <a
            href="https://www.aiassesstech.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Terms
          </a>
          <a
            href="https://www.aiassesstech.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Docs
          </a>
          <a
            href="https://www.aiassesstech.com/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}

