import React, { Component } from 'react';
import { StyleSheet, ScrollView, View, TextInput, Button, Picker, ActivityIndicator} from 'react-native';
import RNFS from 'react-native-fs';

const PROFILE = RNFS.DocumentDirectoryPath + '/profile.json';
const colors = [
  "red",
  "aqua",
  "blue",
  "gold",
  "green",
  "indigo",
  "linen",
  "orange",
  "purple",
  "tan",
  "tomato",
  "wheat",
  "yellow"
];

class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      profile: {
        title: '',
        description: '',
        color: 'red',
      },
      isloading: false,
    };
    this.updateProfile = this.updateProfile.bind(this);
  }
  
  async JSONFileWriter() {
    return RNFS.writeFile(PROFILE, JSON.stringify(this.state.profile), 'utf8')
      .then((success) => {
        return true;
      })
      .catch((err) => {
        console.log(err.message);
        return false;
      });
  }
  
  async updateProfile() {
    this.setState({
      isloading: true,
    });
    this.validateFields();
    if (await this.JSONFileWriter()) {
      this.props.navigation.goBack();
      this.props.navigation.state.params.onGoBack(this.state.profile);
    } else {
        alert("Could not write json!");
    }
    this.setState({
      isloading: false,
    });
  }
  
  validateFields() {
    if (this.state.profile.title == '' && this.state.profile.description == '') {
       this.state.profile.title="My Title";
       this.state.profile.description="My Description";
    }
  }

  setProfile() {
    const results = {
      title: this.props.navigation.getParam('title', ''),
      description: this.props.navigation.getParam('description', ''),
      color: this.props.navigation.getParam('color', 'red'),
    }
    this.setState({profile: results});
  }

  componentDidMount() {
    this.setProfile();
  }
  
  updateTextInput = (text, field) => {
    const userpro = this.state.profile;
    userpro[field] = text;
    this.setState({
      profile: userpro,
    });
  }

  render() {
    if (this.state.isloading) {
      return (
        <View style={styles.activity}>
          <ActivityIndicator size="large" color="#0000ff"/>
        </View>
      );
    }
    return (
      <ScrollView style={styles.container}>
        <View style={styles.subContainer}>
          <TextInput
              placeholder={'Title'}
              value={this.state.profile.title}
              onChangeText={(text) => this.updateTextInput(text, 'title')}
          />
        </View>
        <View style={styles.subContainer}>
          <TextInput
              multiline={true}
              numberOfLines={2}
              placeholder={'Description'}
              value={this.state.profile.description}
              onChangeText={(text) => this.updateTextInput(text, 'description')}
          />
        </View>
        <View style={styles.subContainer}>
          <Picker style={{ height:20, backgroundColor: 'white', width: '80%'}}
              mode="dropdown"
              selectedValue={this.state.profile.color}
              onValueChange={(text) => this.updateTextInput(text, 'color')}
          >
            {colors.map((item, index) => {
              return (<Picker.Item label={item} value={item} color={item} key={index} />); 
            })}
          </Picker>
        </View>
        <View style={styles.buttoncontainer}>
          <Button style={styles.button}
            title="SAVE"
            onPress={this.updateProfile} />
        </View>
      </ScrollView>           
    );
  }
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  button: {
    marginLeft: 20,
    marginRight: 20,
  },
  subContainer: {
    flex: 1,
    marginBottom: 20,
    padding: 5,
    borderBottomWidth: 2,
    borderBottomColor: '#CCCCCC',
  },
  activity: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  }
})

export default Profile;