import { Menu, X, ChevronRight, Lock, MapPin, FileCheck, Users, Zap, Shield, Globe, Landmark } from 'lucide-react';
import Header from '../components/Header';
import HeroSection from '../components/landingCompoments/hero-section';
import FeaturesSection from '../components/landingCompoments/feature-section';
import WorkflowSection from '../components/landingCompoments/workflow-section';

export default function ALanding() {
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* <Header
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
      /> */}
      <main>
        <HeroSection />
        <FeaturesSection />
        <WorkflowSection />
        {/* <ImpactSection /> */}
        {/* <TechStackSection /> */}
        {/* <CTASection /> */}
      </main>
      {/* <Footer /> */}
    </div>
  );
}
