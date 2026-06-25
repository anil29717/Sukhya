import { View, Text, StyleSheet } from 'react-native';

export default function SectionLabel() {
  return (
    <View style={styles.container}>
      <Text>SectionLabel</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
