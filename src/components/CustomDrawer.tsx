import React, { useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet, Pressable, Image } from "react-native";
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ACCENT = "#0DCAF0"; // Use your brand color here
const BG_GRADIENT = ["#f6fafd", "#e3f0fc"]; // Soft gradient background

const CustomDrawer = ({ isOpen, toggleDrawer, navigation }) => {
  const user = useSelector(state => state.auth.user);
  const drawerWidth = 300;
  const slideAnim = React.useRef(new Animated.Value(-drawerWidth)).current;

  const animateDrawer = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: isOpen ? 0 : -drawerWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen, slideAnim]);

  useEffect(() => {
    animateDrawer();
  }, [isOpen, animateDrawer]);

  return (
    <>
      {isOpen && (
        <Pressable style={styles.overlay} onPress={toggleDrawer}>
          <View style={styles.overlayInner} />
        </Pressable>
      )}
      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        <View style={styles.drawerContent}>
          {/* User Section */}
          <View style={styles.profileSection}>
            {/* <View style={styles.avatarWrapper}>
              <Image
                source={user?.profile_picture ? { uri: user.profile_picture } : require('../../assets/blankProfilePic.jpg')}
                style={styles.avatar}
              />
            </View> */}
            <View style={{ marginLeft: 16 }}>
              <Text style={styles.greeting}>
                {user ? `Hello, ${user.name.split(' ')[0]}` : "Loading..."}
              </Text>
              <View style={styles.ratingRow}>
                <Icon name="star" size={16} color={ACCENT} />
                <Text style={styles.ratingText}>4.8</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.sectionDivider} />

          {/* Menu Items */}
          <View style={styles.menuList}>
            <DrawerItem icon="home" label="Home" onPress={() => navigation.navigate('Home')} />
            <DrawerItem icon="car" label="Ride with us!" onPress={() => navigation.navigate('RequestScreen')} />
            <DrawerItem icon="account" label="Profile" onPress={() => navigation.navigate('Profile')} />
            <DrawerItem icon="navigation" label="Trips" onPress={() => navigation.navigate('TripHistory')} />
            <DrawerItem icon="wrench" label="Services" onPress={() => navigation.navigate('services')} />
            <DrawerItem icon="information" label="About" onPress={() => navigation.navigate('About')} />
            <DrawerItem icon="phone" label="Support" onPress={() => navigation.navigate('Support')} />
          </View>

          {/* Divider */}
          <View style={styles.sectionDivider} />

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => navigation.navigate('LogoutPage')}
          >
            <Icon name="logout" size={20} color={ACCENT} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
};

const DrawerItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Icon name={icon} size={22} color="#333" style={styles.menuIcon} />
    <Text style={styles.menuText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
  },
  overlayInner: { flex: 1 },
  drawer: {
    position: "absolute",
    top: 0, bottom: 0, left: 0,
    width: 300,
    backgroundColor: '#f6fafd',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 24,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 36,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    backgroundColor: '#e3f0fc',
    borderRadius: 40,
    padding: 3,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#cfd8dc',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 15,
    color: ACCENT,
    marginLeft: 5,
    fontWeight: '600',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#e0e5ec',
    marginVertical: 10,
    borderRadius: 1,
  },
  menuList: {
    flexGrow: 1,
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginBottom: 2,
    backgroundColor: 'transparent',
  },
  menuIcon: {
    width: 28,
    textAlign: 'center',
  },
  menuText: {
    fontSize: 17,
    marginLeft: 18,
    color: '#222',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#e3f0fc',
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 18,
    color: ACCENT,
    fontWeight: '700',
  },
});

export default CustomDrawer;
