import Image from 'next/image';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF4500]/5 via-white to-[#9F7AEA]/5 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-[#FF6B6B] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-48 w-96 h-96 bg-[#FF4500] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-48 left-48 w-96 h-96 bg-[#9F7AEA] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent"></div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[url('/assets/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>

      {/* Content */}
      <div className="relative flex flex-col min-h-screen">
        <main className="max-w-7xl mx-auto w-full py-6 px-4 md:py-12 lg:px-8 flex-grow">
          <h1 className={`text-3xl md:text-5xl font-extrabold text-center text-[#FF4500] mb-8 md:mb-16 tracking-tight ${inter.className}`}>
            TekstTalent
          </h1>
          <div className="relative z-10 backdrop-blur-sm">
            {children}
          </div>
        </main>

        {/* Footer met logo */}
        <footer className="relative z-10 w-full py-4 mt-8">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
            <span className="text-gray-500 text-sm">Powered by</span>
            <Image
              src="/images/logos/ikbenlit_logo_banner_small.png"
              alt="ikbenlit logo"
              width={100}
              height={30}
              className="object-contain"
            />
          </div>
        </footer>
      </div>
    </div>
  );
}; 