import { View, Text, StyleSheet } from 'react-native';

export default function AppButton() {
  return (
    <View style={styles.container}>
      <Text>AppButton</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
