import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DevilsAdvocate',
  description: 'Multi-agent debate framework for fact-checking and bias detection with real-time streaming dual-perspective analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
