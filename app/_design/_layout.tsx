// Development-only design preview screens.
// Only accessible in development builds.
import { Redirect } from 'expo-router';

export default function DesignLayoutGuard() {
  if (process.env.EXPO_PUBLIC_APP_ENV === 'production') {
    return <Redirect href="/(tabs)/home" />;
  }
  return null;
}
