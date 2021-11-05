import React from 'react';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import * as Animatable from 'react-native-animatable';

import {
  Dimensions,
  StatusBar,
  TouchableOpacity,
  View,
  AsyncStorage,
  LogBox,
  Text,
  Platform,
  ActivityIndicator,
  FlatList,
  BackHandler,
  ToastAndroid,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import {
  Container,
  Header,
  Left,
  Body,
  Right,
  Icon,
  Content,
  Col,
  ListItem,
  Row,
  Button,
} from 'native-base';
import DateTimePicker from '@react-native-community/datetimepicker';
import Communications from 'react-native-communications';
import database from '@react-native-firebase/database';
import variables from '../config/variables';
import {PERMISSIONS, RESULTS} from 'react-native-permissions';
import GetLocation from 'react-native-get-location';
const width = Dimensions.get('window').width;

export default class Home extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      date: new Date(),
      mode: 'date',
      username: '',
      useremail: '',
      userrole: '',
      headertitle: '',
      headersubtitle: '',
      selecteddate: '',
      selectedtime: '',
      selectedmode: '',
      selecteduserinfo: {},
      chats: [],
      therapists: [],
      therapist: {},
      isshowdatetime: false,
      logoutvisible: false,
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
    //this.props.navigation.pop();
    return true;
  };

  componentDidMount() {
    this.onGetUserDetails();
    this.onGetLocalChat();
  }

  openInMap = async location => {
    try {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          var url =
            Platform.OS == 'ios'
              ? 'http://maps.apple.com/maps?api=1&daddr=' +
                location.lat +
                ',' +
                location.lon +
                '&layer=t'
              : 'http://maps.google.com/maps?api=1&daddr=' +
                location.lat +
                ',' +
                location.lon +
                '&layer=t';
          Linking.openURL(url).catch(err =>
            console.error('An error occurred', err),
          );
        } else {
          ToastAndroid.showWithGravityAndOffset(
            'Failed to get permission settings',
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
            5,
            25,
          );
        }
      } catch (err) {
        ToastAndroid.showWithGravityAndOffset(
          'Failed to get permission settings',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          5,
          25,
        );
        console.warn(err);
      }
    } catch (e) {}
  };

  onGetUserDetails = async () => {
    //break before getting user details
    var user = (await AsyncStorage.getItem('tfy_user')) || null;
    if (user == null) {
    } else {
      var decodedUser = JSON.parse(user);
      var role = decodedUser.role;
      if (role == 'therapist') {
        this.setState({
          therapist: decodedUser,
          username: decodedUser.name,
          useremail: decodedUser.email,
          userrole: 'therapist',
          headertitle: 'Welcome ' + decodedUser.name,
          headersubtitle: 'Date Logged In: ' + new Date().toDateString(),
        });
        this.onGetLocalChat();
        //this.onGetChats();
      } else {
        this.setState({
          username: decodedUser.name,
          useremail: decodedUser.email,
          userrole: 'user',
          headertitle: 'Welcome ' + decodedUser.name,
          headersubtitle: 'Date Logged In: ' + new Date().toDateString(),
        });
        this.onGetLocalTherapists();
        //this.onGetTherapists();
      }
    }
  };

  onGetLocalTherapists = async () => {
    this.setState({
      isloading: true,
    });
    var data = (await AsyncStorage.getItem('tfy_saved_therapists')) || null;
    if (data == null) {
      this.onGetTherapists();
      this.setState({
        isloading: false,
      });
    } else {
      var datausers = JSON.parse(data);
      if (datausers.email == this.state.useremail) {
        this.setState({
          isloading: false,
          therapists: datausers.body,
        });
        this.onGetTherapists();
      } else {
        this.onGetTherapists();
      }
    }
  };

  onGetLocalChat = async () => {
    this.setState({
      isloading: true,
    });
    var data = (await AsyncStorage.getItem('tfy_saved_chats')) || null;
    if (data == null) {
      this.onGetChats();
      this.setState({
        isloading: false,
      });
    } else {
      var chats = JSON.parse(data);
      if (chats.email == this.state.useremail) {
        this.setState({
          isloading: false,
          chats: chats.body,
        });
        this.onGetChats();
      } else {
        this.onGetChats();
      }
    }
  };

  onGetChats = async () => {
    try {
      var correcteduseremail = this.state.useremail.split('@')[0].includes('.')
        ? this.state.useremail.split('@')[0].split('.').join('')
        : this.state.useremail.split('@')[0];
      database()
        .ref('/chat/')
        .on('value', async snapshot => {
          if (snapshot.exists()) {
            var allchats = [];

            snapshot.forEach(function (childSnapshot) {
              var key = childSnapshot.key;
              if (key.split('_')[1] == correcteduseremail) {
                var childData = childSnapshot.val();
                var prevchats = [];
                childSnapshot.forEach(function (smallchildSnapshot) {
                  if (childData != null) {
                    prevchats.sort((a, b) => b.date - a.date);
                    prevchats.push(smallchildSnapshot.val());
                  }
                });
                if (childData != null) {
                  var set = {
                    name: childSnapshot.key.split('_')[0],
                    lastmessage: prevchats[0].text,
                    lastdate: new Date(prevchats[0].date).toDateString(),
                    useremail: prevchats[0].user._id,
                  };
                  allchats.push(set);
                }
              }
            }),
              await AsyncStorage.setItem(
                'tfy_saved_chats',
                JSON.stringify({email: this.state.useremail, body: allchats}),
              );
            this.setState({
              isloading: false,
              chats: allchats,
            });
          } else {
            this.setState({
              isloading: false,
            });
            this.onGetLocalChat();
          }
        });
    } catch (e) {
      this.setState({
        isloading: false,
      });
      this.onGetLocalChat();
    }
  };

  onGetTherapists = async () => {
    try {
      database()
        .ref('/users/')
        .on('value', async snapshot => {
          if (snapshot.exists()) {
            var datausers = [];
            snapshot.forEach(function (childSnapshot) {
              var childData = childSnapshot.val();
              if (childData != null) {
                if (childData.role == 'therapist') {
                  var set = {};
                  if (childData.location != null) {
                    set = {
                      name: childData.name,
                      email: childData.email,
                      phone: childData.phone,
                      location: childData.location,
                      password: childData.password,
                      role: childData.role,
                      loggedin: 'yes',
                    };
                  } else {
                    set = {
                      name: childData.name,
                      email: childData.email,
                      phone: childData.phone,
                      password: childData.password,
                      role: childData.role,
                      loggedin: 'yes',
                    };
                  }
                  datausers.push(set);
                }
              }
            });
            await AsyncStorage.setItem(
              'tfy_saved_therapists',
              JSON.stringify({email: this.state.useremail, body: datausers}),
            );
            this.setState({
              isloading: false,
              therapists: datausers,
            });
          }
        });
    } catch (e) {
      this.setState({
        isloading: false,
      });
      this.onGetLocalTherapists();
    }
  };

  onSelectTherapist = async therapist => {
    await AsyncStorage.setItem(
      'tfy_selected_therapist',
      JSON.stringify(therapist),
    );
    this.props.navigation.push('Chat');
  };

  onSelectChat = async chat => {
    await AsyncStorage.setItem(
      'tfy_selected_therapist',
      JSON.stringify(this.state.therapist),
    );
    await AsyncStorage.setItem('tfy_selected_user', chat.name);
    this.props.navigation.push('Chat');
  };

  onGetUserLocation = async () => {
    try {
      await GetLocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      })
        .then(location => {
          this.setState({usercoordinates: location});

          var correctedemail = this.state.useremail.split('@')[0].includes('.')
            ? this.state.useremail.split('@')[0].split('.').join('')
            : this.state.useremail.split('@')[0];

          database()
            .ref('/users/' + correctedemail)
            .update({
              location: {lat: location.latitude, lon: location.longitude},
            })
            .then(() =>
              ToastAndroid.showWithGravityAndOffset(
                'Current location has been set',
                ToastAndroid.SHORT,
                ToastAndroid.CENTER,
                5,
                25,
              ),
            );
        })
        .catch(error => {
          ToastAndroid.showWithGravityAndOffset(
            'Failed to get your current location',
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
            5,
            25,
          );
          const {code, message} = error;
          console.warn(code, message);
        });
    } catch (error) {
      const {code, message} = error;
      console.warn(code, message);
      ToastAndroid.showWithGravityAndOffset(
        'Failed to get your current location',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        5,
        25,
      );
    }
  };

  onGetLocation = async () => {
    if (Platform.OS == 'ios') {
      try {
        check(PERMISSIONS.IOS.LOCATION_ALWAYS).then(async result => {
          if (result == RESULTS.GRANTED) {
            await this.onGetUserLocation();
          } else {
            ToastAndroid.showWithGravityAndOffset(
              'Failed to get permission settings',
              ToastAndroid.SHORT,
              ToastAndroid.CENTER,
              5,
              25,
            );
          }
        });
      } catch (err) {
        console.warn(err);
        ToastAndroid.showWithGravityAndOffset(
          'Failed to get permission settings',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          5,
          25,
        );
      }
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          await this.onGetUserLocation();
        } else {
          ToastAndroid.showWithGravityAndOffset(
            'Failed to get permission settings',
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
            5,
            25,
          );
        }
      } catch (err) {
        ToastAndroid.showWithGravityAndOffset(
          'Failed to get permission settings',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          5,
          25,
        );
        console.warn(err);
      }
    }
  };

  onCallTherapist = phonenumber => {
    if (phonenumber != '') {
      if (phonenumber.includes('|')) {
        var firstnumber = phonenumber.split('|')[0];
        if (firstnumber.includes('/')) {
          var newnumber = firstnumber.split('/')[0];
          phonenumber = newnumber;
        } else if (firstnumber.includes('-')) {
          var newnumber = firstnumber.split('-')[0];
          phonenumber = newnumber;
        } else {
          phonenumber = firstnumber;
        }
      } else {
        if (phonenumber.includes('/')) {
          var newnumber = phonenumber.split('/')[0];
          phonenumber = newnumber;
        } else if (phonenumber.includes('-')) {
          var newnumber = phonenumber.split('-')[0];
          phonenumber = newnumber;
        } else {
          phonenumber = phonenumber;
        }
      }
      Communications.phonecall(phonenumber, true);
    }
  };

  onSendEmail = to => {
    if (to != '') {
      var subject = 'With regards to your services';
      var subemail =
        'Hello, i saw wanted to email you with regards to your services.';
      Communications.email([to], null, null, subject, subemail);
    }
  };

  renderRowView = data => {
    return (
      <Col
        style={{
          marginBottom: hp('1.8%'),
          backgroundColor: '#FFF',
          elevation: 2,
          height: hp('18%'),
          borderRadius: hp('2%'),
          borderRadius: hp('2%'),
          marginLeft: wp('3%'),
          marginRight: wp('3%'),
        }}>
        <ListItem noBorder>
          <Left style={{width: wp('10%')}}>
            <Button style={{backgroundColor: '#FFF', elevation: 0}}>
              <Icon
                name="ios-chatbubbles-outline"
                style={{
                  color: '#AAA',
                  fontSize: wp('15%'),
                  marginTop: 10,
                }}></Icon>
            </Button>
          </Left>
          <Body>
            <Text
              numberOfLines={2}
              style={{
                fontFamily: variables[0].boldfont,
                color: '#000',
                fontSize: wp('3.8%'),
                marginLeft: 3,
                marginTop: 3,
              }}>
              {data.name == null ? 'Could not find name' : 'Name: ' + data.name}
            </Text>
            <Text
              style={{
                marginTop: hp('0.5%'),
                fontFamily: variables[0].lightfont,
                color: '#000',
                fontSize: wp('3.5%'),
                marginLeft: wp('1%'),
              }}>
              {data.email == '' ? 'Could not find email' : data.email}
            </Text>
            <TouchableOpacity onPress={() => this.openInMap(data.location)}>
              <Animatable.Text
                animation="rubberBand"
                delay={1000}
                iterationCount={data.location == null ? 1 : 'infinite'}
                style={{
                  marginTop: hp('0.5%'),
                  fontFamily: variables[0].italicfont,
                  color: 'green',
                  fontSize: wp('3%'),
                  marginLeft: wp('1%'),
                  marginBottom: 10,
                }}>
                {data.location == null
                  ? 'Location Not Set'
                  : 'Click Here To Get Directions'}
              </Animatable.Text>
            </TouchableOpacity>
          </Body>
          <Right></Right>
        </ListItem>
        <Row
          style={{
            width: wp('90%'),
            marginBottom: 10,
            paddingTop: 2,
            paddingBottom: 2,
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
          }}>
          <TouchableOpacity onPress={() => this.onSelectTherapist(data)}>
            <Row
              style={{
                borderColor: variables[0].bgcolor,
                borderWidth: 1,
                borderRadius: hp('2%'),
                marginRight: 10,
                height: 20,
                width: 65,
                paddingTop: 2,
                paddingBottom: 2,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Icon
                name="chatbubble-ellipses-outline"
                style={{color: variables[0].bgcolor, fontSize: 12}}></Icon>
              <Text
                style={{
                  paddingLeft: 3,
                  color: variables[0].bgcolor,
                  fontFamily: variables[0].italicfont,
                  fontSize: wp('2.8%'),
                }}>
                Chat
              </Text>
            </Row>
          </TouchableOpacity>
          {data.phone == null ? null : data.phone == '' ? null : (
            <TouchableOpacity onPress={() => this.onCallTherapist(data.phone)}>
              <Row
                style={{
                  borderColor: variables[0].bgcolor,
                  borderWidth: 1,
                  borderRadius: hp('2%'),
                  marginRight: 10,
                  height: 20,
                  width: 65,
                  paddingTop: 2,
                  paddingBottom: 2,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Icon
                  name="call"
                  style={{color: variables[0].bgcolor, fontSize: 12}}></Icon>
                <Text
                  style={{
                    paddingLeft: 3,
                    color: variables[0].bgcolor,
                    fontFamily: variables[0].italicfont,
                    fontSize: wp('2.8%'),
                  }}>
                  Call
                </Text>
              </Row>
            </TouchableOpacity>
          )}
          {data.email == '' ? null : (
            <TouchableOpacity onPress={() => this.onSendEmail(data.email)}>
              <Row
                style={{
                  borderColor: variables[0].bgcolor,
                  borderWidth: 1,
                  borderRadius: hp('2%'),
                  height: 20,
                  width: 65,
                  paddingTop: 2,
                  paddingBottom: 2,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Icon
                  name="mail"
                  style={{color: variables[0].bgcolor, fontSize: 12}}></Icon>
                <Text
                  style={{
                    paddingLeft: 3,
                    color: variables[0].bgcolor,
                    fontFamily: variables[0].italicfont,
                    fontSize: wp('2.8%'),
                  }}>
                  Email
                </Text>
              </Row>
            </TouchableOpacity>
          )}
        </Row>
      </Col>
    );
  };

  renderChatRowView = data => {
    return (
      <Col
        style={{
          marginBottom: hp('1.8%'),
          backgroundColor: '#FFF',
          elevation: 2,
          borderRadius: hp('2%'),
          borderRadius: hp('2%'),
          marginLeft: wp('3%'),
          marginRight: wp('3%'),
        }}>
        <TouchableOpacity onPress={() => this.onSelectChat(data)}>
          <ListItem noBorder onPress={() => this.onSelectChat(data)}>
            <Left
              style={{
                width: wp('10%'),
                justifyContent: 'center',
              }}>
              <Button
                style={{
                  backgroundColor: '#FFF',
                  elevation: 0,
                  paddingTop: 20,
                }}>
                <Icon
                  name="ios-chatbubble-ellipses-outline"
                  style={{
                    color: '#BCBCBC',
                    fontSize: wp('10%'),
                  }}></Icon>
              </Button>
              <Body>
                <Text
                  numberOfLines={2}
                  style={{
                    fontFamily: variables[0].italicfont,
                    color: '#000',
                    fontSize: wp('4.5%'),
                    marginLeft: 3,
                    marginTop: 3,
                  }}>
                  {data.name == null ? 'User' : data.name}
                </Text>
                <Text
                  numberOfLines={2}
                  style={{
                    marginTop: 5,
                    fontFamily: variables[0].lightfont,
                    color: '#000',
                    fontSize: wp('3.5%'),
                    marginLeft: wp('1%'),
                  }}>
                  {data.lastmessage == null ? 'Message Sent' : data.lastmessage}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: 5,
                    fontFamily: variables[0].lightfont,
                    color: '#000',
                    fontSize: wp('3.5%'),
                    marginLeft: wp('1%'),
                  }}>
                  {data.lastdate == null
                    ? new Date().toDateString()
                    : data.lastdate}
                </Text>
              </Body>
            </Left>
          </ListItem>
        </TouchableOpacity>
        <Row
          style={{
            width: wp('90%'),
            marginBottom: 10,
            paddingTop: 2,
            paddingBottom: 2,
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
          }}>
          <TouchableOpacity onPress={() => this.onSchedule(data, 'chat')}>
            <Row
              style={{
                borderColor: variables[0].bgcolor,
                borderWidth: 1,
                borderRadius: hp('2%'),
                marginRight: 10,
                height: 20,
                paddingRight: 5,
                paddingLeft: 5,
                paddingTop: 2,
                paddingBottom: 2,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Icon
                name="chatbubble-ellipses-outline"
                style={{color: variables[0].bgcolor, fontSize: 12}}></Icon>
              <Text
                style={{
                  paddingLeft: 3,
                  color: variables[0].bgcolor,
                  fontFamily: variables[0].italicfont,
                  fontSize: wp('2.8%'),
                }}>
                Schedule A Chat
              </Text>
            </Row>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => this.onSchedule(data, 'call')}>
            <Row
              style={{
                borderColor: variables[0].bgcolor,
                borderWidth: 1,
                borderRadius: hp('2%'),
                marginRight: 10,
                height: 20,
                paddingLeft: 5,
                paddingRight: 5,
                paddingTop: 2,
                paddingBottom: 2,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Icon
                name="call"
                style={{color: variables[0].bgcolor, fontSize: 12}}></Icon>
              <Text
                style={{
                  paddingLeft: 3,
                  color: variables[0].bgcolor,
                  fontFamily: variables[0].italicfont,
                  fontSize: wp('2.8%'),
                }}>
                Schedule A Call
              </Text>
            </Row>
          </TouchableOpacity>
        </Row>
      </Col>
    );
  };

  onRenderTherapistView = () => {
    return this.state.isloading ? (
      <Content
        contentContainerStyle={{
          justifyContent: 'center',
          height: hp('80%'),
        }}>
        <ActivityIndicator size="large" color={variables[0].bgcolor} />
      </Content>
    ) : this.state.chats.length == 0 ? (
      <Content
        contentContainerStyle={{
          justifyContent: 'center',
          height: hp('80%'),
          alignItems: 'center',
        }}>
        <Icon
          name="chatbubbles-outline"
          style={{color: variables[0].bgcolor, fontSize: wp('13%')}}></Icon>
        <Text
          style={{
            marginTop: 10,
            fontFamily: variables[0].mainfont,
            color: variables[0].bgcolor,
            fontSize: wp('4%'),
          }}>
          No Chats Found
        </Text>
        <Text
          style={{
            marginTop: 5,
            fontFamily: variables[0].italicfont,
            color: variables[0].bgcolor,
            fontSize: wp('2.5%'),
          }}>
          When you have new chats, they will appear here
        </Text>
      </Content>
    ) : (
      <Content>
        <FlatList
          scrollEnabled={true}
          style={{marginTop: hp('1%'), marginBottom: hp('1%')}}
          data={this.state.chats}
          keyExtractor={(item, index) => 'chats_list_' + item.name + index}
          renderItem={({item}) => this.renderChatRowView(item)}
        />
      </Content>
    );
  };

  onRenderUserView = () => {
    return this.state.isloading ? (
      <Content
        contentContainerStyle={{
          justifyContent: 'center',
          height: hp('80%'),
        }}>
        <ActivityIndicator size="large" color={variables[0].bgcolor} />
      </Content>
    ) : this.state.therapists.length == 0 ? (
      <Content
        contentContainerStyle={{
          justifyContent: 'center',
          height: hp('80%'),
          alignItems: 'center',
        }}>
        <Icon
          name="cloud-offline-outline"
          style={{color: variables[0].bgcolor, fontSize: wp('10%')}}></Icon>
        <Text
          style={{
            marginTop: 10,
            fontFamily: variables[0].mainfont,
            color: variables[0].bgcolor,
            fontSize: wp('4%'),
          }}>
          No Therapists Found
        </Text>
        <Text
          style={{
            marginTop: 5,
            fontFamily: variables[0].italicfont,
            color: variables[0].bgcolor,
            fontSize: wp('2.5%'),
          }}>
          Therapists will appear here once they have been added
        </Text>
      </Content>
    ) : (
      <Content>
        <FlatList
          scrollEnabled={true}
          style={{marginTop: hp('1%'), marginBottom: hp('1%')}}
          data={this.state.therapists}
          keyExtractor={(item, index) => 'therapist_list_' + item.name + index}
          renderItem={({item}) => this.renderRowView(item)}
        />
      </Content>
    );
  };

  onSchedule = (data, mode) => {
    this.setState({
      isshowdatetime: true,
      selecteduserinfo: data,
      selectedmode: mode,
    });
  };

  onChange = async (event, selecteddate) => {
    if (this.state.mode == 'date') {
      if (event.type != 'dismissed') {
        this.setState({
          mode: 'time',
          selecteddate: new Date(selecteddate).toLocaleDateString(),
        });
      } else {
        this.setState({
          isshowdatetime: false,
        });
      }
    } else {
      var correcttime = new Date(selecteddate).toLocaleTimeString();
      this.setState({selectedtime: correcttime});
      if (event.type == 'dismissed') {
        this.setState({
          mode: 'date',
          selecteddate: '',
          selectedtime: '',
          selectedmode: '',
          isshowdatetime: false,
        });
      } else if (
        new Date().toLocaleDateString() == this.state.selecteddate &&
        new Date(selecteddate).getTime() < new Date().getTime()
      ) {
        ToastAndroid.showWithGravityAndOffset(
          'Cannot set a date and time before the current date and time',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          5,
          25,
        );
        this.setState({
          mode: 'date',
          selecteddate: '',
          selectedmode: '',
          selectedtime: '',
          isshowdatetime: false,
        });
      } else {
        var correcteduseremail = this.state.useremail
          .split('@')[0]
          .includes('.')
          ? this.state.useremail.split('@')[0].split('.').join('')
          : this.state.useremail.split('@')[0];

        var correcttoemail = this.state.selecteduserinfo.useremail
          .split('@')[0]
          .includes('.')
          ? this.state.selecteduserinfo.useremail
              .split('@')[0]
              .split('.')
              .join('')
          : this.state.selecteduserinfo.useremail.split('@')[0];
        try {
          var x = 0;
          database()
            .ref('/schedule/')
            .once('value')
            .then(snapshot => {
              if (!snapshot.exists()) {
                x = 1;
              } else {
                x = snapshot.numChildren();
              }
            });
          database()
            .ref('/schedule/' + new Date())
            .set({
              from: this.state.useremail,
              schedule: this.state.selectedmode.toUpperCase(),
              date: this.state.selecteddate,
              time: correcttime,
              to: this.state.selecteduserinfo.useremail,
            })
            .then(
              () =>
                ToastAndroid.showWithGravityAndOffset(
                  'Schedule has been added',
                  ToastAndroid.SHORT,
                  ToastAndroid.CENTER,
                  5,
                  25,
                ),
              this.setState({
                mode: 'date',
                selecteddate: '',
                selectedmode: '',
                selectedtime: '',
                isshowdatetime: false,
              }),
            );
        } catch (e) {
          this.setState({
            isshowdatetime: false,
          });
          ToastAndroid.showWithGravityAndOffset(
            'Error adding schedule. Please try again ' + e,
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
            5,
            25,
          );
          this.setState({
            mode: 'date',
            selecteddate: '',
            selectedtime: '',
            selectedmode: '',
            isshowdatetime: false,
          });
        }
      }
    }
  };

  onNavigate = async () => {
    var url = 'https://www.instagram.com/there_for_you_app/?hl=en';
    try {
      Linking.openURL(url);
    } catch (e) {
      ToastAndroid.showWithGravityAndOffset(
        'Cannot open url',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        5,
        25,
      );
    }
  };

  render() {
    LogBox.ignoreAllLogs(true);
    return (
      <Container
        style={{
          backgroundColor: '#EEE',
          width: width,
        }}>
        <Header style={{elevation: 1, backgroundColor: '#FFF'}}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={'#FFF'}
            hidden={false}></StatusBar>
          <Body
            style={{marginLeft: Platform.OS == 'ios' ? wp('20%') : wp('5%')}}>
            <Text
              style={{
                width: wp('70%'),
                fontFamily: variables[0].boldfont,
                color: variables[0].bgcolor,
                fontSize: wp('4.5%'),
              }}>
              {this.state.headertitle}
            </Text>
            <Text
              style={{
                width: wp('70%'),
                fontFamily: variables[0].lightfont,
                color: variables[0].bgcolor,
                fontSize: wp('2.5%'),
                marginTop: 3,
              }}>
              {this.state.headersubtitle}
            </Text>
          </Body>
          <Right style={{justifyContent: 'flex-end'}}>
            {this.state.userrole == 'user' ? null : (
              <TouchableOpacity
                style={{
                  height: wp('10%'),
                  width: wp('10%'),
                  justifyContent: 'center',
                }}
                onPress={() => this.onGetLocation()}>
                <Icon
                  name="ios-location-outline"
                  style={{
                    fontSize: hp('3.5%'),
                    color: variables[0].bgcolor,
                    alignSelf: 'center',
                  }}></Icon>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={{
                height: wp('10%'),
                width: wp('10%'),
                justifyContent: 'center',
              }}
              onPress={() => this.onNavigate()}>
              <Icon
                name="ios-logo-instagram"
                style={{
                  fontSize: hp('3.5%'),
                  color: variables[0].bgcolor,
                  alignSelf: 'center',
                }}></Icon>
            </TouchableOpacity>
          </Right>
        </Header>
        {this.state.userrole == 'user'
          ? this.onRenderUserView()
          : this.onRenderTherapistView()}

        {this.state.isshowdatetime && (
          <DateTimePicker
            ref={dtpicker => (this.dtpicker = dtpicker)}
            testID="dateTimePicker"
            value={this.state.date}
            mode={this.state.mode}
            is24Hour={true}
            display="default"
            minimumDate={new Date()}
            maximumDate={new Date(2300, 10, 20)}
            onChange={this.onChange}
          />
        )}
      </Container>
    );
  }
}
