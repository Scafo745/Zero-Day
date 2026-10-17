import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ZeroTrace // Bauhaus 0-Day Threat Intelligence',
  description: 'Constructivist Real-Time Behavioral Threat Detection Dashboard powered by Ollama',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Outfit:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-canvas text-stark-black font-outfit min-h-screen selection:bg-bauhaus-yellow selection:text-stark-black">
        {children}
      </body>
    </html>
  );
}
