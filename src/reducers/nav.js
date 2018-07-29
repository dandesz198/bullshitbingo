import { NavigationActions } from 'react-navigation';
import Routes from '../Routes';

const initialState = Routes.router.getStateForAction(NavigationActions.init());

const getCurrentRouteName = state => {
  const route = state.routes[state.index];
  return typeof route.index === 'undefined'
    ? route.routeName
    : getCurrentRouteName(route);
};

const getCurrentRouteParams = state => {
  const route = state.routes[state.index];
  return typeof route.index === 'undefined'
    ? route.params
    : getCurrentRouteParams(route);
};

export default (state = initialState, action) => {
  const nextState = Routes.router.getStateForAction(action, state);

  // prevents navigating twice to the same route
  if (state && nextState) {
    const stateRouteName = getCurrentRouteName(state);
    const stateParams = getCurrentRouteParams(state);
    const nextStateRouteName = getCurrentRouteName(nextState);
    const nextStateParams = getCurrentRouteParams(nextState);
    return stateRouteName === nextStateRouteName &&
      stateParams === nextStateParams
      ? state
      : nextState;
  }

  // Simply return the original `state` if `nextState` is null or undefined.
  return [nextState || state];
};
