"use client"

import { useState, useCallback } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons" // Import MaterialCommunityIcons
import axios from "axios"
import { api } from "../../api"
import { SafeAreaView } from "react-native-safe-area-context"
import { useFocusEffect } from "@react-navigation/native" // Import useFocusEffect

const colors = {
  brandCyan: "#00B8D9",
  brandCyanDark: "#0086A8",
  white: "#fff",
  textPrimary: "#222",
  textSecondary: "#888",
  border: "#E0E0E0",
  background: "#F7FAFC",
  error: "#E53935",
  warning: "#FFC107", // Added for warning messages
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

const formatDate = (dateStr) => {
  if (!dateStr) return ""
  const dateObj = new Date(dateStr)
  return dateObj.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

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

const BookingDetail = ({ route, navigation }) => {
  const booking = route?.params?.booking || null
  const userId = route?.params?.userId || null

  // Calculate if the booking is editable (within 2 hours of creation)
  const isBookingEditable = useCallback(() => {
    if (!booking?.createdAt) return false // If no creation date, assume not editable or handle as error
    const bookingCreationTime = new Date(booking.createdAt).getTime()
    const twoHoursInMs = 2 * 60 * 60 * 1000 // 2 hours in milliseconds
    return Date.now() - bookingCreationTime < twoHoursInMs
  }, [booking?.createdAt])

  const [canEdit, setCanEdit] = useState(isBookingEditable())

  useFocusEffect(
    useCallback(() => {
      // Re-evaluate editability on focus (e.g., after returning from BookingEdit)
      setCanEdit(isBookingEditable())
    }, [isBookingEditable]),
  )

  if (!booking || !userId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Booking details or User ID not provided.</Text>
      </View>
    )
  }

  const handleCancelBooking = () => {
    // Renamed function
    Alert.alert("Cancel Booking", "Are you sure you want to cancel this booking?", [
      // Updated title
      { text: "No", style: "cancel" }, // Changed "Cancel" to "No" for clarity
      {
        text: "Yes, Cancel", // Updated text
        style: "default", // Changed style from destructive
        onPress: async () => {
          try {
            await axios.put(api + `helicopter_quotes/${booking.id}`, { status: "Cancelled", user_id: userId }) // Changed to PUT and updated status
            Alert.alert("Success", "Booking cancelled successfully!")
            navigation.navigate("BookingList", { userId }) // Navigate back to booking list
          } catch (error) {
            console.error("Error cancelling booking:", error)
            Alert.alert("Error", "Could not cancel booking. Please try again.")
          }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.roundButton}>
          <Ionicons name="arrow-back" size={30} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 50 }} /> {/* Placeholder for alignment */}
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Your Flight Booking</Text>
          <Text style={styles.introDescription}>Review the details of your confirmed flight below.</Text>
        </View>

        <InfoCard
          icon={<MaterialCommunityIcons name="clock-alert-outline" size={22} color={colors.warning} />}
          title="Editing Window"
          description={
            canEdit
              ? "You can still edit this booking. Changes are allowed within 2 hours of creation."
              : "Editing is no longer available. Please contact support for any modifications."
          }
        />

        <View style={styles.card}>
          <Text style={styles.label}>From:</Text>
          <Text style={styles.value}>{booking.departurePoint}</Text>
          <Text style={styles.label}>To:</Text>
          <Text style={styles.value}>{booking.destination}</Text>
          <Text style={styles.label}>Flight Date:</Text>
          <Text style={styles.value}>{formatDate(booking.flightDate)}</Text>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{booking.statuses}</Text>
          <Text style={styles.label}>Booked On:</Text>
          <Text style={styles.value}>{formatDateTime(booking.created_at)}</Text>
          <Text style={styles.label}>Passengers:</Text>
          <Text style={styles.value}>{booking.numberOfPassengers}</Text>
          <Text style={styles.label}>Passenger Weights:</Text>
          <Text style={styles.value}>{booking.passengerWeights}</Text>
          <Text style={styles.label}>Luggage Weight:</Text>
          <Text style={styles.value}>{booking.luggageWeight}</Text>
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.editButton, !canEdit && styles.editButtonDisabled]}
            onPress={() => navigation.navigate("BookingEdit", { booking, userId })}
            disabled={!canEdit}
          >
            <Ionicons name="create-outline" size={18} color={colors.white} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelBooking}>
            {" "}
            {/* Changed style and onPress */}
            <Ionicons name="close-circle-outline" size={18} color={colors.white} /> {/* Changed icon */}
            <Text style={styles.cancelButtonText}>Cancel</Text> {/* Changed text */}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: colors.background,
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
  introCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  introDescription: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F2F8FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
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
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  label: {
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  editButton: {
    backgroundColor: colors.brandCyanDark,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  editButtonText: {
    color: colors.white,
    fontWeight: "bold",
    marginLeft: 6,
  },
  editButtonDisabled: {
    backgroundColor: "#B0B0B0",
  },
cancelButton: {
  backgroundColor: "#d32f2f", // strong material red
  borderRadius: 8,
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 12,
  paddingHorizontal: 24,
},

  cancelButtonText: {
    // New style for cancel button text
    color: colors.white,
    fontWeight: "bold",
    marginLeft: 6,
  },
  deleteButton: {
    // Kept for reference, but no longer used by the button
    backgroundColor: colors.error,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  deleteButtonText: {
    // Kept for reference
    color: colors.white,
    fontWeight: "bold",
    marginLeft: 6,
  },
})

export default BookingDetail
