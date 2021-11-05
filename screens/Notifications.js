import React, {Component} from 'react';
import * as Animatable from 'react-native-animatable';
import {
  AsyncStorage,
  BackHandler,
  Dimensions,
  LogBox,
  StatusBar,
  Text,
  ToastAndroid,
  TouchableOpacity,
} from 'react-native';
import {Body, Container, Content, Header, Icon, Right} from 'native-base';
import variables from '../config/variables';
import Spinner from 'react-native-spinkit';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

export default class Notifications extends Component {
  constructor(props) {
    super(props);
    this.state = {
      notifications: [],
      userrole: '',
      username: '',
      useremail: '',
    };
  }

  componentWillMount() {
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }

  componentWillUnmount() {
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }

  handleBackButtonClick = () => {
    //this.props.navigation.pop();
    return true;
  };

  componentDidMount() {
    this.onGetUserDetails();
    this.onGetNotifications();
  }

  onGetUserDetails = async () => {
    var user = (await AsyncStorage.getItem('tfy_user')) || null;
    if (user == null) {
    } else {
      var decodedUser = JSON.parse(user);
      var role = decodedUser.role;
      if (role == 'therapist') {
        this.setState({
          userrole: 'therapist',
          username: decodedUser.name,
          useremail: decodedUser.email,
        });
      } else {
        this.setState({
          userrole: 'user',
          username: decodedUser.name,
          useremail: decodedUser.email,
        });
      }
    }
  };

  onGetNotifications = async => {
    var correcteduseremail = this.state.useremail.split('@')[0].includes('.')
      ? this.state.useremail.split('@')[0].split('.').join('')
      : this.state.useremail.split('@')[0];

    try {
      var allnotifications = [];
      database()
        .ref('/notifications/' + correcteduseremail)
        .on('value', snapshot => {
          if (snapshot.exists()) {
            snapshot.forEach(function async(childSnapshot) {
              var childData = childSnapshot.val();
              if (childData != null) {
                allnotifications.push(childData);
              }
            });

            this.setState({
              notifications: allnotifications,
            });
          }
        });
      this.setState({
        isloading: false,
      });
    } catch (e) {
      this.setState({
        isloading: false,
      });
    }
  };

  onDeleteNotifications = () => {
    if (this.state.notifications == 0) {
      ToastAndroid.showWithGravityAndOffset(
        'You currently have no notifications',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        5,
        25,
      );
    } else {
    }
  };

  render() {
    LogBox.ignoreAllLogs(true);
    return (
      <Container
        style={{
          backgroundColor: '#EEE',
          height: height,
          width: width,
          justifyContent: 'center',
        }}>
        <Header style={{elevation: 1, backgroundColor: '#FFF'}}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={'#FFF'}></StatusBar>
          <Body
            style={{marginLeft: Platform.OS == 'ios' ? wp('20%') : wp('5%')}}>
            <Text
              style={{
                width: wp('70%'),
                fontFamily: variables[0].boldfont,
                color: variables[0].bgcolor,
                fontSize: wp('4.5%'),
              }}>
              Notifications
            </Text>
            <Text
              style={{
                width: wp('70%'),
                fontFamily: variables[0].lightfont,
                color: variables[0].bgcolor,
                fontSize: wp('2.8%'),
                marginTop: 3,
              }}>
              {new Date().toDateString()}
            </Text>
          </Body>
          <Right style={{marginRight: wp('2%')}}>
            <TouchableOpacity
              style={{
                height: wp('10%'),
                width: wp('10%'),
                justifyContent: 'center',
              }}
              onPress={() => this.onDeleteNotifications()}>
              <Icon
                name="ios-trash-outline"
                style={{
                  fontSize: hp('3.5%'),
                  color: variables[0].bgcolor,
                  alignSelf: 'center',
                }}></Icon>
            </TouchableOpacity>
          </Right>
        </Header>
        {this.state.isloading ? (
          <Content
            contentContainerStyle={{
              justifyContent: 'center',
              height: hp('80%'),
            }}>
            <ActivityIndicator size="large" color={variables[0].bgcolor} />
          </Content>
        ) : this.state.notifications.length == 0 ? (
          <Content
            contentContainerStyle={{
              justifyContent: 'center',
              height: hp('80%'),
              alignItems: 'center',
            }}>
            <Icon
              name="notifications-outline"
              style={{color: variables[0].bgcolor, fontSize: wp('10%')}}></Icon>
            <Text
              style={{
                marginTop: 10,
                fontFamily: variables[0].mainfont,
                color: variables[0].bgcolor,
                fontSize: wp('4%'),
              }}>
              No Notifications Received
            </Text>
            <Text
              style={{
                marginTop: 5,
                fontFamily: variables[0].italicfont,
                color: variables[0].bgcolor,
                fontSize: wp('2.5%'),
              }}>
              Notifications will appear here when you receive them
            </Text>
          </Content>
        ) : (
          <Content>
            <FlatList
              scrollEnabled={true}
              style={{marginTop: hp('1%'), marginBottom: hp('1%')}}
              data={this.state.notifications}
              keyExtractor={(item, index) =>
                'notification_list_' + item.name + index
              }
              renderItem={({item}) => this.renderRowView(item)}
            />
          </Content>
        )}
      </Container>
    );
  }
}
