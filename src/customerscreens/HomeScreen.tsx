"use client"

import { StatusBar } from "expo-status-bar"
import { useState, useRef, useEffect, memo, useCallback } from "react"
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native"
import { Icon } from "react-native-elements"
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps"
import * as Location from "expo-location"

const SCREEN_WIDTH = Dimensions.get("window").width
import { parameters } from "../global/styles"
import { filterData } from "../global/data"
import { mapStyle } from "../global/mapStyle"
import { useSelector } from "react-redux"
import CustomDrawer from "../components/CustomDrawer"
import axios from "axios"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../../FirebaseConfig" // Firebase configuration

// Memoized components to prevent unnecessary re-renders
const MemoizedServiceCard = memo(({ item }) => (
  <TouchableOpacity style={styles.serviceCard}>
    <View style={styles.serviceIconContainer}>
      <Image style={styles.serviceIcon} source={item.image} />
    </View>
    <Text style={styles.serviceTitle}>{item.name}</Text>
  </TouchableOpacity>
))

const MemoizedQuickAction = memo(({ icon, text, onPress }) => (
  <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
    <View style={styles.quickActionIcon}>
      <Icon type="material-community" name={icon} color="#0DCAF0" size={24} />
    </View>
    <Text style={styles.quickActionText}>{text}</Text>
  </TouchableOpacity>
))

// Helper function moved outside component to avoid recreation on each render
const getWeatherIcon = (weathercode) => {
  // Map WMO weather codes to icon names
  if (weathercode === 0) return "weather-sunny" // Clear sky
  if (weathercode === 1 || weathercode === 2 || weathercode === 3) return "weather-partly-cloudy" // Partly cloudy
  if (weathercode >= 45 && weathercode <= 48) return "weather-fog" // Fog
  if (weathercode >= 51 && weathercode <= 55) return "weather-rainy" // Drizzle
  if (weathercode >= 61 && weathercode <= 65) return "weather-pouring" // Rain
  if (weathercode >= 71 && weathercode <= 77) return "weather-snowy" // Snow
  if (weathercode >= 95 && weathercode <= 99) return "weather-lightning" // Thunderstorm
  return "weather-cloudy" // Default
}

// Get weather condition text from code
const getWeatherCondition = (weathercode) => {
  if (weathercode === 0) return "Clear"
  if (weathercode >= 1 && weathercode <= 3) return "Partly Cloudy"
  if (weathercode >= 45 && weathercode <= 48) return "Foggy"
  if (weathercode >= 51 && weathercode <= 55) return "Drizzle"
  if (weathercode >= 61 && weathercode <= 65) return "Rainy"
  if (weathercode >= 71 && weathercode <= 77) return "Snowy"
  if (weathercode >= 95 && weathercode <= 99) return "Thunderstorm"
  return "Cloudy"
}

