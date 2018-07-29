import { NavigationActions } from 'react-navigation';

export const navigateTo = (routeName, params = {}, action = null) =>
  NavigationActions.navigate({ routeName, params, action });

export const navigateBack = (routeName = null) =>
  NavigationActions.back({ key: routeName });

export default {};
