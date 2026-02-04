import HomeScreen from "@/src/home/screens/homeScreen";
import { FadeTransition } from "@/lib/components/core/transitions";

/**
 * Home page - thin wrapper for HomeScreen.
 * All UI logic lives in src/home/screens/homeScreen.tsx
 */
export default function HomePage() {
  return (
    <FadeTransition>
      <HomeScreen />
    </FadeTransition>
  );
}
