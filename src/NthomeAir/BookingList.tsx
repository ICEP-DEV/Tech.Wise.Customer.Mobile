"use client"

import { useState } from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TextInput, // Added TextInput for search
  KeyboardAvoidingView, // Import KeyboardAvoidingView
  Platform, // Import Platform
} from "react-native"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import { Icon } from "react-native-elements" // Import Icon for CustomDrawer
import axios from "axios"
import { api } from "../../api" // Your API base URL
import { useSelector } from "react-redux"
import { useFocusEffect } from "@react-navigation/native"
import { useCallback } from "react"
import CustomDrawer from "../components/CustomDrawer" // Import CustomDrawer

const colors = {
  brandCyan: "#00B8D9",
  brandCyanDark: "#0086A8",
  white: "#fff",
  textPrimary: "#222",
  textSecondary: "#888",
  border: "#E0E0E0",
  background: "#F7FAFC",
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
  // Get Monday of current week
  const monday = new Date(now)
  const day = monday.getDay()
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)

  // Sunday of current week
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return date >= monday && date <= sunday
}

const isSameMonth = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()

const BookingList = ({ navigation, route }) => {
  const userId = route?.params?.userId
  const userIdGlobal = useSelector((state) => state.auth.user?.user_id)

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // "all", "daily", "weekly", "monthly"
  const [searchQuery, setSearchQuery] = useState("") // New state for search query
  const [drawerOpen, setDrawerOpen] = useState(false) // State for drawer visibility
  const toggleDrawer = () => setDrawerOpen(!drawerOpen) // Toggle function for drawer

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      axios
        .get(api + "helicopter_quotes/" + userIdGlobal)
        .then((res) => setBookings(res.data))
        .catch(() => alert("Error loading bookings"))
        .finally(() => setLoading(false))
    }, [userIdGlobal]), // Changed dependency to userIdGlobal
  )

  // Filter bookings based on filter state and search query
  const now = new Date()
  const filteredBookings = bookings.filter((booking) => {
    if (!booking.flightDate) return false
    const bookingDate = new Date(booking.flightDate)

    // Apply date filter
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
        dateMatch = true // all
    }

    // Apply search filter
    const searchMatch =
      searchQuery.toLowerCase() === "" ||
      booking.departurePoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.destination.toLowerCase().includes(searchQuery.toLowerCase())

    return dateMatch && searchMatch
  })

  // Format date for display
  const formatDate = (dateStr) => {
    const dateObj = new Date(dateStr)
    return dateObj.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.roundButton}>
          <Icon type="material-community" name="menu" color={colors.textPrimary} size={30} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 50 }} /> {/* Placeholder for alignment */}
      </View>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <InfoCard
          icon={<MaterialCommunityIcons name="information" size={24} color={colors.brandCyan} />}
          title="Manage Your Bookings"
          description="View all your flight bookings here. You can tap any booking to view details, edit, or delete it. Use the button below to create a new booking anytime."
        />

        {/* Search Input */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search by departure or destination"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Filter Buttons */}
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

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.brandCyan} size="large" />
        ) : filteredBookings.length === 0 ? (
          <Text style={styles.noBookings}>No bookings found.</Text>
        ) : (
          <FlatList
            data={filteredBookings}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate("BookingDetail", { booking: item, userId: userIdGlobal })}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="airplane" size={20} color={colors.brandCyanDark} style={{ marginRight: 8 }} />
                  <Text style={styles.title}>
                    {item.departurePoint} → {item.destination}
                  </Text>
                </View>
                <Text style={styles.date}>{formatDate(item.flightDate)}</Text>
              </TouchableOpacity>
            )}
            scrollEnabled={false} // Because inside ScrollView
          />
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("BookingForm", { userId: userIdGlobal })} // Changed userIdGlobal to userId
          accessibilityLabel="Create new booking"
        >
          <Text style={styles.addButtonText}>+ New Booking</Text>
        </TouchableOpacity>
      </ScrollView>
      <CustomDrawer isOpen={drawerOpen} toggleDrawer={toggleDrawer} navigation={navigation} />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  headerBar: {
    // Added headerBar style
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
    // Added headerTitle style
    fontSize: 19,
    fontWeight: "700",
    color: colors.brandCyanDark,
    letterSpacing: 0.2,
  },
  roundButton: {
    // Added roundButton style
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
    // New style for search input
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
    marginTop: 20,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default BookingList
