import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TekstTalent',
  description: 'Transform your speech into professional text',
  manifest: '/images/icons/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <head>
        <link 
          rel="apple-touch-icon" 
          sizes="180x180" 
          href="/images/icons/apple-touch-icon.png"
        />
        <link 
          rel="icon" 
          type="image/png" 
          sizes="32x32" 
          href="/images/icons/favicon-32x32.png"
        />
        <link 
          rel="icon" 
          type="image/png" 
          sizes="16x16" 
          href="/images/icons/favicon-16x16.png"
        />
        <link 
          rel="manifest" 
          href="/images/icons/site.webmanifest"
        />
      </head>
      <body className="bg-white">
        {children}
      </body>
    </html>
  );
}
