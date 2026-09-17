import "./globals.css";
import ConditionalNav from "@/components/ConditionalNav";

export const metadata = {
  title: "J.B. Pressure Washing — Ops",
  description: "Internal CRM and job management for J.B. Pressure Washing",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <ConditionalNav />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 lg:pb-8">
          {children}
        </main>
      </body>
    </html>
  );
}
