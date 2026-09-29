import type { Metadata, Viewport } from "next";
import { SessionProvider } from "@/lib/session";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Pottery Story",
  description:
    "Dịch vụ tạo nội dung bán hàng cho nghệ nhân gốm Việt Nam, có xác nhận của nghệ nhân.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f4ef",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <SessionProvider>
          <div className="app-shell mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-background">
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
