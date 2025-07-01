"use client"

import { useMemo, useEffect, useRef, useState } from "react"
import { StyleSheet, Pressable, Animated, View, Text, Alert, Dimensions, StatusBar } from "react-native"
import {
  connectSocket,
  listenToTripAccepted,
  stopListeningToTripAccepted,
  stopListeningToTripDeclined,
} from "../configSocket/socketConfig"
import { useSelector } from "react-redux"
import { ActivityIndicator } from "react-native" // Import ActivityIndicator for circular loading
import { api } from "../../api"
import axios from "axios"
import { LinearGradient } from "expo-linear-gradient"

const { width, height } = Dimensions.get("window")

const TripLoadingResponse = ({ navigation, route }) => {
  // const {  tripData } = route.params;
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("Cash")
  const [durationReached, setDurationReached] = useState(false)
  const [modalVisible, setModalVisible] = useState(true) // State to control modal visibility
  const user_id = useSelector((state) => state.auth?.user.user_id)
  const [timeoutSeconds, setTimeoutSeconds] = useState(20) // Set timeout to 20 seconds

  // Animation refs
  const scaleRef = useRef(new Animated.Value(1))
  const opacityRef = useRef(new Animated.Value(1))
  const loadingAnimation = useRef(new Animated.Value(durationReached ? 1 : 0)).current
  const pulseAnim = useRef(new Animated.Value(0)).current
  const [tripStatus, setTripStatus] = useState()
  // const driverSelected = tripData;
  const driverId = useSelector((state) => state.trip.tripData?.driver_id || "")
  const [timerText, setTimerText] = useState("") // State to show countdown timer

  // Fetch trip data from the backend
  const [tripStatusAccepted, setTripStatusAccepted] = useState(null)
  // Fetch trip statuses from the backend
  const [isManuallyCanceled, setIsManuallyCanceled] = useState(false)

  const fetchTripStatuses = async () => {
    if (!user_id) return // Ensure user_id is available

    try {
      const response = await axios.get(`${api}/trips/statuses/${user_id}`)
      if (response.status === 200) {
        setTripStatusAccepted(response.data.latestTrip?.statuses) // Store latest trip data
      }
    } catch (error) {
      // console.warn("⚠️fetching trip statuses, please wait...");
    }
  }

  useEffect(() => {
    // Connect the customer socket
    connectSocket(user_id, "customer")

    // Listen for when the trip is accepted
    listenToTripAccepted((data) => {
      setTripStatus("accepted")
      setModalVisible(false) // Close modal when the trip is accepted
      fetchTripStatuses() // Fetch trip statuses
    })

    // Cleanup on component unmount
    return () => {
      stopListeningToTripAccepted()
      stopListeningToTripDeclined()
    }
  }, [user_id, tripStatus]) // Add tripStatus as a dependency to re-check navigation on change

  // Snap points for Bottom Sheet
  const snapPoints = useMemo(() => ["40%"], [])

  // Pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [pulseAnim])

  // Loading animation
  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleRef.current, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleRef.current, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityRef.current, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacityRef.current, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start()
  }, [])

  // Duration reached effect with countdown timer
  useEffect(() => {

    if (!durationReached && !isManuallyCanceled) {
      // Start animation
      Animated.timing(loadingAnimation, {
        toValue: 1,
        duration: timeoutSeconds * 1000, // Convert seconds to milliseconds
        useNativeDriver: false,
      }).start()

      // Set up countdown timer
      let secondsLeft = timeoutSeconds
      const countdownInterval = setInterval(() => {
        secondsLeft -= 1
        if (secondsLeft <= 0) {
          clearInterval(countdownInterval)
        }
      }, 1000)

      // Set a timeout to handle no response case
      const timeoutId = setTimeout(() => {
        if (!isManuallyCanceled && (tripStatusAccepted !== "accepted") && !isManuallyCanceled) {
          setDurationReached(true)
          Alert.alert(
            "Driver Not Responding",
            "The driver is not responding at the moment. Please try choosing a different driver.",
            [
              {
                text: "OK",
                onPress: () => {
                  setModalVisible(false) // Close modal
                  navigation.navigate("RequestScreen")

                  setTimeout(() => {
                    navigation.navigate("CarListingBottomSheet", { driverId: driverId })
                  }, 50)
                },
              },
            ]
          )
        }
      }, timeoutSeconds * 1000)


      // Cleanup timeout and interval if trip is accepted before timeout occurs
      return () => {
        clearTimeout(timeoutId)
        clearInterval(countdownInterval)
      }
    }
  }, [durationReached, tripStatusAccepted, driverId, navigation, timeoutSeconds, isManuallyCanceled])

  // Effect to navigate to DestinationScreen if trip is accepted
  useEffect(() => {
    if (tripStatusAccepted === "accepted") {
      console.log("Navigating to DestinationScreen...")

      setTimeout(() => {
        navigation.navigate("DestinationScreen")
      }, 2000) // Delay navigation by 2 seconds
    }
  }, [tripStatusAccepted, navigation])

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  })

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0DCAF0" />
      <LinearGradient colors={["#0DCAF0", "#0AA8CD"]} style={styles.gradientBackground}>
        <View style={styles.contentContainer}>
          <Animated.View
            style={[
              styles.pulseCircle,
              {
                transform: [{ scale: pulseScale }],
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 0],
                }),
              },
            ]}
          />


          <Animated.Text
            style={[
              styles.loadingText,
              {
                opacity: opacityRef.current,
              },
            ]}
          >
            Connecting you with a driver
          </Animated.Text>

          <View style={styles.dotsContainer}>
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 0.3, 0.6, 1],
                    outputRange: [0.3, 1, 0.3, 0.3],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 0.3, 0.6, 1],
                    outputRange: [0.3, 0.3, 1, 0.3],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 0.3, 0.6, 1],
                    outputRange: [0.3, 0.3, 0.3, 1],
                  }),
                },
              ]}
            />
          </View>

          <Text style={styles.subText}>Please wait while we find the perfect driver for your trip</Text>

          <Pressable
            style={styles.cancelButton}
            onPress={() => {
              setIsManuallyCanceled(true); // ✅ tell useEffect to skip timeout
              Alert.alert(
                "Cancelling the request",
                "Are you sure you want to cancel the request?",
                [
                  {
                    text: "No",
                    style: "cancel", // makes "No" button visually distinct (optional)
                    // no onPress needed, alert just closes
                  },
                  {
                    text: "OK",
                    onPress: () => {
                      setModalVisible(false); // Close modal
                      navigation.navigate("RequestScreen");

                      setTimeout(() => {
                        navigation.navigate("CarListingBottomSheet", { driverId: driverId });
                      }, 50);
                    },
                  },
                ],
                { cancelable: true } // allows dismissing alert by tapping outside (optional)
              );
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </Pressable>


        </View>
      </LinearGradient>
    </View>
  )
}

export default TripLoadingResponse

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  pulseCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#FFFFFF",
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
  },
  dotsContainer: {
    flexDirection: "row",
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 4,
  },
  subText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 40,
    maxWidth: "80%",
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
})
