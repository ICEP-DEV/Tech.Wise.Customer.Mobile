"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Switch,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Icon } from "react-native-elements"
import { LinearGradient } from "expo-linear-gradient"
import { Picker } from "@react-native-picker/picker"
import { Platform } from "react-native"
import { useSelector } from "react-redux"
import axios from "axios"
import { api } from "../../api"

const { width } = Dimensions.get("window")

export default function PaymentMethod({ navigation }) {
  const [saveCard, setSaveCard] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const user = useSelector((state) => state.auth.user)
  const mastercardIcon = require("../../assets/mastercard.png")
  const visaIcon = require("../../assets/visa-credit-card.png")
  const [cardType, setCardType] = useState("Mastercard")
  const user_id = user.user_id
  console.log("User :", user);
  

  // State variables to store input values
  const [nameOnCard, setNameOnCard] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [cardNumber, setCardNumber] = useState("")
  const [bankCode, setBankCode] = useState("")
  const [countryCode, setCountryCode] = useState("ZA")
  const [paystackBanks, setPaystackBanks] = useState([])
  const [bankName, setBankName] = useState("")
  const [customer, setCustomer] = useState(null);
  // Determine which icon to show
  const cardIcon = cardType === "Visa" ? visaIcon : mastercardIcon

  // Format card number with spaces
  const formatCardNumber = (text) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, "")
    // Add a space after every 4 digits
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, "$1 ")
    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.slice(0, 19)
  }

  //fetch user data from db
  useEffect(() => {
    if (!user_id) return;

    const fetchCustomer = async () => {
      try {
        const res = await axios.get(api+`customer/${user_id}`);
        setCustomer(res.data);
        // setLoading(false);
      } catch (err) {
        console.error("Error fetching customer:", err);
        // setError('Failed to fetch customer details.');
        // setLoading(false);
      }
    };

    fetchCustomer();
  }, [user_id]);

  // Fetch Paystack banks on component mount
  useEffect(() => {
    const fetchPaystackBanks = async () => {
      try {
        const response = await axios.get(api + "paystack-banks")
        setPaystackBanks(response.data)
      } catch (error) {
        console.error("Error fetching Paystack banks:", error)
      }
    }

    fetchPaystackBanks()
  }, [])

  // Update bank name when bank code changes
  useEffect(() => {
    if (bankCode && paystackBanks.length > 0) {
      const selectedBank = paystackBanks.find((bank) => bank.code === bankCode)
      if (selectedBank) {
        setBankName(selectedBank.name)
      }
    }
  }, [bankCode, paystackBanks])

  // Function to handle form submission
  const handleSubmit = async () => {
    // Basic validation
    if (!nameOnCard || !email || !cardNumber || !bankCode || !countryCode) {
      Alert.alert("Error", "Please fill in all fields.")
      return
    }

    setIsLoading(true)

    const payload = {
      nameOnCard,
      email,
      account_number: cardNumber.replace(/\s/g, ""), // Remove spaces
      bank_code: bankCode,
      first_name: nameOnCard.split(" ")[0],
      user_id: user_id,
      country_code: countryCode,
    }

    try {
      const response = await axios.post(api + "create-recipient", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.status === 200) {
        Alert.alert("Success", "Withdrawal method added successfully!")
        navigation.navigate("PaymentMethodsScreen", {
          cardType: cardType,
        })
      } else {
        Alert.alert("Error", "Failed to add withdrawal method.")
      }
    } catch (error) {
      console.error("Error adding withdrawal method:", error)
      Alert.alert("Error", "Account number is invalid or an error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FBFD" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" type="material" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Withdrawal Method</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Card Preview */}
        <View style={styles.cardPreviewContainer}>
          <LinearGradient
            colors={["#0DCAF0", "#0AA8CD"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardPreview}
          >
            <View style={styles.cardChip}>
              <Icon name="credit-card-chip" type="material-community" size={30} color="#FFD700" />
            </View>

            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardLabel}>{cardType}</Text>
                <Text style={styles.cardNumber}>
                  {cardNumber ? formatCardNumber(cardNumber) : "•••• •••• •••• ••••"}
                </Text>
              </View>
              <Image source={cardIcon} style={styles.cardBrandLogo} />
            </View>

            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.cardHolderLabel}>CARD HOLDER</Text>
                <Text style={styles.cardHolderName}>{nameOnCard || user.name|| "Enter name"}</Text>
              </View>
              <View>
                <Text style={styles.bankLabel}>BANK</Text>
                <Text style={styles.bankName}>{bankName || "Select Bank"}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Card Details</Text>

          <View style={styles.formSection}>
            <Text style={styles.label}>Card Type</Text>
            <View style={styles.cardTypeContainer}>
              <TouchableOpacity
                style={[styles.cardTypeOption, cardType === "Mastercard" && styles.selectedCardType]}
                onPress={() => setCardType("Mastercard")}
              >
                <Image source={mastercardIcon} style={styles.cardTypeIcon} />
                <Text style={styles.cardTypeText}>Mastercard</Text>
                {cardType === "Mastercard" && (
                  <Icon name="check-circle" type="material-community" size={18} color="#0DCAF0" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cardTypeOption, cardType === "Visa" && styles.selectedCardType]}
                onPress={() => setCardType("Visa")}
              >
                <Image source={visaIcon} style={styles.cardTypeIcon} />
                <Text style={styles.cardTypeText}>Visa</Text>
                {cardType === "Visa" && (
                  <Icon name="check-circle" type="material-community" size={18} color="#0DCAF0" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name on Card</Text>
              <View style={styles.inputContainer}>
                <Icon name="account" type="material-community" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={nameOnCard}
                  onChangeText={setNameOnCard}
                  placeholder="Enter name as it appears on card"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Icon name="email" type="material-community" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email address"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Number</Text>
              <View style={styles.inputContainer}>
                <Icon name="credit-card" type="material-community" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={cardNumber}
                  onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  maxLength={19}
                />
                <Image source={cardIcon} style={styles.inputCardIcon} />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.label}>Bank</Text>
                {Platform.OS === "android" ? (
                  <View style={styles.pickerContainer}>
                    <Icon name="bank" type="material-community" size={20} color="#64748B" style={styles.pickerIcon} />
                    <Picker
                      selectedValue={bankCode}
                      style={styles.picker}
                      onValueChange={(itemValue) => setBankCode(itemValue)}
                    >
                      <Picker.Item label="Select a bank" value="" />
                      {paystackBanks.map((bank) => (
                        <Picker.Item key={bank.code} label={bank.name} value={bank.code} />
                      ))}
                    </Picker>
                  </View>
                ) : (
                  <View style={styles.inputContainer}>
                    <Icon name="bank" type="material-community" size={20} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter bank code"
                      placeholderTextColor="#94A3B8"
                      value={bankCode}
                      onChangeText={setBankCode}
                      keyboardType="number-pad"
                    />
                  </View>
                )}
              </View>

              <View style={styles.inputGroupHalf}>
                <Text style={styles.label}>Country Code</Text>
                <View style={styles.inputContainer}>
                  <Icon name="flag" type="material-community" size={20} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={countryCode}
                    onChangeText={setCountryCode}
                    placeholder="ZA"
                    placeholderTextColor="#94A3B8"
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.switchContainer}>
            <Switch
              value={saveCard}
              onValueChange={setSaveCard}
              trackColor={{ false: "#E2E8F0", true: "#0DCAF0" }}
              thumbColor={saveCard ? "#FFFFFF" : "#FFFFFF"}
              ios_backgroundColor="#E2E8F0"
            />
            <Text style={styles.switchLabel}>Save this card for future withdrawals</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, !saveCard && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={!saveCard || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Add Withdrawal Method</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FBFD",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  cardPreviewContainer: {
    marginBottom: 24,
  },
  cardPreview: {
    padding: 24,
    borderRadius: 16,
    shadowColor: "#0DCAF0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    position: "relative",
  },
  cardChip: {
    position: "absolute",
    top: 24,
    left: 24,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 40,
    marginBottom: 40,
  },
  cardLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  cardNumber: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 2,
  },
  cardBrandLogo: {
    width: 50,
    height: 30,
    resizeMode: "contain",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardHolderLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    opacity: 0.8,
    marginBottom: 4,
  },
  cardHolderName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  bankLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    opacity: 0.8,
    marginBottom: 4,
    textAlign: "right",
  },
  bankName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "right",
  },
  formContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 16,
  },
  formSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardTypeOption: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectedCardType: {
    borderColor: "#0DCAF0",
    backgroundColor: "#E0F7FA",
  },
  cardTypeIcon: {
    width: 30,
    height: 20,
    resizeMode: "contain",
    marginRight: 8,
  },
  cardTypeText: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupHalf: {
    width: "48%",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 16,
    color: "#0F172A",
  },
  inputCardIcon: {
    width: 30,
    height: 20,
    resizeMode: "contain",
    marginRight: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    height: 48,
  },
  pickerIcon: {
    marginLeft: 12,
  },
  picker: {
    flex: 1,
    height: 48,
    color: "#0F172A",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  switchLabel: {
    marginLeft: 12,
    fontSize: 14,
    color: "#64748B",
  },
  submitButton: {
    backgroundColor: "#0DCAF0",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0DCAF0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: "#94A3B8",
    shadowColor: "#94A3B8",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
})
