"use client";

import { GameScreen } from "@/src/game/screens";

interface GamePageProps {
  params: { gameId: string };
}

export default function GamePage({ params }: GamePageProps) {
  return <GameScreen gameId={params.gameId} />;
}
