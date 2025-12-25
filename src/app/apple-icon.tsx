/**
 * Apple Touch Icon Generation
 *
 * This file generates the apple-touch-icon for iOS devices
 * Uses the optimized AI Assess Tech logo image (logo-apple-touch.png - 35KB)
 */

import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

// Image metadata - Apple icon is 180x180
export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

// Generate the apple icon
export default async function AppleIcon() {
  // Read the optimized apple touch icon logo file
  const logoPath = path.join(process.cwd(), "public", "logo-apple-touch.png");

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
            borderRadius: 24, // Rounded corners for iOS
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt="AI Assessment Tool"
            width={160}
            height={160}
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
            borderRadius: 24,
          }}
        >
          <div
            style={{
              color: "white",
              fontSize: 100,
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

