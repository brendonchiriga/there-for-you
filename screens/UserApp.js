import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import Home from './Home';
import Schedule from './Schedule';
import Chat from './Chat';
import CreateSchedule from './CreateSchedule';
import UserDetails from './UserDetails';

import {Icon} from 'native-base';
import {View, Platform} from 'react-native';
import variables from '../config/variables';
import Spinner from 'react-native-spinkit';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function App() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={TopAppNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Chat"
        component={Chat}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Schedule"
        component={Schedule}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="CreateSchedule"
        component={CreateSchedule}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="UserDetails"
        component={UserDetails}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
}

function TopAppNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      lazy={false}
      swipeEnabled={false}
      tabBarOptions={{
        showLabel: false,
        showIcon: true,
        indicatorStyle: {backgroundColor: '#FFF'},
        style: {
          backgroundColor: variables[0].bgcolor,
          height: Platform.OS == 'ios' ? hp('10%') : hp('8%'),
        },
        inactiveTintColor: '#FFF',
        activeTintColor: '#eb8a4d',
      }}>
      <Tab.Screen
        name="Schedule"
        component={Schedule}
        options={{
          tabBarLabel: 'Schedule',
          tabBarIcon: ({focused, color}) => (
            <View>
              {focused ? (
                <View>
                  <Icon
                    name="ios-calendar-outline"
                    style={{color: '#FFF', fontSize: wp('6.5%')}}></Icon>
                  <Spinner
                    style={{
                      alignSelf: 'center',
                      marginTop: 1,
                    }}
                    isVisible={true}
                    size={15}
                    type="ThreeBounce"
                    color={'#FFF'}
                  />
                </View>
              ) : (
                <Icon
                  name="ios-calendar-outline"
                  style={{color: '#FFF', fontSize: wp('8%')}}></Icon>
              )}
            </View>
          ),
        }}></Tab.Screen>

      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({focused, color}) => (
            <View>
              {focused ? (
                <View>
                  <Icon
                    name="home-outline"
                    style={{color: '#FFF', fontSize: wp('6.5%')}}></Icon>
                  <Spinner
                    style={{
                      alignSelf: 'center',
                      marginTop: 1,
                    }}
                    isVisible={true}
                    size={15}
                    type="ThreeBounce"
                    color={'#FFF'}
                  />
                </View>
              ) : (
                <Icon
                  name="home-outline"
                  style={{color: '#FFF', fontSize: wp('8%')}}></Icon>
              )}
            </View>
          ),
        }}></Tab.Screen>

      <Tab.Screen
        name="UserDetails"
        component={UserDetails}
        options={{
          tabBarLabel: 'UserDetails',
          tabBarIcon: ({focused, color}) => (
            <View>
              {focused ? (
                <View>
                  <Icon
                    name="ios-person-circle-outline"
                    style={{color: '#FFF', fontSize: wp('6.5%')}}></Icon>
                  <Spinner
                    style={{
                      alignSelf: 'center',
                      marginTop: 1,
                    }}
                    isVisible={true}
                    size={15}
                    type="ThreeBounce"
                    color={'#FFF'}
                  />
                </View>
              ) : (
                <Icon
                  name="ios-person-circle-outline"
                  style={{color: '#FFF', fontSize: wp('8%')}}></Icon>
              )}
            </View>
          ),
        }}></Tab.Screen>
    </Tab.Navigator>
  );
}

export default App;
