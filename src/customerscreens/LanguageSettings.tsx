import React, { useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const LanguageSettings = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const languages = [
    { name: 'English', code: 'en' },
    { name: 'French', code: 'fr' },
    { name: 'Spanish', code: 'es' },
    { name: 'German', code: 'de' },
    { name: 'Chinese', code: 'zh' },
  ];

  const selectLanguage = (language) => {
    setSelectedLanguage(language);
    console.log(`Selected language: ${language}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Language Settings</Text>

        <View>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              onPress={() => selectLanguage(language.name)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 15,
                marginBottom: 10,
                backgroundColor: '#fff',
                borderRadius: 10,
                borderWidth: selectedLanguage === language.name ? 2 : 1,
                borderColor: selectedLanguage === language.name ? '#008B8B' : '#ddd',
              }}
            >
              <Icon
                name={selectedLanguage === language.name ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={24}
                color={selectedLanguage === language.name ? '#008B8B' : '#757575'}
                style={{ marginRight: 15 }}
              />
              <Text style={{ fontSize: 18, color: '#333' }}>{language.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LanguageSettings;
