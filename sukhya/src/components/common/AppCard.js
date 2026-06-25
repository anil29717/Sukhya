import { View, Text, StyleSheet } from 'react-native';

export default function AppCard() {
  return (
    <View style={styles.container}>
      <Text>AppCard</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
