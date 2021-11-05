import React from 'react';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import database from '@react-native-firebase/database';
import {GiftedChat, Send, Bubble} from 'react-native-gifted-chat';
import {
  Image,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  View,
  AsyncStorage,
  LogBox,
  ActivityIndicator,
  BackHandler,
  Platform,
  Text,
  ToastAndroid,
} from 'react-native';
import {Container, Header, Body, Right, Icon, Left} from 'native-base';

import variables from '../config/variables';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

export default class Chat extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedname: '',
      selecteduseremail: '',
      username: '',
      useremail: '',
      userrole: '',
      currentmessage: '',
      messages: [],
      therapist: {},
    };
  }

  componentDidMount() {
    this.onGetUserDetails();
    this.onGetSelectedTherapist();
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
    this.props.navigation.push('UserApp');
    return true;
  };

  onGetMessages = async isuserchat => {
    var correcteduseremail =
      this.state.userrole == 'therapist'
        ? isuserchat != null
          ? isuserchat
          : this.state.useremail.split('@')[0].includes('.')
          ? this.state.useremail.split('@')[0].split('.').join('')
          : this.state.useremail.split('@')[0]
        : this.state.useremail.split('@')[0].includes('.')
        ? this.state.useremail.split('@')[0].split('.').join('')
        : this.state.useremail.split('@')[0];
    var correctedtherapistemail = this.state.therapist.email
      .split('@')[0]
      .includes('.')
      ? this.state.therapist.email.split('@')[0].split('.').join('')
      : this.state.therapist.email.split('@')[0];

    var chatalias = correcteduseremail + '_' + correctedtherapistemail;

    try {
      database()
        .ref('/chat/' + chatalias)
        .on('value', snapshot => {
          if (snapshot.exists()) {
            var prevmessages = [];
            var useremailselected = '';
            this.setState({messages: []});
            snapshot.forEach(function async(childSnapshot) {
              var childData = childSnapshot.val();
              if (childData != null) {
                var createdAt = childSnapshot.key.split('_')[0];
                prevmessages.sort((a, b) => a.date - b.date);
                prevmessages.push({...childData, createdAt: createdAt});
               
                if (isuserchat != null) {
                  useremailselected = childData.user._id;
                }
              }
            });
            this.setState({
              selecteduseremail: useremailselected,
            });

            this.setState(previousState => ({
              messages: GiftedChat.append(previousState.messages, prevmessages),
            }));
          }
        });
    } catch (e) {
      this.setState({
        isloading: false,
      });
    }
  };

  onSendMessage = async message => {
    var set = message;
    var isuserchat = this.state.selecteduseremail;

    if (this.state.messages.length == 0) {
      this.setState({messages: set});
    } else {
      this.setState(previousState => ({
        messages: GiftedChat.append(previousState.messages, message),
      }));
    }

    var correcteduseremail =
      this.state.userrole == 'therapist'
        ? isuserchat != null
          ? this.state.selectedusername
          : this.state.useremail.split('@')[0].includes('.')
          ? this.state.useremail.split('@')[0].split('.').join('')
          : this.state.useremail.split('@')[0]
        : this.state.useremail.split('@')[0].includes('.')
        ? this.state.useremail.split('@')[0].split('.').join('')
        : this.state.useremail.split('@')[0];

    var correctedtherapistemail = this.state.therapist.email
      .split('@')[0]
      .includes('.')
      ? this.state.therapist.email.split('@')[0].split('.').join('')
      : this.state.therapist.email.split('@')[0];

    var chatalias = correcteduseremail + '_' + correctedtherapistemail;
    var id = set[0].createdAt + '_' + set[0]._id;

    try {
      database()
        .ref('/chat/' + chatalias + '/' + id)
        .set({
          date: Date.parse(set[0].createdAt),
          to:
            this.state.userrole == 'user'
              ? this.state.therapist.email
              : this.state.selecteduseremail,
          ...set[0],
        });
    } catch (e) {}

    //Send Notification
    try {
      var x = 0;
      database()
        .ref('/notifications/' + correctedusermail)
        .once('value')
        .then(snapshot => {
          if (!snapshot.exists()) {
            x = 1;
          } else {
            x = snapshot.numChildren();
          }
        });
      database()
        .ref('/notifications/' + correctedusermail + '/' + x)
        .set({
          from: this.state.useremail,
          message:
            'You have received a new message from ' +
            this.state.username +
            '. Open the chat to read',
          to: this.state.therapist.email,
          date: new Date(),
        });
    } catch (e) {}
  };

  onGetSelectedTherapist = async () => {
    var userselected =
      (await AsyncStorage.getItem('tfy_selected_therapist')) || null;
    if (userselected == null) {
    } else {
      this.setState({
        therapist: JSON.parse(userselected),
      });
    }

    var userselectedb =
      (await AsyncStorage.getItem('tfy_selected_user')) || null;

    if (userselectedb == null) {
    } else {
      this.setState({
        selectedusername: userselectedb,
      });
    }

    this.onGetMessages(userselectedb);
  };

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

  renderLoading = () => {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator size="large" color={variables[0].bgcolor} />
      </View>
    );
  };

  renderChatEmpty = () => {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}></View>
    );
  };

  onLogout = () => {
    this.props.navigation.push('UserApp');
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
          <Left style={{marginRight: wp('2%')}}>
            <TouchableOpacity
              style={{
                height: wp('10%'),
                width: wp('10%'),
                justifyContent: 'center',
              }}
              onPress={this.onLogout}>
              <Icon
                name="ios-arrow-back"
                style={{
                  fontSize: hp('3.5%'),
                  color: variables[0].bgcolor,
                  alignSelf: 'center',
                }}></Icon>
            </TouchableOpacity>
          </Left>
          <Body>
            <Text
              style={{
                width: wp('70%'),
                fontFamily: variables[0].boldfont,
                color: variables[0].bgcolor,
                fontSize: wp('4.5%'),
              }}>
              {this.state.userrole != 'therapist'
                ? 'Chatting With ' + this.state.therapist.name
                : 'Chatting With ' + this.state.selectedusername}
            </Text>
            <Text
              style={{
                width: wp('70%'),
                fontFamily: variables[0].lightfont,
                color: variables[0].bgcolor,
                fontSize: wp('2.8%'),
                marginTop: 3,
              }}>
              Chat Date {new Date().toDateString()}
            </Text>
          </Body>
          <Right />
        </Header>

        <GiftedChat
          minInputToolbarHeight={50}
          renderLoading={this.renderLoading}
          renderChatEmpty={this.renderChatEmpty}
          renderUsernameOnMessage
          parsePatterns={() => [
            {
              type: 'url',
              style: {color: variables[0].bgcolor, fontSize: 12},
              //onPress: this.handleUrlPress,
            },
            {
              pattern: /#(\w+)/,
              style: {color: variables[0].bgcolor, fontSize: 10},
              onPress: props => console.warn(props),
            },
            {
              type: 'email',
              style: {color: variables[0].bgcolor, fontSize: 12},
              //onPress: this.handleEmailPress,
            },
          ]}
          renderBubble={props => {
            return (
              <Bubble
                {...props}
                textStyle={{
                  right: {
                    fontFamily: variables[0].mainfont,
                    fontSize: wp('4%'),
                    color: '#FFF',
                  },
                  left: {
                    fontFamily: variables[0].mainfont,
                    fontSize: wp('4%'),
                    color: '#000',
                  },
                }}
                wrapperStyle={{
                  left: {
                    backgroundColor: 'white',
                    marginTop: 7,
                    paddingLeft: 10,
                    paddingright: 10,
                  },
                  right: {
                    backgroundColor: variables[0].bgcolor,
                    paddingLeft: 10,
                    paddingright: 10,
                    paddingBottom: 5,
                    paddingTop: 5,
                  },
                }}
              />
            );
          }}
          renderSend={props => {
            return (
              <Send
                {...props}
                textStyle={{
                  color: variables[0].bgcolor,
                  fontFamily: variables[0].boldfont,
                }}
                label={'Send'}
              />
            );
          }}
          showUserAvatar={false}
          textInputStyle={{
            fontFamily: variables[0].mainfont,
            fontSize: wp('4.5%'),
          }}
          inverted={false}
          keyboardShouldPersistTaps="never"
          messages={this.state.messages}
          onInputTextChanged={text => this.setState({currentmessage: text})}
          onSend={message => this.onSendMessage(message)}
          user={{
            _id: this.state.useremail,
            sent: true,
            received: true,
          }}
        />
      </Container>
    );
  }
}
