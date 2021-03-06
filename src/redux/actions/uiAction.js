import {
  TOAST_NOTIFICATION,
  UPDATE_ACTIVE_BOTTOM_TAB,
  HIDE_POSTS_THUMBNAILS,
  RC_OFFER,
  TOGGLE_ACCOUNTS_BOTTOM_SHEET,
} from '../constants/constants';

export const updateActiveBottomTab = (payload) => ({
  payload,
  type: UPDATE_ACTIVE_BOTTOM_TAB,
});

export const toastNotification = (payload) => ({
  payload,
  type: TOAST_NOTIFICATION,
});

export const setRcOffer = (payload) => ({
  payload,
  type: RC_OFFER,
});

export const hidePostsThumbnails = (payload) => ({
  payload,
  type: HIDE_POSTS_THUMBNAILS,
});

export const toggleAccountsBottomSheet = (payload) => ({
  payload,
  type: TOGGLE_ACCOUNTS_BOTTOM_SHEET,
});
