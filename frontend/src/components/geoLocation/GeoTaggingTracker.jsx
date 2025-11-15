import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Polygon, Marker } from '@react-google-maps/api';
const MAPS_KEY = import.meta.env.VITE_MAPS_KEY
const GeotaggingTracker = () => {
  const [coordinates, setCoordinates] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 21.1287335, lng: 81.7660234 });
  
  const watchIdRef = useRef(null);
  const mapRef = useRef(null);

  // Geolocation tracking effect
  useEffect(() => {
    if (!isTracking) return;

    const geo = navigator.geolocation;
    
    // if (!geo) {
    //   setError('Geolocation is not supported by your browser');
    //   return;
    // }

    const options = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
    };

    const onSuccess = (position) => {
      const newCoord = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      console.log('New Position:', newCoord);
      
      setCurrentPosition(newCoord);
      setCoordinates(prev => {
        const updated = [...prev, newCoord];
        console.log('All Coordinates:', updated);
        return updated;
      });
      
      // Update map center to current position
      setMapCenter(newCoord);
    };

    const onError = (error) => {
      setError(`Error: ${error.message}`);
      console.error('Geolocation error:', error);
    };

    // Start watching position
    watchIdRef.current = geo.watchPosition(onSuccess, onError, options);

    // Cleanup function
    return () => {
      if (watchIdRef.current !== null) {
        geo.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isTracking]);

  const startTracking = () => {
    setIsTracking(true);
    setCoordinates([]);
    setError(null);
  };

  const stopTracking = () => {
    setIsTracking(false);
  };

  const clearTracking = () => {
    setCoordinates([]);
    setCurrentPosition(null);
    setError(null);
  };

  const calculateArea = () => {
    if (coordinates.length < 3) return 0;
    
    // Simple area calculation using Shoelace formula
    let area = 0;
    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      area += coordinates[i].lat * coordinates[j].lng;
      area -= coordinates[j].lat * coordinates[i].lng;
    }
    return Math.abs(area / 2);
  };

  // Save coordinates to JSON (for future backend use)
  const saveToJSON = () => {
    const data = {
      timestamp: new Date().toISOString(),
      totalPoints: coordinates.length,
      area: calculateArea(),
      coordinates: coordinates,
      metadata: {
        startPosition: coordinates[0] || null,
        endPosition: coordinates[coordinates.length - 1] || null,
        centerPoint: mapCenter
      }
    };

    // Store in localStorage
    localStorage.setItem('land-coordinates', JSON.stringify(data));
    
    // Log the JSON data (ready to send to backend)
    console.log('JSON Data (ready for backend):', JSON.stringify(data));
    
    alert('Coordinates saved to JSON! Check console for data.');
  };

  // Download JSON file
  const downloadJSON = () => {
    const data = {
      timestamp: new Date().toISOString(),
      totalPoints: coordinates.length,
      area: calculateArea(),
      coordinates: coordinates,
      metadata: {
        startPosition: coordinates[0] || null,
        endPosition: coordinates[coordinates.length - 1] || null,
        centerPoint: mapCenter
      }
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = href;
    link.download = `land-coordinates-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  // Load from localStorage
  const loadFromStorage = () => {
    const savedData = localStorage.getItem('land-coordinates');
    
    if (savedData) {
      const data = JSON.parse(savedData);
      setCoordinates(data.coordinates);
      
      if (data.metadata && data.metadata.centerPoint) {
        setMapCenter(data.metadata.centerPoint);
      }
      
      console.log('Loaded data from storage:', data);
      alert(`Loaded ${data.coordinates.length} coordinates from storage!`);
    } else {
      alert('No saved data found in storage');
    }
  };

  // Get JSON data (for sending to backend)
  const getJSONData = () => {
    return {
      timestamp: new Date().toISOString(),
      totalPoints: coordinates.length,
      area: calculateArea(),
      coordinates: coordinates,
      metadata: {
        startPosition: coordinates[0] || null,
        endPosition: coordinates[coordinates.length - 1] || null,
        centerPoint: mapCenter
      }
    };
  };

  // Example function to send to backend
  const sendToBackend = async () => {
    const jsonData = getJSONData();
    
    console.log('Sending to backend:', jsonData);
    
    try {
      const response = await fetch('YOUR_BACKEND_URL/api/coordinates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData)
      });
      
      const result = await response.json();
      console.log('Backend response:', result);
      alert('Data sent to backend successfully!');
    } catch (error) {
      console.error('Error sending to backend:', error);
      alert('Failed to send to backend. Check console for details.');
    }
  };

  const polygonOptions = {
    fillColor: '#FF0000',
    fillOpacity: 0.35,
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    clickable: false,
    draggable: false,
    editable: false,
    geodesic: false,
    zIndex: 1
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Control Panel */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f5f5f5', 
        borderBottom: '2px solid #ddd' 
      }}>
        <h2>Land Geotagging Tracker</h2>
        
        <div style={{ marginBottom: '10px' }}>
          <button
            onClick={startTracking}
            disabled={isTracking}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              backgroundColor: isTracking ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isTracking ? 'not-allowed' : 'pointer'
            }}
          >
            Start Tracking
          </button>
          
          <button
            onClick={stopTracking}
            disabled={!isTracking}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              backgroundColor: !isTracking ? '#ccc' : '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !isTracking ? 'not-allowed' : 'pointer'
            }}
          >
            Stop Tracking
          </button>
          
          <button
            onClick={clearTracking}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear All
          </button>
        </div>

        {/* JSON Storage Buttons */}
        <div style={{ marginBottom: '10px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
          <button
            onClick={saveToJSON}
            disabled={coordinates.length === 0}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              backgroundColor: coordinates.length === 0 ? '#ccc' : '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: coordinates.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Save to JSON
          </button>
          
          <button
            onClick={downloadJSON}
            disabled={coordinates.length === 0}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              backgroundColor: coordinates.length === 0 ? '#ccc' : '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: coordinates.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Download JSON
          </button>
          
          <button
            onClick={loadFromStorage}
            style={{
              padding: '10px 20px',
              marginRight: '10px',
              backgroundColor: '#607D8B',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Save Load
          </button>

          {/* <button
            onClick={sendToBackend}
            disabled={coordinates.length === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: coordinates.length === 0 ? '#ccc' : '#00BCD4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: coordinates.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            🚀 Send to Backend
          </button> */}
        </div>

        <div style={{ marginTop: '10px' }}>
          <p><strong>Points Collected:</strong> {coordinates.length}</p>
          <p><strong>Status:</strong> {isTracking ? '🟢 Tracking Active' : '🔴 Stopped'}</p>
          {currentPosition && (
            <p>
              <strong>Current Position:</strong> 
              {currentPosition.lat.toFixed(6)}, {currentPosition.lng.toFixed(6)}
            </p>
          )}
          {coordinates.length > 0 && (
            <p><strong>Estimated Area:</strong> {calculateArea().toFixed(6)} sq degrees</p>
          )}
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      </div>

      {/* Map Container */}
      <div style={{ flex: 1 }}>
        <LoadScript googleMapsApiKey={MAPS_KEY}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={18}
            onLoad={map => mapRef.current = map}
          >
            {/* Draw polygon if we have at least 3 points */}
            {coordinates.length >= 3 && (
              <Polygon
                paths={coordinates}
                options={polygonOptions}
              />
            )}

            {/* Draw markers for each coordinate */}
            {coordinates.map((coord, index) => (
              <Marker
                key={index}
                position={coord}
                label={(index + 1).toString()}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 6,
                  fillColor: index === coordinates.length - 1 ? '#00FF00' : '#FF0000',
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 2
                }}
              />
            ))}

            {/* Current position marker */}
            {currentPosition && isTracking && (
              <Marker
                position={currentPosition}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#0000FF',
                  fillOpacity: 0.7,
                  strokeColor: '#FFFFFF',
                  strokeWeight: 3
                }}
              />
            )}
          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  );
};

export default GeotaggingTracker;
