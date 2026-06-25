import { View, Text, StyleSheet } from 'react-native';

export default function Avatar() {
  return (
    <View style={styles.container}>
      <Text>Avatar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
