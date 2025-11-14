import React, { useState } from 'react';
import { Upload, Loader2, CheckCircle, XCircle, Scan, FileText } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { API_URL } from '../config/api';

const UploadPage = () => {
  const { account } = useWallet();
  const [formData, setFormData] = useState({
    ownerName: '',
    village: '',
    file: null,
  });
  const [uploadResult, setUploadResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrData, setOcrData] = useState(null);

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

    // Auto-trigger OCR for images
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
        
        // Auto-fill form if data extracted
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
    
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setUploadResult(null);

    try {
      const data = new FormData();
      data.append('file', formData.file);
      data.append('ownerName', formData.ownerName);
      data.append('village', formData.village);

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: data,
      });

      const result = await response.json();

      if (result.success) {
        setUploadResult({
          success: true,
          message: 'Document uploaded successfully to blockchain!',
          data: result.data,
        });
        
        // Reset form
        setFormData({ ownerName: '', village: '', file: null });
        setOcrData(null);
        
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      } else {
        setUploadResult({ 
          success: false, 
          message: result.error || 'Upload failed' 
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({ 
        success: false, 
        message: 'Upload failed: ' + error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            Please connect your wallet to upload documents
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Upload className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            Upload Land Document
          </h2>
        </div>
        <p className="text-gray-600 mb-6">
          Register new land ownership on blockchain with automatic document extraction
        </p>

        <form onSubmit={handleUpload} className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Land Document
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              required
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported: PDF, JPG, PNG (max 10MB). Images will be automatically analyzed.
            </p>
          </div>

          {/* OCR Loading Indicator */}
          {ocrLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Analyzing document...
                  </p>
                  <p className="text-xs text-blue-600">
                    Extracting information from image
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* OCR Results */}
          {ocrData && !ocrLoading && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Scan className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 mb-2">
                    Document analyzed successfully
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {ocrData.ownerName && (
                      <div>
                        <span className="text-gray-600">Owner:</span>
                        <span className="ml-1 font-medium text-gray-800">{ocrData.ownerName}</span>
                      </div>
                    )}
                    {ocrData.village && (
                      <div>
                        <span className="text-gray-600">Village:</span>
                        <span className="ml-1 font-medium text-gray-800">{ocrData.village}</span>
                      </div>
                    )}
                    {ocrData.landArea && (
                      <div>
                        <span className="text-gray-600">Area:</span>
                        <span className="ml-1 font-medium text-gray-800">{ocrData.landArea}</span>
                      </div>
                    )}
                    {ocrData.surveyNumber && (
                      <div>
                        <span className="text-gray-600">Survey #:</span>
                        <span className="ml-1 font-medium text-gray-800">{ocrData.surveyNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Owner Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Owner Name *
            </label>
            <input
              type="text"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter owner name"
            />
          </div>

          {/* Village */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Village *
            </label>
            <input
              type="text"
              name="village"
              value={formData.village}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter village name"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || ocrLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading to Blockchain...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload to Blockchain
              </>
            )}
          </button>
        </form>

        {/* Upload Result */}
        {uploadResult && (
          <div className={`mt-6 p-4 rounded-lg ${
            uploadResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {uploadResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  uploadResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {uploadResult.message}
                </p>
                
                {uploadResult.success && uploadResult.data && (
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-green-700">
                        Record ID: <span className="font-mono font-bold">{uploadResult.data.recordId}</span>
                      </span>
                    </div>
                    <div className="text-xs text-green-600 space-y-1">
                      <p>Transaction: {uploadResult.data.transactionHash}</p>
                      <p>Block: {uploadResult.data.blockNumber}</p>
                      <a 
                        href={uploadResult.data.ipfsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View on IPFS →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;