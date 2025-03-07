import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Filter, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '@/integrations/supabase/client'; // Import supabase client

// Fix for default marker icons in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Add this after the DefaultIcon definition

// Public station icon (blue)
const PublicIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Private station icon (dark blue)
const PrivateIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Station {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  access_type: string;
  rating?: number;
  verification_status: string;
  distance?: string;
  position?: [number, number];
  is_private: boolean;  // Add this line
}

// Get stations from Supabase
const getStations = async () => {
  const { data, error } = await supabase
    .from('water_stations')
    .select('*')
    .eq('verification_status', 'approved');
    
  if (error) {
    console.error('Error fetching stations:', error);
    return [];
  }
  
  // Transform the data to include position array
  return data?.map(station => ({
    ...station,
    position: [station.latitude, station.longitude] as [number, number],
    // Add default values for optional fields
    rating: station.rating || 0,
    distance: "calculating...",
    type: station.access_type || "Public Fountain"
  })) || [];
};

// Component to handle getting user's location and setting map view
const LocationButton = () => {
  const map = useMap();
  
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.flyTo([latitude, longitude], 13);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };
  
  return (
    <Button 
      className="absolute top-4 right-16 z-[1000] bg-refillia-primary hover:bg-refillia-primary/90 shadow-md"
      onClick={getLocation}
    >
      <Navigation className="h-5 w-5" />
    </Button>
  );
};

// Component to set initial map center to user location
const SetViewOnUserLocation = () => {
  const map = useMap();
  
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 13);
          console.log("Set view to user location:", latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to default center if geolocation fails
        }
      );
    }
  }, [map]);
  
  return null;
};

const MapView: React.FC = () => {
  const [showList, setShowList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stations, setStations] = useState<Station[]>([]);
  const [filteredStations, setFilteredStations] = useState<Station[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([39.8283, -98.5795]); // Default center of the US
  const [mapZoom, setMapZoom] = useState(4);

  // Load stations on mount and when localStorage changes
  useEffect(() => {
    const loadStations = async () => {
      const loadedStations = await getStations();
      setStations(loadedStations);
      setFilteredStations(loadedStations);
    };
    loadStations();
  }, []);

  // Listen for storage events to update stations if another tab adds a station
  useEffect(() => {
    const handleStorageChange = async () => {
      const loadedStations = await getStations();
      setStations(loadedStations);
      setFilteredStations(loadedStations);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    // Filter stations based on search query
    if (searchQuery.trim() === '') {
      setFilteredStations(stations);
    } else {
      const filtered = stations.filter(station => 
        station.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        station.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStations(filtered);
    }
  }, [searchQuery, stations]);

  return (
    <div className="h-[calc(100vh-64px)] relative">
      {/* Map Component */}
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {filteredStations.map(station => (
          <Marker 
            key={station.id} 
            position={[station.latitude, station.longitude] as [number, number]}
            icon={station.is_private ? PrivateIcon : PublicIcon}
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-semibold">{station.name}</h3>
                <p className="text-sm">{station.address}</p>
                <p className="text-xs text-gray-600">
                  {station.is_private ? 'Private' : 'Public'} {station.access_type}
                </p>
                <div className="flex justify-between mt-2 text-sm">
                  <span>Rating: {station.rating || 0} ★</span>
                  <Link 
                    to={`/station/${station.id}`} 
                    className="text-refillia-primary hover:underline"
                  >
                    Details
                  </Link>
                </div>
                <div className="mt-2">
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-refillia-primary hover:underline text-sm flex items-center"
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Get Directions
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        <SetViewOnUserLocation />
        <LocationButton />
      </MapContainer>
      
      {/* Search and filter overlay */}
      <div className="absolute top-4 left-4 right-24 flex gap-2 z-[1000]">
        <Input 
          className="bg-white shadow-md" 
          placeholder="Search for refill stations..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button variant="outline" className="bg-white shadow-md">
          <Filter className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Toggle list view button */}
      <Button 
        className="absolute bottom-4 right-4 bg-white text-gray-800 hover:bg-gray-100 shadow-md z-[1000]"
        onClick={() => setShowList(!showList)}
      >
        <List className="h-5 w-5 mr-2" />
        {showList ? 'Hide List' : 'Show List'}
      </Button>
      
      {/* Add Station button */}
      <Link to="/add-station">
        <Button 
          className="absolute bottom-4 left-4 bg-refillia-primary hover:bg-refillia-primary/90 shadow-md z-[1000]"
        >
          <MapPin className="h-5 w-5 mr-2" />
          Add Station
        </Button>
      </Link>
      
      {/* Station list overlay */}
      {showList && (
        <div className="absolute bottom-16 right-4 w-80 bg-white rounded-lg shadow-lg max-h-[70vh] overflow-y-auto z-[1000]">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Nearby Refill Stations</h3>
          </div>
          
          <div className="divide-y">
            {filteredStations.length > 0 ? (
              filteredStations.map(station => (
                <Link to={`/station/${station.id}`} key={station.id}>
                  <div className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-800">{station.name}</h4>
                        <p className="text-sm text-gray-500">{station.address}</p>
                        <p className="text-xs text-gray-400 mt-1">{station.access_type}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-gray-600 mr-1">{station.rating || 0}</span>
                          <span className="text-yellow-400">★</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-refillia-primary hover:underline text-sm flex items-center"
                      >
                        <Navigation className="h-3 w-3 mr-1" />
                        Get Directions
                      </a>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No stations found. Try adjusting your search.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
