import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { displayNumber, evaluateExpression } from "@/src/calculator/evaluator";
import { storage } from "@/src/utils/storage";

type ThemeName = "light" | "dark";
type Lang = "en" | "bn";
type Mode = "basic" | "scientific";

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  ts: number;
}

const PALETTE = {
  light: {
    background: "#F8F9FA",
    surface: "#FFFFFF",
    surfaceAlt: "#F3F4F6",
    border: "#E5E7EB",
    textPrimary: "#0A0A0A",
    textSecondary: "#6B7280",
    accent: "#4F46E5",
    accentBg: "#EEF2FF",
    btnDefault: "#FFFFFF",
    btnSpecial: "#E5E7EB",
    btnSpecialText: "#0A0A0A",
    shadow: "rgba(0,0,0,0.08)",
  },
  dark: {
    background: "#0F0F10",
    surface: "#1C1C1E",
    surfaceAlt: "#252527",
    border: "#2C2C2E",
    textPrimary: "#FFFFFF",
    textSecondary: "#8E8E93",
    accent: "#FF9F0A",
    accentBg: "#3E2A1D",
    btnDefault: "#2C2C2E",
    btnSpecial: "#3A3A3C",
    btnSpecialText: "#FFFFFF",
    shadow: "rgba(0,0,0,0.5)",
  },
};

const HISTORY_KEY = "calc.history.v1";
const PREFS_KEY = "calc.prefs.v1";

