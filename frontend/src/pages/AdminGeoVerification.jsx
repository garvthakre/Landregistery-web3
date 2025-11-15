import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, XCircle, Loader2, Map, Navigation, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';

const AdminGeoVerification = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [pendingRecords, setPendingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/upload');
      return;
    }
    loadPendingVerifications();
  }, [isAdmin, navigate]);

  const loadPendingVerifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/geo-verification/pending`);
      const result = await response.json();
      
      if (result.success) {
        setPendingRecords(result.records);
      }
    } catch (error) {
      console.error('Error loading pending verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGeotagging = (record) => {
    setSelectedRecord(record);
    // Navigate to geotagging page with record data
    navigate('/map', { state: { record } });
  };

  const handleViewLocation = (record) => {
    const { latitude, longitude } = record.claimedLocation;
    const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(googleMapsUrl, '_blank');
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-8 border border-blue-100 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Geo Verification Dashboard
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Admin panel for location verification
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MapPin className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-800">{pendingRecords.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Verified Today</p>
                <p className="text-2xl font-bold text-gray-800">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-800">0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Records */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">
          Pending Verifications
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading records...</span>
          </div>
        ) : pendingRecords.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No pending verifications</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRecords.map((record) => (
              <div 
                key={record.recordId} 
                className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-all bg-gradient-to-r from-white to-blue-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-800">
                          Record #{record.recordId}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {record.ownerName} - {record.village}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        📍 Claimed Location:
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs text-gray-600">Latitude:</span>
                          <p className="font-mono text-sm font-bold text-gray-800">
                            {record.claimedLocation.latitude}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-600">Longitude:</span>
                          <p className="font-mono text-sm font-bold text-gray-800">
                            {record.claimedLocation.longitude}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">
                      Uploaded: {new Date(record.timestamp).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleViewLocation(record)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View on Map
                    </button>
                    
                    <button
                      onClick={() => handleStartGeotagging(record)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
                    >
                      <Navigation className="w-4 h-4" />
                      Start Verification
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
        <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
          <Map className="w-5 h-5" />
          Verification Process:
        </h4>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="font-bold">1.</span>
            <span>Click "Start Verification" to open the geotagging interface</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            <span>Visit the physical location with GPS-enabled device</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            <span>Walk the boundary and capture GPS coordinates</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">4.</span>
            <span>System will compare claimed vs actual coordinates</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">5.</span>
            <span>Verification result will be recorded on blockchain</span>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default AdminGeoVerification;