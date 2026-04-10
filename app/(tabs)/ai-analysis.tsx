import { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { useAiHistoryStore } from '@/lib/stores/ai-history-store';
import { AiResultView } from '@/components/ai/AiResultView';
import { getDb, getTransactionsByYear } from '@/lib/stores/db';
import { analyzeFinances, getApiKey } from '@/lib/api/ai';
import type { AiHistory } from '@/types';

type PromptType = 'structured' | 'full';

export default function AiAnalysisScreen() {
  const wallets = useWalletStore(s => s.wallets);
  const { histories, addHistory, deleteHistory } = useAiHistoryStore();

  const currentYear = new Date().getFullYear() + 543;
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [promptType, setPromptType] = useState<PromptType>('structured');
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [currentResult, setCurrentResult] = useState<{ type: string; data: string } | null>(null);

  useEffect(() => {
    getApiKey().then(key => setHasApiKey(!!key));
  }, []);

  const gregorianYear = selectedYear - 543;

  const handleAnalyze = useCallback(async () => {
    const key = await getApiKey();
    if (!key) {
      Alert.alert('ยังไม่ได้ตั้งค่า', 'กรุณาตั้งค่า Gemini API Key ในหน้าตั้งค่าก่อน');
      return;
    }

    setIsLoading(true);
    setCurrentResult(null);

    try {
      const db = getDb();
      const transactions = await getTransactionsByYear(db, gregorianYear, selectedWalletId ?? undefined);

      if (transactions.length === 0) {
        Alert.alert('ไม่มีข้อมูล', `ไม่พบรายการในปี ${selectedYear}`);
        setIsLoading(false);
        return;
      }

      const result = await analyzeFinances({
        year: gregorianYear,
        walletId: selectedWalletId,
        promptType,
        transactions,
      });

      setCurrentResult({ type: result.responseType, data: result.result });

      await addHistory({
        walletId: selectedWalletId,
        promptType,
        year: gregorianYear,
        responseType: result.responseType,
        responseData: result.result,
      });
    } catch (error: any) {
      Alert.alert('ข้อผิดพลาด', error.message ?? 'ไม่สามารถวิเคราะห์ได้');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedWalletId, promptType, gregorianYear, addHistory]);

  const handleViewHistory = useCallback((history: AiHistory) => {
    setCurrentResult({ type: history.responseType, data: history.responseData });
  }, []);

  const handleDeleteHistory = useCallback((history: AiHistory) => {
    Alert.alert('ลบประวัติ', 'ต้องการลบประวัติการวิเคราะห์นี้?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => deleteHistory(history.id) },
    ]);
  }, [deleteHistory]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-foreground text-2xl font-bold mb-4">AI วิเคราะห์การเงิน</Text>

        {hasApiKey === false && (
          <View className="bg-expense/10 rounded-xl p-3 mb-4 flex-row items-center">
            <Ionicons name="warning-outline" size={18} color="#EF4444" />
            <Text className="text-foreground text-sm ml-2 flex-1">
              กรุณาตั้งค่า Gemini API Key ในหน้าตั้งค่าก่อนใช้งาน
            </Text>
          </View>
        )}

        <Text className="text-foreground font-semibold mb-2">ปี</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {years.map(y => (
              <Pressable
                key={y}
                onPress={() => setSelectedYear(y)}
                className={`px-4 py-2 rounded-full border ${
                  selectedYear === y ? 'border-primary bg-primary/10' : 'border-border bg-card'
                }`}
              >
                <Text className={`${selectedYear === y ? 'text-primary font-semibold' : 'text-foreground'}`}>
                  {y}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text className="text-foreground font-semibold mb-2">กระเป๋าเงิน</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setSelectedWalletId(null)}
              className={`px-3 py-2 rounded-full border ${
                !selectedWalletId ? 'border-primary bg-primary/10' : 'border-border bg-card'
              }`}
            >
              <Text className={`text-sm ${!selectedWalletId ? 'text-primary font-semibold' : 'text-foreground'}`}>
                ทุกกระเป๋า
              </Text>
            </Pressable>
            {wallets.map(w => (
              <Pressable
                key={w.id}
                onPress={() => setSelectedWalletId(w.id)}
                className={`flex-row items-center px-3 py-2 rounded-full border ${
                  selectedWalletId === w.id ? 'border-primary bg-primary/10' : 'border-border bg-card'
                }`}
              >
                <View className="w-5 h-5 rounded-full items-center justify-center mr-1" style={{ backgroundColor: w.color }}>
                  <Ionicons name={w.icon as keyof typeof Ionicons.glyphMap} size={10} color="white" />
                </View>
                <Text className={`text-sm ${selectedWalletId === w.id ? 'text-primary font-semibold' : 'text-foreground'}`}>
                  {w.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text className="text-foreground font-semibold mb-2">รูปแบบ</Text>
        <View className="flex-row mb-4 rounded-xl overflow-hidden border border-border">
          <Pressable
            onPress={() => setPromptType('structured')}
            className={`flex-1 py-2.5 items-center ${promptType === 'structured' ? 'bg-primary' : 'bg-card'}`}
          >
            <Text className={`text-sm font-semibold ${promptType === 'structured' ? 'text-primary-foreground' : 'text-foreground'}`}>
              วิเคราะห์แบบสรุป
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setPromptType('full')}
            className={`flex-1 py-2.5 items-center ${promptType === 'full' ? 'bg-primary' : 'bg-card'}`}
          >
            <Text className={`text-sm font-semibold ${promptType === 'full' ? 'text-primary-foreground' : 'text-foreground'}`}>
              วิเคราะห์แบบละเอียด
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleAnalyze}
          disabled={isLoading}
          className={`flex-row items-center justify-center py-4 rounded-xl mb-6 ${isLoading ? 'bg-primary/50' : 'bg-primary'}`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Ionicons name="sparkles" size={20} color="white" />
          )}
          <Text className="text-white font-bold text-lg ml-2">
            {isLoading ? 'กำลังวิเคราะห์...' : 'เริ่มวิเคราะห์'}
          </Text>
        </Pressable>

        {currentResult && (
          <View className="mb-6">
            <Text className="text-foreground font-bold text-base mb-3">ผลวิเคราะห์</Text>
            <AiResultView
              responseType={currentResult.type as any}
              responseData={currentResult.data}
            />
          </View>
        )}

        {histories.length > 0 && (
          <View>
            <Text className="text-foreground font-bold text-base mb-3">ประวัติการวิเคราะห์</Text>
            {histories.map(h => (
              <Pressable
                key={h.id}
                onPress={() => handleViewHistory(h)}
                onLongPress={() => handleDeleteHistory(h)}
                className="flex-row items-center px-4 py-3 bg-card border-b border-border rounded-xl mb-2"
              >
                <Ionicons name="document-text-outline" size={20} color="#0891b2" />
                <View className="flex-1 ml-3">
                  <Text className="text-foreground font-medium">
                    ปี {h.year + 543} — {h.walletId ? wallets.find(w => w.id === h.walletId)?.name : 'ทุกกระเป๋า'}
                  </Text>
                  <Text className="text-muted-foreground text-xs">
                    {h.promptType === 'structured' ? 'แบบสรุป' : 'แบบละเอียด'} • {new Date(h.createdAt).toLocaleDateString('th-TH')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#ccc" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
