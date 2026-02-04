import { redirect } from "next/navigation";

interface LobbyPageProps {
  params: { gameId: string };
}

/**
 * Redirect old lobby URLs to the unified game page.
 * The game page now handles all phases including lobby.
 */
export default function LobbyPage({ params }: LobbyPageProps) {
  redirect(`/game/${params.gameId}`);
}
