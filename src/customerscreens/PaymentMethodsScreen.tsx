"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList, Alert, Dimensions, StatusBar } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Icon } from "react-native-elements"
import { LinearGradient } from "expo-linear-gradient"

const { width } = Dimensions.get("window")

const PaymentMethodsScreen = ({ navigation }) => {
  // Dummy user data
  const user = { name: "John Doe" }

  // Dummy cards data
  const [cardsDetails, setCardsDetails] = useState([
    {
      id: "1",
      card_type: "Mastercard",
      last_four_digits: "4242",
      is_selected: 1,
      expiry_date: "05/25",
    },
    {
      id: "2",
      card_type: "Visa",
      last_four_digits: "1234",
      is_selected: 0,
      expiry_date: "12/24",
    },
    {
      id: "3",
      card_type: "Mastercard",
      last_four_digits: "8765",
      is_selected: 0,
      expiry_date: "09/26",
    },
  ])

  const [selectedCardId, setSelectedCardId] = useState("1") // Default to first card
  const [isLoading, setIsLoading] = useState(false)

  const mastercardIcon = require("../../assets/mastercard.png")
  const visaIcon = require("../../assets/visa-credit-card.png")

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
            setIsLoading(true)
            // Simulate API call delay
            setTimeout(() => {
              // Update local state
              const updatedCards = cardsDetails.filter((card) => card.id !== cardId)
              setCardsDetails(updatedCards)

              if (selectedCardId === cardId && updatedCards.length > 0) {
                // Select the first card if the selected card was deleted
                setSelectedCardId(updatedCards[0].id)
                // Update the selected status in the cards array
                updatedCards[0].is_selected = 1
              }

              setIsLoading(false)
            }, 500)
          },
        },
      ],
      { cancelable: false },
    )
  }

  // Function to handle card selection
  const handleCardSelect = (cardId) => {
    if (selectedCardId === cardId) {
      return
    }

    setIsLoading(true)
    // Simulate API call delay
    setTimeout(() => {
      // Update selected card in state
      setSelectedCardId(cardId)

      // Update is_selected status in cards array
      const updatedCards = cardsDetails.map((card) => ({
        ...card,
        is_selected: card.id === cardId ? 1 : 0,
      }))

      setCardsDetails(updatedCards)
      setIsLoading(false)
    }, 500)
  }

  const renderCardItem = ({ item }) => {
    const isSelected = item.id === selectedCardId
    const cardLogo = item.card_type === "Visa" ? visaIcon : mastercardIcon

    return (
      <View style={styles.cardItemContainer}>
        <TouchableOpacity
          style={[styles.cardItem, isSelected && styles.selectedCardItem]}
          onPress={() => handleCardSelect(item.id)}
          disabled={isLoading}
        >
          <View style={styles.cardItemContent}>
            <Image source={cardLogo} style={styles.cardLogo} />
            <View style={styles.cardDetails}>
              <Text style={styles.cardType}>{item.card_type}</Text>
              <Text style={styles.cardNumberText}>•••• •••• •••• {item.last_four_digits}</Text>
              <Text style={styles.expiryText}>Expires: {item.expiry_date}</Text>
            </View>
          </View>
          <View style={[styles.checkCircle, isSelected && styles.selectedCheckCircle]}>
            {isSelected && <Icon name="check" type="material" size={16} color="#FFFFFF" />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteCard(item.id)} disabled={isLoading}>
          <Icon name="delete-outline" type="material" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    )
  }

  const selectedPrimaryCard = cardsDetails.find((card) => card.id === selectedCardId)

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FBFD" />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" type="material" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Methods</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Primary Card */}
        {selectedPrimaryCard ? (
          <View style={styles.primaryCardContainer}>
            <LinearGradient
              colors={["#0DCAF0", "#0AA8CD"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryCard}
            >
              <View style={styles.cardChip}>
                <Icon name="credit-card-chip" type="material-community" size={30} color="#FFD700" />
              </View>

              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardLabel}>{selectedPrimaryCard.card_type}</Text>
                  <Text style={styles.cardNumber}>•••• •••• •••• {selectedPrimaryCard.last_four_digits}</Text>
                </View>
                <Image
                  source={selectedPrimaryCard.card_type === "Visa" ? visaIcon : mastercardIcon}
                  style={styles.cardBrandLogo}
                />
              </View>

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardHolderLabel}>CARD HOLDER</Text>
                  <Text style={styles.cardHolderName}>{user.name}</Text>
                </View>
                <View>
                  <Text style={styles.expiryLabel}>EXPIRES</Text>
                  <Text style={styles.expiryValue}>{selectedPrimaryCard.expiry_date}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.noCardContainer}>
            <Icon name="credit-card-off" type="material-community" size={60} color="#CBD5E1" />
            <Text style={styles.noCardText}>No primary card selected</Text>
            <Text style={styles.noCardSubtext}>Add a card to manage your payments</Text>
          </View>
        )}

        {/* Available Cards List */}
        <View style={styles.cardsListContainer}>
          <Text style={styles.sectionTitle}>Your Payment Cards</Text>

          {cardsDetails.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Icon name="credit-card-off" type="material-community" size={50} color="#CBD5E1" />
              <Text style={styles.emptyStateText}>No payment cards found</Text>
              <Text style={styles.emptyStateSubtext}>Add a card to get started</Text>
            </View>
          ) : (
            <FlatList
              data={cardsDetails}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderCardItem}
              style={styles.cardList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Add New Card Button */}
        <TouchableOpacity
          style={styles.addCardButton}
          onPress={() => navigation.navigate("AddPaymentMethodScreen")}
          disabled={isLoading}
        >
          <Icon name="add-circle-outline" type="material" size={20} color="#FFFFFF" />
          <Text style={styles.addCardButtonText}>Add New Card</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FBFD",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
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
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  primaryCardContainer: {
    marginBottom: 24,
  },
  primaryCard: {
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
  expiryLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    opacity: 0.8,
    marginBottom: 4,
    textAlign: "right",
  },
  expiryValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  noCardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noCardText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
    marginTop: 16,
    marginBottom: 8,
  },
  noCardSubtext: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  cardsListContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 16,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  cardList: {
    flex: 1,
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
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  selectedCardItem: {
    borderWidth: 2,
    borderColor: "#0DCAF0",
    shadowColor: "#0DCAF0",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardLogo: {
    width: 40,
    height: 25,
    resizeMode: "contain",
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
  },
  cardType: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0F172A",
    marginBottom: 4,
  },
  cardNumberText: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 2,
  },
  expiryText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedCheckCircle: {
    backgroundColor: "#0DCAF0",
    borderColor: "#0DCAF0",
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  addCardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0DCAF0",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: "#0DCAF0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addCardButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
})

export default PaymentMethodsScreen
