import LobbyScreen from "@/src/lobby/screens/lobbyScreen";

interface LobbyPageProps {
  params: { gameId: string };
}

/**
 * Lobby page - thin wrapper for LobbyScreen.
 * All UI logic lives in src/lobby/screens/lobbyScreen.tsx
 */
export default function LobbyPage({ params }: LobbyPageProps) {
  return <LobbyScreen gameId={params.gameId} />;
}
