import React, {Component} from 'react';
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
} from 'react-native';
import Dialog, {
  DialogButton,
  DialogContent,
  DialogFooter,
} from 'react-native-popup-dialog';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {
  Container,
  Tab,
  Tabs,
  DefaultTabBar,
  Icon,
  Content,
  Switch,
  ListItem,
  Body,
  Right,
  Header,
} from 'native-base';
import variables from '../config/variables';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

export default class UserDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userrole: '',
      username: '',
      useremail: '',

      //Account fields
      accountname: '',
      accountphone: '',
      accountemail: '',
      accountpassword: '',
      practicenumber: '',

      //visibility
      show: false,
      isloading: false,
      istherapist: false,
      ispopupmessage: false,
      logoutvisible: false,
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
          accountname: decodedUser.name,
          accountemail: decodedUser.email,
          accountphone: decodedUser.phone,
          accountpassword: decodedUser.password,
          practicenumber:
            decodedUser.practicenumber == null ||
            decodedUser.practicenumber == undefined
              ? ''
              : decodedUser.practicenumber,
        });
      } else {
        this.setState({
          userrole: 'user',
          username: decodedUser.name,
          useremail: decodedUser.email,
          accountname: decodedUser.name,
          accountemail: decodedUser.email,
          accountphone: decodedUser.phone,
          accountpassword: decodedUser.password,
        });
      }
    }
  };

  onEdit = () => {
    var name = this.state.accountname.trim();
    var email = this.state.accountemail.trim();
    var phone = this.state.accountphone.trim();
    var password1 = this.state.accountpassword.trim();

    if (name == '' || email == '' || phone == '' || password1 == '') {
      ToastAndroid.showWithGravityAndOffset(
        'Please fill in all empty text fields',
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
        5,
        25,
      );
    } else if (!/^[a-zA-Z ]+$/.test(name)) {
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
    } else if (phone.length < 10 || phone.length > 15) {
      ToastAndroid.showWithGravityAndOffset(
        'Seems like your phone number is incorrect. Please enter a correct phone number',
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

      var body =
        this.state.userrole == 'therapist'
          ? {
              name: name,
              email: email,
              phone: phone,
              password: password1,
              practicenumber: this.state.practicenumber,
              role: 'therapist',
              loggedin: 'yes',
            }
          : {
              name: name,
              email: email,
              phone: phone,
              password: password1,
              role: 'user',
              loggedin: 'yes',
            };
      try {
        database()
          .ref('/users/' + correctedemail)
          .update(body)
          .then(() =>
            ToastAndroid.showWithGravityAndOffset(
              'Account Edit Successful',
              ToastAndroid.SHORT,
              ToastAndroid.CENTER,
              5,
              25,
            ),
          );

        var userbody =
          this.state.userrole == 'therapist'
            ? {
                name: name,
                email: email,
                phone: phone,
                password: password1,
                practicenumber: this.state.practicenumber,
                role: 'therapist',
                loggedin: 'yes',
              }
            : {
                name: name,
                email: email,
                phone: phone,
                password: password1,
                role: 'user',
                loggedin: 'yes',
              };
        AsyncStorage.setItem('tfy_user', JSON.stringify(userbody));
        this.setState({
          isloading: false,
        });
        this.props.navigation.push('UserApp');
      } catch (e) {
        ToastAndroid.showWithGravityAndOffset(
          'Account edit failed. There was an error adding your user details.',
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

  onLogout = async () => {
    this.setState({
      logoutvisible: false,
    });
    AsyncStorage.removeItem('tfy_user');
    this.props.navigation.push('Login');
  };

  onRenderUserDetails = () => {
    return (
      <Container
        style={{
          marginTop: hp('4%'),
          marginLeft: wp('5%'),
          marginRight: wp('5%'),
          backgroundColor: '#FFF',
        }}>
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
            defaultValue={this.state.accountname}
            blurOnSubmit
            selectionColor="#000"
            style={styles.inputTextfield}
            placeholderStyle={styles.inputTextfield}
            placeholder="Register Your Name"
            onChangeText={accountname => {
              this.setState({accountname});
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
            editable={false}
            enablesReturnKeyAutomatically
            blurOnSubmit
            defaultValue={this.state.accountemail}
            returnKeyType={'done'}
            selectionColor="#000"
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            style={styles.inputTextfield}
            placeholderStyle={styles.inputTextfield}
            placeholder="Register Email Address"
            onChangeText={accountemail => {
              this.setState({accountemail});
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
            defaultValue={this.state.accountphone}
            blurOnSubmit
            autoCapitalize="none"
            keyboardType="phone-pad"
            selectionColor="#000"
            style={styles.inputTextfield}
            placeholderStyle={styles.inputTextfield}
            placeholder="Register Your Phone Number"
            onChangeText={accountphone => {
              this.setState({accountphone});
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
            defaultValue={this.state.accountpassword}
            blurOnSubmit
            autoCapitalize="none"
            selectionColor="#000"
            style={styles.inputTextfield}
            placeholderStyle={styles.inputTextfield}
            secureTextEntry={true}
            placeholder="Register Your Password"
            onChangeText={accountpassword => {
              this.setState({accountpassword});
            }}
            underlineColorAndroid="#CCC"
          />
        </View>

        {this.state.userrole == 'therapist' ? (
          <View style={styles.inputView}>
            <TextInput
              ref={practicenumber => (this.practicenumber = practicenumber)}
              returnKeyType={'done'}
              defaultValue={this.state.practicenumber}
              blurOnSubmit
              autoCapitalize="none"
              selectionColor="#000"
              style={styles.inputTextfield}
              placeholderStyle={styles.inputTextfield}
              placeholder="Practice Number"
              onChangeText={practicenumber => {
                this.setState({practicenumber});
              }}
              underlineColorAndroid="#CCC"
            />
          </View>
        ) : null}

        <TouchableOpacity
          style={{
            alignItems: 'center',
            marginTop: 20,
            borderWidth: 1,
            borderRadius: 50,
            marginLeft: wp('10%'),
            marginRight: wp('10%'),
            borderColor: variables[0].bgcolor,
            padding: 10,
          }}
          onPress={() => this.onEdit()}>
          {this.state.isloading == true ? (
            <ActivityIndicator size="small" color={variables[0].bgcolor} />
          ) : (
            <Text
              style={{
                color: variables[0].bgcolor,
                fontFamily: variables[0].mainfont,
                fontSize: wp('4.5%'),
              }}>
              Save Edits
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            alignItems: 'center',
            marginTop: 20,
            borderRadius: 50,
            marginLeft: wp('10%'),
            marginRight: wp('10%'),
            backgroundColor: variables[0].bgcolor,
            padding: 10,
          }}
          onPress={() => this.setState({logoutvisible: true})}>
          <Text
            style={{
              color: '#FFF',
              fontFamily: variables[0].mainfont,
              fontSize: wp('4.5%'),
            }}>
            Logout
          </Text>
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
        <StatusBar barStyle="dark-content" backgroundColor={'#FFF'}></StatusBar>
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
              My Account
            </Text>
            <Text
              style={{
                width: wp('70%'),
                fontFamily: variables[0].lightfont,
                color: variables[0].bgcolor,
                fontSize: wp('2.8%'),
                marginTop: 3,
              }}>
              View and/or edit your account details
            </Text>
          </Body>
          <Right style={{marginRight: wp('2%')}}></Right>
        </Header>

        <Content>
          <KeyboardAvoidingView behavior="height">
            {this.onRenderUserDetails()}
          </KeyboardAvoidingView>
        </Content>

        <Dialog
          visible={this.state.logoutvisible}
          footer={
            <DialogFooter>
              <DialogButton
                text={'YES'}
                style={{backgroundColor: variables[0].bgcolor}}
                textStyle={{
                  fontFamily: variables[0].mainfont,
                  color: '#FFF',
                  textAlign: 'center',
                  fontSize: wp('4.5%'),
                }}
                onPress={this.onLogout}
              />
              <DialogButton
                text={'NO'}
                style={{backgroundColor: variables[0].bgcolor}}
                textStyle={{
                  fontFamily: variables[0].mainfont,
                  color: '#FFF',
                  textAlign: 'center',
                  fontSize: wp('4.5%'),
                }}
                onPress={() => {
                  this.setState({logoutvisible: false});
                }}
              />
            </DialogFooter>
          }>
          <DialogContent>
            <View style={{width: wp('70%')}}>
              <Text
                style={{
                  marginTop: hp('2.5%'),
                  fontFamily: variables[0].mainfont,
                  color: '#000',
                  textAlign: 'center',
                  fontSize: wp('4.5%'),
                }}>
                {
                  'Are you sure you want to logout of the application. Your chats will be saved'
                }
              </Text>
            </View>
          </DialogContent>
        </Dialog>
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
