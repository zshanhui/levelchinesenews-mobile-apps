import { Alert, Platform, ToastAndroid } from 'react-native';

/** Short user-visible hint when a background/native-only operation fails. */
export function showErrorFeedback(title: string, message?: string): void {
  if (Platform.OS === 'android') {
    ToastAndroid.show(
      message ? `${title}: ${message}` : title,
      ToastAndroid.LONG,
    );
    return;
  }
  Alert.alert(title, message);
}

/** Short confirmation after a successful action (toast on Android, alert on iOS). */
export function showSuccessFeedback(message: string): void {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }
  Alert.alert(message);
}
