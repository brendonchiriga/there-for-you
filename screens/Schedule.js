import React, {Component} from 'react';
import {
  Dimensions,
  LogBox,
  StatusBar,
  TouchableOpacity,
  Text,
  View,
  FlatList,
  AsyncStorage,
  ActivityIndicator,
  ToastAndroid,
  Linking,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {
  Button,
  Col,
  Container,
  Content,
  Icon,
  Left,
  ListItem,
  Body,
  Right,
  Header,
} from 'native-base';
import RNCalendarEvents from 'react-native-calendar-events';
import database from '@react-native-firebase/database';
import variables from '../config/variables';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

export default class Schedule extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      userrole: '',
      username: '',
      useremail: '',
      isdeletelatestschedule: true,
      schedules: [],
      latestschedule: {},
    };
  }
  componentDidMount() {
    this.onGetUserDetails();
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
    this.onGetLocalSchedules();
  };

  onSaveEvent = async (mode, data) => {
    var scheduleDate = new Date(data.date);
    let alarmDate = new Date(scheduleDate - 1 * 60000);
    RNCalendarEvents.saveEvent(data.schedule + ' with ' + data.from, {
      location: 'South Africa',
      notes:
        data.schedule +
        ' with ' +
        data.from +
        ' - ' +
        scheduleDate.toDateString(),
      description:
        data.schedule +
        ' with ' +
        data.from +
        ' - ' +
        scheduleDate.toDateString(),
      startDate: scheduleDate.toISOString(),
      endDate: scheduleDate.toISOString(),
      calendar: ['Calendar'],
      alarm: [
        {
          date: 1,
        },
      ],
    })
      .then(id => {
        ToastAndroid.showWithGravityAndOffset(
          'Your event has been saved',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          5,
          25,
        );
        var url = `content://com.android.calendar/time/${scheduleDate.getTime()}`;
        Linking.canOpenURL(url).then(supported => {
          if (supported) {
            Linking.openURL(url);
          } else {
            ToastAndroid.showWithGravityAndOffset(
              'Your event has been saved',
              ToastAndroid.SHORT,
              ToastAndroid.CENTER,
              5,
              25,
            );
          }
        });
      })
      .catch(error =>
        ToastAndroid.showWithGravityAndOffset(
          error,
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          5,
          25,
        ),
      );
  };

  onAddToCalendar = async (mode, data) => {
    var status = await RNCalendarEvents.checkPermissions();
    if (status === 'authorized') {
      this.onSaveEvent(mode, data);
    } else {
      var status = await RNCalendarEvents.requestPermissions();
      if (status === 'authorized') {
        this.onSaveEvent(mode, data);
      } else {
        ToastAndroid.showWithGravityAndOffset(
          'Cannot add calendar event. Please accept permission to add this event to your phone calendar',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          5,
          25,
        );
      }
    }
  };

  onDeleteSchedule = async data => {
    try {
      let itemsRef = database().ref('/schedule/' + data.key);
      itemsRef.remove();
      ToastAndroid.showWithGravityAndOffset(
        'Schedule has been deleted',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        5,
        25,
      );
    } catch (e) {
      ToastAndroid.showWithGravityAndOffset(
        'Failure to add a schedule',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        5,
        25,
      );
    }
  };

  onGetLocalSchedules = async () => {
    this.setState({
      isloading: true,
      schedules: [],
      latestschedule: {},
    });
    var data = (await AsyncStorage.getItem('tfy_saved_schedules')) || null;
    if (data == null) {
      this.onGetSchedules();
      this.setState({
        isloading: false,
      });
    } else {
      var schedules = JSON.parse(data);

      var otherschedules = [];

      if (schedules.body.length != 0) {
        for (var a = 1; a < schedules.body.length; a++) {
          otherschedules.push(schedules.body[a]);
        }
      }
      if (schedules.email == this.state.useremail) {
        this.setState({
          latestschedule: schedules.body[0],
          schedules: otherschedules,
          isloading: false,
        });
        this.onGetSchedules();
      } else {
        this.onGetSchedules();
      }
    }
  };

  onGetSchedules = async () => {
    try {
      database()
        .ref('/schedule/')
        .on('value', async snapshot => {
          var schedules = [];
          if (snapshot.exists()) {
            snapshot.forEach(function (childSnapshot) {
              var childData = childSnapshot.val();
              if (childData != null) {
                var set = {
                  key: childSnapshot.key,
                  ...childData,
                };
                schedules.push(set);
              }
            });

            this.state.userrole == 'therapist'
              ? (schedules = schedules.filter(
                  e => e.from == this.state.useremail,
                ))
              : (schedules = schedules.filter(
                  e => e.to == this.state.useremail,
                ));

            schedules = schedules.filter(
              e => new Date(e.date).getTime() > new Date().getTime(),
            );

            schedules = schedules.sort(
              (b, a) => new Date(b.date).getTime() > new Date(a.date).getTime(),
            );

            var body = {email: this.state.useremail, body: schedules};
            await AsyncStorage.setItem(
              'tfy_saved_schedules',
              JSON.stringify(body),
            );

            var otherschedules = [];
            var firstschedule = schedules[0];

            if (schedules.length != 0) {
              for (var a = 1; a < schedules.length; a++) {
                otherschedules.push(schedules[a]);
              }
            }

            this.setState({
              latestschedule: schedules[0],
              schedules: otherschedules,
              isloading: false,
            });
          }
        });
    } catch (e) {
      this.setState({
        isloading: false,
      });
      this.onGetLocalSchedules();
    }
  };

  renderScheduleRowView = data => {
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
        <TouchableOpacity onPress={() => this.onAddToCalendar('other', data)}>
          <ListItem
            noBorder
            onPress={() => this.onAddToCalendar('latest', data)}>
            <Left
              style={{
                width: wp('10%'),
                justifyContent: 'center',
              }}>
              <Button
                style={{
                  backgroundColor: '#FFF',
                  elevation: 0,
                  paddingTop: 0,
                }}>
                {data.schedule == 'CHAT' ? (
                  <Icon
                    name="ios-chatbubbles-outline"
                    style={{
                      color: '#BCBCBC',
                      fontSize: wp('10%'),
                    }}></Icon>
                ) : (
                  <Icon
                    name="ios-call-outline"
                    style={{
                      color: '#BCBCBC',
                      fontSize: wp('10%'),
                    }}></Icon>
                )}
              </Button>
              <Body>
                <Text
                  numberOfLines={2}
                  style={{
                    fontFamily: variables[0].italicfont,
                    color: '#000',
                    fontSize: wp('3.5%'),
                    marginLeft: 3,
                    marginTop: 7,
                  }}>
                  {data.schedule == null
                    ? 'User'
                    : data.schedule + ' with ' + data.to}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    marginTop: 5,
                    fontFamily: variables[0].lightfont,
                    color: '#000',
                    fontSize: wp('3%'),
                    marginLeft: wp('1%'),
                  }}>
                  {data.date == null
                    ? new Date().toDateString()
                    : new Date(data.date).toDateString() + ' at ' + data.time}
                </Text>
              </Body>
            </Left>
            <Right>
              {this.state.userrole == 'user' ? null : (
                <TouchableOpacity
                  style={{
                    height: wp('10%'),
                    width: wp('10%'),
                    justifyContent: 'center',
                  }}
                  onPress={() => this.onDeleteSchedule(data)}>
                  <Icon
                    name="ios-trash-outline"
                    style={{
                      fontSize: hp('3.5%'),
                      color: variables[0].bgcolor,
                      alignSelf: 'center',
                    }}></Icon>
                </TouchableOpacity>
              )}
            </Right>
          </ListItem>
        </TouchableOpacity>
      </Col>
    );
  };

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
              Latest Schedule
            </Text>
            <Text
              style={{
                width: wp('70%'),
                fontFamily: variables[0].lightfont,
                color: variables[0].bgcolor,
                fontSize: wp('2.8%'),
                marginTop: 3,
              }}>
              View your latest schedule
            </Text>
          </Body>
          <Right style={{marginRight: wp('2%')}}>
            <TouchableOpacity
              style={{
                height: wp('10%'),
                width: wp('10%'),
                justifyContent: 'center',
              }}
              onPress={this.onGetSchedules}>
              <Icon
                name="ios-refresh-outline"
                style={{
                  fontSize: hp('3.5%'),
                  color: variables[0].bgcolor,
                  alignSelf: 'center',
                }}></Icon>
            </TouchableOpacity>
          </Right>
        </Header>
        <Content>
          {this.state.latestschedule == undefined ||
          this.state.latestschedule == {} ? (
            this.state.schedules == undefined ||
            this.state.schedules.length == 0 ? null : (
              <Text
                style={{
                  textAlign: 'center',
                  fontFamily: variables[0].lightfont,
                  color: variables[0].bgcolor,
                  fontSize: wp('2.8%'),
                  marginTop: 10,
                }}>
                No latest schedule found
              </Text>
            )
          ) : (
            <Col
              style={{
                marginBottom: hp('1.8%'),
                backgroundColor: variables[0].bgcolor,
                elevation: 2,
                borderRadius: hp('2%'),
                borderRadius: hp('2%'),
                marginLeft: wp('3%'),
                marginRight: wp('3%'),
              }}>
              <TouchableOpacity
                onPress={() =>
                  this.onAddToCalendar('latest', this.state.latestschedule)
                }>
                <ListItem
                  noBorder
                  onPress={() =>
                    this.onAddToCalendar('latest', this.state.latestschedule)
                  }>
                  <Left
                    style={{
                      width: wp('10%'),
                      justifyContent: 'center',
                    }}>
                    <Button
                      style={{
                        backgroundColor: variables[0].bgcolor,
                        elevation: 0,
                        paddingTop: 0,
                      }}>
                      <Icon
                        name="ios-calendar-outline"
                        style={{
                          color: '#FFF',
                          fontSize: wp('10%'),
                        }}></Icon>
                    </Button>
                    <Body>
                      <Text
                        numberOfLines={2}
                        style={{
                          fontFamily: variables[0].italicfont,
                          color: '#FFF',
                          fontSize: wp('3.5%'),
                          marginLeft: 3,
                          marginTop: 7,
                        }}>
                        {this.state.latestschedule.schedule == null
                          ? ''
                          : this.state.latestschedule.schedule +
                            ' with ' +
                            this.state.latestschedule.to}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: variables[0].italicfont,
                          color: '#FFF',
                          fontSize: wp('3%'),
                          marginLeft: 3,
                          marginTop: 3,
                        }}>
                        {this.state.latestschedule.date == null
                          ? new Date().toDateString()
                          : new Date(
                              this.state.latestschedule.date,
                            ).toDateString() +
                            ' at ' +
                            this.state.latestschedule.time}
                      </Text>
                    </Body>
                  </Left>
                  <Right>
                    {this.state.userrole == 'user' ? null : (
                      <TouchableOpacity
                        style={{
                          height: wp('10%'),
                          width: wp('10%'),
                          justifyContent: 'center',
                        }}
                        onPress={() =>
                          this.state.userrole == 'user'
                            ? null
                            : this.onDeleteSchedule(this.state.latestschedule)
                        }>
                        <Icon
                          name="ios-trash-outline"
                          style={{
                            fontSize: hp('3.5%'),
                            color: '#FFF',
                            alignSelf: 'center',
                          }}></Icon>
                      </TouchableOpacity>
                    )}
                  </Right>
                </ListItem>
              </TouchableOpacity>
            </Col>
          )}

          {this.state.isloading ? (
            <Content
              contentContainerStyle={{
                justifyContent: 'center',
                height: hp('70%'),
              }}>
              <ActivityIndicator size="large" color={variables[0].bgcolor} />
            </Content>
          ) : (this.state.schedules == undefined &&
              this.state.latestschedule == undefined) ||
            (this.state.schedules.length == 0 &&
              (this.state.latestschedule == undefined ||
                this.state.latestschedule == null)) ? (
            <Content
              contentContainerStyle={{
                justifyContent: 'center',
                height: hp('60%'),
                alignItems: 'center',
              }}>
              <Icon
                name="ios-calendar-outline"
                style={{
                  color: variables[0].bgcolor,
                  fontSize: wp('13%'),
                }}></Icon>
              <Text
                style={{
                  marginTop: 10,
                  fontFamily: variables[0].mainfont,
                  color: variables[0].bgcolor,
                  fontSize: wp('4%'),
                }}>
                No Schedules Found
              </Text>
              <Text
                style={{
                  marginTop: 5,
                  fontFamily: variables[0].italicfont,
                  color: variables[0].bgcolor,
                  fontSize: wp('2.5%'),
                }}>
                When you have new schedules, they will appear here
              </Text>
            </Content>
          ) : (
            <Content>
              <Header style={{elevation: 0, backgroundColor: '#FFF'}}>
                <StatusBar
                  barStyle="dark-content"
                  backgroundColor={'#FFF'}></StatusBar>
                <Body
                  style={{
                    marginLeft: Platform.OS == 'ios' ? wp('20%') : wp('5%'),
                  }}>
                  <Text
                    style={{
                      width: wp('70%'),
                      fontFamily: variables[0].boldfont,
                      color: variables[0].bgcolor,
                      fontSize: wp('4.5%'),
                    }}>
                    Other Schedules
                  </Text>
                  <Text
                    style={{
                      width: wp('70%'),
                      fontFamily: variables[0].lightfont,
                      color: variables[0].bgcolor,
                      fontSize: wp('2.8%'),
                      marginTop: 3,
                    }}>
                    View other schedules for later
                  </Text>
                </Body>
                <Right style={{marginRight: wp('2%')}}></Right>
              </Header>
              <FlatList
                scrollEnabled={true}
                style={{marginTop: hp('1%'), marginBottom: hp('1%')}}
                data={this.state.schedules}
                keyExtractor={(item, index) =>
                  'schedules_list_' + item.name + index
                }
                renderItem={({item}) => this.renderScheduleRowView(item)}
              />
            </Content>
          )}
        </Content>
      </Container>
    );
  }
}
