'use client';

import React from 'react';
import { Lock, MapPin, FileCheck, Users, Zap, Globe } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: Lock,
      title: 'Immutable Records',
      description: 'Blockchain-backed land titles ensure no authority can alter or manipulate records unilaterally.',
    },
    {
      icon: MapPin,
      title: 'Geo-Tagged Verification',
      description: 'AR-powered boundary verification with GPS accuracy and satellite imagery comparison.',
    },
    {
      icon: FileCheck,
      title: 'AI Document Validation',
      description: 'Automated scanning and authentication of legacy paper records and survey documents.',
    },
    {
      icon: Users,
      title: 'Community Governance',
      description: 'Gram Sabha consent recorded on-chain with verifiable digital signatures and audit trails.',
    },
    {
      icon: Zap,
      title: 'Low-Bandwidth Access',
      description: 'Optimized mobile interface for remote areas with limited connectivity.',
    },
    {
      icon: Globe,
      title: 'Multilingual Support',
      description: 'Interface in local languages ensuring accessibility for all community members.',
    },
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-pretty">
            Powerful Features for <span className="text-emerald-400">Land Protection</span>
          </h2>
          
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-lg bg-card border border-border hover:border-emerald-500/50 transition-colors group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:from-emerald-400/30 group-hover:to-emerald-600/30 transition-colors">
                  <Icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
