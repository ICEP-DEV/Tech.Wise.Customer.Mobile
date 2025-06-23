import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import axios from "axios"
import { api } from "../../api"

const colors = {
  brandCyan: "#00B8D9",
  brandCyanDark: "#0086A8",
  white: "#fff",
  textPrimary: "#222",
  textSecondary: "#888",
  border: "#E0E0E0",
  background: "#F7FAFC",
  error: "#E53935",
}

const formatDate = (dateStr) => {
  if (!dateStr) return ""
  const dateObj = new Date(dateStr)
  return dateObj.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const BookingDetail = ({ route, navigation }) => {
  const booking = route?.params?.booking || null
  const userId = route?.params?.userId || null

  if (!booking || !userId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Booking details or User ID not provided.</Text>
      </View>
    )
  }

  const handleDelete = () => {
    Alert.alert("Delete Booking", "Are you sure you want to delete this booking?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await axios.delete(api + `helicopter_quotes/${booking.id}`, { data: { user_id: userId } })
          navigation.goBack()
        },
      },
    ])
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.roundButton}>
          <Ionicons name="arrow-back" size={30} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 50 }} /> {/* Placeholder for alignment */}
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.label}>From:</Text>
          <Text style={styles.value}>{booking.departurePoint}</Text>
          <Text style={styles.label}>To:</Text>
          <Text style={styles.value}>{booking.destination}</Text>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{formatDate(booking.flightDate)}</Text>
          <Text style={styles.label}>Passengers:</Text>
          <Text style={styles.value}>{booking.numberOfPassengers}</Text>
          <Text style={styles.label}>Passenger Weights:</Text>
          <Text style={styles.value}>{booking.passengerWeights}</Text>
          <Text style={styles.label}>Luggage Weight:</Text>
          <Text style={styles.value}>{booking.luggageWeight}</Text>
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("BookingEdit", { booking, userId })}
          >
            <Ionicons name="create-outline" size={18} color={colors.white} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={colors.white} />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  deleteButton: {
    backgroundColor: colors.error,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  deleteButtonText: {
    color: colors.white,
    fontWeight: "bold",
    marginLeft: 6,
  },
})

export default BookingDetail
