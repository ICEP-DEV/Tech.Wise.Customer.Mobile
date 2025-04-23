import React, { useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet, Pressable } from "react-native";
// import Icon from "react-native-vector-icons/Feather";
import { useSelector } from 'react-redux';
import { Rating } from 'react-native-ratings';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface CustomDrawerProps {
    isOpen: boolean;
    toggleDrawer: () => void;
    navigation: any;
}

const CustomDrawer: React.FC<CustomDrawerProps> = ({ isOpen, toggleDrawer, navigation }) => {
    const user = useSelector(state => state.auth.user);
    const drawerWidth = 280;
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
                    {
                        transform: [{ translateX: slideAnim }],
                    },
                ]}
            >
                <View style={styles.drawerContent}>
                    {/* Display customer's name and rating at the top */}
                    <View style={[styles.menuItem, styles.mainMenuItem]}>
                        {/* <Icon name="user" size={20} color="#666666" /> */}
                        <View>
                            <Text style={styles.mainText}>
                                {user ? `Hello, ${user.name}` : "Loading..."}
                            </Text>
                            <Text style={styles.ratingText}>
                                4.8 {/* Hardcoded dummy rating */}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Icon name="home" size={20} color="#666666" />
                        <Text style={styles.menuText}>Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('RequestScreen')}
                    >
                        <Icon name="car" size={20} color="#666666" />
                        <Text style={styles.menuText}>Ride with us!</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Icon name="account" size={20} color="#666666" />
                        <Text style={styles.menuText}>Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('TripHistory')}
                    >
                        <Icon name="navigation" size={20} color="#666666" />
                        <Text style={styles.menuText}>Trips</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('services')}
                    >
                        <Icon name="wrench" size={20} color="#666666" />
                        <Text style={styles.menuText}>Services</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('About')}
                    >
                        <Icon name="information" size={20} color="#666666" />
                        <Text style={styles.menuText}>About</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('Support')}
                    >
                        <Icon name="phone" size={20} color="#666666" />
                        <Text style={styles.menuText}>Support</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('LogoutPage')}
                    >
                        <Icon name="logout" size={20} color="#666666" />
                        <Text style={styles.menuText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 1,
    },
    overlayInner: {
        flex: 1,
    },
    drawer: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        width: 280,
        backgroundColor: '#fff',
        zIndex: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.58,
        shadowRadius: 16.00,

        elevation: 24,
    },
    drawerContent: {
        flex: 1,
        paddingTop: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    mainMenuItem: {
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        marginBottom: 10,
        marginTop: 10,
    },
    menuText: {
        fontSize: 16,
        marginLeft: 15,
        color: '#333',
    },
    mainText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    ratingText: {
        fontSize: 14,
        color: '#666',
    },
});

export default CustomDrawer;
