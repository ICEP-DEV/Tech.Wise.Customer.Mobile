"use client"

import { useState } from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { Icon } from "react-native-elements"
import axios from "axios"
import { api } from "../../api"
import { useSelector } from "react-redux"
import { useFocusEffect } from "@react-navigation/native"
import { useCallback } from "react"
import CustomDrawer from "../components/CustomDrawer"
import { Alert } from "react-native"

const colors = {
  brandCyan: "#00B8D9",
  brandCyanDark: "#0086A8",
  white: "#fff",
  textPrimary: "#222",
  textSecondary: "#888",
  border: "#E0E0E0",
  background: "#F7FAFC",
  error: "#E53935",
  statusPending: "#FFC107", // Orange for pending
  statusConfirmed: "#28A745", // Green for confirmed
  statusCancelled: "#DC3545", // Red for cancelled
}

const InfoCard = ({ icon, title, description }) => (
  <View style={styles.infoCard}>
    <View style={styles.infoIcon}>{icon}</View>
    <View>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoDescription}>{description}</Text>
    </View>
  </View>
)

// Helper functions for date filtering
const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()

const isSameWeek = (date, now) => {
  const monday = new Date(now)
  const day = monday.getDay()
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return date >= monday && date <= sunday
}

const isSameMonth = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()

const formatDateTime = (isoString) => {
  if (!isoString) return "N/A"
  try {
    const date = new Date(isoString)
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  } catch (e) {
    console.error("Error formatting date:", e)
    return "Invalid Date"
  }
}

const BookingList = ({ navigation, route }) => {
  const userIdGlobal = useSelector((state) => state.auth.user?.user_id)

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true) // Initialize loading to true
  const [filter, setFilter] = useState("all") // "all", "daily", "weekly", "monthly"
  const [searchQuery, setSearchQuery] = useState("")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const toggleDrawer = () => setDrawerOpen(!drawerOpen)

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      axios
        .get(api + "helicopter_quotes/" + userIdGlobal)
        .then((res) => setBookings(Array.isArray(res.data) ? res.data : []))
        .catch(() => Alert.alert("Error", "Error loading bookings")) // Use Alert.alert for user feedback
        .finally(() => setLoading(false))
    }, [userIdGlobal]),
  )

  const now = new Date()
  const filteredBookings = bookings.filter((booking) => {
    if (!booking.flightDate) return false
    const bookingDate = new Date(booking.flightDate)

    let dateMatch = true
    switch (filter) {
      case "daily":
        dateMatch = isSameDay(bookingDate, now)
        break
      case "weekly":
        dateMatch = isSameWeek(bookingDate, now)
        break
      case "monthly":
        dateMatch = isSameMonth(bookingDate, now)
        break
      default:
        dateMatch = true
    }

    const searchMatch =
      searchQuery.toLowerCase() === "" ||
      booking.departurePoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.destination.toLowerCase().includes(searchQuery.toLowerCase())

    return dateMatch && searchMatch
  })

  const formatDate = (dateStr) => {
    const dateObj = new Date(dateStr)
    return dateObj.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Header component for FlatList
  const ListHeader = () => (
    <View style={styles.listHeaderContainer}>
      <InfoCard
        icon={<MaterialCommunityIcons name="information" size={24} color={colors.brandCyan} />}
        title="Manage Your Bookings"
        description="View all your flight bookings here. You can tap any booking to view details, edit, or cancel it. Use the button below to create a new booking anytime."
      />

      <InfoCard
        icon={<Ionicons name="information-circle-outline" size={22} color={colors.brandCyan} />}
        title="Booking Statuses"
        description="Pending: Awaiting confirmation. Confirmed: Your booking is set. Cancelled: Booking has been cancelled."
      />

      <TextInput
        style={styles.searchInput}
        placeholder="Search by departure or destination"
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.filterContainer}>
        {["all", "daily", "weekly", "monthly"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  // Footer component for FlatList
  const ListFooter = () => (
    <TouchableOpacity
      style={styles.addButton}
      onPress={() => navigation.navigate("BookingForm", { userId: userIdGlobal })}
      accessibilityLabel="Create new booking"
    >
      <Text style={styles.addButtonText}>+ New Booking</Text>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={toggleDrawer} style={styles.roundButton}>
            <Icon type="material-community" name="menu" color={colors.textPrimary} size={30} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <View style={{ width: 50 }} />
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.brandCyan} size="large" />
        ) : (
          <FlatList
            data={filteredBookings}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const getStatusColor = (status) => {
                switch (status) {
                  case "Pending":
                    return colors.statusPending
                  case "Confirmed":
                    return colors.statusConfirmed
                  case "Cancelled":
                    return colors.statusCancelled
                  default:
                    return colors.textSecondary
                }
              }

              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => navigation.navigate("BookingDetails", { booking: item, userId: userIdGlobal })}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Ionicons name="airplane" size={20} color={colors.brandCyanDark} style={{ marginRight: 8 }} />
                      <Text style={styles.title}>
                        {item.departurePoint} → {item.destination}
                      </Text>
                    </View>
                    <View style={styles.statusContainer}>
                      <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.statuses) }]} />
                      <Text style={styles.statusText}>{item.statuses}</Text>
                    </View>
                  </View>
                  <Text style={styles.date}>Flight Date: {formatDate(item.flightDate)}</Text>
                  {item.createdAt && <Text style={styles.date}>Booked On: {formatDateTime(item.createdAt)}</Text>}
                </TouchableOpacity>
              )
            }}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={ListFooter}
            ListEmptyComponent={<Text style={styles.noBookings}>No bookings found.</Text>}
            contentContainerStyle={styles.flatListContentContainer} // Apply padding here
          />
        )}

        <CustomDrawer isOpen={drawerOpen} toggleDrawer={toggleDrawer} navigation={navigation} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  flatListContentContainer: {
    padding: 20, // Apply padding to the content container of FlatList
    flexGrow: 1, // Ensure content takes up available space for proper scrolling
  },
  listHeaderContainer: {
    marginBottom: 15, // Add some space below the header content
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 15,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.brandCyanDark,
    letterSpacing: 0.2,
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
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F2F8FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoTitle: {
    fontWeight: "600",
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: 2,
  },
  infoDescription: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  searchInput: {
    height: 40,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: colors.white,
    color: colors.textPrimary,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.brandCyan,
  },
  filterButtonActive: {
    backgroundColor: colors.brandCyan,
  },
  filterText: {
    color: colors.brandCyan,
    fontWeight: "600",
  },
  filterTextActive: {
    color: colors.white,
  },
  noBookings: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontWeight: "600",
    fontSize: 16,
    color: colors.textPrimary,
  },
  date: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  addButton: {
    backgroundColor: colors.brandCyan,
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 20, // Add margin top to separate from the last list item
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
})

export default BookingList
