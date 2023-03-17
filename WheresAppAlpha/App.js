import React from 'react';
import { createStackNavigator, createAppContainer } from 'react-navigation';

import StartPage from './pages/start';
import ProfilePage from './pages/profile';
import MainPage from './pages/main';

console.disableYellowBox = true;

const RootStack = createStackNavigator(
  {
    Start: StartPage,
    Main: MainPage,
    Profile: ProfilePage,
  },
  { 
    initialRouteName: 'Start',
    headerMode: 'none',
    navigationOptions: {
        headerVisible: false,
    },
  },
);

const Container = createAppContainer(RootStack);

export default class App extends React.Component {
  
  render() {
    return <Container />;
  }
}
