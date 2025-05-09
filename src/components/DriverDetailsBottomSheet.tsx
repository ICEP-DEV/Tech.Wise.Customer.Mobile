"use client"
import { useContext, useEffect, useState } from "react"
import {
  Pressable,
  StyleSheet,
  Image,
  Alert,
  View,
  Text,
  Animated,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { DestinationContext, OriginContext } from "../contexts/contexts"
import { DriverOriginContext } from "../contexts/driverContexts"
import axios from "axios"
import { useSelector } from "react-redux"
import { useDispatch } from "react-redux"
import { setTripData } from "../redux/actions/tripActions"
import { api } from "../../api"
import { BASE_URL } from "../../api"
import { connectSocket, emitTripRequestToDrivers } from "../configSocket/socketConfig" // Import socket functions
import { LinearGradient } from "expo-linear-gradient"
import { Icon } from "react-native-elements"

const { width, height } = Dimensions.get("window")

const DriverDetailsBottomSheet = ({ navigation, route }) => {
  const { dispatchDestination } = useContext(DestinationContext)
  const { dispatchOrigin } = useContext(DriverOriginContext)
  const user_id = useSelector((state) => state.auth.user?.user_id || "")
  const distanceTrip = useSelector((state) => state.location?.distance || "")
  // console.log("Distance from Redux:", distanceTrip);

  const carData = route.params || {}

  const { id, driverName, driverRating, price, ETA, driverPhoto, classType, driverState, driverStatus } = carData
  const { origin } = useContext(OriginContext)
  const { destination } = useContext(DestinationContext)
  const dispatch = useDispatch()
  const [isBlurVisible, setIsBlurVisible] = useState(true)
  const [slideAnim] = useState(new Animated.Value(height))
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("Cash")
  const [lastFourDigits, setLastFourDigits] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const focusListener = navigation.addListener("focus", () => {
      setIsBlurVisible(true)
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start()
    })

    const blurListener = navigation.addListener("blur", () => {
      setIsBlurVisible(false)
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start()
    })

    return () => {
      focusListener()
      blurListener()
    }
  }, [navigation, slideAnim])

  const formatETA = (etaMinutes) => {
    if (etaMinutes >= 90) {
      const hours = Math.floor(etaMinutes / 60)
      const minutes = Math.round(etaMinutes % 60)
      return `${hours}h ${minutes}min`
    } else {
      return `${Math.round(etaMinutes)} min`
    }
  }

  const formattedETA = formatETA(ETA)

  // useEffect(() => {
  //   if (selectedPaymentMethod === "Credit Card" && user_id) {
  //     const controller = new AbortController()
  //     const fetchRecipientData = async () => {
  //       try {
  //         const response = await axios.get(api + "recipient", {
  //           params: { user_id: user_id },
  //           signal: controller.signal,
  //           timeout: 60000,
  //         })

  //         const recipient = response.data.recipients[0]
  //         if (recipient) {
  //           setLastFourDigits(recipient.last_four_digits)
  //         }
  //       } catch (error) {
  //         if (!axios.isCancel(error)) {
  //           console.error("Error fetching recipient data:", error)
  //           Alert.alert("Error", "Could not fetch recipient data.")
  //         }
  //       }
  //     }

  //     const timer = setTimeout(fetchRecipientData, 1000)
  //     return () => {
  //       clearTimeout(timer)
  //       controller.abort()
  //     }
  //   }
  // }, [selectedPaymentMethod, user_id])

  const extractedData = {
    customerId: user_id,
    driverId: carData.id,
    requestDate: new Date().toISOString(),
    currentDate: new Date().toISOString(),
    pickUpLocation: origin?.address ?? "none",
    dropOffLocation: destination?.address ?? "none",
    driverState: driverState || [],
    driverStatus: driverStatus || [],
    customer_rating: carData.driverRating || 0,
    customer_feedback: null,
    duration_minutes: carData.ETA ?? 0,
    vehicle_type: carData.classType || "Unknown",
    distance_traveled: distanceTrip || null,
    cancellation_reason: null,
    cancel_by: null,
    pickupTime: null,
    dropOffTime: null,
    pickUpCoordinates: {
      latitude: origin?.latitude ?? null,
      longitude: origin?.longitude ?? null,
      address: origin?.address ?? "Unknown",
    },
    dropOffCoordinates: {
      latitude: destination?.latitude ?? null,
      longitude: destination?.longitude ?? null,
      address: destination?.address ?? "Unknown",
    },
    payment_status: "pending",
    statuses: "pending",
  }

  const userType = "customer"
  useEffect(() => {
    connectSocket(user_id, userType)
  }, [user_id, userType])

  const handleButtonClick = async () => {
    if (selectedPaymentMethod) {
      setIsLoading(true)
      try {
        // Prepare trip data to send to the backend
        let tripData = {
          driver_id: extractedData.driverId,
          paymentType: selectedPaymentMethod,
          amount: carData.price,
          requestDate: extractedData.requestDate,
          tripData: extractedData,
          carData: carData,
          user_id: user_id,
          driverStatus: driverStatus,
        }

        // Insert trip data into the backend (MySQL)
        const tripResponse = await axios.post(`${api}trips`, tripData, {
          timeout: 60000,
        })

        // Update tripData with the generated tripId
        tripData = {
          ...tripData,
          tripId: tripResponse.data.tripId,
        }

        // Insert payment data into the backend (MySQL)
        const paymentData = {
          paymentType: selectedPaymentMethod,
          amount: carData.price,
          paymentDate: extractedData.requestDate,
          tripId: tripResponse.data.tripId,
          user_id: user_id,
        }

        if (selectedPaymentMethod === "Cash") {
        await axios.post(api + "payment", paymentData)
        }

        

        // Send trip notification to driver via Socket.io with updated tripData
        emitTripRequestToDrivers(tripData, extractedData.driverId)

        // Dispatch action to store updated trip data in Redux
        dispatch(setTripData(tripData))

        

        // Navigate to the next screen
        navigation.navigate("TripLoadingResponse")
      } catch (error) {
        console.error("Error saving trip data:", error)
        Alert.alert("Error", "Failed to save trip data.")
      } finally {
        setIsLoading(false)
      }
    } else {
      Alert.alert("Error", "Please select a payment method.")
    }
  }

  const paymentImages = {
    Cash: require("../../assets/money.png"),
    "Credit Card": require("../../assets/mastercard.png"),
  }

  const isFemale = carData?.gender?.toLowerCase() === "female"

  const imageUri = carData.driverPhoto
    ? carData.driverPhoto
    : require("../../assets/placeholder.jpg")

  const renderStars = (rating) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const halfStar = rating - fullStars >= 0.5

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Icon key={i} name="star" type="material-community" size={16} color="#FFD700" />)
      } else if (i === fullStars && halfStar) {
        stars.push(<Icon key={i} name="star-half" type="material-community" size={16} color="#FFD700" />)
      } else {
        stars.push(<Icon key={i} name="star-outline" type="material-community" size={16} color="#FFD700" />)
      }
    }

    return (
      <View style={styles.starsContainer}>
        {stars}
        <Text style={styles.ratingText}>{isNaN(driverRating) ? "N/A" : Number(driverRating).toFixed(1)}</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => navigation.navigate("CarListingBottomSheet")} style={styles.overlay} />

      {isBlurVisible && (
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient colors={["#FFFFFF", "#F8FBFD"]} style={styles.gradientBackground}>
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            <View style={styles.headerContainer}>
              <Text style={styles.headerText}>Driver Details</Text>
              <Pressable onPress={() => navigation.navigate("RequestScreen")} style={styles.cancelButton}>
                <Icon name="close" type="material-community" size={24} color="#FF3B30" />
              </Pressable>
            </View>

            <View style={styles.driverInfoContainer}>
              <View style={styles.driverImageContainer}>
                <Image source={{ uri: imageUri }} style={styles.driverImage} />
                <View style={styles.statusIndicator} />
              </View>

              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{driverName}</Text>
                {renderStars(driverRating)}
                <View style={styles.vehicleInfo}>
                  <Icon name="car" type="material-community" size={16} color="#0DCAF0" />
                  <Text style={styles.vehicleText}>{classType || "Standard"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.tripInfoContainer}>
              <View style={styles.tripInfoItem}>
                <Icon name="cash" type="material-community" size={20} color="#0DCAF0" />
                <Text style={styles.tripInfoLabel}>Price</Text>
                <Text style={styles.tripInfoValue}>R{price}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.tripInfoItem}>
                <Icon name="clock-outline" type="material-community" size={20} color="#0DCAF0" />
                <Text style={styles.tripInfoLabel}>ETA</Text>
                <Text style={styles.tripInfoValue}>{formattedETA}</Text>
              </View>
            </View>

            <View style={styles.paymentSection}>
              <Text style={styles.sectionTitle}>Payment Method</Text>

              <View style={styles.paymentOptions}>
                <Pressable
                  style={[styles.paymentOption, selectedPaymentMethod === "Cash" && styles.selectedPaymentOption]}
                  onPress={() => setSelectedPaymentMethod("Cash")}
                >
                  <Image source={paymentImages["Cash"]} style={styles.paymentImage} />
                  <Text style={styles.paymentText}>Cash</Text>
                  {selectedPaymentMethod === "Cash" && (
                    <Icon name="check-circle" type="material-community" size={20} color="#0DCAF0" />
                  )}
                </Pressable>

                <Pressable
                  style={[
                    styles.paymentOption,
                    selectedPaymentMethod === "Credit Card" && styles.selectedPaymentOption,
                  ]}
                  onPress={() => setSelectedPaymentMethod("Credit Card")}
                >
                  <Image source={paymentImages["Credit Card"]} style={styles.paymentImage} />
                  <View style={styles.cardDetails}>
                    <Text style={styles.paymentText}>Credit Card</Text>
                    {selectedPaymentMethod === "Credit Card" && lastFourDigits && (
                      <Text style={styles.cardInfo}>**** {lastFourDigits}</Text>
                    )}
                  </View>
                  {selectedPaymentMethod === "Credit Card" && (
                    <Icon name="check-circle" type="material-community" size={20} color="#0DCAF0" />
                  )}
                </Pressable>
              </View>
            </View>

            <TouchableOpacity style={styles.confirmButton} onPress={handleButtonClick} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Icon name="check-circle" type="material-community" size={20} color="#FFFFFF" />
                  <Text style={styles.confirmText}>Confirm Pickup</Text>
                </>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}
    </SafeAreaView>
  )
}

export default DriverDetailsBottomSheet

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  overlay: {
    flex: 1,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
    height: height * 0.65,
  },
  gradientBackground: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E2E8F0",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  driverInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#0DCAF0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  driverImageContainer: {
    position: "relative",
    marginRight: 16,
  },
  driverImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#0DCAF0",
  },
  statusIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#64748B",
  },
  vehicleInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#64748B",
  },
  tripInfoContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#0DCAF0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  tripInfoItem: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 10,
  },
  tripInfoLabel: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  tripInfoValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
    marginTop: 2,
  },
  paymentSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 12,
  },
  paymentOptions: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#0DCAF0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  selectedPaymentOption: {
    backgroundColor: "rgba(13, 202, 240, 0.05)",
  },
  paymentImage: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  paymentText: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
  },
  cardDetails: {
    flex: 1,
  },
  cardInfo: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0DCAF0",
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: "#0DCAF0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
})