export default function CalculatorScreen() {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeName>(systemScheme === "light" ? "light" : "dark");
  const [lang, setLang] = useState<Lang>("en");
  const [mode, setMode] = useState<Mode>("basic");
  const [expression, setExpression] = useState<string>("");
  const [result, setResult] = useState<string>("0");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const colors = PALETTE[theme];
  const historyAnim = useSharedValue(0);

  useEffect(() => {
    (async () => {
      const prefs = await storage.getItem<string>(PREFS_KEY, "");
      if (prefs) {
        try {
          const p = JSON.parse(prefs);
          if (p.theme) setTheme(p.theme);
          if (p.lang) setLang(p.lang);
          if (p.mode) setMode(p.mode);
        } catch {
          // ignore
        }
      }
      const histRaw = await storage.getItem<string>(HISTORY_KEY, "");
      if (histRaw) {
        try {
          const h = JSON.parse(histRaw) as HistoryItem[];
          setHistory(h);
        } catch {
          // ignore
        }
      }
    })();
  }, []);

  useEffect(() => {
    storage.setItem(PREFS_KEY, JSON.stringify({ theme, lang, mode }));
  }, [theme, lang, mode]);

  useEffect(() => {
    storage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  }, [history]);

  useEffect(() => {
    historyAnim.value = withTiming(showHistory ? 1 : 0, { duration: 280 });
  }, [showHistory, historyAnim]);

  const historyStyle = useAnimatedStyle(() => ({
    opacity: historyAnim.value,
    transform: [{ translateY: (1 - historyAnim.value) * -40 }],
  }));

  const tap = useCallback((light: boolean = true) => {
    Haptics.impactAsync(
      light ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
    ).catch(() => {});
  }, []);

  const preview = useMemo(() => {
    if (!expression) return "";
    const res = evaluateExpression(expression);
    if (res === "Error" || res === "") return "";
    return res;
  }, [expression]);

  const append = (val: string) => {
    tap();
    setExpression((prev) => prev + val);
  };

  const clearAll = () => {
    tap(false);
    setExpression("");
    setResult("0");
  };

  const backspace = () => {
    tap();
    setExpression((prev) => prev.slice(0, -1));
  };

  const equals = () => {
    if (!expression) return;
    tap(false);
    const res = evaluateExpression(expression);
    setResult(res);
    if (res !== "Error" && res !== "") {
      const item: HistoryItem = {
        id: String(Date.now()),
        expression,
        result: res,
        ts: Date.now(),
      };
      setHistory((prev) => [item, ...prev].slice(0, 50));
    }
  };

  const toggleSign = () => {
    tap();
    setExpression((prev) => {
      const match = prev.match(/(-?\d+(?:\.\d+)?)$/);
      if (!match) return prev;
      const num = match[1];
      const idx = prev.lastIndexOf(num);
      const newNum = num.startsWith("-") ? num.slice(1) : `-${num}`;
      return prev.slice(0, idx) + newNum;
    });
  };

  const onHistoryItemPress = (item: HistoryItem) => {
    tap();
    setExpression(item.result);
    setResult(item.result);
    setShowHistory(false);
  };

  const clearHistory = () => {
    tap(false);
    setHistory([]);
  };

  const displayExpression = displayNumber(expression || "0", lang);
  const displayResult = displayNumber(
    expression && preview ? preview : result,
    lang,
  );

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const sciKeys: { label: string; value: string; testID: string }[][] = [
    [
      { label: "sin", value: "sin(", testID: "btn-sci-sin" },
      { label: "cos", value: "cos(", testID: "btn-sci-cos" },
      { label: "tan", value: "tan(", testID: "btn-sci-tan" },
      { label: "π", value: "pi", testID: "btn-sci-pi" },
      { label: "e", value: "e", testID: "btn-sci-e" },
    ],
    [
      { label: "ln", value: "ln(", testID: "btn-sci-ln" },
      { label: "log", value: "log(", testID: "btn-sci-log" },
      { label: "√", value: "sqrt(", testID: "btn-sci-sqrt" },
      { label: "x²", value: "^2", testID: "btn-sci-sq" },
      { label: "x^y", value: "^", testID: "btn-sci-pow" },
    ],
    [
      { label: "(", value: "(", testID: "btn-sci-open" },
      { label: ")", value: ")", testID: "btn-sci-close" },
      { label: "n!", value: "!", testID: "btn-sci-fact" },
      { label: "|x|", value: "abs(", testID: "btn-sci-abs" },
      { label: "exp", value: "exp(", testID: "btn-sci-exp" },
    ],
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <View style={styles.header} testID="header-controls">
        <Pressable
          testID="btn-toggle-history"
          onPress={() => {
            tap();
            setShowHistory((v) => !v);
          }}
          style={styles.iconBtn}
          hitSlop={8}
        >
          <Ionicons name="time-outline" size={22} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.segment} testID="toggle-mode">
          <Pressable
            testID="seg-mode-basic"
            onPress={() => {
              tap();
              setMode("basic");
            }}
            style={[styles.segPill, mode === "basic" && styles.segPillActive]}
          >
            <Text style={[styles.segText, mode === "basic" && styles.segTextActive]}>Basic</Text>
          </Pressable>
          <Pressable
            testID="seg-mode-sci"
            onPress={() => {
              tap();
              setMode("scientific");
            }}
            style={[styles.segPill, mode === "scientific" && styles.segPillActive]}
          >
            <Text style={[styles.segText, mode === "scientific" && styles.segTextActive]}>Sci</Text>
          </Pressable>
        </View>

        <View style={styles.rightControls}>
          <Pressable
            testID="btn-toggle-lang"
            onPress={() => {
              tap();
              setLang((l) => (l === "en" ? "bn" : "en"));
            }}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <Text style={[styles.langText, { color: colors.textPrimary }]}>
              {lang === "en" ? "EN" : "বাং"}
            </Text>
          </Pressable>
          <Pressable
            testID="btn-toggle-theme"
            onPress={() => {
              tap();
              setTheme((t) => (t === "dark" ? "light" : "dark"));
            }}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <Ionicons
              name={theme === "dark" ? "sunny-outline" : "moon-outline"}
              size={22}
              color={colors.textPrimary}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.displayArea} testID="display-area">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.displayScroll}
        >
          <Text
            testID="display-expression"
            style={[styles.expressionText, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {displayExpression}
          </Text>
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.displayScroll}
        >
          <Text
            testID="display-result"
            style={[styles.resultText, { color: colors.textPrimary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {displayResult}
          </Text>
        </ScrollView>
      </View>

      {mode === "scientific" && (
        <View style={styles.sciKeypad} testID="keypad-scientific">
          {sciKeys.map((row, ri) => (
            <View key={`sci-row-${ri}`} style={styles.sciRow}>
              {row.map((k) => (
                <Pressable
                  key={k.testID}
                  testID={k.testID}
                  onPress={() => append(k.value)}
                  style={({ pressed }) => [
                    styles.sciBtn,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Text style={[styles.sciBtnText, { color: colors.accent }]}>{k.label}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      )}

      <View style={styles.keypad} testID="keypad-basic">
        <View style={styles.row}>
          <CalcButton testID="btn-clear" label="AC" variant="special" onPress={clearAll} colors={colors} />
          <CalcButton testID="btn-sign" label="±" variant="special" onPress={toggleSign} colors={colors} />
          <CalcButton testID="btn-op-percent" label="%" variant="special" onPress={() => append("%")} colors={colors} />
          <CalcButton testID="btn-op-divide" label="÷" variant="operator" onPress={() => append("/")} colors={colors} />
        </View>
        <View style={styles.row}>
          <CalcButton testID="btn-num-7" label={displayNumber("7", lang)} onPress={() => append("7")} colors={colors} />
          <CalcButton testID="btn-num-8" label={displayNumber("8", lang)} onPress={() => append("8")} colors={colors} />
          <CalcButton testID="btn-num-9" label={displayNumber("9", lang)} onPress={() => append("9")} colors={colors} />
          <CalcButton testID="btn-op-multiply" label="×" variant="operator" onPress={() => append("*")} colors={colors} />
        </View>
        <View style={styles.row}>
          <CalcButton testID="btn-num-4" label={displayNumber("4", lang)} onPress={() => append("4")} colors={colors} />
          <CalcButton testID="btn-num-5" label={displayNumber("5", lang)} onPress={() => append("5")} colors={colors} />
          <CalcButton testID="btn-num-6" label={displayNumber("6", lang)} onPress={() => append("6")} colors={colors} />
          <CalcButton testID="btn-op-minus" label="−" variant="operator" onPress={() => append("-")} colors={colors} />
        </View>
        <View style={styles.row}>
          <CalcButton testID="btn-num-1" label={displayNumber("1", lang)} onPress={() => append("1")} colors={colors} />
          <CalcButton testID="btn-num-2" label={displayNumber("2", lang)} onPress={() => append("2")} colors={colors} />
          <CalcButton testID="btn-num-3" label={displayNumber("3", lang)} onPress={() => append("3")} colors={colors} />
          <CalcButton testID="btn-op-plus" label="+" variant="operator" onPress={() => append("+")} colors={colors} />
        </View>
        <View style={styles.row}>
          <CalcButton testID="btn-num-0" label={displayNumber("0", lang)} onPress={() => append("0")} colors={colors} wide />
          <CalcButton testID="btn-dot" label="." onPress={() => append(".")} colors={colors} />
          <CalcButton
            testID="btn-backspace"
            label=""
            icon="backspace-outline"
            variant="special"
            onPress={backspace}
            colors={colors}
          />
          <CalcButton testID="btn-equals" label="=" variant="accent" onPress={equals} colors={colors} />
        </View>
      </View>

      {showHistory && (
        <Animated.View
          testID="history-panel"
          style={[
            styles.historyPanel,
            { backgroundColor: colors.surface, borderColor: colors.border },
            historyStyle,
          ]}
        >
          <View style={styles.historyHeader}>
            <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>History</Text>
            <View style={styles.historyHeaderActions}>
              <Pressable testID="btn-clear-history" onPress={clearHistory} hitSlop={8}>
                <Text style={[styles.historyClear, { color: colors.accent }]}>Clear</Text>
              </Pressable>
              <Pressable testID="btn-close-history" onPress={() => setShowHistory(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
            {history.length === 0 ? (
              <Text style={[styles.historyEmpty, { color: colors.textSecondary }]} testID="history-empty">
                No calculations yet
              </Text>
            ) : (
              history.map((it, idx) => (
                <Pressable
                  key={it.id}
                  testID={`history-item-${idx}`}
                  onPress={() => onHistoryItemPress(it)}
                  style={[styles.historyItem, { borderBottomColor: colors.border }]}
                >
                  <Text
                    style={[styles.historyExpr, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {displayNumber(it.expression, lang)}
                  </Text>
                  <Text
                    style={[styles.historyResult, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    = {displayNumber(it.result, lang)}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

interface CalcButtonProps {
  testID: string;
  label: string;
  onPress: () => void;
  variant?: "default" | "operator" | "special" | "accent";
  wide?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  colors: typeof PALETTE.dark;
}

function CalcButton({
  testID,
  label,
  onPress,
  variant = "default",
  wide = false,
  icon,
  colors,
}: CalcButtonProps) {
  let bg = colors.btnDefault;
  let fg = colors.textPrimary;
  if (variant === "operator") {
    bg = colors.accentBg;
    fg = colors.accent;
  } else if (variant === "special") {
    bg = colors.btnSpecial;
    fg = colors.btnSpecialText;
  } else if (variant === "accent") {
    bg = colors.accent;
    fg = "#FFFFFF";
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flex: wide ? 2.1 : 1,
          aspectRatio: wide ? 2.1 : 1,
          backgroundColor: bg,
          borderRadius: 999,
          alignItems: wide ? "flex-start" : "center",
          justifyContent: "center",
          paddingLeft: wide ? 30 : 0,
          marginHorizontal: 4,
          borderWidth: 1,
          borderColor: colors.border,
        },
        pressed && {
          transform: [{ scale: 0.94 }],
          opacity: 0.85,
        },
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={26} color={fg} />
      ) : (
        <Text style={{ fontSize: 28, fontWeight: "500", color: fg }}>{label}</Text>
      )}
    </Pressable>
  );
}

const makeStyles = (colors: typeof PALETTE.dark) =>
  StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 12 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 6,
      paddingTop: 8,
      paddingBottom: 8,
    },
    iconBtn: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    langText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
    rightControls: { flexDirection: "row", gap: 8 },
    segment: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 999,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segPill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 999,
    },
    segPillActive: { backgroundColor: colors.accent },
    segText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
    segTextActive: { color: "#fff" },
    displayArea: {
      flex: 1,
      justifyContent: "flex-end",
      paddingHorizontal: 10,
      paddingBottom: 16,
      minHeight: 140,
    },
    displayScroll: {
      flexGrow: 1,
      justifyContent: "flex-end",
      flexDirection: "row",
    },
    expressionText: { fontSize: 22, fontWeight: "400", textAlign: "right" },
    resultText: {
      fontSize: 64,
      fontWeight: "300",
      letterSpacing: -1,
      textAlign: "right",
      marginTop: 6,
    },
    sciKeypad: { paddingBottom: 8 },
    sciRow: { flexDirection: "row", marginBottom: 6 },
    sciBtn: {
      flex: 1,
      marginHorizontal: 3,
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    sciBtnText: { fontSize: 15, fontWeight: "600" },
    btnPressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
    keypad: { paddingBottom: 8 },
    row: { flexDirection: "row", marginBottom: 8 },
    historyPanel: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "70%",
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 16,
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 12,
    },
    historyHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    historyTitle: { fontSize: 22, fontWeight: "700" },
    historyHeaderActions: { flexDirection: "row", alignItems: "center", gap: 16 },
    historyClear: { fontSize: 15, fontWeight: "600" },
    historyEmpty: { textAlign: "center", marginTop: 40, fontSize: 15 },
    historyItem: {
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    historyExpr: { fontSize: 15, textAlign: "right" },
    historyResult: { fontSize: 22, fontWeight: "600", textAlign: "right", marginTop: 2 },
  });
