import { View, Text, StyleSheet } from 'react-native';

export default function Toast() {
  return (
    <View style={styles.container}>
      <Text>Toast</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
