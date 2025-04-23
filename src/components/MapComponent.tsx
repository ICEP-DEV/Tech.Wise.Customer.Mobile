import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image, Text, Animated, Easing } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { mapStyle } from '../global/mapStyle';
import { colors } from '../global/styles';
import { GOOGLE_MAPS_APIKEY } from "@env";
import { useDispatch } from 'react-redux';
import { setOrigin, setDestination, setDistance, setDuration } from '../redux/actions/locationActions';

const MapComponent = ({ userOrigin, userDestination, driverLocation }) => {
    const dispatch = useDispatch();
    const mapRef = useRef(null);
    const [mapBearing, setMapBearing] = useState(0); // Add state for map bearing
    const rotateAnimatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Check if driverLocation is null
        if (driverLocation?.latitude && driverLocation?.longitude) {
            // Center the map on driverLocation
            mapRef.current.animateToRegion({
                latitude: driverLocation.latitude,
                longitude: driverLocation.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            });
        } else if (userOrigin?.latitude && userOrigin?.longitude) {
            // If driverLocation is null, center on userOrigin
            mapRef.current.animateToRegion({
                latitude: userOrigin.latitude,
                longitude: userOrigin.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
            });
        }
    }, [driverLocation, userOrigin]); // Run this effect when driverLocation or userOrigin changes

    useEffect(() => {
        if (userOrigin?.latitude && userDestination?.latitude && driverLocation?.latitude) {
            const coordinates = [userOrigin, userDestination, driverLocation].filter(
                (coord) => coord?.latitude && coord?.longitude
            );
            if (coordinates.length > 0 && mapRef.current) {
                mapRef.current.fitToCoordinates(coordinates, {
                    edgePadding: {
                        top: 450,
                        right: 50,
                        bottom: 350,
                        left: 50,
                    },
                    animated: true,
                });
            }
        }
    }, [userOrigin, userDestination, driverLocation]);

    const initialRegion = userOrigin?.latitude && userOrigin?.longitude
        ? {
            latitude: userOrigin.latitude,
            longitude: userOrigin.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
        }
        : {
            latitude: -25.5399,
            longitude: 28.1000,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
        };

    const getMapRegion = async () => {
        if (mapRef.current) {
            try {
                const region = await mapRef.current.getCamera();
                if (region) {
                    const newBearing = region.heading || 0;
                    setMapBearing(newBearing);
                    Animated.timing(rotateAnimatedValue, {
                        toValue: newBearing,
                        duration: 350,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }).start();
                }
            } catch (error) {
                console.error("Error getting map region:", error);
            }
        }
    };

    return (
        <View style={styles.container}>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                customMapStyle={mapStyle}
                ref={mapRef}
                initialRegion={initialRegion}
                onRegionChangeComplete={getMapRegion} // Capture map bearing changes
            >
                {userOrigin?.latitude && userOrigin?.longitude && (
                    <Marker coordinate={userOrigin} anchor={{ x: 0.5, y: 1 }}>
                        <Image
                            source={{ uri: "https://maps.google.com/mapfiles/kml/paddle/grn-circle.png" }}
                            style={styles.markerOrigin}
                            resizeMode="contain"
                        />
                    </Marker>
                )}

                {driverLocation?.latitude && driverLocation?.longitude && (
                    <Marker
                        coordinate={driverLocation}
                        anchor={{ x: 0.5, y: 0.5 }}
                        rotation={mapBearing} // Pass the map bearing to the Marker
                    >
                        <Animated.View style={[
                            {
                                width: 35,
                                height: 40,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: 20,
                                backgroundColor: 'rgba(0, 0, 255, 0.2)',
                                shadowColor: '#0000ff',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.8,
                                elevation: 5,
                                transform: [{
                                    rotate: rotateAnimatedValue.interpolate({
                                        inputRange: [0, 360],
                                        outputRange: ['0deg', '360deg'],
                                    })
                                }]
                            }
                        ]}>
                            <Image
                                source={require('../../assets/carM.png')}
                                style={{
                                    width: 40,
                                    height: 40,
                                }}
                                resizeMode="contain"
                            />
                        </Animated.View>
                    </Marker>
                )}

                {userDestination?.latitude && userDestination?.longitude && (
                    <Marker coordinate={userDestination} anchor={{ x: 0.5, y: 1 }}>
                        <Image
                            source={{ uri: "https://maps.google.com/mapfiles/kml/paddle/red-circle.png" }}
                            style={styles.markerDestination}
                            resizeMode="contain"
                        />
                    </Marker>
                )}

                {userOrigin?.latitude && userDestination?.latitude && (
                    <MapViewDirections
                        origin={userOrigin} // Change this from driverLocation to userOrigin
                        destination={userDestination} // Change this to userDestination
                        apikey={GOOGLE_MAPS_APIKEY}
                        strokeWidth={4}
                        strokeColor="#2c3e50" // Soft gray color for the polyline
                        onReady={(result) => {
                            console.log('Distance: ', result.distance, 'km');
                            // console.log('Duration: ', result.duration, 'mins');
                            // Dispatch actions to store distance and duration
                            dispatch(setDistance(result.distance));
                            dispatch(setDuration(result.duration));
                        }}
                        onError={(errorMessage) => {
                            console.log(errorMessage);
                            alert('Unable to find a route. Please check the coordinates or try again later.');
                        }}
                    // onError={(error) => console.error("Directions Error: ", error)}
                    />
                )}
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    map: {
        height: "100%",
        width: "100%"
    },

    markerWrapOrigin: {
        width: 40,
        height: 20,
    },
    markerOrigin: {
        width: 45,
        height: 45,
        borderRadius: 15,
    },

    destination: {
        width: 20,
        height: 20,
        backgroundColor: colors.black,
        alignItems: "center",
        justifyContent: "center"
    },

    view1: {
        width: 7,
        height: 7,
        backgroundColor: colors.white
    },
    markerDestination: {
        width: 45,
        height: 45,
        borderRadius: 15,
    },

    markerOrigin2: {
        width: 20,
        height: 20,
        borderRadius: 10
    },
    markerDriver: {
        width: 40,
        height: 20,
    },
    car: {
        paddingTop: 0,
        width: 40,
        height: 20,
    },

    view2: {
        position: "absolute",
        top: 10,
        right: 12,
        backgroundColor: colors.white,
        height: 40,
        width: 180,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 2,
        zIndex: 8

    },

    view3: {
        flexDirection: "row",
        alignItems: "center",
    },

    view4: {
        position: "absolute",
        top: 50,
        left: 12,
        backgroundColor: colors.white,
        height: 40,
        width: 140,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 2,
        zIndex: 8

    },

    location: {
        width: 20,
        height: 20,
        borderRadius: 9,
        backgroundColor: colors.black,
        alignItems: "center",
        justifyContent: "center"

    },

    view9: {
        width: 6,
        height: 6,
        borderRadius: 4,
        backgroundColor: "white"
    }
});

export default MapComponent;
