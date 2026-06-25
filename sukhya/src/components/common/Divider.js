import { View, Text, StyleSheet } from 'react-native';

export default function Divider() {
  return (
    <View style={styles.container}>
      <Text>Divider</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
