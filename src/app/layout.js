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
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
