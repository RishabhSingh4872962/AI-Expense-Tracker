import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';

import HomeScreen        from './src/screens/HomeScreen';
import AddExpenseScreen  from './src/screens/AddExpenseScreen';
import ExpenseListScreen from './src/screens/ExpenseListScreen';
import AnalyticsScreen   from './src/screens/AnalyticsScreen';
import { COLORS }        from './src/constants';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.muted,
            tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 0,
              elevation: 10, shadowColor: '#000', shadowOpacity: 0.08,
              shadowRadius: 10, height: 60, paddingBottom: 8 },
            tabBarIcon: ({ color, size }) => {
              const icons: Record<string, string> = {
                Home: 'home', Add: 'add-circle', List: 'list', Analytics: 'bar-chart',
              };
              return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Home"      component={HomeScreen} />
          <Tab.Screen name="Add"       component={AddExpenseScreen} options={{ title: 'Add' }} />
          <Tab.Screen name="List"      component={ExpenseListScreen} />
          <Tab.Screen name="Analytics" component={AnalyticsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}