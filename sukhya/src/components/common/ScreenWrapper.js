import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { FontFamily, FontSize, LineHeight } from '../../theme/typography';

export default function ScreenWrapper({ title, children }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    padding: Spacing[4],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: FontSize.lg,
    lineHeight: LineHeight.lg,
    color: Colors.textPrimary,
  },
  content: { flex: 1, padding: Spacing[4] },
});
