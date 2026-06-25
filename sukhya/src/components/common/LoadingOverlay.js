import { View, Text, StyleSheet } from 'react-native';

export default function LoadingOverlay() {
  return (
    <View style={styles.container}>
      <Text>LoadingOverlay</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
