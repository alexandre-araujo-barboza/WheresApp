import React, { Component } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import MapView from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import firebase from 'react-native-firebase';

const {width, height} = Dimensions.get('window')
const ASPECT_RATIO = width / height
const LATITUDE_DELTA = 0.0025
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO

class Main extends Component {
  constructor(props) {
    super(props);
    this.ref = firebase.firestore().collection('WheresApp');
    this.state = {
      prevPos: null,
      curPos: { latitude: 37.420814, longitude: -122.081949 },
      curAng: 45,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
      profile: {
        title: '',
        description: '',
        color: 'red',
        timestamp: Math.floor(Date.now() / 1000),
      },
      mykey: 'undefined',
      mylocale: true,
      otherMarkers: [],
      isloading: true,
    };
    this.changePosition = this.changePosition.bind(this);
    this.getRotation = this.getRotation.bind(this);
    this.updateMap = this.updateMap.bind(this);
    this.gotoProfile = this.gotoProfile.bind(this);
    this.toogleLocale  = this.toogleLocale.bind(this);
    this.refreshToBack = this.refreshToBack.bind(this);
  }
    
  changePosition(latOffset, lonOffset) {
    const latitude = this.state.curPos.latitude + latOffset;
    const longitude = this.state.curPos.longitude + lonOffset;
    this.setState({
      prevPos: this.state.curPos,
      curPos: { latitude, longitude },
    });
    this.updateMap();
  }

  getRotation(prevPos, curPos) {
    if (!prevPos) {
      return 0;
    }
    const xDiff = curPos.latitude - prevPos.latitude;
    const yDiff = curPos.longitude - prevPos.longitude;
    return (Math.atan2(yDiff, xDiff) * 180.0) / Math.PI;
  }

  updateMap() {
    const { curPos, prevPos, curAng } = this.state;
    const curRot = this.getRotation(prevPos, curPos);
    if (this.map) {
        this.map.animateCamera({ heading: curRot, center: curPos, pitch: curAng });
    }
  }
              
  async fireCreateAndGetMyKey(profile) {
    return this.ref.add({
      title: profile.title,
      description: profile.description,
      color: profile.color,
      latitude: this.state.curPos.latitude,
      longitude: this.state.curPos.longitude,
      timestamp: Math.floor(Date.now() / 1000),
    }).then((docRef) => {
      this.setState({
         mykey: docRef.id,
      });
    }).catch((error) => {
       //console.error("Error adding document: ", error);
    });
  }
  
  async fireDestroyRecordFromMyKey() {
    const key = this.state.mykey;
    return  this.ref.doc(key).delete().then(() => {
       this.setState ({
         mykey: 'undefined',
       })
    }).catch((error) => {
       //console.error("Error removing document: ", error);
    });
  }
  
  async fireUpdateMe() {
    if (this.state.mykey == 'undefined') {
      return;
    } 
    const key = this.state.mykey;
    const updateRef = this.ref.doc(key);
    return updateRef.set({
      title: this.state.profile.title,
      description: this.state.profile.description,
      color: this.state.profile.color,
      timestamp: Math.floor(Date.now() / 1000),
      latitude:  this.state.curPos.latitude,
      longitude: this.state.curPos.longitude,
    }).then((docRef) => {
       
    }).catch((error) => {
      //console.error("Error updating document: ", error);
    });
  }
  
  async fireDeleteOneOther(key) {
    return this.ref.doc(key).delete().then(() => {
      
    }).catch((error) => {
      //console.error("Error removing document: ", error);
    });
  }
  
  onCollectionLoad = (querySnapshot) => {
    var otherMarkers = [];
    querySnapshot.forEach((doc) => {
      if (doc.id != this.state.mykey) {
        const { title, description, color, latitude, longitude, timestamp } = doc.data();
        const coordinate = {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        };
        otherMarkers.push({
          key: doc.id,
          coordinate,
          title,
          description,
          pinColor: color,
          timestamp,
        });
      }
    });
    this.setState({
      otherMarkers,
    });
  }
    
  onGarbageCollect() {
    var otherMarkers = this.state.otherMarkers;
    const now = Math.floor(Date.now() / 1000);
    const count = otherMarkers.length -1;
    for (i = count; i >= 0; i--) {
      const dif = (now - parseInt(otherMarkers[i].timestamp));
      if (dif > 5) {
        this.fireDeleteOneOther(otherMarkers[i].key).then(() => {
          otherMarkers.splice(i, 1);
          this.setState({
            otherMarkers,
          });
        });
      }
    }
  }

