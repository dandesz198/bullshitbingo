import { NavigationActions } from 'react-navigation';

let navigator;

const setTopLevelNavigator = navigatorRef => {
  navigator = navigatorRef;
};

const navigateTo = (routeName, params) => {
  navigator.dispatch(
    NavigationActions.navigate({
      routeName,
      params,
    })
  );
};

const navigateBack = () => {
  navigator.dispatch(NavigationActions.back);
};

const popToTop = () => {
  navigator.dispatch(NavigationActions.back());
  navigator.dispatch(NavigationActions.back());
};

// add other navigation functions that you need and export them

export default {
  popToTop,
  navigateTo,
  navigateBack,
  setTopLevelNavigator,
};
