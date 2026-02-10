import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "../index.css";
import { Providers } from "./providers";
import { GlobalSettingsButton } from "@/components/GlobalSettingsButton";
import { HelpModal } from "@/components/HelpModal";

const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "Kaboo",
  description: "A card game",
  appleWebApp: {
    title: "Kaboo",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} ${nunito.variable} font-body`}>
        <Providers>
          {children}
          <GlobalSettingsButton />
          <HelpModal />
        </Providers>
      </body>
    </html>
  );
}
