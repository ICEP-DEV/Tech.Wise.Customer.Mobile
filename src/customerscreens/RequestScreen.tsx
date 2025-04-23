import React, { useContext, useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, TouchableWithoutFeedback, Image, Text } from 'react-native';
import MapComponent from '../components/MapComponent';
import { colors, parameters } from '../global/styles';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_APIKEY } from "@env";
import { DestinationContext, OriginContext } from '../contexts/contexts';
import * as Location from 'expo-location';
import { Icon } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react-native';
import CustomDrawer from '../components/CustomDrawer';


const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function RequestScreen({ navigation }) {
  const user = useSelector((state) => state.auth.user);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  const { origin, dispatchOrigin } = useContext(OriginContext);
  const { destination, dispatchDestination } = useContext(DestinationContext);
  const [destinationCondition, setDestination] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const originRef = useRef();
  const destinationRef = useRef();
  const [locationFetched, setLocationFetched] = useState(false);

  const getCurrentLocation = async () => {
    if (locationFetched) return;
    setLocationFetched(true);

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      console.log("Permission Status:", status);
      if (status !== "granted") {
        return;
      }

      let { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      if (coords) {
        const { latitude, longitude } = coords;

        const addressArray = await Location.reverseGeocodeAsync({ latitude, longitude });

        if (addressArray.length > 0) {
          const address = `${addressArray[0].name}, ${addressArray[0].street}, ${addressArray[0].city}, ${addressArray[0].region}, ${addressArray[0].country}`;

          dispatchOrigin({
            type: 'ADD_ORIGIN',
            payload: { latitude, longitude, address },
          });
        }
      }
    } catch (error) {
      console.error("Error fetching location:", error);
    }
  };


  const handleNavigation = () => {
    if (destination &&
      destination.latitude !== null &&
      destination.longitude !== null) {
      navigation.navigate('CarListingBottomSheet', { destinations: destination });
    } else {
      navigation.navigate('RecentPlacesBottomSheet');
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);
  useEffect(() => {
    if (destination?.latitude && destination?.longitude) {
      navigation.navigate('CarListingBottomSheet');
    }
  }, [destination?.latitude, destination?.longitude]);


  const clearOrigionAddress = () => {
    if (originRef.current) {
      originRef.current.clear();
      originRef.current.setAddressText('');
    }
    dispatchOrigin({ type: 'RESET_ORIGIN' });
  };

  const clearDestinationAddress = () => {
    if (destinationRef.current) {
      destinationRef.current.clear();
      destinationRef.current.setAddressText('');
    }
    dispatchDestination({ type: 'RESET_DESTINATION' });
    setDestination(false);
  };


  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.topContainer}>
          <View style={styles.whiteBox}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={toggleDrawer}
                style={styles.roundButton}
              >
                <Icon type="material-community" name="menu" color={colors.black} size={30} />
              </TouchableOpacity>
            </View>
            <View style={[styles.inputContainer, autoCompleteStyles.inputStackContainer]}>
              <GooglePlacesAutocomplete
                ref={originRef}
                placeholder="From..."
                listViewDisplayed="auto"
                debounce={400}
                minLength={2}
                enablePoweredByContainer={false}
                fetchDetails={true}
                onPress={(data, details = null) => {
                  if (details) {
                    dispatchOrigin({
                      type: "ADD_ORIGIN",
                      payload: {
                        latitude: details.geometry.location.lat,
                        longitude: details.geometry.location.lng,
                        address: details.formatted_address,
                        name: details.name,
                      },
                    }, 1000);
                  }
                }}
                query={{
                  key: GOOGLE_MAPS_APIKEY,
                  language: "en",
                }}
                styles={autoCompleteStyles}
                nearbyPlacesAPI="GooglePlacesSearch"

              />
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearOrigionAddress}
              >
                <Icon name="close" size={20} color="#000" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.locationButton}
                onPress={getCurrentLocation}
              >
                <Icon name="my-location" size={20} color="#000" />
              </TouchableOpacity>
              <GooglePlacesAutocomplete
                ref={destinationRef}
                placeholder="Where to"
                listViewDisplayed="auto"
                debounce={400}
                minLength={2}
                enablePoweredByContainer={false}
                fetchDetails={true}
                onPress={(data, details = null) => {
                  if (details) {
                    dispatchDestination({
                      type: "ADD_DESTINATION",
                      payload: {
                        latitude: details.geometry.location.lat,
                        longitude: details.geometry.location.lng,
                        address: details.formatted_address,
                        name: details.name,
                      },
                    });
                  }
                }}
                query={{
                  key: GOOGLE_MAPS_APIKEY,
                  language: "en",
                }}
                styles={autoCompleteStyles}
                //open recent places bottom sheet if destination is selected
                // textInputProps={{
                //   onFocus: handleNavigation,
                // }}
                nearbyPlacesAPI="GooglePlacesSearch"

              />
              <TouchableOpacity
                style={[styles.clearButton1]}
                onPress={clearDestinationAddress}
              >
                <Icon name="close" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <MapComponent
          key={mapKey}
          userOrigin={origin}
          userDestination={destination}
        />
        <CustomDrawer isOpen={drawerOpen} toggleDrawer={toggleDrawer} navigation={navigation} />
      </SafeAreaView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  whiteBox: {
    backgroundColor: colors.white, // Background for input fields
    padding: 100, // Adjusted padding to avoid excessive spacing
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, // Shadow for Android
    zIndex: 1, // Ensure it doesn't overlap list views unnecessarily
  },

  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
  backButton: {
    padding: 10,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestText: {
    fontSize: 18,
    color: colors.grey1,
    marginLeft: 8, // Adds spacing between the icon and the text
    fontWeight: 'bold', // Makes the text bold
  },
  inputContainer: {
    position: "absolute",
    left: 10,
    right: 10,
    zIndex: 10,

  },
  arrowButton: {
    backgroundColor: '#6200ee', // Deep purple button
    borderRadius: 30,          // Circle shape
    width: 60,                 // Diameter
    height: 60,                // Diameter
    justifyContent: 'center',  // Center icon vertically
    alignItems: 'center',      // Center icon horizontally
    position: 'absolute',      // Absolute positioning
    bottom: 20,                // Distance from the bottom
    right: 20,                 // Distance from the right
    shadowColor: '#000',       // Shadow color
    shadowOffset: { width: 0, height: 4 }, // Shadow offset
    shadowOpacity: 0.3,        // Shadow transparency
    shadowRadius: 4,           // Shadow radius
    elevation: 5,
    zIndex: 1,              // Elevation for Android shadow
  },
  view1: {
    position: "absolute",
    top: 10,
    left: 12,
    backgroundColor: colors.white,
    height: 40,
    width: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    zIndex: 10,
  },
  view2: {
    height: SCREEN_HEIGHT * 0.21,
    alignItems: "center",
    zIndex: 5,
    backgroundColor: colors.white,
  },
  // Wrapper for each input and the clear button
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white, // Matches the input field background color
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  // Clear button styling for origin 
  clearButton: {
    position: 'absolute',
    top: 10, // Align it with the top of the "From..." input
    right: 10, // Align it to the right of the input
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5, // Ensure it's above other elements
  },

  clearButton1: {
    position: 'absolute',
    top: 65, // Align it below the "From..." input
    right: 10, // Align it to the right of the input
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5, // Ensure it's above other elements
  },

  // my location button styling
  locationButton: {
    backgroundColor: '#999',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'start',
    right: 45,
    position: "absolute",
  },
  profilePictureContainer: {
    position: 'absolute',
    top: 25,
    right: 12,
    backgroundColor: colors.white,
    height: 40,
    width: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    zIndex: 10,
  },
  profilePicture: {
    height: 40,
    width: 40,
    borderRadius: 20,
  },
  header: {
    position: "absolute", // Ensures it floats on top of the screen
    top: 20, // Adjust for slight padding at the top
    left: 10, // Adjust for slight padding at the left
    zIndex: 100, // Ensures it's above other elements
  },
  roundButton: {
    backgroundColor: "#fff", // Add a background color
    borderRadius: 30, // Make it round (half of the width/height)
    width: 50, // Diameter of the circle
    height: 50, // Diameter of the circle
    justifyContent: "center", // Center the icon vertically
    alignItems: "center", // Center the icon horizontally
    shadowColor: "#000", // Add shadow (optional)
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // Elevation for Android
  },
});

const autoCompleteStyles = {
  container: {
    flex: 0,
    marginBottom: 10,
  },
  textInputContainer: {
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row', // Align items in a row
    alignItems: 'center', // Center items vertically

  },
  textInput: {
    height: 40,
    color: "#5d5d5d",
    fontSize: 16,
    backgroundColor: colors.white,
    borderRadius: 5,
    paddingRight: 50, // Add padding for clear button
  },
  listView: {
    backgroundColor: '#ffffff',
    position: 'absolute',
    top: 50,
    borderRadius: 8,
    marginTop: 5,
    elevation: 3,
    zIndex: 1000,
  },
  inputStackContainer: {
    marginTop: 90,

  },

};