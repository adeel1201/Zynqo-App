import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zynqo | Connect, Chat, Share, Discover',
  description: 'Premium modern messaging and social networking platform.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-primary/30 min-h-screen">
        <div className="flex flex-col min-h-screen max-w-md mx-auto relative bg-background shadow-2xl overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}