  tickMe() {
    if (!this.state.mylocale) {
        return;
    }
    Geolocation.getCurrentPosition((position) => {
      var lat = parseFloat(position.coords.latitude)
      var long = parseFloat(position.coords.longitude)
      var dif_lat  = lat  - this.state.curPos.latitude;
      var dif_long = long - this.state.curPos.longitude;
      if (lat > this.state.curPos.latitude || lat < this.state.curPos.latitude) {
        this.changePosition(dif_lat, 0);
      }
      if (long > this.state.curPos.longitude || long < this.state.curPos.longitude) {
        this.changePosition(0, dif_long);    
      }
    },
    error => console.log('ERROR', error.message),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 2000 }
    );
    this.fireUpdateMe();
  }
  
  tickOthers() {
    this.onGarbageCollect();
  }

  setInitialState() {
    const results = {
      title: this.props.navigation.getParam('title', ''),
      description: this.props.navigation.getParam('description', ''),
      color: this.props.navigation.getParam('color', 'red'),
    }
    this.setState({
      profile: results,
    });
    this.fireCreateAndGetMyKey(results).then(() => {
      this.unsubscribe = this.ref.onSnapshot(this.onCollectionLoad);
      this.intervalMe     = setInterval(() => this.tickMe(), 2000);
      this.intervalOthers = setInterval(() => this.tickOthers(), 5000);
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
      isloading: false,
    });
  }
 
  gotoProfile() {
    this.props.navigation.navigate('Profile', {
      title: this.state.profile.title,
      description: this.state.profile.description,
      color: this.state.profile.color,
      onGoBack: this.refreshToBack,
    });
  }
  
  toogleLocale() {
    const value = (!this.state.mylocale);
    const status = value ? "enabled" : "disabled";
    this.setState({
      mylocale: value,
    });
    if (status == "disabled")  {
      this.fireDestroyRecordFromMyKey();
    } else {
      this.fireCreateAndGetMyKey(this.state.profile);
    }
    alert("My Locale was " + status + ".");
  }

  componentDidMount() {
    Geolocation.getCurrentPosition((position) => {
      var lat = parseFloat(position.coords.latitude)
      var long = parseFloat(position.coords.longitude)
      var initialRegion = {
        latitude: lat,
        longitude: long,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }
      this.setState({curPos: initialRegion})
    },
    (error) => alert(JSON.stringify(error)),
    {  enableHighAccuracy: false, timeout: 10000, maximumAge: 2000  } );
    this.setInitialState();
  }
  
  componentWillUnmount() {
    clearInterval(this.intervalOthers);
    clearInterval(this.intervalMe);
    this.unsubscribe();
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
        <View style={styles.flex}>
        <MapView
          ref={el => (this.map = el)}
          style={styles.flex}
          minZoomLevel={15}
          initialRegion={{
            ...this.state.curPos,
            latitudeDelta: this.state.latitudeDelta,
            longitudeDelta: this.state.longitudeDelta,
          }}
          onLongPress={this.toogleLocale}
          longPressDelay={2000}>
            <MapView.Marker
              style={this.state.mylocale ? styles.inline : styles.hidden }
              coordinate={this.state.curPos}
              anchor={{ x: 0.5, y: 0.5 }}
              title={this.state.mylocale ? this.state.profile.title : ''}
              description={this.state.mylocale ? this.state.profile.description : ''}
              key={this.state.mylocale ? this.state.mykey : ''}
              pinColor={this.state.profile.color} >
              <MapView.Callout
                tooltip={true} 
                onPress={this.gotoProfile} />
            </MapView.Marker>
            {this.state.otherMarkers.map((marker) => {
              return ( 
                <MapView.Marker {...marker} 
                  key={marker.key}
                  title={marker.title}
                  description={marker.description}
                  pinColor={marker.pinColor}
                  coordinate={marker.coordinate}
                />
              );   
            })}
        </MapView>
      </View>  
    );
  }
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    width: '100%',
  },
  inline: {
    opacity: 1.0,
  },
  hidden: {
    opacity: 0.0,
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
});

export default Main;
