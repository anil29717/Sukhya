import type { Href } from 'expo-router';
import { router } from 'expo-router';

/** Go back when history exists; otherwise navigate to a safe fallback route. */
export function goBackOrReplace(fallback: Href = '/(auth)/welcome') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
