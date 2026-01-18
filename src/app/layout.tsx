import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google"; // Solid cute anime-style font!
import "./globals.css";

const mPlus = M_PLUS_Rounded_1c({
  weight: ["100", "300", "400", "500", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-mplus",
});

export const metadata: Metadata = {
  title: "Mai Aphrodite",
  description: "Your cute AI desktop assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${mPlus.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
