import { View, Text, StyleSheet } from 'react-native';

export default function Badge() {
  return (
    <View style={styles.container}>
      <Text>Badge</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
