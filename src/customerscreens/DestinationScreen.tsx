import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, Image, TouchableWithoutFeedback, BackHandler } from 'react-native';
import { Icon } from 'react-native-elements';
import { colors } from '../global/styles';
import { DestinationContext, OriginContext } from '../contexts/contexts';
import { DriverOriginContext } from '../contexts/driverContexts';
import MapComponent from '../components/MapComponent';
import axios from 'axios';
import { GOOGLE_MAPS_APIKEY } from "@env";
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomDrawer from '../components/CustomDrawer';
import { useDispatch, useSelector } from 'react-redux';
import { db, doc } from '../../FirebaseConfig';
import { onSnapshot } from 'firebase/firestore';
import debounce from 'lodash.debounce';
import { connectSocket, emitTripCanceltToDrivers, listenToChatMessages, listenToDriverArrival, listenToTripAccepted, listenToTripDeclined, listenToTripEnded, listenToTripStarted, stopListeningToTripAccepted, stopListeningToTripDeclined } from "../configSocket/socketConfig"; // Import the new functions
import TripCancellationModal from '../components/TripCancelationModal';
import { api } from '../../api';
import { setMessageData } from '../redux/actions/messageAction';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

const DestinationScreen = ({ navigation, route }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const tripData = useSelector(state => state.trip?.tripData);
  //trip data from socket notification
  const [tripDataSocket, setTripData] = useState(null);
  // console.log("Trip Dataidddddddddddd", tripDataSocket?.tripId);
  // driver id from trip data
  const driver_id = tripData?.driver_id;
  // console.log("trip data6666666666666666", driver_id);
  const user_id = useSelector(state => state.auth?.user.user_id);
  const dispatch = useDispatch()


  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  const { originDriver = {} } = useContext(DriverOriginContext);
  const { origin = {} } = useContext(OriginContext);
  const { destination = {} } = useContext(DestinationContext);

  const [userOrigin] = useState({
    latitude: origin?.latitude || null,
    longitude: origin?.longitude || null,
  });

  const [driverLocation, setDriverLocation] = useState({
    latitude: null,
    longitude: null,
  });

  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [etaTrip, setEtaTrip] = useState(null);
  const [distanceTrip, setDistanceTrip] = useState(null);

  // Trip Cancellation Modal
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [notificationCountChat, setNotificationCountChat] = useState("");


  const handleCancelTrip = () => {
    setCancelModalVisible(true); // Show cancellation modal
  };

  const handleCancel = async (reason) => {
    setCancelReason(reason);
    // console.log("Trip Cancelled for reason:", reason);

    // Assuming you have the tripId, cancel_by (user ID or admin), and distance_traveled (if applicable)
    const tripId = tripData?.tripId; // Replace with the actual trip ID you want to cancel
    const distanceTraveled = distanceTrip || null; // Replace with the actual distance if relevant

    try {
      const response = await fetch(`${api}trips/${tripId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'canceled',
          cancellation_reason: reason,
          cancel_by: 'customer',
          distance_traveled: distanceTraveled,
        }),
      });

      if (response.status === 200) {
        // console.log('Trip status updated:', await response.json());
        emitTripCanceltToDrivers(tripData, driver_id); // Emit trip cancellation to drivers
        stopListeningToTripAccepted();
        stopListeningToTripDeclined();

        navigation.navigate('RequestScreen');
      } else if (response.status === 404) {
        console.error('Trip not found:', await response.json());
        // Handle trip not found error here, e.g., display a message to the user
        alert('The trip does not exist or has been removed.');
      } else {
        console.log('Trip status not updated:', await response.json());
      }
    } catch (error) {
      console.error("Error canceling the trip:", error);
    }

  };

  const handleCloseModal = () => {
    setCancelModalVisible(false); // Close modal
  };

  // Socket.IO state if accepted/cancelled/started/ended
  const [tripStatus, setTripStatus] = useState('');
  // Socket.IO state if accepted/cancelled/started/ended functions
  useEffect(() => {
    // Connect the customer socket
    connectSocket(user_id, "customer");

    // Listen for when the trip is accepted
    listenToTripAccepted((data) => {
      // console.log("✅ Trip accepted:", data);
      // alert(`Your trip has been accepted! Trip ID: ${data.tripId}`);
      setTripStatus("accepted");
      setTripData(data);
    });
    // Listen for when the driver has arrived
    listenToDriverArrival((data) => {
      console.log("✅ Trip arrived:", data);
      // alert(`Your driver has arrived! Trip ID: ${data.tripId}`);
      setTripStatus("arrived");
    });

    // Listen for when the trip is started
    listenToTripStarted((data) => {
      // console.log("✅ Trip started:", data);
      alert(`Your trip has been started! Trip ID: ${data.tripId}`);
      setTripStatus("started");
    });
    // Listen for when the trip is ended
    listenToTripEnded((data) => {
      // console.log("�� Trip ended:", data);
      alert(`Your trip has ended! Trip ID: ${data.tripId}`);
      setTripStatus("ended");
    });

    // Listen for when the trip is declined
    listenToTripDeclined((data) => {
      console.log("❌ Trip declined:", data);
      // alert(`Your trip has been declined! Trip ID: ${data.tripId}`);
      setTripStatus("declined");
    });

    listenToChatMessages((messageData) => {
      setNotificationCountChat(prevCount => prevCount + 1)
      dispatch(setMessageData({
        message: messageData.message,
      }))
    });

    // Cleanup on component unmount
    // return () => {
    //   stopListeningToTripAccepted();
    //   stopListeningToTripDeclined();
    // };
  }, [user_id]);

  // Fetch trip statuses
  const [tripStatusAccepted, setTripStatusAccepted] = useState(null);
  useEffect(() => {
    const fetchTripStatuses = async () => {
      if (!user_id) return;

      try {
        const response = await axios.get(`${api}trips/statuses/${user_id}`);
        if (response.status === 200) {
          const latestTripStatus = response.data.latestTrip?.statuses;
          setTripStatusAccepted(latestTripStatus);

          // If the trip status is "canceled", set driverLocation to null
          if (latestTripStatus === 'canceled') {
            setDriverLocation({
              latitude: null,
              longitude: null,
            });
          }
        }
      } catch (error) {
        console.error("⚠️ Error fetching trip statuses:", error);
      }
    };

    fetchTripStatuses();
    const intervalId = setInterval(fetchTripStatuses, 5000); // Fetch every 5 seconds

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [user_id, api]);

  useEffect(() => {
    if (tripStatusAccepted === 'canceled') {
      // console.log("Trip Cancelleduuuuuuuuuuuuuuuu", driver_id);
      navigation.navigate("RequestScreen", { driverId: driver_id });

      setTimeout(() => {
        navigation.navigate("CarListingBottomSheet", { driverId: driver_id });
      }, 1000); // Delay navigation by 2 seconds
      stopListeningToTripAccepted();
      stopListeningToTripDeclined();
    }

    // customer payments
    if (tripStatusAccepted === 'on-going' && driver_id) {
      console.log('payment processing...');
    }
  }, [tripStatusAccepted]);

  // Fetch driver location from firestore according to trip status
  useEffect(() => {
    if (tripStatusAccepted === 'accepted' && driver_id) {
      const driverDocRef = doc(db, "driver_locations", String(driver_id));
      const unsubscribe = onSnapshot(
        driverDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data() || {}; // Ensure data is always an object
            // console.log("🚗 Driver location updated:", data);

            if (!data.latitude || !data.longitude) {
              console.warn("⚠️ Missing latitude or longitude in Firestore data", data);
              return;
            }

            setDriverLocation((prev) => ({
              latitude: data.latitude ?? prev.latitude,
              longitude: data.longitude ?? prev.longitude,
              // timestamp: data.timestamp ?? prev.timestamp,
            }));
          } else {
            console.warn("❌ No driver location found in Firestore.");
          }
        },
        (error) => {
          console.error("🔥 Error fetching driver location:", error);
        }
      );

      return () => {
        // console.log(`Unsubscribing from driver ${driver_id} location updates.`);
        unsubscribe();
      };
    }
  }, [tripStatusAccepted, driver_id]);

  // Prevent back button press
  // useEffect(() => {
  //   const backHandler = BackHandler.addEventListener("hardwareBackPress", () => true);
  //   return () => backHandler.remove();
  // }, []);

  // Redirect if trip not accepted or payment not confirmed
  // useEffect(() => {
  //   console.log("Trip Status Accepted:", tripStatusAccepted);
  //   if (tripStatusAccepted !=='accepted' ) {

  //     navigation.navigate("TripLoadingResponse", { durationReacheds: false });
  //   }
  // }, [tripStatusAccepted, navigation]);
  // **Fetch Route Details(distance and time) for User and driverLocation**
  useEffect(() => {
    const fetchRouteDetails = async () => {
      if (!userOrigin.latitude || !driverLocation.latitude) return;

      try {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
          params: {
            origin: `${userOrigin.latitude},${userOrigin.longitude}`,
            destination: `${driverLocation.latitude},${driverLocation.longitude}`,
            key: GOOGLE_MAPS_APIKEY,
          },
        });

        const firstRoute = response.data?.routes?.[0];
        const firstLeg = firstRoute?.legs?.[0];

        if (firstLeg) {
          setEta(firstLeg.duration?.text || 'N/A');
          setDistance(firstLeg.distance?.text || 'N/A');
        }
      } catch (error) {
        console.error("Error fetching route details:", error);
      }
    };

    fetchRouteDetails();
  }, [userOrigin, driverLocation]);

  // **Fetch Route Details(distance and destination araival time) for User and Destination**
  useEffect(() => {
    const fetchRouteDetails = async () => {
      try {
        if (!userOrigin.latitude || !destination.latitude) return;

        const responseDestination = await axios.get(
          `https://maps.googleapis.com/maps/api/directions/json`,
          {
            params: {
              origin: `${userOrigin.latitude},${userOrigin.longitude}`,
              destination: `${destination.latitude},${destination.longitude}`,
              key: GOOGLE_MAPS_APIKEY,
            },
          }
        );

        const firstRouteDestination = responseDestination.data?.routes?.[0];
        const firstLegDestination = firstRouteDestination?.legs?.[0];

        if (firstLegDestination) {
          setEtaTrip(firstLegDestination.duration?.text || "N/A");
          setDistanceTrip(firstLegDestination.distance?.text || "N/A");
        }
      } catch (error) {
        console.error("Error fetching route details:", error);
      }
    };

    fetchRouteDetails();
  }, [userOrigin, destination]);

  // view driver details
  const handleNavigation = () => {
    if (destination?.latitude && destination?.longitude && tripData) {
      navigation.navigate('DriverInfoBottomSheet', {
        durationReacheds: true,
        driver_id: String(driver_id || ""),
        tripStatusAccepted: tripStatusAccepted,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={() => drawerOpen && setDrawerOpen(false)}>
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={toggleDrawer} style={styles.roundButton}>
              <Icon type="material-community" name="menu" color={colors.black} size={30} />
            </TouchableOpacity>
          </View>


          <TouchableOpacity
            style={styles.profilePictureContainer}
            onPress={() => navigation.navigate('DriverCommunicationBottomSheet')}
          >
            <Image source={require('../../assets/call.png')} style={styles.profilePicture} />
          </TouchableOpacity>
          {/* Cancel Trip Icon positioned below the call button */}
          <TouchableOpacity
            style={[styles.profilePictureContainer, styles.cancelButtonContainer]}
            onPress={handleCancelTrip}
          >
            <Icon name="cancel" color="#0DCAF0" size={30} />  {/* Cancel Icon */}
          </TouchableOpacity>

          <TouchableOpacity style={styles.rectangleButton} onPress={handleNavigation}>
            <Text style={styles.buttonText}>View Driver</Text>
          </TouchableOpacity>

          {/* Trip Cancellation Modal */}
          <TripCancellationModal
            isVisible={cancelModalVisible}
            onClose={handleCloseModal}
            onCancel={handleCancel}
          />
          {tripData?.driver_id && (
            <MapComponent
              driverLocation={driverLocation}
              driverId={String(tripData.driver_id)}
              userOrigin={userOrigin}
            />
          )}
        </View>
      </TouchableWithoutFeedback>
      {drawerOpen && <CustomDrawer isOpen={drawerOpen} toggleDrawer={toggleDrawer} navigation={navigation} />}

    </SafeAreaView>
  );
};

export default DestinationScreen;


// Keep your existing styles

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  view1: {
    position: "absolute",
    top: 25,
    left: 12,
    backgroundColor: colors.white,
    height: 40,
    width: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    zIndex: 99999,
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
  view2: {
    backgroundColor: colors.white,
    zIndex: 4,
    paddingBottom: 10,
    flex: 1,
  },
  rectangleButton: {
    backgroundColor: '#0092FF',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: -2,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  routeInfoContainer: {
    position: 'absolute',
    top: 80,
    left: SCREEN_WIDTH / 2 - 100,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    zIndex: 10,
    width: 200,
  },
  routeInfoText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  header: {
    position: "absolute",
    top: 50,
    left: 10,
    zIndex: 100,
  },
  roundButton: {
    backgroundColor: "#fff",
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cancelButtonContainer: {
    top: 75, // Adjust this to position the cancel button below the call button
    right: 12, // Same alignment as the call button
  },
});
