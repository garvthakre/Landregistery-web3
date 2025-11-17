import { ChevronRight, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  const {t} = useTranslation();
  return (
    <section className="relative min-h-[85vh] w-full overflow-hidden flex items-end">
      {/* Background Image */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: 'url(/land-1.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Gradient Overlay - White (bottom-left) to Transparent (top-right) */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            linear-gradient(
              to top,
              rgba(255, 255, 255, 0.98) 0%,
              rgba(255, 255, 255, 0.95) 25%,
              rgba(255, 255, 255, 0.6) 35%,
              rgba(255, 255, 255, 0.2) 50%,
              rgba(255, 255, 255, 0) 85%
            ),
            linear-gradient(
              to top right,
              rgba(255, 255, 255, 0.95) 0%,
              rgba(255, 255, 255, 0.75) 20%,
              rgba(255, 255, 255, 0.35) 40%,
              rgba(255, 255, 255, 0.1) 45%,
              transparent 60%
            )
          `
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full px-8 sm:px-12 lg:px-16 pb-12">
        <div className="max-w-4xl">
          <div className="mb-2 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full backdrop-blur-sm">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-emerald-800 font-medium">{t("landing.heroText")}</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            {t("landing.heroTitle1")} <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-500 to-green-400">{t("landing.heroTitle2")} </span> {t("landing.heroTitle3")} 
          </h1>

          <p className="text-xl text-gray-700 mb-8 max-w-2xl text-pretty leading-relaxed">
            {t("landing.heroP1")}
            <span className='text-emerald-600 font-semibold block mt-2'>{t("landing.heroP2")} </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/login">
              <button className="px-8 py-3 rounded-full bg-linear-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all">
                {t("landing.getStarted")}
              </button>
            </Link>
            <Link to="/login">
              <button className="px-8 py-3 rounded-full border-2 border-emerald-600 text-emerald-700 font-semibold hover:bg-emerald-500/10 transition-colors flex items-center gap-2">
                {t("landing.listYourLand")} <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}