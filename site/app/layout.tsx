import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Metlife Crisis | Fantasy Command Center',
  description:
    'Your weekly fantasy football lineup, survivor and pick’em command center.',
  icons: { icon: '/football/favicon.svg' },
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
