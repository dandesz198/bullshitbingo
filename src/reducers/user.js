import { HIDE_ONBOARDING, UPDATE_NAME } from '../actions';

const defaultState = {
  isFirst: true,
  myName: '',
};

export default function reducer(state = defaultState, action) {
  switch (action.type) {
    case HIDE_ONBOARDING:
      return { ...state, isFirst: false };
    case UPDATE_NAME:
      return { ...state, myName: action.payload };
    default:
      return state;
  }
}
