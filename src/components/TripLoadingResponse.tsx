import React, { useContext, useMemo, useEffect, useRef, useState } from 'react';
import { StyleSheet, Pressable, Image, Animated, View, Text, Alert } from 'react-native';
import { DestinationContext } from '../contexts/contexts';
import BottomSheet from '@gorhom/bottom-sheet';
import { Picker } from '@react-native-picker/picker';
import { Icon } from 'react-native-elements';
import { connectSocket, listenToTripAccepted, stopListeningToTripAccepted, stopListeningToTripDeclined } from '../configSocket/socketConfig';
import { useSelector } from 'react-redux';
import { ActivityIndicator } from 'react-native';  // Import ActivityIndicator for circular loading
import { api } from '../../api';
import axios from 'axios';

const TripLoadingResponse = ({ navigation, route }) => {
  // const {  tripData } = route.params;
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Cash');
  const [durationReached, setDurationReached] = useState( false);
  const [modalVisible, setModalVisible] = useState(true); // State to control modal visibility
  const user_id = useSelector(state => state.auth?.user.user_id);
  // Animation refs
  const scaleRef = useRef(new Animated.Value(1));
  const opacityRef = useRef(new Animated.Value(1));
  const loadingAnimation = useRef(new Animated.Value(durationReached ? 1 : 0)).current;
  const [tripStatus, setTripStatus] = useState();
  // const driverSelected = tripData;
  const driverId = useSelector((state) => state.trip.tripData?.driver_id || "");
 // Fetch trip data from the backend
 const [tripStatusAccepted, setTripStatusAccepted] = useState(null);
 // Fetch trip statuses from the backend

 const fetchTripStatuses = async () => {
   if (!user_id) return; // Ensure user_id is available

   try {
     const response = await axios.get(`${api}/trips/statuses/${user_id}`);
     if (response.status === 200) {
       setTripStatusAccepted(response.data.latestTrip?.statuses); // Store latest trip data
     }
   } catch (error) {
     // console.warn("⚠️fetching trip statuses, please wait...");
   }
 };

  useEffect(() => {
    // Connect the customer socket
    connectSocket(user_id, "customer");
  
    // Listen for when the trip is accepted
    listenToTripAccepted((data) => {
      setTripStatus("accepted");
      setModalVisible(false); // Close modal when the trip is accepted
      fetchTripStatuses(); // Fetch trip statuses
      // // Navigate to the destination screen when trip is accepted
      // if (tripStatus === "accepted") {
      //   navigation.navigate('DestinationScreen'); // Navigate to the destination screen
      // }
    });
  
    // Cleanup on component unmount
    return () => {
      stopListeningToTripAccepted();
      stopListeningToTripDeclined();
    };
  }, [user_id, tripStatus]); // Add tripStatus as a dependency to re-check navigation on change
  
  // Snap points for Bottom Sheet
  const snapPoints = useMemo(() => ['40%'], []);

  // Loading animation
  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleRef.current, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleRef.current, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityRef.current, {
            toValue: 0.6,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(opacityRef.current, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

// Duration reached effect
useEffect(() => {
  if (!durationReached) {
    // Start animation
    Animated.timing(loadingAnimation, {
      toValue: 1,
      duration: 250000,
      useNativeDriver: false,
    }).start();

    // Set a timeout to handle no response case
    const timeoutId = setTimeout(() => {
      if (tripStatusAccepted !== "accepted") {
        alert("The driver is not available at the moment. Please try choosing a different driver.");
        setModalVisible(false); // Close modal
        navigation.navigate("RequestScreen");

        // Navigate to CarListingBottomSheet with driverId after a small delay
        setTimeout(() => {
          navigation.navigate("CarListingBottomSheet", { driverId: driverId });
        }, 50);
      }
    }, 10000); // Timeout duration (10 seconds)

    // Cleanup timeout if trip is accepted before timeout occurs
    return () => clearTimeout(timeoutId);
  }
}, [durationReached, tripStatusAccepted, driverId, navigation]); 

// Effect to navigate to DestinationScreen if trip is accepted
useEffect(() => {
  if (tripStatusAccepted === "accepted") {
    console.log("Navigating to DestinationScreen...");

    setTimeout(() => {
      navigation.navigate("DestinationScreen");
    }, 2000); // Delay navigation by 2 seconds
  }
}, [tripStatusAccepted, navigation]);


  // const loadingBarWidth = durationReached
  //   ? '100%'
  //   : loadingAnimation.interpolate({
  //     inputRange: [0, 1],
  //     outputRange: ['0%', '100%'],
  //   });

  // if (!modalVisible) return null; // If modal is closed, return nothing

  return (
    <View style={styles.fullScreenOverlay}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007aff" />
      </View>

      <Animated.Text
        style={[
          styles.loadingText,
          {
            transform: [{ scale: scaleRef.current }],
            opacity: opacityRef.current,
          },
        ]}
      >
       <Text> Waiting for driver response </Text>
      </Animated.Text>

      {/* Optional: You can keep the BottomSheet if needed, but it's not necessary for full-screen loading */}
      {/* <BottomSheet
        snapPoints={snapPoints}
        index={0}
        enablePanDownToClose={false}
        style={styles.bottomSheet}
      >
        {/* Your content here */}
      {/* </BottomSheet> */}
    </View>
  );
};

export default TripLoadingResponse;

const styles = StyleSheet.create({
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white', // Semi-transparent overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    marginBottom: 20, // Add some space between the spinner and text
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
  },
});
