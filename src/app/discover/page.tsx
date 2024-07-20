"use client"
import React, { useMemo, useState, useEffect, createContext, useContext } from 'react'
import { AdvancedMarker, APIProvider, Map, MapCameraChangedEvent, MapCameraProps, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import formattedData from '@/components/data'
import { saveAs } from 'file-saver'
import { IoIosRestaurant } from 'react-icons/io'
import Image from 'next/image'
import { error } from 'console'


interface FinalDestinationContextProp {
  finalDestinatioPosition: | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place | string;
  setFinalDestinationPosition : React.Dispatch<React.SetStateAction<| google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place | string>>;
}

interface CurrentUserContextProp {
  currentUserPosition: | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place | string | undefined;
  setCurrentUserPosition : React.Dispatch<React.SetStateAction<| google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place | string | undefined>>;
}

const FinalDestinationContext = createContext<FinalDestinationContextProp | null>(null);

const CurrentUserContext = createContext<CurrentUserContextProp | null>(null);

const Discover = () => {

  
  const INITIAL_CAMERA = useMemo(() => ({
    center: 
    {lat: 6.673175, lng: -1.565423},
    zoom: 15
  }), [])
  const [finalDestinatioPosition, setFinalDestinationPosition] = useState<google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place | string>(INITIAL_CAMERA.center);
  const [currentUserPosition, setCurrentUserPosition] = useState<google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place | string>();


  const [cameraProp, setCameraProp] = useState<MapCameraProps>(INITIAL_CAMERA);
  const handleCameraChange = ((ev: MapCameraChangedEvent) => {
    return setCameraProp(ev.detail);
  })

  return (
    <div className="w-full h-screen">
    <APIProvider key="AIzaSyAebH2YjT8g-C572_d7H5wc9aHLgJg1iv8">
        <Map mapId="6ad54b3b63d51297" {...cameraProp} onCameraChanged={handleCameraChange}>
          <CurrentUserContext.Provider value={{currentUserPosition, setCurrentUserPosition}}>
          <FinalDestinationContext.Provider value={{finalDestinatioPosition, setFinalDestinationPosition}}>
          <Markers/>
          <Direction/>
          </FinalDestinationContext.Provider>
          </CurrentUserContext.Provider>
        </Map>
    </APIProvider>
</div>

  )
}


//MARKERS/////////
const Markers = () => {
  const {setFinalDestinationPosition} = useContext(FinalDestinationContext)!;
  const {currentUserPosition} = useContext(CurrentUserContext)!


return <>
{
formattedData.map((point, index) => (
   <AdvancedMarker
   title={"Mealmate"}
   position={point.coord}
   key={index}
   onClick={() => {
    const position: google.maps.LatLngLiteral = {
      lat: point.coord?.lat!,
      lng: point.coord?.lng!

    }
    setFinalDestinationPosition(position);
   }}
   >
    <Image src={point.google_map_src} alt='Image' width={50} height={30} priority/>
    {/* <IoIosRestaurant size={200}/> */}
   </AdvancedMarker>
)

)
}

{
 currentUserPosition &&
<AdvancedMarker title={"user"} position={currentUserPosition}>
  <Image src="/female_toy.jpeg" alt='female toy' width={50} height={50}/>
</AdvancedMarker>
}

</>

}


//DIRECTIONS///
const Direction = () => {
  const {finalDestinatioPosition} = useContext(FinalDestinationContext)!;
  const {currentUserPosition, setCurrentUserPosition} = useContext(CurrentUserContext)!

  // console.log("Selected Position: ", finalDestinatioPosition);
const map = useMap();
const routeLibrary = useMapsLibrary("routes");
const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
const [directionRenRenderer, setDirectionRenderer] = useState<google.maps.DirectionsRenderer>();

useEffect(() => {
  if(!map || !routeLibrary) return;

  setDirectionsService(new routeLibrary.DirectionsService());
  setDirectionRenderer(new routeLibrary.DirectionsRenderer({map}));

}, [map, routeLibrary]);

useEffect(() => {
  if(!directionsService || !directionRenRenderer) return

  directionsService.route({
    origin: currentUserPosition ? currentUserPosition : {lat: 6.673175, lng: -1.565423},
    destination: finalDestinatioPosition,
    travelMode: google.maps.TravelMode.WALKING,
  }).then((response) => {
     directionRenRenderer.setDirections(response);
  }).catch((err) => {
     console.log("Error from directions: ", err);
  })
}, [directionsService, directionRenRenderer, finalDestinatioPosition]);


useEffect(() => {
  (
    () => {
      if(navigator.geolocation){
        const watchId = navigator.geolocation.watchPosition(
          (position) => {

            const userPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }
            console.log("LOCATION: ", userPos);
            setCurrentUserPosition(userPos)
          },
          (error) => {
            console.log("Error getting user position", error);
          },
          {
            enableHighAccuracy: true, maximumAge: 0, timeout: 30000
          }
        )

        return () => navigator.geolocation.clearWatch(watchId);
      }else{
        console.log("Geolocation is not supported by this browser");
      }
    }
  )()
}, [setCurrentUserPosition, currentUserPosition, navigator.geolocation])
  return <></>
}
export default Discover