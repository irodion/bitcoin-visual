import { motion } from "framer-motion";
import { CONTAINER_VARIANTS } from "../../../shared/components/styles.ts";
import { GOSSIP_EDGES, COMPACT_BLOCK_TXS } from "./networkConstants.ts";
import { useNetworkState } from "./useNetworkState.ts";
import { GossipSimulator } from "./GossipSimulator.tsx";
import { CompactBlockRelay } from "./CompactBlockRelay.tsx";
import { EclipseAttackDemo } from "./EclipseAttackDemo.tsx";
import { BootstrapWaterfall } from "./BootstrapWaterfall.tsx";

export function NetworkTab() {
  const state = useNetworkState();

  return (
    <motion.div
      variants={CONTAINER_VARIANTS}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-5xl space-y-6"
    >
      <GossipSimulator
        nodes={state.gossipNodes}
        edges={GOSSIP_EDGES}
        tick={state.gossipTick}
        speed={state.gossipSpeed}
        running={state.gossipRunning}
        viewMode={state.gossipViewMode}
        messageCount={state.gossipMessageCount}
        onStartGossip={state.startGossip}
        onReset={state.resetGossip}
        onSpeedChange={state.setGossipSpeed}
        onViewModeChange={state.setGossipViewMode}
      />

      <CompactBlockRelay
        txs={COMPACT_BLOCK_TXS}
        phase={state.compactBlockPhase}
        savings={state.compactBlockSavings}
        onStart={state.startCompactBlockDemo}
        onReset={state.resetCompactBlock}
      />

      <EclipseAttackDemo
        phase={state.eclipsePhase}
        connections={state.eclipseConnections}
        step={state.eclipseStep}
        onAdvance={state.advanceEclipse}
        onReset={state.resetEclipse}
      />

      <BootstrapWaterfall
        stage={state.bootstrapStage}
        timer={state.bootstrapTimer}
        running={state.bootstrapRunning}
        completed={state.bootstrapCompleted}
        onStart={state.startBootstrap}
        onReset={state.resetBootstrap}
      />
    </motion.div>
  );
}
