import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TekstTalent',
  description: 'Spraak naar tekst met AI transformatie',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/images/icons/favicon.ico' },
      { url: '/images/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/images/icons/apple-touch-icon.png' }
    ],
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className="bg-white">
        {children}
      </body>
    </html>
  );
}
