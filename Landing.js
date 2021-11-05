import React, {Component} from 'react';
import * as Animatable from 'react-native-animatable';
import {
  TouchableOpacity,
  Dimensions,
  LogBox,
  StatusBar,
  Text,
  BackHandler,
} from 'react-native';
import {Body, Card, CardItem, Container, Left, Icon} from 'native-base';
import {SliderBox} from 'react-native-image-slider-box';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import variables from './config/variables';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

export default class Landing extends Component {
  constructor(props) {
    super(props);
    this.state = {
      position: 1,
      interval: null,
      images: [
        require('./assets/6.jpg'),
        require('./assets/9.jpg'),
        require('./assets/2.jpg'),
        require('./assets/8.jpg'),
        require('./assets/5.jpg'),
      ],
    };
  }

  UNSAFE_componentWillMount() {
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }

  UNSAFE_componentWillUnmount() {
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }

  handleBackButtonClick = () => {
    BackHandler.exitApp();
    return true;
  };

  render() {
    LogBox.ignoreAllLogs(true);
    return (
      <Container
        style={{
          backgroundColor: '#FFF',
          height: height,
          width: width,
        }}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFF"
          hidden></StatusBar>

        <SliderBox
          images={this.state.images}
          sliderBoxHeight={height * 0.75}
          autoplay
          circleLoop
          resizeMethod={'resize'}
          resizeMode={'stretch'}
          dotColor={variables[0].bgcolor}
          imageLoadingColor="#000"
          ImageComponentStyle={{
            borderBottomRightRadius: 35,
            elevation: 2,
          }}
        />
        <TouchableOpacity onPress={() => this.props.navigation.push('UserApp')}>
          <CardItem
            style={{
              borderColor: variables[0].bgcolor,
              borderWidth: 0.5,
              borderRadius: 15,
              marginTop: 40,
              marginLeft: 20,
              marginRight: 20,
            }}>
            <Left>
              <Icon
                name="ios-chatbubbles-outline"
                size={width * 0.1}
                style={{
                  color: variables[0].bgcolor,
                }}
              />
              <Body>
                <Text
                  style={{
                    width: widthPercentageToDP('75%'),
                    marginLeft: widthPercentageToDP('2%'),
                    fontFamily: variables[0].boldfont,
                    color: variables[0].bgcolor,
                    fontSize: widthPercentageToDP('5%'),
                  }}>
                  Chat To Therapist
                </Text>
                <Text
                  style={{
                    width: widthPercentageToDP('75%'),
                    marginLeft: widthPercentageToDP('2%'),
                    marginTop: 3,
                    fontFamily: variables[0].lightfont,
                    color: variables[0].bgcolor,
                    fontSize: widthPercentageToDP('3.6%'),
                  }}>
                  Continue to home screen
                </Text>
              </Body>
            </Left>
          </CardItem>
        </TouchableOpacity>
      </Container>
    );
  }
}
