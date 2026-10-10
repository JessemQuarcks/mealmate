"use client"
import React, { useMemo, useState, useEffect, createContext, useContext } from 'react'
import { AdvancedMarker, APIProvider, Map, MapCameraChangedEvent, MapCameraProps, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import Image from 'next/image'

interface NearbyRestaurant {
  _id: string;
  externalId: string;
  name: string;
  imageUrl?: string;
  location: { coordinates: [number, number] }; // [lng, lat]
}

interface FinalDestinationContextProp {
  finalDestinatioPosition: google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place | string;
  setFinalDestinationPosition: React.Dispatch<React.SetStateAction<google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place | string>>;
}

interface CurrentUserContextProp {
  currentUserPosition: google.maps.LatLngLiteral | undefined;
  setCurrentUserPosition: React.Dispatch<React.SetStateAction<google.maps.LatLngLiteral | undefined>>;
}

const FinalDestinationContext = createContext<FinalDestinationContextProp | null>(null);
const CurrentUserContext = createContext<CurrentUserContextProp | null>(null);

const Discover = () => {
  const INITIAL_CAMERA = useMemo(() => ({
    center: { lat: 6.673175, lng: -1.565423 },
    zoom: 15,
  }), []);

  const [finalDestinatioPosition, setFinalDestinationPosition] = useState<google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place | string>(INITIAL_CAMERA.center);
  const [currentUserPosition, setCurrentUserPosition] = useState<google.maps.LatLngLiteral | undefined>();
  const [cameraProp, setCameraProp] = useState<MapCameraProps>(INITIAL_CAMERA);

  const handleCameraChange = (ev: MapCameraChangedEvent) => setCameraProp(ev.detail);

  return (
    <div className="w-full h-screen">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <Map mapId="6ad54b3b63d51297" {...cameraProp} onCameraChanged={handleCameraChange}>
          <CurrentUserContext.Provider value={{ currentUserPosition, setCurrentUserPosition }}>
            <FinalDestinationContext.Provider value={{ finalDestinatioPosition, setFinalDestinationPosition }}>
              <Markers />
              <Direction />
            </FinalDestinationContext.Provider>
          </CurrentUserContext.Provider>
        </Map>
      </APIProvider>
    </div>
  );
};

// MARKERS — loaded from the database by proximity to the user.
const Markers = () => {
  const { setFinalDestinationPosition } = useContext(FinalDestinationContext)!;
  const { currentUserPosition } = useContext(CurrentUserContext)!;
  const [restaurants, setRestaurants] = useState<NearbyRestaurant[]>([]);

  useEffect(() => {
    const center = currentUserPosition ?? { lat: 6.673175, lng: -1.565423 };
    const url = `/api/restaurants?lat=${center.lat}&lng=${center.lng}&radius=50000`;
    fetch(url)
      .then((r) => r.json())
      .then((body) => setRestaurants(body?.data ?? []))
      .catch((err) => console.log("Failed to load nearby restaurants", err));
  }, [currentUserPosition]);

  return (
    <>
      {restaurants.map((point) => {
        const [lng, lat] = point.location.coordinates;
        return (
          <AdvancedMarker
            title={point.name}
            position={{ lat, lng }}
            key={point._id}
            onClick={() => setFinalDestinationPosition({ lat, lng })}
          >
            {point.imageUrl && (
              <Image src={point.imageUrl} alt={point.name} width={50} height={30} priority />
            )}
          </AdvancedMarker>
        );
      })}

      {currentUserPosition && (
        <AdvancedMarker title="You" position={currentUserPosition}>
          <Image src="/female_toy.jpeg" alt="Your location" width={50} height={50} />
        </AdvancedMarker>
      )}
    </>
  );
};

// DIRECTIONS
const Direction = () => {
  const { finalDestinatioPosition } = useContext(FinalDestinationContext)!;
  const { currentUserPosition, setCurrentUserPosition } = useContext(CurrentUserContext)!;

  const map = useMap();
  const routeLibrary = useMapsLibrary("routes");
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
  const [directionRenRenderer, setDirectionRenderer] = useState<google.maps.DirectionsRenderer>();

  useEffect(() => {
    if (!map || !routeLibrary) return;
    setDirectionsService(new routeLibrary.DirectionsService());
    setDirectionRenderer(new routeLibrary.DirectionsRenderer({ map }));
  }, [map, routeLibrary]);

  useEffect(() => {
    if (!directionsService || !directionRenRenderer) return;
    directionsService.route({
      origin: currentUserPosition ? currentUserPosition : { lat: 6.673175, lng: -1.565423 },
      destination: finalDestinatioPosition,
      travelMode: google.maps.TravelMode.WALKING,
    }).then((response) => {
      directionRenRenderer.setDirections(response);
    }).catch((err) => {
      console.log("Error from directions: ", err);
    });
  }, [directionsService, directionRenRenderer, finalDestinatioPosition, currentUserPosition]);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by this browser");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentUserPosition({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => console.log("Error getting user position", error),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [setCurrentUserPosition]);

  return <></>;
};

export default Discover;
