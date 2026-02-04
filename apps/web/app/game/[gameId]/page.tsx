"use client";

import { GameScreen } from "@/src/game/screens";
import { FadeTransition } from "@/lib/components/core/transitions";

interface GamePageProps {
  params: { gameId: string };
}

export default function GamePage({ params }: GamePageProps) {
  return (
    <FadeTransition>
      <GameScreen gameId={params.gameId} />
    </FadeTransition>
  );
}
