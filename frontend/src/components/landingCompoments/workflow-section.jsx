'use client';

import React from 'react';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function WorkflowSection() {
  const steps = [
    { num: '1', title: 'Land Owner Visits', desc: 'Land owner visits the land' },
    { num: '2', title: 'Upload Documents', desc: 'Scan and upload original documents' },
    { num: '3', title: 'Request Verification', desc: 'Submit geotagging verification request to authorities' },
    { num: '4', title: 'Official Review', desc: 'Land officer receives and processes the verification request' },
    { num: '5', title: 'AR Verification', desc: 'Officer visits location with AR camera and GPS for field verification' },
    { num: '6', title: 'Smart Contract Match', desc: 'System automatically compares claimed area vs geotagged data' },
  ];

  return (
    <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-pretty">
            Verification <span className="text-emerald-400">Workflow</span>
          </h2>
        </div>

        {/* Process Flow */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              <div className="p-6 rounded-lg bg-card border border-border">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold mb-4">
                  {step.num}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
              {idx < steps.length - 1 && (
                <ArrowRight className="hidden lg:block absolute -right-3 top-8 w-6 h-6 text-emerald-400/50" />
              )}
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-8 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Request Approved</h3>
                <p className="text-sm text-muted-foreground">Area matches documented claims within ±10% tolerance. Land rights verified and recorded on blockchain.</p>
              </div>
            </div>
          </div>
          <div className="p-8 rounded-lg bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Request Rejected</h3>
                <p className="text-sm text-muted-foreground">Area exceeds allowed tolerance limits. Community can appeal with additional documentation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