const HomeScreen = ({ navigation, route }) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const toggleDrawer = useCallback(() => setDrawerOpen(!drawerOpen), [drawerOpen])

  // Use optional chaining to prevent crashes if auth state is undefined
  const user = useSelector((state) => state.auth?.user)
  const { closeBottomSheets } = route?.params || {}

  const [latlng, setLatLng] = useState(null)
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [carsAround, setCarsAround] = useState([])
  const [mapError, setMapError] = useState(false)
  const [weatherError, setWeatherError] = useState(false)

  const _map = useRef(null)

  // Safely get location with error handling
  const getLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== "granted") {
        console.log("Location permission denied")
        setLoading(false)
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      }).catch((err) => {
        console.error("Error in getCurrentPositionAsync:", err)
        return null
      })

      if (!location) {
        setLoading(false)
        return
      }

      const { latitude, longitude } = location.coords
      setLatLng({ latitude, longitude })

      // Fetch weather data once we have location
      fetchWeather(latitude, longitude)
    } catch (err) {
      console.error("Error in getLocation:", err)
      setLoading(false)
    }
  }, [])

  // Fetch weather with proper error handling
  const fetchWeather = useCallback(async (latitude, longitude) => {
    if (!latitude || !longitude) {
      setWeatherError(true)
      setLoading(false)
      return
    }

    try {
      const response = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`,
      )

      if (response.data && response.data.current_weather) {
        const data = response.data.current_weather

        const weatherData = {
          temp: Math.round(data.temperature),
          condition: getWeatherCondition(data.weathercode),
          icon: getWeatherIcon(data.weathercode),
          wind: Math.round(data.windspeed),
          humidity: 65, // Placeholder as the API doesn't provide humidity
        }

        setWeather(weatherData)
      } else {
        setWeatherError(true)
      }
    } catch (error) {
      console.error("Error fetching weather:", error)
      setWeatherError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch driver locations with error handling
  const fetchDriverLocations = useCallback(async () => {
    try {
      // Default location if no drivers found
      const defaultLocation = {
        latitude: 6.5244,
        longitude: 3.3792,
      }

      // Check if Firestore is properly initialized
      if (!db) {
        console.error("Firestore not initialized")
        setCarsAround([defaultLocation])
        return
      }

      const querySnapshot = await getDocs(collection(db, "driver_locations"))
      const locations = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.latitude && data.longitude) {
          locations.push({
            latitude: data.latitude,
            longitude: data.longitude,
          })
        }
      })

      if (locations.length > 0) {
        setCarsAround(locations)
      } else {
        setCarsAround([defaultLocation])
      }
    } catch (error) {
      console.error("Error fetching driver locations:", error)
      // Set default location on error
      setCarsAround([
        {
          latitude: 6.5244,
          longitude: 3.3792,
        },
      ])
      setMapError(true)
    }
  }, [])

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        await getLocation()
        await fetchDriverLocations()
      } catch (error) {
        console.error("Error initializing data:", error)
        setLoading(false)
      }
    }

    initializeData()

    // Clean up function
    return () => {
      // Any cleanup needed
    }
  }, [getLocation, fetchDriverLocations])

  // Optimized renderItem function for FlatList
  const renderServiceItem = useCallback(({ item }) => <MemoizedServiceCard item={item} />, [])

  // Handle navigation to request screen
  const handleBookRide = useCallback(() => {
    navigation.navigate("RequestScreen", {
      state: 0,
      closeBottomSheets: closeBottomSheets,
    })
  }, [navigation, closeBottomSheets])

  // Handle navigation to profile
  const handleProfilePress = useCallback(() => {
    navigation.navigate("Profile", { user })
  }, [navigation, user])

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#E0F7FA" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton}>
            <Icon type="material-community" name="menu" color="#0A2240" size={24} />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Text style={styles.headerText}>NthomeRides</Text>
          </View>

          <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
            <Icon type="material-community" name="account-circle" color="#0A2240" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        removeClippedSubviews={true}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>Ready to Ride?</Text>
              <Text style={styles.heroSubtitle}>Let us take you where you need to go</Text>
              <TouchableOpacity onPress={handleBookRide} style={styles.rideButton}>
                <Text style={styles.rideButtonText}>Book a Ride</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.heroImageContainer}>
              <Image
                source={require("../../assets/hero.png")}
                style={styles.heroImage}
                defaultSource={require("../../assets/hero.png")}
              />
            </View>
          </View>
        </View>

        {/* Services Section - Optimized FlatList */}
        {/* Services Section - Grid Layout */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Our Services</Text>
          <View style={styles.quickActionsContainer}>
            {filterData.slice(0, 3).map((item) => (
              <TouchableOpacity key={item.id} style={styles.quickActionCard}>
                <View style={styles.quickActionIcon}>
                  <Image style={styles.serviceIconInGrid} source={item.image} />
                </View>
                <Text style={styles.quickActionText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Weather Section - Simplified */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Weather Forecast</Text>
          <View style={styles.weatherCard}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0DCAF0" />
                <Text style={styles.loadingText}>Loading weather data...</Text>
              </View>
            ) : weatherError ? (
              <View style={styles.errorContainer}>
                <Icon type="material-community" name="weather-cloudy-alert" color="#0A2240" size={48} />
                <Text style={styles.errorText}>Unable to load weather data</Text>
              </View>
            ) : weather ? (
              <View style={styles.currentWeather}>
                <View style={styles.weatherMain}>
                  <Icon type="material-community" name={weather.icon} color="#0DCAF0" size={48} />
                  <Text style={styles.tempText}>{weather.temp}°C</Text>
                </View>
                <View style={styles.weatherDetails}>
                  <Text style={styles.conditionText}>{weather.condition}</Text>
                  <View style={styles.weatherMetrics}>
                    <View style={styles.metric}>
                      <Icon type="material-community" name="weather-windy" color="#0A2240" size={18} />
                      <Text style={styles.metricText}>{weather.wind} km/h</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <Icon type="material-community" name="weather-cloudy-alert" color="#0A2240" size={48} />
                <Text style={styles.errorText}>Unable to load weather data</Text>
              </View>
            )}
          </View>
        </View>

        {/* Drivers Around You Map - Optimized */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Drivers Around You</Text>
          <View style={styles.mapCard}>
            {mapError ? (
              <View style={[styles.map, styles.mapLoading]}>
                <Icon type="material-community" name="map-marker-alert" color="#0A2240" size={48} />
                <Text style={styles.errorText}>Unable to load map</Text>
              </View>
            ) : !latlng || carsAround.length === 0 ? (
              <View style={[styles.map, styles.mapLoading]}>
                <ActivityIndicator size="large" color="#0DCAF0" />
                <Text style={styles.loadingText}>Loading map...</Text>
              </View>
            ) : (
              <MapView
                ref={_map}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                customMapStyle={mapStyle}
                showsUserLocation={true}
                followsUserLocation={false}
                initialRegion={{
                  latitude: carsAround[0].latitude,
                  longitude: carsAround[0].longitude,
                  latitudeDelta: 0.008,
                  longitudeDelta: 0.008,
                }}
                liteMode={true}
              >
                {carsAround.slice(0, 5).map((item, index) => (
                  <Marker coordinate={item} key={index.toString()}>
                    <Image
                      source={require("../../assets/carMarker.png")}
                      style={styles.carsAround}
                      resizeMode="cover"
                    />
                  </Marker>
                ))}
              </MapView>
            )}
          </View>
        </View>

        {/* Quick Actions - Memoized components */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={[styles.quickActionsContainer, styles.twoItemsContainer]}>
            <MemoizedQuickAction
              icon="history"
              text="Trip History"
              onPress={() => navigation.navigate("TripHistory")}
            />
            <MemoizedQuickAction icon="help-circle" text="Support" onPress={() => {}} />
          </View>
        </View>
      </ScrollView>

      {drawerOpen && <CustomDrawer isOpen={drawerOpen} toggleDrawer={toggleDrawer} navigation={navigation} />}
    </View>
  )
}

export default memo(HomeScreen)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0FBFF",
    paddingTop: parameters.statusBarHeight,
  },
  header: {
    height: parameters.headerHeight,
    backgroundColor: "#E0F7FA",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: "100%",
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(13, 202, 240, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    alignItems: "center",
  },
  headerText: {
    color: "#0A2240",
    fontSize: 20,
    fontWeight: "700",
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(13, 202, 240, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroSection: {
    marginBottom: 24,
    backgroundColor: "#E0F7FA",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 220,
  },
  heroTextContainer: {
    flex: 1,
    paddingLeft: 20,
    paddingRight: 10,
  },
  heroTitle: {
    color: "#0A2240",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 12,
  },
  heroSubtitle: {
    color: "#0A2240",
    fontSize: 18,
    opacity: 0.8,
    marginBottom: 24,
    lineHeight: 24,
  },
  rideButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: 180,
    borderWidth: 1,
    borderColor: "#0DCAF0",
    elevation: 2,
  },
  rideButtonText: {
    color: "#0A2240",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  heroImageContainer: {
    width: "50%",
    height: "100%",
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    color: "#0A2240",
  },
  servicesList: {
    paddingRight: 20,
  },
  serviceCard: {
    alignItems: "center",
    marginRight: 16,
    width: 100,
  },
  serviceIconContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#0DCAF0",
  },
  serviceIcon: {
    height: 50,
    width: 50,
    borderRadius: 25,
  },
  serviceTitle: {
    color: "#0A2240",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  weatherCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#0DCAF0",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    minHeight: 100,
  },
  loadingText: {
    marginTop: 10,
    color: "#0A2240",
    fontSize: 14,
  },
  currentWeather: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 100,
  },
  weatherMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  tempText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#0A2240",
    marginLeft: 10,
  },
  weatherDetails: {
    alignItems: "flex-end",
  },
  conditionText: {
    fontSize: 18,
    color: "#0A2240",
    fontWeight: "600",
    marginBottom: 5,
  },
  weatherMetrics: {
    flexDirection: "row",
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  metricText: {
    marginLeft: 4,
    color: "#0A2240",
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "#0DCAF0",
    marginVertical: 16,
  },
  forecastContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  forecastDay: {
    alignItems: "center",
    flex: 1,
  },
  forecastDayText: {
    fontSize: 14,
    color: "#0A2240",
    marginBottom: 8,
  },
  forecastTemp: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0A2240",
    marginTop: 8,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    minHeight: 100,
  },
  errorText: {
    marginTop: 10,
    color: "#0A2240",
    fontSize: 14,
    textAlign: "center",
  },
  mapCard: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    borderWidth: 1,
    borderColor: "#0DCAF0",
  },
  map: {
    height: 200,
    width: "100%",
  },
  mapLoading: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FBFF",
  },
  carsAround: {
    width: 28,
    height: 14,
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    width: "31%",
    elevation: 2,
    borderWidth: 1,
    borderColor: "#0DCAF0",
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    backgroundColor: "rgba(13, 202, 240, 0.1)",
  },
  quickActionText: {
    fontSize: 14,
    color: "#0A2240",
    fontWeight: "500",
    textAlign: "center",
  },
  serviceIconInGrid: {
    height: 30,
    width: 30,
  },
  twoItemsContainer: {
    justifyContent: "space-around",
    paddingHorizontal: 30,
  },
})
