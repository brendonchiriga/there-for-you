import React, {Component} from 'react';
import * as Animatable from 'react-native-animatable';
import database from '@react-native-firebase/database';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  LogBox,
  StatusBar,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ToastAndroid,
  AsyncStorage,
  BackHandler,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {
  Container,
  Tab,
  Tabs,
  DefaultTabBar,
  Separator,
  Input,
  Button,
  Icon,
  Content,
  Switch,
  ListItem,
  Left,
  Body,
  Right,
  Header,
} from 'native-base';
import variables from '../config/variables';
import {RadioButton} from 'react-native-paper';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

export default class CreateSchedule extends Component {
  constructor(props) {
    super(props);
    this.state = {
      //signup fields
      signupname: '',
      signupphone: '',
      signupemail: '',
      signuppassword: '',
      signupcpassword: '',

      //visibility
      show: false,
      isloading: false,
      istherapist: false,
      ispopupmessage: false,
    };
  }

  componentDidMount() {}

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
    this.props.navigation.pop();
    return true;
  };

  onSignUp = () => {
    var name = this.state.signupname.trim();
    var email = this.state.signupemail.trim();
    var phone = this.state.signupphone.trim();
    var password1 = this.state.signuppassword.trim();
    var password2 = this.state.signupcpassword.trim();
    var istherapist = this.state.istherapist;

    if (
      name == '' ||
      email == '' ||
      phone == '' ||
      password1 == '' ||
      password2 == ''
    ) {
      ToastAndroid.showWithGravityAndOffset(
        'Please fill in all empty text fields',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        5,
        25,
      );
    } else if (!/^[a-zA-Z]+$/.test(name)) {
      ToastAndroid.showWithGravityAndOffset(
        'Seems like your name is incorrect. Please enter a correct name',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        5,
        25,
      );
    } else if (!this.onValidateEmail(email)) {
      ToastAndroid.showWithGravityAndOffset(
        'Seems like your email is incorrect. Please enter a correct email',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        5,
        25,
      );
    } else if (!/^[1-9+]+$/.test(phone)) {
      ToastAndroid.showWithGravityAndOffset(
        'Seems like your phone number has incorrect characters. Please enter a correct phone number',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        5,
        25,
      );
    } else if (phone.length < 10 || phone.length > 15) {
      ToastAndroid.showWithGravityAndOffset(
        'Seems like your phone number is incorrect. Please enter a correct phone number',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        5,
        25,
      );
    } else if (!phone.startsWith('+263')) {
      ToastAndroid.showWithGravityAndOffset(
        'Seems like your phone number is incorrect. All phone number must be prefixed with +263',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        5,
        25,
      );
    } else if (!phone.startsWith('+2637')) {
      ToastAndroid.showWithGravityAndOffset(
        'Seems like your phone number is incorrect. We cannot identify any provider with that number',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        5,
        25,
      );
    } else if (password1 != password2) {
      ToastAndroid.showWithGravityAndOffset(
        'Seems like your passwords do not match. Please make sure your passwords are the same',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        5,
        25,
      );
    } else if (password1.length < 6 || password2.length < 6) {
      ToastAndroid.showWithGravityAndOffset(
        'Seems like your password is too short. All passwords must be 6 characters and above',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        5,
        25,
      );
    } else {
      this.setState({
        isloading: true,
      });
      var userexists = false;
      var correctedemail = email.split('@')[0].includes('.')
        ? email.split('@')[0].split('.').join('')
        : email.split('@')[0];
      try {
        database()
          .ref('/users/' + correctedemail)
          .once('value')
          .then(snapshot => {
            if (snapshot.exists()) {
              userexists = true;
            }

            if (userexists) {
              ToastAndroid.showWithGravityAndOffset(
                'Seems like this user already exists. Please enter correct and unique details',
                ToastAndroid.SHORT,
                ToastAndroid.CENTER,
                5,
                25,
              );
              this.setState({
                isloading: false,
              });
            } else {
              database()
                .ref('/users/' + correctedemail)
                .set({
                  name: name,
                  email: email,
                  phone: phone,
                  password: password1,
                  role: istherapist ? 'therapist' : 'user',
                  loggedin: 'yes',
                })
                .then(() =>
                  ToastAndroid.showWithGravityAndOffset(
                    'Registration Successful',
                    ToastAndroid.SHORT,
                    ToastAndroid.CENTER,
                    5,
                    25,
                  ),
                );

              var userbody = {
                name: name,
                email: email,
                phone: phone,
                password: password1,
                role: istherapist ? 'therapist' : 'user',
              };
              AsyncStorage.setItem('tfy_user', JSON.stringify(userbody));
              this.setState({
                isloading: false,
              });

              this.props.navigation.push('UserApp');
            }
          });
      } catch (e) {
        ToastAndroid.showWithGravityAndOffset(
          'Registration Failed. There was an error adding the user to the database',
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
          5,
          25,
        ),
          this.setState({
            isloading: false,
          });
      }
    }
  };

  onRenderScheduleView = () => {
    return (
      <Container
        style={{
          marginTop: hp('4%'),
          marginLeft: wp('5%'),
          marginRight: wp('5%'),
          backgroundColor: '#FFF',
        }}>
        <RadioButton.Group
          onValueChange={newValue => setValue(newValue)}
          value={this.state.value}>
          <View style={{flexDirection: 'row', flex: 0}}>
            <Text>First</Text>
            <RadioButton value="first" />
          </View>
          <View style={{flexDirection: 'row', flex: 0}}>
            <Text>Second</Text>
            <RadioButton value="second" />
          </View>
        </RadioButton.Group>
        <View style={styles.inputView}>
          <Icon
            style={styles.inputIcon}
            name="ios-person-add-outline"
            size={20}
            color="#000"
          />
          <TextInput
            ref={signnamefield => (this.signnamefield = signnamefield)}
            returnKeyType={'done'}
            autoCapitalize="none"
            blurOnSubmit
            selectionColor="#000"
            style={styles.inputTextfield}
            placeholderStyle={styles.inputTextfield}
            placeholder="Register Your Name"
            onChangeText={signupname => {
              this.setState({signupname});
            }}
            underlineColorAndroid="#CCC"
          />
        </View>
        <View style={styles.inputView}>
          <Icon
            style={styles.inputIcon}
            name="ios-mail-outline"
            size={20}
            color="#000"
          />
          <TextInput
            ref={signemailfield => (this.signemailfield = signemailfield)}
            secureTextEntry={false}
            enablesReturnKeyAutomatically
            blurOnSubmit
            returnKeyType={'done'}
            selectionColor="#000"
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            style={styles.inputTextfield}
            placeholderStyle={styles.inputTextfield}
            placeholder="Register Email Address"
            onChangeText={signupemail => {
              this.setState({signupemail});
            }}
            underlineColorAndroid="#CCC"
          />
        </View>
        <View style={styles.inputView}>
          <Icon
            style={styles.inputIcon}
            name="ios-phone-portrait-outline"
            size={20}
            color="#000"
          />
          <TextInput
            ref={signphonefield => (this.signphonefield = signphonefield)}
            returnKeyType={'done'}
            blurOnSubmit
            autoCapitalize="none"
            keyboardType="phone-pad"
            selectionColor="#000"
            style={styles.inputTextfield}
            placeholderStyle={styles.inputTextfield}
            placeholder="Register Your Phone Number"
            onChangeText={signupphone => {
              this.setState({signupphone});
            }}
            underlineColorAndroid="#CCC"
          />
        </View>
        <View style={styles.inputView}>
          <Icon
            style={styles.inputIcon}
            name="lock-closed-outline"
            size={20}
            color="#000"
          />
          <TextInput
            ref={signpass1field => (this.signpass1field = signpass1field)}
            returnKeyType={'done'}
            blurOnSubmit
            autoCapitalize="none"
            selectionColor="#000"
            style={styles.inputTextfield}
            placeholderStyle={styles.inputTextfield}
            secureTextEntry={true}
            placeholder="Register Your Password"
            onChangeText={signuppassword => {
              this.setState({signuppassword});
            }}
            underlineColorAndroid="#CCC"
          />
        </View>
        <View style={styles.inputView}>
          <Icon
            style={styles.inputIcon}
            name="lock-closed-outline"
            size={20}
            color="#000"
          />
          <TextInput
            ref={signpass2field => (this.signpass2field = signpass2field)}
            returnKeyType="done"
            blurOnSubmit
            autoCapitalize="none"
            selectionColor="#000"
            style={styles.inputTextfield}
            placeholderStyle={styles.inputTextfield}
            secureTextEntry={true}
            placeholder="Confirm Your Password"
            onChangeText={signupcpassword => {
              this.setState({signupcpassword});
            }}
            underlineColorAndroid="#CCC"
          />
        </View>
        <View style={{backgroundColor: '#FFF'}}>
          <ListItem style={{height: hp('7%')}} icon>
            <Body>
              <Text
                style={{
                  color: '#BBB',
                  fontFamily: variables[0].mainfont,
                  fontSize: wp('4%'),
                }}>
                Are you registering as a therapist?
              </Text>
            </Body>
            <Right>
              <Switch
                trackColor={{true: '#A3EBB1', false: '#CCC'}}
                thumbColor={this.state.istherapist ? '#007500' : '#AAA'}
                onValueChange={value => {
                  this.setState({
                    istherapist: value,
                  });
                }}
                value={this.state.istherapist}
              />
            </Right>
          </ListItem>
        </View>
        <TouchableOpacity
          style={{
            alignItems: 'center',
            marginTop: 20,
            borderRadius: 50,
            marginLeft: wp('15%'),
            marginRight: wp('15%'),
            backgroundColor: variables[0].bgcolor,
            padding: 10,
          }}
          onPress={this.onSignUp}>
          {this.state.isloading == true ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text
              style={{
                color: '#FFF',
                fontFamily: variables[0].mainfont,
                fontSize: wp('4.5%'),
              }}>
              Proceed
            </Text>
          )}
        </TouchableOpacity>
      </Container>
    );
  };

  onValidateEmail = email => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
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
          <Left style={{justifyContent: 'flex-end'}}>
            <TouchableOpacity
              style={{
                height: wp('10%'),
                width: wp('10%'),
                justifyContent: 'center',
              }}
              onPress={() => this.setState({logoutvisible: true})}>
              <Icon
                name="ios-chevron-back-circle-outline"
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
              Create Schedule
            </Text>
            <Text
              style={{
                width: wp('70%'),
                fontFamily: variables[0].lightfont,
                color: variables[0].bgcolor,
                fontSize: wp('2.5%'),
                marginTop: 3,
              }}>
              Fill in details about your schedule
            </Text>
          </Body>
          <Right />
        </Header>
        <KeyboardAvoidingView style={{flex: 1}} behavior="height">
          <Content>{this.onRenderScheduleView()}</Content>
        </KeyboardAvoidingView>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  inputView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  inputIcon: {
    padding: 10,
  },
  inputTextfield: {
    flex: 1,
    height: 70,
    paddingRight: 10,
    paddingBottom: 10,
    fontWeight: 'normal',
    fontFamily: variables[0].mainfont,
    fontSize: wp('4.5%'),
    backgroundColor: '#fff',
    color: '#000',
  },
});
