import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../src/store/auth';
import { colors } from '../src/theme/colors';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Wait for session restore before redirecting
  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.klakGreen} size="large" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/auth" />;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
