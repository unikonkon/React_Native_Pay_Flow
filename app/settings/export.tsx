import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getDb, getAllTransactions } from '@/lib/stores/db';
import { exportToCSV, exportToExcel, exportToText } from '@/lib/utils/export';
import { importFromExcel, importFromText } from '@/lib/utils/import';
import { useTransactionStore } from '@/lib/stores/transaction-store';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';

export default function ExportScreen() {
  const loadTransactions = useTransactionStore(s => s.loadTransactions);
  const [importing, setImporting] = useState(false);

  const handleExport = async (format: 'csv' | 'excel' | 'text') => {
    try {
      const db = getDb();
      const allTx = await getAllTransactions(db);
      if (allTx.length === 0) {
        Alert.alert('ไม่มีข้อมูล', 'ยังไม่มีรายการสำหรับส่งออก');
        return;
      }
      if (format === 'csv') await exportToCSV(allTx);
      else if (format === 'excel') await exportToExcel(allTx);
      else await exportToText(allTx);
    } catch {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถส่งออกข้อมูลได้');
    }
  };

  const handleImport = async (format: 'excel' | 'text') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/plain',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const uri = result.assets[0].uri;
      setImporting(true);
      const importResult = format === 'excel' ? await importFromExcel(uri) : await importFromText(uri);
      setImporting(false);
      await loadTransactions();
      Alert.alert('นำเข้าเสร็จสิ้น', `นำเข้าสำเร็จ: ${importResult.imported} รายการ\nข้าม: ${importResult.skipped} รายการ${importResult.errors.length > 0 ? `\n\nปัญหา:\n${importResult.errors.slice(0, 5).join('\n')}` : ''}`);
    } catch {
      setImporting(false);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถนำเข้าข้อมูลได้');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView>
        <View className="px-4 py-2 bg-background">
          <Text className="text-muted-foreground text-xs font-semibold uppercase">ส่งออกข้อมูล</Text>
        </View>
        <ExportButton icon="document-text-outline" label="ส่งออก CSV" onPress={() => handleExport('csv')} />
        <ExportButton icon="grid-outline" label="ส่งออก Excel (.xlsx)" onPress={() => handleExport('excel')} />
        <ExportButton icon="reader-outline" label="ส่งออก Text (.txt)" onPress={() => handleExport('text')} />

        <View className="px-4 py-2 bg-background mt-4">
          <Text className="text-muted-foreground text-xs font-semibold uppercase">นำเข้าข้อมูล</Text>
        </View>
        <ExportButton icon="cloud-upload-outline" label={importing ? 'กำลังนำเข้า...' : 'นำเข้าจาก Excel'} onPress={() => handleImport('excel')} disabled={importing} />
        <ExportButton icon="document-outline" label={importing ? 'กำลังนำเข้า...' : 'นำเข้าจาก Text'} onPress={() => handleImport('text')} disabled={importing} />

        <View className="px-4 py-3">
          <Text className="text-muted-foreground text-xs">
            หมายเหตุ: การนำเข้าจะเพิ่มรายการใหม่ ไม่ลบรายการเดิม ชื่อหมวดหมู่ต้องตรงกับที่มีในแอป
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ExportButton({ icon, label, onPress, disabled }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} className={`flex-row items-center px-4 py-4 bg-card border-b border-border ${disabled ? 'opacity-50' : ''}`}>
      <Ionicons name={icon} size={22} color="#666" />
      <Text className="flex-1 text-foreground ml-3">{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </Pressable>
  );
}
