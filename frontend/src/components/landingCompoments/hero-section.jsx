import { ChevronRight, Shield } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative pt-2 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* <img src={}/> */}
      
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-300">Web3 Powered Land Governance</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-pretty">
          Decentralized <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Land Rights</span> for Tribal Communities
        </h1>

        <p className="text-xl text-muted-foreground mb-8 max-w-2xl text-pretty leading-relaxed">
           a decentralized, blockchain-powered land registry system that 
ensures transparency, immutability, and community control over land records
 <span className='text-green-300'> Preserving tribal rights and preventing unlawful displacement. </span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <button className="px-8 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all">
            Get Started
          </button>
          <button className="px-8 py-3 rounded-full border border-emerald-500/30 text-emerald-400 font-semibold hover:bg-emerald-500/10 transition-colors flex items-center gap-2">
            List your Land <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
}
