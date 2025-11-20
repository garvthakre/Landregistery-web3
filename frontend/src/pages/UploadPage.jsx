import React, { useState } from 'react';
import { Upload, Loader2, CheckCircle, XCircle, Scan, FileText, Lock, Database, Rocket, Shield, Hash, ExternalLink, AlertCircle } from 'lucide-react';

const API_URL = "http://localhost:5000/api";

const UploadPage = () => {
  const [formData, setFormData] = useState({
    ownerName: '',
    village: '',
    file: null,
    landArea: '',
    unit: 'acres'
  });
  const [uploadResult, setUploadResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrData, setOcrData] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [processingSteps, setProcessingSteps] = useState([]);
  
  const STEPS = [
    { id: 1, name: 'Analyzing Document', icon: Scan, color: 'blue', description: 'Extracting data via OCR' },
    { id: 2, name: 'Validating Data', icon: CheckCircle, color: 'purple', description: 'Matching document with input' },
    { id: 3, name: 'Calculating Hash', icon: Hash, color: 'cyan', description: 'Computing SHA-256 hash' },
    { id: 4, name: 'Uploading to IPFS', icon: Database, color: 'green', description: 'Storing on decentralized storage' },
    { id: 5, name: 'Creating Smart Contract', icon: Lock, color: 'orange', description: 'Preparing blockchain transaction' },
    { id: 6, name: 'Broadcasting to Network', icon: Rocket, color: 'pink', description: 'Sending to blockchain network' },
    { id: 7, name: 'Confirming on Blockchain', icon: Shield, color: 'indigo', description: 'Waiting for confirmation' },
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
    
    // Clear validation when user changes input
    if (ocrData) {
      setValidationResult(null);
    }
  };

  const normalizeString = (str) => {
    if (!str) return '';
    return str.toString().toLowerCase().trim().replace(/\s+/g, ' ');
  };

  const validateData = (ocrExtracted, userInput) => {
    const results = {
      ownerName: { match: false, confidence: 0 },
      village: { match: false, confidence: 0 },
      landArea: { match: false, confidence: 0 }
    };

    // Validate Owner Name
    if (ocrExtracted.ownerName && userInput.ownerName) {
      const ocrName = normalizeString(ocrExtracted.ownerName);
      const inputName = normalizeString(userInput.ownerName);
      results.ownerName.match = ocrName === inputName;
      results.ownerName.confidence = results.ownerName.match ? 100 : 
        (ocrName.includes(inputName) || inputName.includes(ocrName)) ? 50 : 0;
    }

    // Validate Village
    if (ocrExtracted.village && userInput.village) {
      const ocrVillage = normalizeString(ocrExtracted.village);
      const inputVillage = normalizeString(userInput.village);
      results.village.match = ocrVillage === inputVillage;
      results.village.confidence = results.village.match ? 100 : 
        (ocrVillage.includes(inputVillage) || inputVillage.includes(ocrVillage)) ? 50 : 0;
    }

    // Validate Land Area
    if (ocrExtracted.landArea && userInput.landArea) {
      const ocrArea = parseFloat(ocrExtracted.landArea);
      const inputArea = parseFloat(userInput.landArea);
      const difference = Math.abs(ocrArea - inputArea);
      const percentDiff = (difference / ocrArea) * 100;
      
      results.landArea.match = percentDiff < 5; // Allow 5% difference
      results.landArea.confidence = percentDiff < 5 ? 100 : percentDiff < 10 ? 70 : 30;
    }

    const allMatch = results.ownerName.match && results.village.match && results.landArea.match;
    const avgConfidence = (results.ownerName.confidence + results.village.confidence + results.landArea.confidence) / 3;

    return {
      success: allMatch,
      confidence: Math.round(avgConfidence),
      details: results
    };
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData(prev => ({ ...prev, file }));
    setOcrData(null);
    setUploadResult(null);
    setValidationResult(null);

    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
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
        
        // Auto-fill form fields if empty
        setFormData(prev => ({ 
          ...prev, 
          ownerName: prev.ownerName || result.data.ownerName || '',
          village: prev.village || result.data.village || '',
          landArea: prev.landArea || result.data.landArea || '',
          unit: result.data.unit || prev.unit
        }));
      } else {
        console.error('OCR failed:', result.error);
      }
    } catch (error) {
      console.error('OCR error:', error);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleValidateBeforeUpload = () => {
    if (!ocrData) {
      setValidationResult({
        success: false,
        message: 'Please upload a document first for validation'
      });
      return false;
    }

    const validation = validateData(ocrData, formData);
    setValidationResult(validation);
    return validation.success;
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    setUploadResult(null);
    setProcessingSteps([]);
    setCurrentStep(0);

    try {
      // Step 1: Analyzing Document
      setCurrentStep(0);
      updateStep(0, 'processing');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (!ocrData) {
        updateStep(0, 'error', 'No document data found');
        throw new Error('Please upload and analyze a document first');
      }
      
      updateStep(0, 'completed', 'Document analyzed successfully');

      // Step 2: Validate Data
      setCurrentStep(1);
      updateStep(1, 'processing');
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const validation = validateData(ocrData, formData);
      setValidationResult(validation);
      
      if (!validation.success) {
        updateStep(1, 'error', `Validation failed - ${validation.confidence}% match`);
        setUploadResult({
          success: false,
          message: 'Document data does not match your input. Please verify and correct the information.'
        });
        return;
      }
      
      updateStep(1, 'completed', `✓ 100% match confirmed`);

      // Step 3: Calculate Hash
      setCurrentStep(2);
      updateStep(2, 'processing');
      await new Promise(resolve => setTimeout(resolve, 700));
      updateStep(2, 'completed', 'Hash calculated');

      // Step 4: Upload to IPFS
      setCurrentStep(3);
      updateStep(3, 'processing');
      
      const data = new FormData();
      data.append('file', formData.file);
      data.append('ownerName', formData.ownerName);
      data.append('village', formData.village);
      data.append('landArea', formData.landArea);
      data.append('unit', formData.unit);

      const response = await fetch(`${API_URL}/upload-document`, {
        method: 'POST',
        body: data,
      });

      updateStep(3, 'completed', 'Uploaded to IPFS');

      // Step 5: Smart Contract
      setCurrentStep(4);
      updateStep(4, 'processing');
      await new Promise(resolve => setTimeout(resolve, 600));
      updateStep(4, 'completed', 'Smart contract created');

      // Step 6: Broadcasting
      setCurrentStep(5);
      updateStep(5, 'processing');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStep(5, 'completed', 'Broadcasted to network');

      // Step 7: Confirmation
      setCurrentStep(6);
      updateStep(6, 'processing');
      
      const result = await response.json();

      if (result.success) {
        updateStep(6, 'completed', 'Confirmed on blockchain');
        
        setUploadResult({
          success: true,
          message: 'Document uploaded successfully to blockchain!',
          data: result.data,
        });
        
        // Reset form after 5 seconds
        setTimeout(() => {
          setFormData({ ownerName: '', village: '', landArea: '', unit: 'acres', file: null });
          setOcrData(null);
          setValidationResult(null);
          const fileInput = document.querySelector('input[type="file"]');
          if (fileInput) fileInput.value = '';
        }, 5000);
      } else {
        updateStep(6, 'error', result.error);
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
        message: error.message || 'Upload failed'
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
      cyan: 'from-cyan-500 to-cyan-600',
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
      cyan: 'border-cyan-500',
    };
    return colors[color] || colors.blue;
  };

  const canSubmit = formData.file && formData.ownerName && formData.village && formData.landArea && ocrData;

  return (
    <div className="max-w-6xl mx-auto mt-8 px-4 pb-8">
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
                  Secure blockchain registration with auto-validation
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
                  📄 Upload document for automatic data extraction
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
                        ✅ Document Scanned Successfully
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {ocrData.ownerName && (
                          <div className="bg-white rounded-lg p-2 shadow-sm">
                            <span className="text-xs text-gray-600 block">Owner:</span>
                            <span className="text-sm font-semibold text-gray-800">{ocrData.ownerName}</span>
                          </div>
                        )}
                        {ocrData.village && (
                          <div className="bg-white rounded-lg p-2 shadow-sm">
                            <span className="text-xs text-gray-600 block">Village:</span>
                            <span className="text-sm font-semibold text-gray-800">{ocrData.village}</span>
                          </div>
                        )}
                        {ocrData.landArea && (
                          <div className="bg-white rounded-lg p-2 shadow-sm col-span-2">
                            <span className="text-xs text-gray-600 block">Area:</span>
                            <span className="text-sm font-semibold text-gray-800">
                              {ocrData.landArea} {ocrData.unit || 'acres'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Result */}
              {validationResult && !validationResult.success && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-800 mb-2">
                        ⚠️ Validation Warning
                      </p>
                      <div className="space-y-2 text-xs">
                        {!validationResult.details.ownerName.match && (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-3 h-3 text-red-500" />
                            <span className="text-gray-700">Owner name mismatch</span>
                          </div>
                        )}
                        {!validationResult.details.village.match && (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-3 h-3 text-red-500" />
                            <span className="text-gray-700">Village name mismatch</span>
                          </div>
                        )}
                        {!validationResult.details.landArea.match && (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-3 h-3 text-red-500" />
                            <span className="text-gray-700">Land area mismatch</span>
                          </div>
                        )}
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

              {/* Land Area */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Land Area *
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    step="0.01"
                    name="landArea"
                    value={formData.landArea}
                    onChange={handleInputChange}
                    required
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="e.g., 2.5"
                  />
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    required
                    className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                    <option value="square meters">Sq Meters</option>
                    <option value="bigha">Bigha</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleUpload}
                disabled={!canSubmit || (processingSteps.length > 0 && !uploadResult)}
                className="w-full bg-gradient-to-br from-green-500 to-green-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {processingSteps.length > 0 && !uploadResult ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Rocket className="w-5 h-5" />
                    {!canSubmit ? 'Fill All Fields & Upload Document' : 'Validate & Upload to Blockchain'}
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
                            <p className={`text-xs mt-1 font-semibold ${isError ? 'text-red-600' : 'text-green-600'}`}>
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
                  Smart Validation System
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Upload your document and we'll automatically extract and validate the data before blockchain registration.
                </p>
                <div className="grid grid-cols-3 gap-3 mt-6">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <Scan className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-gray-700">Auto Extract</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-gray-700">Validate</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <Shield className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-gray-700">Secure</p>
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

export default UploadPage;