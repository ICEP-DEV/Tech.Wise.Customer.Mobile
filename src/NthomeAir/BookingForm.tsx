"use client"

import React, { useState, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList, // Changed from ScrollView
  StyleSheet,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Ionicons, MaterialCommunityIcons, FontAwesome5, FontAwesome } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import axios from "axios"
import { api } from "../../api"
import { useSelector } from "react-redux"
import { SafeAreaView } from "react-native-safe-area-context"
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete"
import { GOOGLE_MAPS_APIKEY } from "@env"

const colors = {
  brandCyan: "#00B8D9",
  brandCyanDark: "#0086A8",
  white: "#fff",
  textPrimary: "#222",
  textSecondary: "#888",
  textPlaceholder: "#B0B0B0",
  border: "#E0E0E0",
  background: "#F7FAFC",
  error: "#E53935",
  iconMuted: "#B6D7E5",
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

const BookingForm = ({ navigation }) => {
  const userId = useSelector((state) => state.auth.user.user_id)

  const [form, setForm] = useState({
    flightDate: "",
    numberOfPassengers: "",
    passengerWeights: "",
    luggageWeight: "",
    departurePoint: "",
    destination: "",
    isReturnFlight: "",
    waitingTime: "",
  })

  const [focused, setFocused] = useState(null)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false)

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start()
  }, [])

  const handleChange = (name, value) => setForm({ ...form, [name]: value })
  const handleFocus = (inputName) => setFocused(inputName)
  const handleBlur = () => setFocused(null)

  // Handle date picker selection
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false)
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split("T")[0]
      setForm({ ...form, flightDate: dateString })
    }
  }

  const handleSubmit = async () => {
    const requiredFields = ["flightDate", "numberOfPassengers", "departurePoint", "destination"]
    const missingFields = requiredFields.filter((field) => !form[field])
    if (missingFields.length > 0) {
      Alert.alert("Missing Information", "Please fill in all required fields.")
      return
    }
    try {
      await axios.post(api + "helicopter_quotes", { user_id: userId, ...form })
      Alert.alert("Quote Request Submitted", "We will contact you shortly with your flight quote!")
      setForm({
        flightDate: "",
        numberOfPassengers: "",
        passengerWeights: "",
        luggageWeight: "",
        departurePoint: "",
        destination: "",
        isReturnFlight: "",
        waitingTime: "",
      })
      navigation.navigate("BookingList", { userId })
    } catch (error) {
      Alert.alert("Error", "Failed to submit quote. Please try again.")
    }
  }

  const getInputStyle = (inputName) => [
    styles.input,
    focused === inputName && styles.inputFocused,
    form[inputName] && styles.inputFilled,
  ]

  // Define the ListHeaderComponent for FlatList
  const ListHeader = () => (
    <>
      <View style={styles.introCard}>
        <Text style={styles.introTitle}>Flight Charter Request</Text>
        <Text style={styles.introDescription}>
          Enter your flight details below. We'll send you a personalized quote as soon as possible.
        </Text>
      </View>
      <InfoCard
        icon={<Ionicons name="information-circle-outline" size={22} color={colors.brandCyan} />}
        title="Why We Ask for Weights"
        description="Passenger and luggage weights help us ensure your safety and select the right aircraft for your journey."
      />
      <InfoCard
        icon={<MaterialCommunityIcons name="calendar" size={22} color={colors.brandCyan} />}
        title="Flexible Dates?"
        description="If your travel date is flexible, let us know in the notes for more options."
      />
      <Animated.View style={[styles.formCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.formHeader}>
          <FontAwesome5 name="plane" size={22} color={colors.brandCyanDark} style={{ marginRight: 10 }} />
          <Text style={styles.formHeading}>Flight Details</Text>
        </View>
        {/* Trip Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Trip Information</Text>
          <TouchableOpacity style={styles.inputGroupFlat} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
            <FontAwesome name="calendar" size={16} color={colors.iconMuted} style={styles.inputIcon} />
            <Text style={[styles.input, form.flightDate ? styles.inputFilled : { color: colors.textPlaceholder }]}>
              {form.flightDate ? form.flightDate : "Flight Date *"}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={form.flightDate ? new Date(form.flightDate) : new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
          <Text style={styles.helperText}>Tap to select your preferred departure date.</Text>
          <View style={styles.inputGroupFlat}>
            <Ionicons name="people" size={16} color={colors.iconMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="Number of Passengers *"
              placeholderTextColor={colors.textPlaceholder}
              keyboardType="numeric"
              style={getInputStyle("numberOfPassengers")}
              value={form.numberOfPassengers}
              onChangeText={(text) => handleChange("numberOfPassengers", text)}
              onFocus={() => handleFocus("numberOfPassengers")}
              onBlur={handleBlur}
              accessibilityLabel="Number of Passengers"
            />
          </View>
          <Text style={styles.helperText}>Maximum: 6 per flight.</Text>
        </View>
        {/* Weights Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Weight Information</Text>
          <View style={styles.inputGroupFlat}>
            <MaterialCommunityIcons name="weight" size={16} color={colors.iconMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="Passenger Weights (comma separated)"
              placeholderTextColor={colors.textPlaceholder}
              style={getInputStyle("passengerWeights")}
              value={form.passengerWeights}
              onChangeText={(text) => handleChange("passengerWeights", text)}
              onFocus={() => handleFocus("passengerWeights")}
              onBlur={handleBlur}
              accessibilityLabel="Passenger Weights"
            />
          </View>
          <Text style={styles.helperText}>E.g., 80, 75, 90</Text>
          <View style={styles.inputGroupFlat}>
            <MaterialCommunityIcons name="bag-checked" size={16} color={colors.iconMuted} style={styles.inputIcon} />
            <TextInput
              placeholder="Total Luggage Weight (kg)"
              placeholderTextColor={colors.textPlaceholder}
              keyboardType="numeric"
              style={getInputStyle("luggageWeight")}
              value={form.luggageWeight}
              onChangeText={(text) => handleChange("luggageWeight", text)}
              onFocus={() => handleFocus("luggageWeight")}
              onBlur={handleBlur}
              accessibilityLabel="Total Luggage Weight"
            />
          </View>
          <Text style={styles.helperText}>Estimate if unsure.</Text>
        </View>
        {/* Route Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Route</Text>
          <View style={styles.inputGroupFlat}>
            <Ionicons name="location" size={16} color={colors.iconMuted} style={styles.inputIcon} />
            <GooglePlacesAutocomplete
              placeholder="Departure Point *"
              onPress={(data, details = null) => {
                handleChange("departurePoint", data.description)
              }}
              query={{
                key: GOOGLE_MAPS_APIKEY,
                language: "en",
              }}
              fetchDetails={true}
              enablePoweredByContainer={false}
              styles={{
                container: { flex: 1, zIndex: 1 },
                textInput: {
                  ...styles.input,
                  height: 40,
                  paddingHorizontal: 0,
                  backgroundColor: "transparent",
                },
                listView: {
                  position: "absolute",
                  top: 45,
                  left: 0,
                  right: 0,
                  backgroundColor: colors.white,
                  zIndex: 1000,
                  elevation: 5,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  borderRadius: 6,
                },
                row: {
                  padding: 10,
                  backgroundColor: colors.white,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
                description: {
                  color: colors.textPrimary,
                },
                predefinedPlacesDescription: {
                  color: colors.brandCyanDark,
                },
              }}
              textInputProps={{
                value: form.departurePoint,
                onChangeText: (text) => {
                  if (text !== form.departurePoint) {
                    handleChange("departurePoint", text)
                  }
                },
                placeholderTextColor: colors.textPlaceholder,
                accessibilityLabel: "Departure Point",
              }}

            />

          </View>
          <Text style={styles.helperText}>City, landmark, or airport location.</Text>
          <View style={styles.inputGroupFlat}>
            <Ionicons name="flag" size={16} color={colors.iconMuted} style={styles.inputIcon} />
            <GooglePlacesAutocomplete
              placeholder="Destination *"
              onPress={(data, details = null) => {
                handleChange("destination", data.description)
              }}
              query={{
                key: GOOGLE_MAPS_APIKEY,
                language: "en",
              }}
              styles={{
                container: { flex: 1, zIndex: 1 },
                textInput: {
                  ...styles.input,
                  height: 40,
                  paddingHorizontal: 0,
                  backgroundColor: "transparent",
                },
                listView: {
                  position: "absolute",
                  top: 45,
                  left: 0,
                  right: 0,
                  backgroundColor: colors.white,
                  zIndex: 1000,
                  elevation: 5,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  borderRadius: 6,
                },
                row: {
                  padding: 10,
                  backgroundColor: colors.white,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
                description: {
                  color: colors.textPrimary,
                },
                predefinedPlacesDescription: {
                  color: colors.brandCyanDark,
                },
              }}
              fetchDetails={true}
              textInputProps={{
                value: form.destination,
                onChangeText: (text) => {
                  if (text !== form.destination) {
                    handleChange("destination", text)
                  }
                },
                placeholderTextColor: colors.textPlaceholder,
                accessibilityLabel: "Destination",
              }}

              enablePoweredByContainer={false}
            />
          </View>
          <Text style={styles.helperText}>Where would you like to go?</Text>
        </View>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          accessibilityLabel="Submit flight booking request"
        >
          <Text style={styles.submitText}>Request Quote</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.roundButton}>
            <Ionicons name="arrow-back" color={colors.textPrimary} size={30} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Your Flight</Text>
          <View style={{ width: 50 }} />
        </View>

        <FlatList
          data={[]} // Dummy data, as all content is in header
          renderItem={() => null} // No items to render directly
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>
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
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 18,
    marginTop: 8,
    marginBottom: 24,
    shadowColor: "#00B8D9",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  formHeading: {
    fontSize: 18,
    color: colors.brandCyanDark,
    fontWeight: "bold",
    letterSpacing: 0.2,
  },
  section: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontWeight: "600",
    fontSize: 15,
    color: colors.brandCyanDark,
    marginBottom: 8,
    marginTop: 8,
  },
  inputGroupFlat: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 1, // Ensure autocomplete suggestions appear above other content
  },
  inputIcon: {
    marginRight: 7,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  inputFocused: {
    backgroundColor: "#E3F7FA",
  },
  inputFilled: {
    color: colors.brandCyanDark,
    fontWeight: "600",
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: colors.brandCyan,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    marginTop: 10,
    shadowColor: "#00B8D9",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  submitText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },
})

export default BookingForm
