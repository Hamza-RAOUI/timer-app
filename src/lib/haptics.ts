import * as Haptics from 'expo-haptics';

export function triggerImpact(style: 'light' | 'medium' | 'heavy' = 'medium') {
  const styleMap = {
    light: Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy: Haptics.ImpactFeedbackStyle.Heavy,
  };
  Haptics.impactAsync(styleMap[style]);
}

export function triggerNotification(type: 'success' | 'warning' | 'error') {
  const typeMap = {
    success: Haptics.NotificationFeedbackType.Success,
    warning: Haptics.NotificationFeedbackType.Warning,
    error: Haptics.NotificationFeedbackType.Error,
  };
  Haptics.notificationAsync(typeMap[type]);
}

export function triggerSelection() {
  Haptics.selectionAsync();
}
