import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Modal, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendTimerCommand } from '../lib/timerCommands';
import { useRewardStore } from '../stores/rewardStore';
import { APP_VIEWS, useUiStore } from '../stores/uiStore';
import { useSettingsStore } from '../stores/settingsStore';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/typography';
import { FlowglassMark } from './art/FlowglassMark';
import { ConsentBanner } from './feedback/ConsentBanner';
import { EvolutionOverlay } from './feedback/EvolutionOverlay';
import { LevelUpOverlay } from './feedback/LevelUpOverlay';
import { ProSheet } from './feedback/ProSheet';
import { ToastStack } from './feedback/ToastStack';
import { Sidebar } from './Sidebar';
import { CharacterView } from './views/CharacterView';
import { SettingsView } from './views/SettingsView';
import { StatisticsView } from './views/StatisticsView';
import { TimerView } from './views/TimerView';

const WIDE = 900;
const SIDEBAR_W = 272;
const DRAWER_W = 300;

const VIEW_TITLE = { timer: 'Timer', character: 'Character', stats: 'Statistics', settings: 'Settings' } as const;

/** Web keyboard shortcuts: Space start/pause · R stop/reset · S skip · 1–4 switch view · Esc close. */
const useKeyboardShortcuts = () => {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = typeof HTMLElement !== 'undefined' && e.target instanceof HTMLElement ? e.target : null;
      const tag = el?.tagName;
      const toggle = tag === 'INPUT' && ['checkbox', 'radio', 'button', 'submit', 'reset', 'range'].includes((el as HTMLInputElement).type);
      if ((tag === 'INPUT' && !toggle) || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return; // typing
      const ui = useUiStore.getState();
      const rewards = useRewardStore.getState();

      if (e.key === 'Escape') {
        if (rewards.evolution) rewards.dismissEvolution();
        else if (rewards.levelUp) rewards.dismissLevelUp();
        else if (ui.drawerOpen) ui.closeDrawer();
        return;
      }
      if (rewards.levelUp || rewards.evolution || ui.proSheet) return; // a dialog owns the keyboard
      if (e.key >= '1' && e.key <= String(APP_VIEWS.length)) {
        ui.setView(APP_VIEWS[Number(e.key) - 1]);
        return;
      }
      if (ui.view !== 'timer') return;
      if (e.key === ' ') {
        // A focused button / switch handles Space itself.
        if (toggle || tag === 'BUTTON' || tag === 'A' || el?.getAttribute('role') === 'button') return;
        e.preventDefault();
        sendTimerCommand('toggle');
      } else if (e.key === 'r' || e.key === 'R') sendTimerCommand('reset');
      else if (e.key === 's' || e.key === 'S') sendTimerCommand('skip');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
};

export const AppShell: React.FC = () => {
  const t = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const view = useUiStore((s) => s.view);
  const drawerOpen = useUiStore((s) => s.drawerOpen);
  const openDrawer = useUiStore((s) => s.openDrawer);
  const closeDrawer = useUiStore((s) => s.closeDrawer);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const isWide = width >= WIDE;
  useKeyboardShortcuts();

  // The timer stays mounted (hidden) on other views so a running session keeps
  // its phase and is still logged when it finishes in the background.
  const Content = (
    <View style={styles.content} role="main">
      <View style={[styles.fill, view !== 'timer' && styles.hidden]}>
        <TimerView />
      </View>
      {view === 'character' && <CharacterView />}
      {view === 'stats' && <StatisticsView />}
      {view === 'settings' && <SettingsView />}
    </View>
  );

  const Overlays = (
    <>
      <LevelUpOverlay />
      <EvolutionOverlay />
      <ToastStack />
      <ConsentBanner />
      <ProSheet />
    </>
  );

  if (isWide) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.wideRow}>
          {!collapsed && (
            <View style={[styles.sidebarWide, { paddingBottom: insets.bottom }]} role="navigation">
              <Sidebar onCollapse={toggleSidebar} />
            </View>
          )}
          <View style={styles.mainWide}>
            {collapsed && (
              <Pressable onPress={toggleSidebar} style={[styles.expandBtn, { top: 14 }]} accessibilityRole="button" accessibilityLabel="Expand sidebar">
                <Ionicons name="menu" size={20} color={t.colors.text.primary} />
              </Pressable>
            )}
            {Content}
          </View>
        </View>
        {Overlays}
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topbar}>
        <Pressable onPress={openDrawer} style={styles.menuBtn} accessibilityRole="button" accessibilityLabel="Open menu">
          <Ionicons name="menu" size={22} color={t.colors.text.primary} />
        </Pressable>
        <View style={styles.topCenter}>
          <FlowglassMark size={28} />
          <Text style={styles.topTitle} accessibilityRole="header">
            {VIEW_TITLE[view]}
          </Text>
        </View>
        <Pressable
          onPress={() => setThemeMode(t.isDark ? 'light' : 'dark')}
          style={styles.menuBtn}
          accessibilityRole="button"
          accessibilityLabel={t.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <Ionicons name={t.isDark ? 'sunny' : 'moon'} size={19} color={t.colors.text.secondary} />
        </Pressable>
      </View>
      {Content}

      <Drawer open={drawerOpen} onClose={closeDrawer} topInset={insets.top} bottomInset={insets.bottom} />
      {Overlays}
    </View>
  );
};

const Drawer: React.FC<{ open: boolean; onClose: () => void; topInset: number; bottomInset: number }> = ({ open, onClose, topInset, bottomInset }) => {
  const t = useTheme();
  const styles = useStyles();
  const x = useSharedValue(-DRAWER_W);
  useEffect(() => {
    x.value = withTiming(open ? 0 : -DRAWER_W, { duration: 220 });
  }, [open, x]);
  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.drawerRoot}>
        <Pressable style={styles.drawerBackdrop} onPress={onClose} accessibilityLabel="Close menu" />
        <Animated.View style={[styles.drawerPanel, { paddingTop: topInset + 6, paddingBottom: bottomInset }, panelStyle, t.shadow.lg]} role="navigation">
          <Sidebar />
        </Animated.View>
      </View>
    </Modal>
  );
};

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  content: { flex: 1 },
  fill: { flex: 1 },
  hidden: { display: 'none' },
  wideRow: { flex: 1, flexDirection: 'row' },
  sidebarWide: { width: SIDEBAR_W, backgroundColor: t.colors.sidebar, borderRightWidth: 1, borderRightColor: t.colors.border },
  mainWide: { flex: 1 },
  topbar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  menuBtn: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border },
  expandBtn: { position: 'absolute', left: 16, zIndex: 10, width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, ...t.shadow.sm },
  topCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topTitle: { fontFamily: fonts.display, fontSize: 16, letterSpacing: 1.6, color: t.colors.text.primary, textTransform: 'uppercase', transform: [{ skewX: '-8deg' }] },
  drawerRoot: { flex: 1, flexDirection: 'row' },
  drawerBackdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: t.colors.overlay },
  drawerPanel: { width: DRAWER_W, backgroundColor: t.colors.sidebar, borderRightWidth: 1, borderRightColor: t.colors.border },
}));
