import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadow } from '../theme/colors';
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
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.key === value) ?? options[0];

  return (
    <View>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <Pressable onPress={() => setOpen(true)} style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}>
        {current.icon && (
          <View style={[styles.dot, current.color ? { backgroundColor: current.color } : undefined]}>
            <Ionicons name={current.icon} size={14} color={current.color ? '#fff' : colors.accent} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.triggerLabel}>{current.label}</Text>
          {current.sub ? <Text style={styles.triggerSub}>{current.sub}</Text> : null}
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.text.tertiary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            {options.map((o, i) => {
              const active = o.key === value;
              return (
                <Pressable
                  key={o.key}
                  onPress={() => {
                    onChange(o.key);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [styles.option, i !== options.length - 1 && styles.optionBorder, pressed && { backgroundColor: colors.surfaceAlt }]}
                >
                  {o.icon && (
                    <View style={[styles.dot, o.color ? { backgroundColor: o.color } : { backgroundColor: colors.accentSoft }]}>
                      <Ionicons name={o.icon} size={14} color={o.color ? '#fff' : colors.accent} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionLabel, active && { color: colors.accent }]}>{o.label}</Text>
                    {o.sub ? <Text style={styles.optionSub}>{o.sub}</Text> : null}
                  </View>
                  {active && <Ionicons name="checkmark" size={18} color={colors.accent} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.text.tertiary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  pressed: { backgroundColor: colors.surfaceAlt },
  triggerLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text.primary },
  triggerSub: { fontFamily: fonts.body, fontSize: 11, color: colors.text.tertiary, marginTop: 1 },
  dot: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.25)', justifyContent: 'center', paddingHorizontal: 32 },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.lg,
  },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  optionBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  optionLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text.primary },
  optionSub: { fontFamily: fonts.body, fontSize: 12, color: colors.text.tertiary, marginTop: 2 },
});
