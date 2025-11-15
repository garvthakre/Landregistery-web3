import { ChevronRight, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  const {t} = useTranslation();
  return (
    <section className="relative pt-2 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      
      <div className="max-w-6xl mx-auto">
        <div className="mb-2 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/30 rounded-full">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-green-500">{t("landing.heroText")}</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-pretty">
          {t("landing.heroTitle1")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">{t("landing.heroTitle2")} </span> {t("landing.heroTitle3")} 
        </h1>

        <p className="text-xl text-muted-foreground mb-8 max-w-2xl text-pretty leading-relaxed">
           {t("landing.heroP1")}
 <span className='text-green-400 flex'>{t("landing.heroP2")} </span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link to="/login">
          <button className="px-8 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all">
            {t("landing.getStarted")}
          </button>
          </Link>
           <Link to="/login">
          <button className="px-8 py-3 rounded-full border border-emerald-500/30 text-emerald-400 font-semibold hover:bg-emerald-500/10 transition-colors flex items-center gap-2">
           {t("landing.listYourLand")} <ChevronRight className="w-4 h-4" />
          </button>
          </Link>
        </div>

      </div>
    </section>
  );
}
