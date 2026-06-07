import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUiStore } from '../stores/uiStore';
import { colors, shadow } from '../theme/colors';
import { fonts } from '../theme/typography';
import { Sidebar } from './Sidebar';
import { SettingsView } from './views/SettingsView';
import { StatisticsView } from './views/StatisticsView';
import { TimerView } from './views/TimerView';

const WIDE = 900;
const SIDEBAR_W = 268;
const DRAWER_W = 300;

const VIEW_TITLE = { timer: 'Timer', stats: 'Statistics', settings: 'Settings' } as const;

export const AppShell: React.FC = () => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const view = useUiStore((s) => s.view);
  const drawerOpen = useUiStore((s) => s.drawerOpen);
  const openDrawer = useUiStore((s) => s.openDrawer);
  const closeDrawer = useUiStore((s) => s.closeDrawer);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const isWide = width >= WIDE;

  const Content = (
    <View style={styles.content}>
      {view === 'timer' && <TimerView />}
      {view === 'stats' && <StatisticsView />}
      {view === 'settings' && <SettingsView />}
    </View>
  );

  if (isWide) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={[styles.wideRow]}>
          {!collapsed && (
            <View style={[styles.sidebarWide, { paddingBottom: insets.bottom }]}>
              <Sidebar onCollapse={toggleSidebar} />
            </View>
          )}
          <View style={styles.mainWide}>
            {collapsed && (
              <Pressable onPress={toggleSidebar} style={[styles.expandBtn, { top: 14 }]} accessibilityLabel="Expand sidebar">
                <Ionicons name="menu" size={20} color={colors.text.primary} />
              </Pressable>
            )}
            {Content}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topbar}>
        <Pressable onPress={openDrawer} style={styles.menuBtn} accessibilityLabel="Open menu">
          <Ionicons name="menu" size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.topTitle}>{VIEW_TITLE[view]}</Text>
        <View style={{ width: 42 }} />
      </View>
      {Content}

      <Drawer open={drawerOpen} onClose={closeDrawer} topInset={insets.top} bottomInset={insets.bottom} />
    </View>
  );
};

const Drawer: React.FC<{ open: boolean; onClose: () => void; topInset: number; bottomInset: number }> = ({ open, onClose, topInset, bottomInset }) => {
  const x = useSharedValue(-DRAWER_W);
  useEffect(() => {
    x.value = withTiming(open ? 0 : -DRAWER_W, { duration: 220 });
  }, [open, x]);
  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.drawerRoot}>
        <Pressable style={styles.drawerBackdrop} onPress={onClose} />
        <Animated.View style={[styles.drawerPanel, { paddingTop: topInset + 6, paddingBottom: bottomInset }, panelStyle, shadow.lg]}>
          <Sidebar />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
  wideRow: { flex: 1, flexDirection: 'row' },
  sidebarWide: { width: SIDEBAR_W, backgroundColor: colors.sidebar, borderRightWidth: 1, borderRightColor: colors.border },
  mainWide: { flex: 1 },
  topbar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  menuBtn: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  expandBtn: { position: 'absolute', left: 16, zIndex: 10, width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  topTitle: { fontFamily: fonts.heading, fontSize: 17, color: colors.text.primary },
  drawerRoot: { flex: 1, flexDirection: 'row' },
  drawerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.3)' },
  drawerPanel: { width: DRAWER_W, backgroundColor: colors.sidebar, borderRightWidth: 1, borderRightColor: colors.border },
});
