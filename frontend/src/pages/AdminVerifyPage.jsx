import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, CheckCircle, XCircle, ExternalLink, AlertCircle, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = "http://localhost:5000/api";

const AdminVerifyPage = () => {
  const navigate = useNavigate();
  const [pendingRecords, setPendingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [activeRecordId, setActiveRecordId] = useState(null);
  const [verifiedArea, setVerifiedArea] = useState('');
  const [geotagCoordinates, setGeotagCoordinates] = useState(null);

  useEffect(() => {
    loadPendingVerifications();
  }, []);

  const loadPendingVerifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/pending-verifications`);
      const result = await response.json();

      if (result.success) {
        setPendingRecords(result.data);
      }
    } catch (error) {
      console.error('Error loading pending verifications:', error);
      alert('Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyArea = async (recordId) => {
    if (!verifiedArea) {
      alert('Please enter the verified area');
      return;
    }

    setVerifying(true);
    setActiveRecordId(recordId);

    try {
      const response = await fetch(`${API_URL}/verify-area`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId,
          verifiedArea,
          geotagData: geotagCoordinates
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Area verified successfully!');
        setVerifiedArea('');
        setGeotagCoordinates(null);
        await loadPendingVerifications();
      } else {
        alert('❌ Verification failed: ' + result.error);
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('Failed to verify area');
    } finally {
      setVerifying(false);
      setActiveRecordId(null);
    }
  };

  const handleGeotagging = (recordId) => {
    localStorage.setItem('geotagRecordId', recordId);
    navigate('/map');
  };

  useEffect(() => {
    const savedGeotagData = localStorage.getItem('land-coordinates');
    if (savedGeotagData) {
      try {
        const data = JSON.parse(savedGeotagData);
        setGeotagCoordinates(data);
        
        if (data.area) {
          const areaInAcres = (data.area * 111000 * 111000 / 4046.86).toFixed(2);
          setVerifiedArea(areaInAcres);
        }
      } catch (error) {
        console.error('Error parsing geotag data:', error);
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto mt-8 px-4">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4 space-y-6">
      <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-2xl p-8 border border-green-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Area Verification Dashboard
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Admin Panel - Verify land areas using geotagging
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">How to Verify</h4>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>Click "Start Geotagging" to map the land boundaries</li>
                <li>Walk around the property boundary with GPS tracking</li>
                <li>System automatically calculates the verified area</li>
                <li>Review and confirm the area matches claimed area (±10% tolerance)</li>
                <li>Click "Verify Area" to complete verification</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">
          Pending Verifications ({pendingRecords.length})
        </h3>

        {pendingRecords.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No pending verifications</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingRecords.map((record) => (
              <div key={record.recordId} className="border-2 border-green-200 rounded-xl p-6 bg-gradient-to-br from-green-50 to-white">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 mb-4">
                      Record #{record.recordId}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Owner:</span>
                        <span className="ml-2 font-semibold text-gray-800">{record.ownerName}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Village:</span>
                        <span className="ml-2 font-semibold text-gray-800">{record.village}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Uploaded:</span>
                        <span className="ml-2 text-gray-800">{record.timestamp}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Claimed Area:</span>
                        <span className="ml-2 font-bold text-green-700 text-lg">
                          {record.claimedArea} {record.unit}
                        </span>
                      </div>
                    </div>

                    <a
                      href={record.ipfsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline text-sm"
                    >
                      View Document on IPFS <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Verified Area (from Geotagging)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={activeRecordId === record.recordId ? verifiedArea : ''}
                          onChange={(e) => {
                            setActiveRecordId(record.recordId);
                            setVerifiedArea(e.target.value);
                          }}
                          step="0.01"
                          min="0"
                          placeholder="Enter verified area"
                          className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <span className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-semibold">
                          {record.unit}
                        </span>
                      </div>
                    </div>

                    {geotagCoordinates && activeRecordId === record.recordId && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Map className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-800">
                            Geotag Data Available
                          </span>
                        </div>
                        <p className="text-xs text-green-700">
                          {geotagCoordinates.totalPoints} GPS points collected
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleGeotagging(record.recordId)}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Map className="w-5 h-5" />
                        Start Geotagging
                      </button>

                      <button
                        onClick={() => handleVerifyArea(record.recordId)}
                        disabled={verifying && activeRecordId === record.recordId}
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                      >
                        {verifying && activeRecordId === record.recordId ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Verify Area
                          </>
                        )}
                      </button>
                    </div>

                    {activeRecordId === record.recordId && verifiedArea && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Area Comparison</h5>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Claimed:</span>
                            <span className="font-semibold">{record.claimedArea} {record.unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Verified:</span>
                            <span className="font-semibold">{verifiedArea} {record.unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Difference:</span>
                            <span className={`font-semibold ${
                              Math.abs(parseFloat(verifiedArea) - parseFloat(record.claimedArea)) / parseFloat(record.claimedArea) * 100 <= 10
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {((Math.abs(parseFloat(verifiedArea) - parseFloat(record.claimedArea)) / parseFloat(record.claimedArea)) * 100).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVerifyPage;