import { CatCategoryIcon } from '@/components/common/CatCategoryIcon';
import { groupCategoriesByType } from '@/lib/constants/categories';
import type { Category, TransactionType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { AddCategoryModal } from './AddCategoryModal';

interface Props {
  visible: boolean;
  categories: Category[];
  selectedId?: string;
  type?: TransactionType;
  onSelect: (cat: Category) => void;
  onClose: () => void;
  columns?: number;
}

export function CategoryGridModal({
  visible,
  categories,
  selectedId,
  type,
  onSelect,
  onClose,
  columns = 5,
}: Props) {
  const [addVisible, setAddVisible] = useState(false);

  const sections = useMemo(() => groupCategoriesByType(categories), [categories]);

  // Build flat children + collect sticky-header indices so the section
  // headers pin to the top of the ScrollView as the user scrolls.
  const { children, stickyIndices } = useMemo(() => {
    const out: React.ReactNode[] = [];
    const sticky: number[] = [];

    sections.forEach(({ group, items }) => {
      sticky.push(out.length);
      out.push(
        <View
          key={`hdr-${group.id}`}
          className="bg-card flex-row items-center"
          style={{
            paddingHorizontal: 16,
          }}
        >
          <Ionicons
            name={group.ionicon as React.ComponentProps<typeof Ionicons>['name']}
            size={16}
            color="#E87A3D"
          />
          <Text
            className="text-foreground"
            style={{
              fontFamily: 'IBMPlexSansThai_600SemiBold',
              fontSize: 14,
              marginLeft: 8,
            }}
          >
            {group.name}
          </Text>
          {/* <Text
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              color: '#8A7E72',
              fontFamily: 'IBMPlexSansThai_400Regular',
            }}
          >
            {items.length}
          </Text> */}
        </View>
      );
      out.push(
        <View
          key={`grp-${group.id}`}
          className="flex-row flex-wrap"
          style={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 }}
        >
          {items.map((cat) => {
            const isSelected = cat.id === selectedId;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelect(cat);
                  onClose();
                }}
                style={{ width: `${100 / columns}%` }}
                className="items-center mb-3"
              >
                <View
                  style={{
                    borderRadius: 999,
                    borderWidth: isSelected ? 4 : 0,
                    borderColor: '#E87A3D',
                    padding: isSelected ? 2 : 0,
                  }}
                >
                  <CatCategoryIcon kind={cat.icon} bg={cat.color} size={50} />
                </View>
                <Text
                  style={{
                    fontFamily: isSelected
                      ? 'IBMPlexSansThai_600SemiBold'
                      : 'IBMPlexSansThai_400Regular',
                    fontSize: 11,
                    textAlign: 'center',
                    marginTop: 4,
                  }}
                  className={isSelected ? 'text-primary' : 'text-foreground'}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
    });

    return { children: out, stickyIndices: sticky };
  }, [sections, selectedId, columns, onSelect, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/40 items-center justify-center"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-11/12 max-w-md bg-card rounded-3xl border border-border"
          style={{ maxHeight: '75%', overflow: 'hidden' }}
        >
          {/* Header */}
          <View
            className="flex-row items-center justify-between"
            style={{ padding: 16, paddingBottom: 12 }}
          >
            <Text
              style={{ fontFamily: 'IBMPlexSansThai_700Bold', fontSize: 18 }}
              className="text-foreground"
            >
              เลือกหมวดหมู่
            </Text>
            <Pressable
              onPress={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="bg-secondary"
            >
              <Ionicons name="close" size={18} color="#6B5F52" />
            </Pressable>
          </View>

          {/* Sectioned grid — sticky group headers, items wrap horizontally */}
          <ScrollView
            stickyHeaderIndices={stickyIndices}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {children}

            {/* "+ เพิ่มหมวด" — sits at the very end (no sticky header) */}
            {type && (
              <View
                className="flex-row flex-wrap"
                style={{ paddingHorizontal: 12, paddingTop: 8 }}
              >
                <Pressable
                  onPress={() => setAddVisible(true)}
                  style={{ width: `${100 / columns}%` }}
                  className="items-center mb-3"
                >
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      borderWidth: 1.5,
                      borderStyle: 'dashed',
                      borderColor: '#E87A3D',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="add" size={22} color="#E87A3D" />
                  </View>
                  <Text
                    style={{
                      fontFamily: 'IBMPlexSansThai_600SemiBold',
                      fontSize: 11,
                      textAlign: 'center',
                      marginTop: 4,
                      color: '#E87A3D',
                    }}
                    numberOfLines={1}
                  >
                    เพิ่ม
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>

      {type && (
        <AddCategoryModal
          visible={addVisible}
          type={type}
          onClose={() => setAddVisible(false)}
        />
      )}
    </Modal>
  );
}
