import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useSelector } from "react-redux";
import axios from "axios";
import { api } from '../../api';


const PaymentMethodsScreen = ({ navigation, route }) => {
  const user = useSelector((state) => state.auth.user);
  const [paystackBanks, setPaystackBanks] = useState([]);
  const [cardsDetails, setCardsDetails] = useState([]);
  const cardType = route.params?.cardType || 'Mastercard';
  const [selectedCardId, setSelectedCardId] = useState(null); // Initially null
  const mastercardIcon = require('../../assets/mastercard.png');
  const visaIcon = require('../../assets/visa-credit-card.png');

  // Fetch Paystack banks on component mount
  useEffect(() => {
    const fetchPaystackBanks = async () => {
      try {
        const response = await axios.get(api+'paystack-banks');
        setPaystackBanks(response.data);
      } catch (error) {
        console.error("Error fetching Paystack banks:", error);
        Alert.alert("Error", "Failed to load bank list. Check your server.");
      }
    };
    fetchPaystackBanks();
  }, []);

// Fetch recipients on component mount
useEffect(() => {
  const fetchRecipients = async () => {
    try {
      const response = await axios.get(api + 'recipient', {
        params: {
          user_id: user.user_id,
        },
      });

      const fetchedCards = response.data || []; // Ensure fetchedCards is an array
      console.log(fetchedCards);  // Log to ensure you're getting the expected data

      setCardsDetails(fetchedCards);

      // Find the default card where is_selected is 1
      const defaultCard = Array.isArray(fetchedCards) ? fetchedCards.find(card => card.is_selected === 1) : null;
      setSelectedCardId(defaultCard ? defaultCard.id : null);

    } catch (error) {
      console.error("Error fetching recipients:", error);
      Alert.alert("Error", "Failed to load recipient data.");
    }
  };

  fetchRecipients();
}, [user.user_id]);

  // New state for the withdrawal amount
  const [withdrawalAmount, setWithdrawalAmount] = useState('');

  const handleDeleteCard = (cardId) => {
    Alert.alert(
      "Delete Card",
      "Are you sure you want to delete this card?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => {
            const updatedCards = cardsDetails.filter((card) => card.id !== cardId);
            setCardsDetails(updatedCards);
            if (selectedCardId === cardId) {
              setSelectedCardId(updatedCards.length > 0 ? updatedCards[0].id : null);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Function to handle card selection
  const handleCardSelect = async (cardId) => {
    if (selectedCardId === cardId) {
      // If the card is already selected, we don't need to do anything
      return;
    }
  
    console.log(`Selecting card with ID: ${cardId}`);
  
    try {
      // Make API call to update the selected card in the backend
      const response = await axios.put(`http://10.0.2.2:3000/api/recipients/${cardId}/select`, {
        user_id: user.user_id,  // Pass the user ID as part of the request
      });
  
      if (response.status === 200) {
        // Successfully updated, now update the state
        setSelectedCardId(cardId);
      } else {
        Alert.alert("Error", "Failed to select the card.");
      }
    } catch (error) {
      console.error("Error selecting card:", error, "for user id " + user.user_id);
      Alert.alert("Error", "Failed to select the card. Please try again.");
    }
  };
  
  

  const renderCardItem = ({ item }) => {
    const isSelected = item.id === selectedCardId; // Check if this card is selected
    const cardLogo = item.cardType === 'Mastercard' ? mastercardIcon : visaIcon;
  
    return (
      <View style={styles.cardItemContainer}>
        <TouchableOpacity
          style={[styles.cardItem, isSelected ? styles.selectedCardItem : null]}
          onPress={() => handleCardSelect(item.id, item.is_selected)}  // Only update if is_selected is 1
        >
          <Image source={cardLogo} style={styles.cardLogo} />
          <View style={styles.cardDetails}>
            <Text style={styles.cardType}>{cardType}</Text>
            <Text style={styles.cardNumber}>
              {"•••• •••• •••• " + item.last_four_digits}
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={24} color={isSelected ? "#007BFF" : "#ccc"} />
        </TouchableOpacity>
  
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCard(item.id)}
        >
          <Ionicons name="trash-bin" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    );
  };
  
  const selectedPrimaryCard = cardsDetails.find((card) => card.id === selectedCardId);

  // const handleWithdraw = () => {
  //   if (!withdrawalAmount) {
  //     Alert.alert("Error", "Please enter an amount to withdraw.");
  //     return;
  //   }
  
  //   const amount = parseFloat(withdrawalAmount);
  //   if (isNaN(amount) || amount <= 0) {
  //     Alert.alert("Error", "Please enter a valid amount to withdraw.");
  //     return;
  //   }
  
  //   Alert.alert(
  //     "Confirm Withdrawal",
  //     `Are you sure you want to withdraw R${amount.toFixed(2)}?`,
  //     [
  //       { text: "Cancel", style: "cancel" },
  //       {
  //         text: "Withdraw",
  //         onPress: async () => {
  //           try {
  //             console.log(`Simulating withdrawal of R${amount.toFixed(2)}`);
  
  //             // Simulating a dummy response instead of an actual API call
  //             const dummyResponse = {
  //               status: "success",
  //               message: `Withdrawal of R${amount.toFixed(2)} processed successfully.`,
  //               transaction_id: "DUMMY12345",
  //             };
  
  //             console.log("Dummy Withdrawal Response:", dummyResponse);
  //             Alert.alert("Success", dummyResponse.message);
  
  //             setWithdrawalAmount("");
  
  //             // Pass the amount to the Wallet screen
  //             navigation.replace("Wallet", { amount });
  
  //           } catch (error) {
  //             console.error("Withdrawal Error:", error);
  //             Alert.alert("Error", "Failed to process withdrawal. Please try again.");
  //           }
  //         },
  //       },
  //     ],
  //     { cancelable: false }
  //   );
  // };
  
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color="#000" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Withdrawal Methods</Text>
        </View>

        {/* Primary Card */}
        {selectedPrimaryCard && (
          <View style={styles.primaryCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardLabel}>{selectedPrimaryCard.cardType || cardType}</Text>
                <Text style={styles.cardNumber}>
                  {"•••• •••• •••• " + selectedPrimaryCard.last_four_digits}
                </Text>
                <Text style={styles.cardNumber}>{user.name}</Text>
              </View>
              <Text style={styles.cardAmount}>R3,500.00</Text>
            </View>
          </View>
        )}

        {/* Withdrawal Input */}
        {/* <View style={styles.withdrawalContainer}>
          <Text style={styles.withdrawalLabel}>Enter Amount to Withdraw:</Text>
          <TextInput
            style={styles.withdrawalInput}
            keyboardType="number-pad"
            placeholder="e.g., 100"
            value={withdrawalAmount}
            onChangeText={setWithdrawalAmount}
          />
          <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View> */}

        {/* Available Cards List */}
        <Text style={styles.sectionTitle}>Available Cards</Text>

        {cardsDetails.length === 0 ? (
          <Text style={styles.noCardsMessage}>You have no cards linked. Please add a card to withdraw funds.</Text>
        ) : (
          <FlatList
          data={cardsDetails}
          keyExtractor={(item) => (item.id ? item.id.toString() : item.last_four_digits.toString())} 
          renderItem={renderCardItem}
          style={styles.cardList}
        />
        

        )}

        {/* Add New Card Button */}
        <TouchableOpacity style={styles.addCardButton} onPress={() => navigation.navigate('AddPaymentMethodScreen')}>
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.addCardButtonText}>Add New Card</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default PaymentMethodsScreen;



const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F9F9F9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  primaryCard: {
    backgroundColor: "#282828",
    padding: 20, paddingTop: 50, paddingBottom: 50,
    borderRadius: 12,
    marginTop: 20,
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
    marginTop: 20,
    marginBottom: 12,
  },
  cardList: {
    marginBottom: 20,
  },
  cardItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  selectedCardItem: {
    borderColor: "#007BFF",
    borderWidth: 2,
  },
  cardLogo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
  },
  cardType: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  cardNumber: {
    fontSize: 14,
    color: "#666",
  },
  deleteButton: {
    padding: 10,
    marginLeft: 8,
  },
  addCardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007BFF",
    padding: 16,
    borderRadius: 10,
  },
  addCardButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  withdrawalContainer: {
    marginTop: 20,
    marginBottom: 20,
    // padding: 8,

  },
  withdrawalLabel: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  withdrawalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
  },
  withdrawButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  withdrawButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  noCardsMessage: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginVertical: 20,
  },
});
