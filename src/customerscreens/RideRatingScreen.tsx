import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import axios from 'axios';

const RideRatingScreen = ({ route }) => {
  const { tripId, userId } = route.params;
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert('Please select a rating');
      return;
    }

    try {
      await axios.post('http://your-api-url.com/api/ride/rating', {
        tripId,
        userId,
        rating,
        feedback,
      });
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      Alert.alert('Submission failed');
    }
  };

  return (
    <View style={styles.container}>
      {submitted ? (
        <Text style={styles.thankYou}>Thank you for your feedback!</Text>
      ) : (
        <>
          <Text style={styles.title}>Rate Your Ride</Text>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Icon
                  name="star"
                  size={40}
                  color={star <= rating ? '#FFD700' : '#ccc'}
                  style={styles.star}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.textInput}
            placeholder="Leave feedback (optional)"
            value={feedback}
            onChangeText={setFeedback}
            multiline
          />

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default RideRatingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  star: {
    marginHorizontal: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#1976d2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  thankYou: {
    fontSize: 22,
    textAlign: 'center',
    color: 'green',
  },
});
