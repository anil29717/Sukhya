import { View, Text, StyleSheet } from 'react-native';

export default function StatusBadge() {
  return (
    <View style={styles.container}>
      <Text>StatusBadge</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
