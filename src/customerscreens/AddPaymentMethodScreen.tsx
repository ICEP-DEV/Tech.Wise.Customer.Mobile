import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useSelector } from "react-redux";
import axios from 'axios'; // Import axios
import { Platform } from 'react-native';  // Import Platform
import { Picker } from "@react-native-picker/picker";
import { api } from '../../api';


export default function PaymentMethod({ navigation }) {
  const [saveCard, setSaveCard] = useState(true);
  const user = useSelector((state) => state.auth.user);
  const mastercardIcon = require('../../assets/mastercard.png');
  const visaIcon = require('../../assets/visa-credit-card.png');
  const [cardType, setCardType] = useState("Mastercard"); // Default to Mastercard
  const user_id = user.user_id;
  // console.log('user -------', user_id);
  
  // State variables to store input values
  const [nameOnCard, setNameOnCard] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [cardNumber, setCardNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [countryCode, setCountryCode] = useState('ZA'); // Default value is ZA
  const [paystackBanks, setPaystackBanks] = useState([]);


  // Determine which icon to show
  const cardIcon = cardType === "Visa" ? visaIcon : mastercardIcon;
  // Fetch Paystack banks on component mount
  useEffect(() => {
    const fetchPaystackBanks = async () => {
      try {
        const response = await axios.get(
          api+'paystack-banks',  // Call your server endpoint
        );
        setPaystackBanks(response.data);
      } catch (error) {
        console.error("Error fetching Paystack banks:", error);
        Alert.alert("Error", "Failed to load bank list.  Check your server.");
      }
    };

    fetchPaystackBanks();
  }, []);

  // Function to handle bank code selection
  const handleSubmit = async () => {
    // Basic validation
    if (!nameOnCard || !email || !cardNumber || !bankCode || !countryCode) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }


    const payload = {
      nameOnCard,
      email,
      account_number: cardNumber,
      bank_code: bankCode,
      first_name: nameOnCard.split(" ")[0],
      user_id: user_id,
      country_code: countryCode,
    };

    try {
      const response = await axios.post(
        api+'create-recipient', // Replace with your actual endpoint URL
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        Alert.alert("Success", "Withdrawal method added successfully!");
        navigation.navigate("PaymentMethodsScreen",{
          cardType:cardType
        }
        ); // Navigate on success
      } else {
        Alert.alert("Error", "Failed to add Withdrawal method.  Check your endpoint.");
      }
    } catch (error) {
      console.error("Error adding Withdrawal method:", error);
      Alert.alert("Account number is invalid", "An error occurred while adding the payment method.");
    }
  };

  return (
    <ScrollView>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft color="#000" size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Withdrawal Method</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardLabel}>{cardType}</Text>
              <Text style={styles.cardNumber}>{user.name}</Text>
            </View>
            <Text style={styles.cardAmount}>3,500.00</Text>
          </View>
          <Text style={styles.cardExpiry}>
            •••• •••• •••• {cardNumber.slice(-4)}
          </Text>

        </View>

        <Text style={styles.sectionTitle}>Card Details</Text>

        <Text style={styles.label}>Select Card Type</Text>
        <Picker
          selectedValue={cardType}
          style={styles.input}
          onValueChange={(value) => setCardType(value)}
        >
          <Picker.Item label="Mastercard" value="Mastercard" />
          <Picker.Item label="Visa" value="Visa" />
        </Picker>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name on Card</Text>
          <TextInput
            style={styles.input}
            value={nameOnCard}
            onChangeText={setNameOnCard}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Card Number</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.flexInput]}
              placeholder="e.g., 4580 5644 3524 4543"
              keyboardType="number-pad"
              value={cardNumber}
              onChangeText={setCardNumber}
            />
            <Image
              source={cardIcon}
              style={styles.cardIcon}
            />
          </View>
        </View>

        <View style={styles.row}>
          {Platform.OS === 'android' ? (
            <View style={styles.inputGroupHalf}>
              <Text style={styles.label}>Select Bank</Text>
              <Picker
                selectedValue={bankCode}
                style={styles.input}
                onValueChange={(itemValue) => setBankCode(itemValue)}
              >
                <Picker.Item label="Select a bank" value="" />
                {paystackBanks.map((bank) => (
                  <Picker.Item key={bank.code} label={bank.name} value={bank.code} />
                ))}
              </Picker>
            </View>
          ) : (
            <View style={styles.inputGroupHalf}>
              <Text style={styles.label}>Bank Code</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 1234"
                keyboardType="number-pad"
                value={bankCode}
                onChangeText={setBankCode}
              />
            </View>
          )}
          <View style={styles.inputGroupHalf}>
            <Text style={styles.label}>Country Code</Text>
            <TextInput
              style={styles.input}
              value={countryCode}
              onChangeText={setCountryCode}
            />
          </View>
        </View>

        <View style={styles.switchRow}>
          <Switch value={saveCard} onValueChange={setSaveCard} />
          <Text style={styles.switchLabel}>Save this card details</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, !saveCard && { opacity: 0.5 }]}  // Reduce opacity if saveCard is false
          onPress={handleSubmit}
          disabled={!saveCard}  // Disable the button if saveCard is false
        >
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>

      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9", padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  card: {
    backgroundColor: "#282828",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardLabel: {
    color: "#ddd",
    fontSize: 16,
    marginBottom: 4,
  },
  cardNumber: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "monospace",
  },
  cardAmount: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  cardExpiry: {
    color: "#ddd",
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  inputGroup: { marginBottom: 15 },
  inputGroupHalf: { flex: 1 },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  flexInput: { flex: 1, padding: 12, fontSize: 16 },
  cardIcon: { width: 24, height: 24, marginRight: 10 },
  switchRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  switchLabel: { marginLeft: 10, fontSize: 14, color: "#333" },
  button: {
    backgroundColor: "#007BFF",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  backButton: {
    padding: 8,
  },
});
