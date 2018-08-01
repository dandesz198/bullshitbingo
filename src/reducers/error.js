import { ERROR } from '../actions';

export default function reducer(state, action) {
  switch (action.type) {
    case ERROR:
      return { ...action.payload };
    default:
      return null;
  }
}
