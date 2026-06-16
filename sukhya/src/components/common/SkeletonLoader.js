import { View, Text, StyleSheet } from 'react-native';

export default function SkeletonLoader() {
  return (
    <View style={styles.container}>
      <Text>SkeletonLoader</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
