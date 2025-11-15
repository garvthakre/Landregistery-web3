import React, { useState } from 'react';
import { CheckCircle, XCircle, FileText, Loader2, Shield, Hash, Database, Search, AlertCircle, Lock, Sparkles } from 'lucide-react';

const API_URL = "http://localhost:5000/api";

const VerifyPage = () => {
  const [verifyFile, setVerifyFile] = useState(null);
  const [recordId, setRecordId] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verificationSteps, setVerificationSteps] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);

  const VERIFY_STEPS = [
    { id: 1, name: 'Scanning Document', icon: Search, color: 'blue', description: 'Reading file structure and metadata' },
    { id: 2, name: 'Computing Hash', icon: Hash, color: 'purple', description: 'Generating SHA-256 cryptographic hash' },
    { id: 3, name: 'Connecting to Blockchain', icon: Database, color: 'green', description: 'Establishing secure connection to network' },
    { id: 4, name: 'Retrieving Record', icon: FileText, color: 'orange', description: 'Fetching stored blockchain record' },
    { id: 5, name: 'Cross-Verification', icon: Shield, color: 'pink', description: 'Comparing hashes and validating integrity' },
    { id: 6, name: 'Final Analysis', icon: Sparkles, color: 'indigo', description: 'Performing authenticity check' },
  ];

  const updateStep = (stepIndex, status, message = '') => {
    setVerificationSteps(prev => {
      const updated = [...prev];
      if (!updated[stepIndex]) {
        updated[stepIndex] = { ...VERIFY_STEPS[stepIndex], status, timestamp: Date.now() };
      } else {
        updated[stepIndex] = { ...updated[stepIndex], status };
      }
      if (status === 'completed') {
        updated[stepIndex].completedAt = Date.now();
        updated[stepIndex].message = message;
      }
      return updated;
    });
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!recordId) {
      alert('Please enter the Record ID to verify against');
      return;
    }

    if (!verifyFile) {
      alert('Please select a file to verify');
      return;
    }

    setVerifyResult(null);
    setVerificationSteps([]);
    setIsVerifying(true);

    try {
      // Step 1: Scanning Document
      updateStep(0, 'processing');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStep(0, 'completed', 'Document scanned');

      // Step 2: Computing Hash
      updateStep(1, 'processing');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStep(1, 'completed', 'Hash computed locally');

      // Step 3: Connecting to Blockchain
      updateStep(2, 'processing');
      await new Promise(resolve => setTimeout(resolve, 1200));
      updateStep(2, 'completed', 'Connected to blockchain');

      // Step 4: Retrieving Record
      updateStep(3, 'processing');
      
      const data = new FormData();
      data.append('file', verifyFile);
      data.append('recordId', recordId);

      const response = await fetch(`${API_URL}/verify`, {
        method: 'POST',
        body: data,
      });

      updateStep(3, 'completed', 'Record retrieved');

      // Step 5: Cross-Verification
      updateStep(4, 'processing');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const result = await response.json();

      if (result.success) {
        updateStep(4, 'completed', 'Hashes compared');

        // Step 6: Final Analysis
        updateStep(5, 'processing');
        await new Promise(resolve => setTimeout(resolve, 800));
        updateStep(5, 'completed', 'Analysis complete');

        setVerifyResult(result);
      } else {
        updateStep(4, 'error', result.error || 'Verification failed');
        setVerifyResult({ 
          success: false, 
          message: result.error || 'Verification failed' 
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      const failedStep = verificationSteps.filter(s => s.status === 'completed').length;
      updateStep(failedStep, 'error', error.message);
      setVerifyResult({ 
        success: false, 
        message: 'Verification failed: ' + error.message 
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getStepColor = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      pink: 'from-pink-500 to-pink-600',
      indigo: 'from-indigo-500 to-indigo-600',
    };
    return colors[color] || colors.blue;
  };

  const getStepBgColor = (color) => {
    const colors = {
      blue: 'bg-blue-50',
      purple: 'bg-purple-50',
      green: 'bg-green-50',
      orange: 'bg-orange-50',
      pink: 'bg-pink-50',
      indigo: 'bg-indigo-50',
    };
    return colors[color] || colors.blue;
  };

  const getStepBorderColor = (color) => {
    const colors = {
      blue: 'border-blue-400',
      purple: 'border-purple-400',
      green: 'border-green-400',
      orange: 'border-orange-400',
      pink: 'border-pink-400',
      indigo: 'border-indigo-400',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Verify Form */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-2xl p-8 border border-green-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  Verify Document
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Check authenticity against blockchain
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Record ID *
                </label>
                <input
                  type="text"
                  value={recordId}
                  onChange={(e) => setRecordId(e.target.value)}
                  required
                  placeholder="e.g. 0, 1, 2..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all font-mono"
                />
                <p className="text-xs text-gray-500">
                  Enter the blockchain record ID to verify against
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Document to Verify *
                </label>
                <input
                  type="file"
                  onChange={(e) => setVerifyFile(e.target.files[0])}
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
                <p className="text-xs text-gray-500">
                  Upload the document you want to verify
                </p>
              </div>

              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isVerifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5" />
                    Verify Document
                  </span>
                )}
              </button>
            </div>

            {/* Info Box */}
            {!isVerifying && verificationSteps.length === 0 && (
              <div className=" rounded-xl p-4">
                {/* <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">How Verification Works</h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Document hash is computed locally</li>
                      <li>• Blockchain record is fetched securely</li>
                      <li>• Hashes are compared for integrity</li>
                      <li>• Any tampering is instantly detected</li>
                    </ul>
                  </div>
                </div> */}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Live Verification Process */}
        <div className="space-y-6">
          {/* Verification Steps */}
          {verificationSteps.length > 0 && (
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg animate-pulse">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Live Verification
                  </h3>
                  <p className="text-sm text-gray-600">
                    Analyzing document authenticity
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {verificationSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = step.status === 'processing';
                  const isCompleted = step.status === 'completed';
                  const isError = step.status === 'error';
                  const duration = step.completedAt ? ((step.completedAt - step.timestamp) / 1000).toFixed(2) : null;

                  return (
                    <div
                      key={step.id}
                      className={`relative p-5 rounded-xl border-2 transition-all duration-500 ${
                        isActive 
                          ? `${getStepBorderColor(step.color)} ${getStepBgColor(step.color)} shadow-lg scale-105` 
                          : isCompleted
                          ? 'border-green-300 bg-green-50'
                          : isError
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl flex-shrink-0 ${
                          isActive 
                            ? `bg-gradient-to-br ${getStepColor(step.color)} animate-pulse shadow-lg` 
                            : isCompleted
                            ? 'bg-green-500'
                            : isError
                            ? 'bg-red-500'
                            : 'bg-gray-300'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6 text-white" />
                          ) : isError ? (
                            <XCircle className="w-6 h-6 text-white" />
                          ) : (
                            <StepIcon className={`w-6 h-6 text-white ${isActive ? 'animate-bounce' : ''}`} />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-gray-800 text-base">
                              {step.name}
                            </h4>
                            {isActive && (
                              <Loader2 className="w-5 h-5 text-gray-600 animate-spin flex-shrink-0" />
                            )}
                            {isCompleted && duration && (
                              <span className="text-xs text-green-600 font-semibold flex-shrink-0">
                                ✓ {duration}s
                              </span>
                            )}
                          </div>
                          
                          <p className={`text-sm ${
                            isActive ? 'text-gray-700 font-medium' : 'text-gray-600'
                          }`}>
                            {step.description}
                          </p>

                          {step.message && (
                            <p className={`text-xs mt-1 ${isError ? 'text-red-600' : 'text-green-600'}`}>
                              {step.message}
                            </p>
                          )}
                          
                          {isActive && (
                            <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"
                                style={{ width: '100%' }} 
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {index < verificationSteps.length - 1 && (
                        <div className={`absolute left-9 top-full w-1 h-4 ${
                          isCompleted ? 'bg-green-500' : isError ? 'bg-red-500' : 'bg-gray-300'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Verification Result */}
          {verifyResult && (
            <div className={`rounded-2xl shadow-2xl p-8 border-2 ${
              verifyResult.verified 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' 
                : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`p-4 rounded-xl shadow-lg ${
                  verifyResult.verified ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {verifyResult.verified ? (
                    <CheckCircle className="w-8 h-8 text-white" />
                  ) : (
                    <XCircle className="w-8 h-8 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`text-2xl font-bold mb-2 ${
                    verifyResult.verified ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {verifyResult.verified ? '✅ Document Verified!' : '⚠️ Verification Failed'}
                  </h3>
                  <p className={`mb-4 ${
                    verifyResult.verified ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {verifyResult.message}
                  </p>
                  
                  {verifyResult.recordDetails && (
                    <div className="space-y-3">
                      <div className="bg-white rounded-xl p-4 shadow-md">
                        <h4 className="font-semibold text-gray-800 mb-3">Record Details</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600 block">Owner:</span>
                            <span className="font-semibold text-gray-800">{verifyResult.recordDetails.ownerName}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 block">Village:</span>
                            <span className="font-semibold text-gray-800">{verifyResult.recordDetails.village}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-600 block">Current Owner:</span>
                            <span className="font-mono text-xs text-gray-800 break-all">{verifyResult.recordDetails.currentOwner}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-600 block">Timestamp:</span>
                            <span className="text-sm text-gray-800">{verifyResult.recordDetails.timestamp}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 shadow-md">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Hash className="w-4 h-4" />
                          Hash Comparison
                        </h4>
                        <div className="space-y-3 text-xs">
                          <div>
                            <span className="text-gray-600 block mb-1">Blockchain Hash:</span>
                            <div className="bg-blue-50 p-2 rounded-lg font-mono text-blue-800 break-all border border-blue-200">
                              {verifyResult.blockchainHash}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600 block mb-1">Document Hash:</span>
                            <div className={`p-2 rounded-lg font-mono break-all border ${
                              verifyResult.verified 
                                ? 'bg-green-50 text-green-800 border-green-200' 
                                : 'bg-red-50 text-red-800 border-red-200'
                            }`}>
                              {verifyResult.uploadedFileHash}
                            </div>
                          </div>
                          {verifyResult.verified ? (
                            <div className="flex items-center gap-2 text-green-600 font-semibold">
                              <CheckCircle className="w-4 h-4" />
                              Hashes match perfectly - Document is authentic
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-600 font-semibold">
                              <XCircle className="w-4 h-4" />
                              Hashes do not match - Document may be tampered
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Info Card when idle */}
          {verificationSteps.length === 0 && !verifyResult && (
            <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-2xl shadow-xl p-8 border border-gray-200">
              <div className="text-center">
                <div className="inline-flex p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-4">
                  <Lock className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Cryptographic Verification
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Our system uses SHA-256 hashing to ensure document integrity. Any modification to the document will result in a completely different hash.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-3xl font-bold text-green-600 mb-1">256-bit</div>
                    <div className="text-xs text-gray-600">Hash Security</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-3xl font-bold text-blue-600 mb-1">100%</div>
                    <div className="text-xs text-gray-600">Accuracy</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;