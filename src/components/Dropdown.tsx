import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/typography';

export interface DropdownOption<T extends string> {
  key: T;
  label: string;
  sub?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

interface DropdownProps<T extends string> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (key: T) => void;
  label?: string;
}

export function Dropdown<T extends string>({ value, options, onChange, label }: DropdownProps<T>) {
  const t = useTheme();
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.key === value) ?? options[0];

  return (
    <View>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [styles.trigger, (pressed || hovered) && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${label ?? 'Choose'}: ${current.label}`}
        accessibilityHint="Opens a list of options"
      >
        {current.icon && (
          <View style={[styles.dot, current.color ? { backgroundColor: current.color } : undefined]}>
            <Ionicons name={current.icon} size={14} color={current.color ? t.colors.text.onAccent : t.colors.accentText} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.triggerLabel}>{current.label}</Text>
          {current.sub ? <Text style={styles.triggerSub}>{current.sub}</Text> : null}
        </View>
        <Ionicons name="chevron-down" size={18} color={t.colors.text.tertiary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close list">
          <View style={styles.sheet} accessibilityRole="menu">
            {options.map((o, i) => {
              const active = o.key === value;
              return (
                <Pressable
                  key={o.key}
                  onPress={() => {
                    onChange(o.key);
                    setOpen(false);
                  }}
                  style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                    styles.option,
                    i !== options.length - 1 && styles.optionBorder,
                    (pressed || hovered) && { backgroundColor: t.colors.surfaceAlt },
                  ]}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: active }}
                >
                  {o.icon && (
                    <View style={[styles.dot, o.color ? { backgroundColor: o.color } : { backgroundColor: t.colors.accentSoft }]}>
                      <Ionicons name={o.icon} size={14} color={o.color ? t.colors.text.onAccent : t.colors.accentText} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionLabel, active && { color: t.colors.accentText }]}>{o.label}</Text>
                    {o.sub ? <Text style={styles.optionSub}>{o.sub}</Text> : null}
                  </View>
                  {active && <Ionicons name="checkmark" size={18} color={t.colors.accentText} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  fieldLabel: {
    fontFamily: fonts.display,
    fontSize: 11,
    color: t.colors.text.tertiary,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  pressed: { backgroundColor: t.colors.surfaceAlt, borderColor: t.colors.borderStrong },
  triggerLabel: { fontFamily: fonts.semibold, fontSize: 14, color: t.colors.text.primary },
  triggerSub: { fontFamily: fonts.body, fontSize: 11, color: t.colors.text.tertiary, marginTop: 1 },
  dot: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.accentSoft },
  backdrop: { flex: 1, backgroundColor: t.colors.overlay, justifyContent: 'center', paddingHorizontal: 32, alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: t.colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: t.colors.border,
    overflow: 'hidden',
    ...t.shadow.lg,
  },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  optionBorder: { borderBottomWidth: 1, borderBottomColor: t.colors.border },
  optionLabel: { fontFamily: fonts.semibold, fontSize: 15, color: t.colors.text.primary },
  optionSub: { fontFamily: fonts.body, fontSize: 12, color: t.colors.text.tertiary, marginTop: 2 },
}));
