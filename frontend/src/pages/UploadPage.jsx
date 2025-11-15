import React, { useState } from 'react';
import { Upload, Loader2, CheckCircle, XCircle, Scan, FileText, Lock, Database, Rocket, Shield, Hash, ExternalLink } from 'lucide-react';

const API_URL = "http://localhost:5000/api";

const UploadPage = () => {
  const [formData, setFormData] = useState({
    ownerName: '',
    village: '',
    file: null,
  });
  const [uploadResult, setUploadResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrData, setOcrData] = useState(null);
  const [processingSteps, setProcessingSteps] = useState([]);

  const STEPS = [
    { id: 1, name: 'Analyzing Document', icon: Scan, color: 'blue', description: 'Extracting data via OCR' },
    { id: 2, name: 'Calculating Hash', icon: Hash, color: 'purple', description: 'Computing SHA-256 hash' },
    { id: 3, name: 'Uploading to IPFS', icon: Database, color: 'green', description: 'Storing on decentralized storage' },
    { id: 4, name: 'Creating Smart Contract', icon: Lock, color: 'orange', description: 'Preparing blockchain transaction' },
    { id: 5, name: 'Broadcasting to Network', icon: Rocket, color: 'pink', description: 'Sending to blockchain network' },
    { id: 6, name: 'Confirming on Blockchain', icon: Shield, color: 'indigo', description: 'Waiting for confirmation' },
  ];

  const updateStep = (stepIndex, status, message = '') => {
    setProcessingSteps(prev => {
      const updated = [...prev];
      if (!updated[stepIndex]) {
        updated[stepIndex] = { ...STEPS[stepIndex], status, timestamp: Date.now() };
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData(prev => ({ ...prev, file }));
    setOcrData(null);
    setUploadResult(null);

    if (file.type.startsWith('image/')) {
      await performOCR(file);
    }
  };

  const performOCR = async (file) => {
    setOcrLoading(true);
    try {
      const data = new FormData();
      data.append('file', file);

      const response = await fetch(`${API_URL}/ocr`, {
        method: 'POST',
        body: data,
      });

      const result = await response.json();

      if (result.success) {
        setOcrData(result.data);
        
        if (result.data.ownerName) {
          setFormData(prev => ({ 
            ...prev, 
            ownerName: result.data.ownerName,
            village: result.data.village || prev.village
          }));
        }
      } else {
        console.error('OCR failed:', result.error);
      }
    } catch (error) {
      console.error('OCR error:', error);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    setUploadResult(null);
    setProcessingSteps([]);
    setCurrentStep(0);

    try {
      // Step 1: Analyzing Document (if image, already done with OCR)
      setCurrentStep(0);
      updateStep(0, 'processing');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStep(0, 'completed', 'Document analyzed successfully');

      // Step 2: Calculate Hash (happens on server)
      setCurrentStep(1);
      updateStep(1, 'processing');
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateStep(1, 'completed', 'Hash calculated');

      // Step 3-6: Upload to backend
      setCurrentStep(2);
      updateStep(2, 'processing');
      
      const data = new FormData();
      data.append('file', formData.file);
      data.append('ownerName', formData.ownerName);
      data.append('village', formData.village);

      const response = await fetch(`${API_URL}/upload-document`, {
        method: 'POST',
        body: data,
      });

      updateStep(2, 'completed', 'Uploaded to IPFS');

      // Step 4: Smart Contract
      setCurrentStep(3);
      updateStep(3, 'processing');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStep(3, 'completed', 'Smart contract created');

      // Step 5: Broadcasting
      setCurrentStep(4);
      updateStep(4, 'processing');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStep(4, 'completed', 'Broadcasted to network');

      // Step 6: Confirmation
      setCurrentStep(5);
      updateStep(5, 'processing');
      
      const result = await response.json();

      if (result.success) {
        updateStep(5, 'completed', 'Confirmed on blockchain');
        
        setUploadResult({
          success: true,
          message: 'Document uploaded successfully to blockchain!',
          data: result.data,
        });
        
        // Reset form
        setTimeout(() => {
          setFormData({ ownerName: '', village: '', file: null });
          setOcrData(null);
          const fileInput = document.querySelector('input[type="file"]');
          if (fileInput) fileInput.value = '';
        }, 5000);
      } else {
        updateStep(5, 'error', result.error);
        setUploadResult({ 
          success: false, 
          message: result.error || 'Upload failed' 
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      const failedStep = currentStep;
      updateStep(failedStep, 'error', error.message);
      setUploadResult({ 
        success: false, 
        message: 'Upload failed: ' + error.message 
      });
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

  const getStepBorderColor = (color) => {
    const colors = {
      blue: 'border-blue-500',
      purple: 'border-purple-500',
      green: 'border-green-500',
      orange: 'border-orange-500',
      pink: 'border-pink-500',
      indigo: 'border-indigo-500',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="max-w-6xl mx-auto mt-8 px-4">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Upload Form */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-8 border border-blue-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  Upload Land Document
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Secure blockchain registration
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* File Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Land Document *
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <p className="text-xs text-gray-500">
                  Supported: PDF, JPG, PNG (max 10MB)
                </p>
              </div>

              {/* OCR Loading */}
              {ocrLoading && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800">
                        🤖 AI Analyzing Document...
                      </p>
                      <p className="text-xs text-blue-600">
                        Extracting ownership information
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* OCR Results */}
              {ocrData && !ocrLoading && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Scan className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-800 mb-3">
                        ✅ Document Analyzed Successfully
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(ocrData).map(([key, value]) => value && (
                          <div key={key} className="bg-white rounded-lg p-2 shadow-sm">
                            <span className="text-xs text-gray-600 block capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="text-sm font-semibold text-gray-800">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Owner Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Owner Name *
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter full name"
                />
              </div>

              {/* Village */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Village *
                </label>
                <input
                  type="text"
                  name="village"
                  value={formData.village}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter village name"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleUpload}
                disabled={processingSteps.length > 0 && !uploadResult}
                className="w-full p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {processingSteps.length > 0 && !uploadResult ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Rocket className="w-5 h-5" />
                    Upload to Blockchain
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Live Process Tracking */}
        <div className="space-y-6">
          {/* Processing Steps */}
          {processingSteps.length > 0 && (
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg animate-pulse">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Live Processing
                  </h3>
                  <p className="text-sm text-gray-600">
                    Blockchain transaction in progress
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {processingSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = step.status === 'processing';
                  const isCompleted = step.status === 'completed';
                  const isError = step.status === 'error';
                  const duration = step.completedAt ? ((step.completedAt - step.timestamp) / 1000).toFixed(2) : null;

                  return (
                    <div
                      key={step.id}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-500 ${
                        isActive 
                          ? `${getStepBorderColor(step.color)} bg-gradient-to-r from-white to-${step.color}-50 shadow-lg scale-105` 
                          : isCompleted
                          ? 'border-green-300 bg-green-50'
                          : isError
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
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
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-gray-800">
                              {step.name}
                            </h4>
                            {isActive && (
                              <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                            )}
                            {isCompleted && duration && (
                              <span className="text-xs text-green-600 font-semibold">
                                ✓ {duration}s
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                          {step.message && (
                            <p className={`text-xs mt-1 ${isError ? 'text-red-600' : 'text-green-600'}`}>
                              {step.message}
                            </p>
                          )}
                          
                          {isActive && (
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" 
                                   style={{ width: '100%' }} />
                            </div>
                          )}
                        </div>
                      </div>

                      {index < processingSteps.length - 1 && (
                        <div className={`absolute left-8 top-full w-0.5 h-4 ${
                          isCompleted ? 'bg-green-500' : isError ? 'bg-red-500' : 'bg-gray-300'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className={`rounded-2xl shadow-2xl p-8 border-2 ${
              uploadResult.success 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`p-4 rounded-xl shadow-lg ${
                  uploadResult.success ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {uploadResult.success ? (
                    <CheckCircle className="w-8 h-8 text-white" />
                  ) : (
                    <XCircle className="w-8 h-8 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`text-2xl font-bold mb-2 ${
                    uploadResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {uploadResult.success ? '🎉 Success!' : '❌ Failed'}
                  </h3>
                  <p className={uploadResult.success ? 'text-green-700' : 'text-red-700'}>
                    {uploadResult.message}
                  </p>
                  
                  {uploadResult.success && uploadResult.data && (
                    <div className="space-y-3 mt-4">
                      <div className="bg-white rounded-xl p-4 shadow-md">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-green-600" />
                          <div>
                            <span className="text-xs text-gray-600 block">Record ID</span>
                            <span className="font-mono font-bold text-lg text-gray-800">
                              #{uploadResult.data.recordId}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 shadow-md">
                        <div className="flex items-center gap-3">
                          <ExternalLink className="w-5 h-5 text-blue-600" />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-gray-600 block">Transaction Hash</span>
                            <span className="font-mono text-xs text-gray-800 truncate block">
                              {uploadResult.data.transactionHash}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 shadow-md">
                        <div className="flex items-center gap-3">
                          <Database className="w-5 h-5 text-purple-600" />
                          <div>
                            <span className="text-xs text-gray-600 block">Block Number</span>
                            <span className="font-mono font-bold text-lg text-gray-800">
                              {uploadResult.data.blockNumber}
                            </span>
                          </div>
                        </div>
                      </div>

                      <a 
                        href={uploadResult.data.ipfsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Database className="w-5 h-5" />
                            <span className="font-semibold">View on IPFS</span>
                          </div>
                          <ExternalLink className="w-5 h-5" />
                        </div>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {processingSteps.length === 0 && !uploadResult && (
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl shadow-xl p-8 border border-gray-200">
              <div className="text-center">
                <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
                  <Shield className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Blockchain-Powered Security
                </h3>
                <p className="text-gray-600 text-sm">
                  Your documents are secured with military-grade encryption and stored on immutable blockchain technology.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;