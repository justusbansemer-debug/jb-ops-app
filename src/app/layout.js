import "./globals.css";
import ConditionalNav from "@/components/ConditionalNav";

export const metadata = {
  title: "J.B. Pressure Washing — Ops",
  description: "Internal CRM and job management for J.B. Pressure Washing",
  // How it looks once it's added to the iPhone home screen.
  appleWebApp: {
    capable: true,
    title: "JB Ops",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

// viewport-fit=cover is what makes env(safe-area-inset-*) actually report a
// number on an iPhone. Without it the bottom bar's safe-area padding is zero
// and the tabs sit under the home indicator.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <ConditionalNav />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8">
          {children}
        </main>
      </body>
    </html>
  );
}
