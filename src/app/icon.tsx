/**
 * Dynamic Favicon Generation
 *
 * This file generates the favicon/icon for the browser tab
 * Uses the optimized AI Assess Tech logo image (logo-favicon.png - 5.9KB)
 */

import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Generate the icon
export default async function Icon() {
  // Read the optimized favicon logo file
  const logoPath = path.join(process.cwd(), "public", "logo-favicon.png");

  try {
    const logoData = await readFile(logoPath);
    const logoBase64 = logoData.toString("base64");
    const logoSrc = `data:image/png;base64,${logoBase64}`;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1e293b", // Dark slate background to match logo bg
            borderRadius: 4,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt="AI Assessment Tool"
            width={28}
            height={28}
            style={{ objectFit: "contain" }}
          />
        </div>
      ),
      {
        ...size,
      }
    );
  } catch {
    // Fallback if logo can't be read - render a simple icon
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            borderRadius: 4,
          }}
        >
          <div
            style={{
              color: "white",
              fontSize: 20,
              fontWeight: 700,
              fontFamily: "system-ui",
            }}
          >
            A
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  }
}

