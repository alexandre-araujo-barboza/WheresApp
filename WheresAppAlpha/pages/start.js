import React, {Component} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import RNFS from 'react-native-fs';

import ProfilePage from './profile';
import MainPage from './main';

const PROFILE = RNFS.DocumentDirectoryPath + '/profile.json';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      profile: {
        title: '',
        description: '',
        color: 'red',
      }, 
      isloading: true,
      filenotfound: false,
      errormessage: false,
    }
    this.refreshToBack = this.refreshToBack.bind(this);
  }
  
  async JSONFileReader() {
    if (await RNFS.exists(PROFILE)){
      try {
        const content = await RNFS.readFile(PROFILE, "utf8");
        const results = JSON.parse(content);
        this.setState({profile: results});
      } catch (err) {
        this.setState({errormessage: err.message});
      }
    } else {
      this.setState({filenotfound: true});   
    }
  }
  
  async JSONFileDelete() {
    return RNFS.unlink(PROFILE).then(() => {
      alert("JSON FILE DELETED!");
    }).catch((err) => {
      alert(err.message);
    });
  }

  componentDidMount() {
    /*
    this.JSONFileDelete();
    return;
    */
    this.JSONFileReader().then(() => {
      this.props.navigation.setParams({
        title: this.state.profile.title,
        description: this.state.profile.description,
        color: this.state.profile.color,
        onGoBack: this.refreshToBack,
      });
      this.setState({
        isloading: false,
      });
    });
  }
    
  refreshToBack(profile) {
    this.setState({
      isloading: true,
    });
    const userpro = profile;
    this.props.navigation.setParams({
      title: userpro.title,
      description: userpro.description,
      color: userpro.color,
    });
    this.setState({
      profile: userpro,
      filenotfound: false,
      isloading: false,
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
    if (this.state.errormessage) {
        <View>
          <Text>{this.state.errormessage}</Text>
        </View>
    }
    if (this.state.filenotfound) {
      return <ProfilePage navigation={this.props.navigation} />;
    }
    return <MainPage navigation={this.props.navigation} />;
  }
}

const styles = StyleSheet.create({
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