"use client"

import { StatusBar } from "expo-status-bar"
import { useState, useRef, useEffect } from "react"
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  ScrollView,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native"
import { Icon } from "react-native-elements"
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps"
import * as Location from "expo-location"
import { LinearGradient } from "expo-linear-gradient"

const SCREEN_WIDTH = Dimensions.get("window").width
import { parameters } from "../global/styles"
import { filterData, carsAround } from "../global/data"
import { mapStyle } from "../global/mapStyle"
import { useSelector } from "react-redux"
import CustomDrawer from "../components/CustomDrawer"

const HomeScreen = ({ navigation, route }) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const toggleDrawer = () => setDrawerOpen(!drawerOpen)
  const user = useSelector((state) => state.auth.user)
  const { closeBottomSheets } = route.params || {}

  const [latlng, setLatLng] = useState({})
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [forecast, setForecast] = useState([])

  const checkPermission = async () => {
    const hasPermission = await Location.requestForegroundPermissionsAsync()
    if (hasPermission.status === "granted") {
      const permission = await askPermission()
      return permission
    }
    return true
  }

  const askPermission = async () => {
    const permission = await Location.requestForegroundPermissionsAsync()
    return permission.status === "granted"
  }

  const getLocation = async () => {
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync()
      if (!granted) return

      const {
        coords: { latitude, longitude },
      } = await Location.getCurrentPositionAsync()
      setLatLng({ latitude, longitude })

      // Fetch weather data once we have location
      fetchWeather(latitude, longitude)
    } catch (err) {
      console.error("Error fetching location:", err)
      setLoading(false)
    }
  }

  const fetchWeather = async (latitude, longitude) => {
    try {
      // This is a placeholder for actual weather API implementation
      // You would need to replace this with your actual weather API call
      // Example using OpenWeatherMap API:
      // const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=YOUR_API_KEY`);

      // Simulating API response for demonstration
      setTimeout(() => {
        const mockWeather = {
          temp: 24,
          condition: "Sunny",
          humidity: 65,
          wind: 12,
          icon: "weather-sunny",
        }

        const mockForecast = [
          { day: "Today", temp: 24, icon: "weather-sunny" },
          { day: "Tomorrow", temp: 22, icon: "weather-partly-cloudy" },
          { day: "Wed", temp: 19, icon: "weather-rainy" },
        ]

        setWeather(mockWeather)
        setForecast(mockForecast)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error("Error fetching weather:", error)
      setLoading(false)
    }
  }

  const _map = useRef(1)

  useEffect(() => {
    checkPermission()
    getLocation()
  }, [])

  const getWeatherIcon = (iconName) => {
    switch (iconName) {
      case "weather-sunny":
        return "weather-sunny"
      case "weather-partly-cloudy":
        return "weather-partly-cloudy"
      case "weather-rainy":
        return "weather-rainy"
      default:
        return "weather-sunny"
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#E0F7FA" />

      {/* Header */}
      <LinearGradient colors={["#E0F7FA", "#B2EBF2"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton}>
            <Icon type="material-community" name="menu" color="#0A2240" size={24} />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Text style={styles.headerText}>NthomeRides</Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => {
              navigation.navigate("Profile", { user })
            }}
          >
            <Icon type="material-community" name="account-circle" color="#0A2240" size={24} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={["#B2EBF2", "#80DEEA"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroTitle}>Ready to Ride?</Text>
                <Text style={styles.heroSubtitle}>Let us take you where you need to go</Text>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate("RequestScreen", { state: 0, closeBottomSheets: closeBottomSheets })
                  }}
                  style={styles.rideButton}
                >
                  <Text style={styles.rideButtonText}>Book a Ride</Text>
                  <Icon type="material-community" name="arrow-right" color="#0A2240" size={20} />
                </TouchableOpacity>
              </View>
              <View style={styles.heroImageContainer}>
                <LinearGradient
                  colors={["#E0F7FA", "#B2EBF2"]}
                  style={styles.imageBackground}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Image
                  source={require("../../assets/autonomous-car.jpg")}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
                <View style={styles.sensorRings}>
                  <View style={[styles.sensorRing, styles.sensorRing1]} />
                  <View style={[styles.sensorRing, styles.sensorRing2]} />
                  <View style={[styles.sensorRing, styles.sensorRing3]} />
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Services Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Our Services</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={filterData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.servicesList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.serviceCard}>
                <View style={styles.serviceIconContainer}>
                  <Image style={styles.serviceIcon} source={item.image} />
                </View>
                <Text style={styles.serviceTitle}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Weather Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Weather Forecast</Text>
          <View style={styles.weatherCard}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0DCAF0" />
                <Text style={styles.loadingText}>Loading weather data...</Text>
              </View>
            ) : weather ? (
              <>
                <View style={styles.currentWeather}>
                  <View style={styles.weatherMain}>
                    <Icon type="material-community" name={getWeatherIcon(weather.icon)} color="#0DCAF0" size={48} />
                    <Text style={styles.tempText}>{weather.temp}°C</Text>
                  </View>
                  <View style={styles.weatherDetails}>
                    <Text style={styles.conditionText}>{weather.condition}</Text>
                    <View style={styles.weatherMetrics}>
                      <View style={styles.metric}>
                        <Icon type="material-community" name="water-percent" color="#0A2240" size={18} />
                        <Text style={styles.metricText}>{weather.humidity}%</Text>
                      </View>
                      <View style={styles.metric}>
                        <Icon type="material-community" name="weather-windy" color="#0A2240" size={18} />
                        <Text style={styles.metricText}>{weather.wind} km/h</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.forecastContainer}>
                  {forecast.map((day, index) => (
                    <View key={index} style={styles.forecastDay}>
                      <Text style={styles.forecastDayText}>{day.day}</Text>
                      <Icon type="material-community" name={getWeatherIcon(day.icon)} color="#0DCAF0" size={24} />
                      <Text style={styles.forecastTemp}>{day.temp}°</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.errorContainer}>
                <Icon type="material-community" name="weather-cloudy-alert" color="#0A2240" size={48} />
                <Text style={styles.errorText}>Unable to load weather data</Text>
              </View>
            )}
          </View>
        </View>

        {/* Drivers Around You Map */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Drivers Around You</Text>
          <View style={styles.mapCard}>
            <MapView
              ref={_map}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              customMapStyle={mapStyle}
              showsUserLocation={true}
              followsUserLocation={true}
              initialRegion={{ ...carsAround[0], latitudeDelta: 0.008, longitudeDelta: 0.008 }}
            >
              {carsAround.map((item, index) => (
                <Marker coordinate={item} key={index.toString()}>
                  <Image source={require("../../assets/carMarker.png")} style={styles.carsAround} resizeMode="cover" />
                </Marker>
              ))}
            </MapView>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity style={styles.quickActionCard}>
              <View style={[styles.quickActionIcon]}>
                <Icon type="material-community" name="history" color="#0DCAF0" size={24} />
              </View>
              <Text style={styles.quickActionText}>Trip History</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard}>
              <View style={[styles.quickActionIcon]}>
                <Icon type="material-community" name="star" color="#0DCAF0" size={24} />
              </View>
              <Text style={styles.quickActionText}>Rewards</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard}>
              <View style={[styles.quickActionIcon]}>
                <Icon type="material-community" name="help-circle" color="#0DCAF0" size={24} />
              </View>
              <Text style={styles.quickActionText}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <CustomDrawer isOpen={drawerOpen} toggleDrawer={toggleDrawer} navigation={navigation} />
    </View>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0FBFF", // Light blue-cyan background
    paddingTop: parameters.statusBarHeight,
  },
  header: {
    height: parameters.headerHeight,
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
    backgroundColor: "rgba(13, 202, 240, 0.2)", // Cyan with transparency
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    alignItems: "center",
  },
  headerText: {
    color: "#0A2240", // Dark blue text
    fontSize: 20,
    fontWeight: "700",
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(13, 202, 240, 0.2)", // Cyan with transparency
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroSection: {
    marginBottom: 24,
  },
  heroGradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 20,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  heroTitle: {
    color: "#0A2240", // Dark blue text
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  heroSubtitle: {
    color: "#0A2240", // Dark blue text
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 20,
  },
  rideButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF", // White background
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: 160,
    borderWidth: 1,
    borderColor: "#0DCAF0", // Cyan border
    shadowColor: "#0DCAF0",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  rideButtonText: {
    color: "#0A2240", // Dark blue text
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  heroImageContainer: {
    position: "relative",
    width: 150,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 75,
    overflow: "hidden",
    shadowColor: "#0DCAF0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  imageBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 70,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    zIndex: 1,
    transform: [{ scale: 1.2 }], // Scale up slightly to ensure it fills the circle
  },
  sensorRings: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
  sensorRing: {
    position: "absolute",
    borderRadius: 100,
    borderWidth: 1,
  },
  sensorRing1: {
    width: 170,
    height: 170,
    borderColor: "#0DCAF0", // Cyan
    opacity: 0.7,
  },
  sensorRing2: {
    width: 140,
    height: 140,
    borderColor: "#FF9F7F", // Orange from the image
    opacity: 0.5,
  },
  sensorRing3: {
    width: 110,
    height: 110,
    borderColor: "#E83E8C", // Pink/purple from the image
    opacity: 0.3,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    color: "#0A2240", // Dark blue text
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
    backgroundColor: "#FFFFFF", // White background
    borderRadius: 16,
    padding: 16,
    shadowColor: "#0DCAF0", // Cyan shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#0DCAF0", // Cyan border
  },
  serviceIcon: {
    height: 50,
    width: 50,
    borderRadius: 25,
  },
  serviceTitle: {
    color: "#0A2240", // Dark blue text
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  weatherCard: {
    backgroundColor: "#FFFFFF", // White background
    borderRadius: 16,
    padding: 20,
    shadowColor: "#0DCAF0", // Cyan shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#0DCAF0", // Cyan border
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#0A2240", // Dark blue text
    fontSize: 14,
  },
  currentWeather: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weatherMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  tempText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#0A2240", // Dark blue text
    marginLeft: 10,
  },
  weatherDetails: {
    alignItems: "flex-end",
  },
  conditionText: {
    fontSize: 18,
    color: "#0A2240", // Dark blue text
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
    color: "#0A2240", // Dark blue text
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "#0DCAF0", // Cyan divider
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
    color: "#0A2240", // Dark blue text
    marginBottom: 8,
  },
  forecastTemp: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0A2240", // Dark blue text
    marginTop: 8,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: "#0A2240", // Dark blue text
    fontSize: 14,
  },
  mapCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#0DCAF0", // Cyan shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#0DCAF0", // Cyan border
  },
  map: {
    height: 200,
    width: "100%",
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
    backgroundColor: "#FFFFFF", // White background
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    width: "31%",
    shadowColor: "#0DCAF0", // Cyan shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#0DCAF0", // Cyan border
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    backgroundColor: "rgba(13, 202, 240, 0.1)", // Very light cyan background
  },
  quickActionText: {
    fontSize: 14,
    color: "#0A2240", // Dark blue text
    fontWeight: "500",
    textAlign: "center",
  },
})
