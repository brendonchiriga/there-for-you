import React, {Component} from 'react';
import * as Animatable from 'react-native-animatable';
import {AsyncStorage, Dimensions, LogBox, StatusBar} from 'react-native';
import {Container} from 'native-base';
import variables from './config/variables';
import Spinner from 'react-native-spinkit';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

export default class Splash extends Component {
  async componentDidMount() {
    var user = (await AsyncStorage.getItem('tfy_user')) || null;
    if (user == null) {
      setTimeout(() => {
        this.props.navigation.navigate('Login');
      }, 2500);
    } else {
      var decodedUser = JSON.parse(user);
      var role = decodedUser.role;
      if (role == 'therapist') {
        setTimeout(() => {
          this.props.navigation.navigate('UserApp');
        }, 2500);
      } else {
        setTimeout(() => {
          this.props.navigation.navigate('Landing');
        }, 2500);
      }
    }
  }

  render() {
    LogBox.ignoreAllLogs(true);
    return (
      <Container
        style={{
          backgroundColor: '#FFF',
          height: height,
          width: width,
          justifyContent: 'center',
        }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF"></StatusBar>

        <Animatable.View
          style={{
            alignSelf: 'center',
          }}
          animation="fadeIn"
          easing="ease-out"
          delay={300}
          duration={700}
          useNativeDriver={true}>
          <Spinner
            style={{marginTop: 10, alignSelf: 'center', marginBottom: 5}}
            isVisible={true}
            size={60}
            type="Wave"
            color={variables[0].bgcolor}
          />
        </Animatable.View>
      </Container>
    );
  }
}
