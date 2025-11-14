import React, { useState } from 'react';
import { Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { API_URL } from '../config/api';
const UploadPage = () => {
  const { account, contract, loading, setLoading } = useWallet();
  const [formData, setFormData] = useState({
    ownerName: '',
    village: '',
    file: null,
  });
  const [uploadResult, setUploadResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, file: e.target.files[0] }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!contract) {
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
        const tx = await contract.createRecord(
          formData.ownerName,
          formData.village,
          result.ipfsCID,
          result.documentHash
        );

        await tx.wait();
        setUploadResult({
          success: true,
          message: 'Document uploaded successfully!',
          recordId: result.recordId,
        });
        setFormData({ ownerName: '', village: '', file: null });
      } else {
        setUploadResult({ success: false, message: result.message });
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
        <p className="text-center text-gray-600">
          Please connect your wallet to upload documents
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Upload className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">
            Upload Document
          </h2>
        </div>
        <p className="text-gray-600 mb-6">
          Register new land ownership on blockchain
        </p>

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Owner Name
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Village
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload to Blockchain
              </>
            )}
          </button>
        </form>

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
              <div>
                <p className={`font-medium ${
                  uploadResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {uploadResult.message}
                </p>
                {uploadResult.recordId && (
                  <p className="text-sm text-green-600 mt-1">
                    Record ID: {uploadResult.recordId}
                  </p>
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
