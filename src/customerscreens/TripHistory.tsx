"use client"

import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
  SafeAreaView,
  FlatList,
  Platform,
} from "react-native"
import Icon from "react-native-vector-icons/Feather"
import CustomDrawer from "../components/CustomDrawer"
import { useSelector } from "react-redux"
import axios from "axios"
import { api } from "../../api"
// Import LinearGradient
import { LinearGradient } from "expo-linear-gradient"

const { width } = Dimensions.get("window")

export default function MyRidesScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("completed")
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [trips, setTrips] = useState([])
  // Animation values
  const tabPosition = useRef(new Animated.Value(0)).current
  const errorToastPosition = useRef(new Animated.Value(100)).current
  const errorToastOpacity = useRef(new Animated.Value(0)).current

  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setIsLoading(true)

    // Animate tab indicator
    let toValue = 0
    if (tab === "canceled") toValue = 1
    if (tab === "on-going") toValue = 2

    Animated.spring(tabPosition, {
      toValue,
      tension: 300,
      friction: 30,
      useNativeDriver: true,
    }).start()
    fetchTrips(tab)
  }

  const [drawerOpen, setDrawerOpen] = useState(false)
  const toggleDrawer = () => setDrawerOpen(!drawerOpen)
  const userId = useSelector((state) => state.auth.user.user_id)
  const customerId = userId || null
  console.log("Customer ID:", customerId)

  const fetchTrips = async (status) => {
    try {
      setIsLoading(true)

      const res = await axios.get(api + `tripHistory/${customerId}`, {
        params: { status: status },
      })

      setTrips(res.data)
      setHasError(false)
    } catch (err) {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (customerId) {
      fetchTrips(activeTab)
    }
  }, [activeTab, customerId])

  console.log("Trips================:", trips)

  // Show error toast animation
  useEffect(() => {
    if (hasError) {
      Animated.parallel([
        Animated.spring(errorToastPosition, {
          toValue: 0,
          tension: 300,
          friction: 30,
          useNativeDriver: true,
        }),
        Animated.timing(errorToastOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.spring(errorToastPosition, {
          toValue: 100,
          tension: 300,
          friction: 30,
          useNativeDriver: true,
        }),
        Animated.timing(errorToastOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [hasError])

  // Dismiss error
  const dismissError = () => {
    setHasError(false)
  }

  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Render trip item
  const renderTripItem = ({ item }) => (
    <TouchableOpacity style={styles.tripCard} onPress={() => navigation.navigate("TripDetails", { tripId: item.id })}>
      <View style={styles.tripHeader}>
        <View style={styles.tripIdContainer}>
          <Text style={styles.tripIdLabel}>Trip ID</Text>
          <Text style={styles.tripId}>#{item.id}</Text>
        </View>
        <View style={styles.statusContainer}>
          <Text
            style={[
              styles.statusText,
              item.statuses === "completed"
                ? styles.completedStatus
                : item.statuses === "canceled"
                  ? styles.canceledStatus
                  : styles.ongoingStatus,
            ]}
          >
            {item.statuses.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <View style={styles.locationIconContainer}>
            <View style={styles.pickupDot} />
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationText} numberOfLines={2}>
              {item.pickUpLocation}
            </Text>
          </View>
        </View>

        <View style={styles.locationDivider} />

        <View style={styles.locationRow}>
          <View style={styles.locationIconContainer}>
            <View style={styles.dropoffDot} />
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>Dropoff</Text>
            <Text style={styles.locationText} numberOfLines={2}>
              {item.dropOffLocation}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tripFooter}>
        <View style={styles.tripDetail}>
          <Icon name="calendar" size={14} color="#666" />
          <Text style={styles.tripDetailText}>{formatDate(item.requestDate)}</Text>
        </View>

        <View style={styles.tripDetail}>
          <Icon name="clock" size={14} color="#666" />
          <Text style={styles.tripDetailText}>{item.duration_minutes} min</Text>
        </View>

        <View style={styles.tripDetail}>
          <Icon name="credit-card" size={14} color="#666" />
          <Text style={styles.tripDetailText}>{item.payment_status}</Text>
        </View>
      </View>

      {item.cancellation_reason && (
        <View style={styles.cancellationContainer}>
          <Text style={styles.cancellationLabel}>Cancellation Reason:</Text>
          <Text style={styles.cancellationText}>{item.cancellation_reason}</Text>
        </View>
      )}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Update StatusBar */}
      <StatusBar barStyle="light-content" backgroundColor="#0DCAF0" />

      {/* Header */}
      <Animated.View style={styles.header}>
        <LinearGradient
          colors={["#0DCAF0", "#0AA8CC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton}>
              <Icon name="menu" color="#fff" size={22} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Rides</Text>
            <TouchableOpacity style={styles.notificationButton}>
              <Icon name="navigation" color="#fff" size={22} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Tab navigation */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBar}>
          {["completed", "canceled", "on-going"].map((tab, index) => (
            <TouchableOpacity key={tab} style={styles.tab} onPress={() => handleTabChange(tab)} activeOpacity={0.8}>
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}

          <Animated.View
            style={[
              styles.tabIndicator,
              {
                transform: [
                  {
                    translateX: tabPosition.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: [0, width / 3, (width / 3) * 2],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      </View>

      {/* Content area */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.centerContent}>
            <View style={styles.loadingIndicator} />
            <Text style={styles.loadingText}>Loading your rides...</Text>
          </View>
        ) : hasError ? (
          <View style={styles.centerContent}>
            <View style={styles.iconContainer}>
              <Icon name="wifi-off" size={40} color="#aaa" />
            </View>
            <Text style={styles.errorTitle}>Connection Error</Text>
            <Text style={styles.errorDescription}>
              We couldn't load your rides. Please check your connection and try again.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchTrips(activeTab)}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            {activeTab === "completed" && (
              <EmptyState
                iconName="check-circle"
                title="No completed rides yet"
                description="Your completed rides will appear here"
              />
            )}
            {activeTab === "canceled" && (
              <EmptyState iconName="x" title="No canceled rides" description="Your canceled rides will appear here" />
            )}
            {activeTab === "on-going" && (
              <EmptyState
                iconName="clock"
                title="No on-going rides"
                description="Your on-going rides will appear here"
              />
            )}
          </View>
        ) : (
          <FlatList
            data={trips}
            renderItem={renderTripItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.tripsList}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>

      {/* Error toast */}
      <Animated.View
        style={[
          styles.errorToast,
          {
            transform: [{ translateY: errorToastPosition }],
            opacity: errorToastOpacity,
          },
        ]}
      >
        <View style={styles.errorIconContainer}>
          <Icon name="wifi-off" size={16} color="#fff" />
        </View>
        <Text style={styles.errorToastText}>Network error. Please check your connection.</Text>
        <TouchableOpacity style={styles.dismissButton} onPress={dismissError}>
          <Icon name="x" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom indicator */}
      <View style={styles.bottomIndicatorContainer}>
        <View style={styles.bottomIndicator} />
      </View>

      {/* Custom Drawer - Wrapped in an overlay View */}
      {drawerOpen && (
        <View style={styles.drawerOverlay}>
          <CustomDrawer isOpen={drawerOpen} toggleDrawer={toggleDrawer} navigation={navigation} />
        </View>
      )}
    </SafeAreaView>
  )
}

function EmptyState({ iconName, title, description }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.iconContainer}>
        <Icon name={iconName} size={40} color="#aaa" />
      </View>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateDescription}>{description}</Text>
    </View>
  )
}

// Update styles object
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    width: "100%",
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  tabContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    borderRadius: 30,
    overflow: "hidden",
    position: "relative",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  tabText: {
    color: "#6b7280",
    fontWeight: "500",
    fontSize: 14,
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "700",
  },
  tabIndicator: {
    position: "absolute",
    width: width / 3,
    height: "100%",
    backgroundColor: "#00b0ff",
    borderRadius: 30,
    zIndex: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  loadingIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: "#e0e0e0",
    borderTopColor: "#00b0ff",
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  iconContainer: {
    backgroundColor: "#f0f0f0",
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#00b0ff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  emptyStateContainer: {
    flex: 1,
    paddingVertical: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  errorToast: {
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: "#333",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  errorIconContainer: {
    backgroundColor: "#ff3b30",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  errorToastText: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
  },
  dismissButton: {
    padding: 4,
  },
  bottomIndicatorContainer: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  bottomIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#ccc",
    borderRadius: 2,
  },
  // Trip card styles
  tripsList: {
    paddingVertical: 16,
  },
  separator: {
    height: 16,
  },
  tripCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tripIdContainer: {
    flexDirection: "column",
  },
  tripIdLabel: {
    fontSize: 12,
    color: "#666",
  },
  tripId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  completedStatus: {
    color: "#4CAF50",
  },
  canceledStatus: {
    color: "#F44336",
  },
  ongoingStatus: {
    color: "#2196F3",
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  locationIconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
  },
  dropoffDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#F44336",
  },
  locationDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#e0e0e0",
    marginLeft: 12,
    marginBottom: 8,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  tripFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  tripDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  tripDetailText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  cancellationContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#FFC107",
  },
  cancellationLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F57C00",
    marginBottom: 4,
  },
  cancellationText: {
    fontSize: 14,
    color: "#333",
  },
  drawerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000, // Ensure this is higher than any other zIndex
    backgroundColor: "rgba(0,0,0,0.5)", // Optional: adds a semi-transparent background dimming
  },
})
