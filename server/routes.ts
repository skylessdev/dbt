import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema, snapshotSchema } from "@shared/schema";
import { ProofGenerator } from "./lib/proof-generator";
import { SymbolicEngine } from "./lib/symbolic-engine";
import { EMBEDDINGS, DOMAIN } from "./lib/glyphs";
import {
  vectorDistance,
  forbiddenTransition,
  temporalResidualFromDistance,
  logicResidualFromRule,
  divergence as calcDiv,
  verdictFromDivergence,
  generateDBTReasons,
} from "./lib/fraud";
import { 
  getIntegrity, 
  getIntegrityDetails, 
  updateIntegrity 
} from "./lib/integrity";
import { appendProof, getProofChain } from "./lib/proof";

const proofGenerator = new ProofGenerator();
const symbolicEngine = new SymbolicEngine();

export async function registerRoutes(app: Express): Promise<Server> {

  // ✅ New: Submit Snapshot with runtime check
  app.post("/api/submitSnapshot", async (req, res) => {
    try {
      // Validate input at runtime
      const snapshot = snapshotSchema.parse(req.body);

      const prevState = await storage.getCurrentSymbolicState();

      const newState = {
        mode: "standard",
        tone: "neutral",
        protocols: ["snapshot_input"],
        identityVector: [
          snapshot.symbolic_vector.cognitive,
          snapshot.symbolic_vector.emotional,
          snapshot.symbolic_vector.adaptive,
          snapshot.symbolic_vector.coherence
        ],
        previousStateHash: prevState?.currentStateHash || null,
        currentStateHash: "0x" + Math.random().toString(16).slice(2, 64),
        ruleApplied: "snapshot_ingest"
      };

      await storage.createSymbolicState(newState);

      res.json({
        message: "Snapshot stored",
        newState
      });
    } catch (error) {
      console.error("Error submitting snapshot:", error);
      res.status(400).json({ message: "Invalid snapshot format", error: error instanceof Error ? error.message : error });
    }
  });

  // 🔵 Existing: Get chat messages
  app.get("/api/messages", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getMessages(limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // 🔵 Existing: Send message + generate AI response
  app.post("/api/messages", async (req, res) => {
    try {
      const validatedMessage = insertMessageSchema.parse(req.body);

      const userMessage = await storage.createMessage(validatedMessage);

      const response = await symbolicEngine.processMessage(validatedMessage.content);

      const currentState = await storage.getCurrentSymbolicState();
      const newState = await symbolicEngine.generateSymbolicTransition(
        currentState || null,
        validatedMessage.content,
        response.mode
      );

      const proof = await proofGenerator.generateTransitionProof(
        currentState || null,
        newState,
        validatedMessage.content
      );

      await storage.createProof({
        hash: proof.hash,
        proof: proof.proof,
        publicSignals: proof.publicSignals,
        previousProofHash: currentState?.currentStateHash || null,
        circuitName: "SymbolicTransition"
      });

      await storage.createSymbolicState(newState);

      const aiMessage = await storage.createMessage({
        content: response.content,
        role: "assistant"
      });

      await storage.updateMessageProof(aiMessage.id, proof.hash, newState);

      res.json({
        userMessage,
        aiMessage,
        proof: proof.hash,
        symbolicState: newState
      });
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // 🔵 Existing: Get proofs
  app.get("/api/proofs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const proofs = await storage.getRecentProofs(limit);
      res.json(proofs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch proofs" });
    }
  });

  app.get("/api/proofs/:hash", async (req, res) => {
    try {
      const proof = await storage.getProof(req.params.hash);
      if (!proof) {
        return res.status(404).json({ message: "Proof not found" });
      }
      res.json(proof);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch proof" });
    }
  });

  app.post("/api/proofs/generate", async (req, res) => {
    try {
      const currentState = await storage.getCurrentSymbolicState();
      if (!currentState) {
        return res.status(400).json({ message: "No current symbolic state found" });
      }

      const proof = await proofGenerator.generateIdentityProof(currentState);

      await storage.createProof({
        hash: proof.hash,
        proof: proof.proof,
        publicSignals: proof.publicSignals,
        previousProofHash: currentState.currentStateHash,
        circuitName: "Identity"
      });

      res.json(proof);
    } catch (error) {
      console.error("Error generating proof:", error);
      res.status(500).json({ message: "Failed to generate proof" });
    }
  });

  // 🔵 Existing: Symbolic state endpoints
  app.get("/api/symbolic-state", async (req, res) => {
    try {
      const state = await storage.getCurrentSymbolicState();
      if (!state) {
        return res.status(404).json({ message: "No symbolic state found" });
      }
      res.json(state);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch symbolic state" });
    }
  });

  app.get("/api/symbolic-state/history", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const history = await storage.getSymbolicStateHistory(limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch symbolic state history" });
    }
  });

  // 🔵 Existing: Switch mode
  app.post("/api/mode", async (req, res) => {
    try {
      const { mode } = req.body;
      const currentState = await storage.getCurrentSymbolicState();
      if (!currentState) {
        return res.status(400).json({ message: "No current symbolic state found" });
      }

      const newState = await symbolicEngine.switchMode(currentState, mode);

      const proof = await proofGenerator.generateTransitionProof(
        currentState,
        newState,
        `Mode switch to ${mode}`
      );

      await storage.createProof({
        hash: proof.hash,
        proof: proof.proof,
        publicSignals: proof.publicSignals,
        previousProofHash: currentState.currentStateHash,
        circuitName: "SymbolicTransition"
      });

      await storage.createSymbolicState(newState);

      res.json({
        symbolicState: newState,
        proof: proof.hash
      });
    } catch (error) {
      console.error("Error switching mode:", error);
      res.status(500).json({ message: "Failed to switch mode" });
    }
  });

  // 🔵 Existing: Circuits & metrics
  app.get("/api/circuits", async (req, res) => {
    try {
      const circuits = await storage.getCircuits();
      res.json(circuits);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch circuits" });
    }
  });

  app.post("/api/circuits/recompile", async (req, res) => {
    try {
      const circuits = await storage.getCircuits();
      const results = [];

      for (const circuit of circuits) {
        try {
          const compiled = await proofGenerator.compileCircuit(circuit.name);
          if (compiled) {
            await storage.updateCircuitCompilation(circuit.name, true, {
              r1cs: `circuits/${circuit.name}.r1cs`,
              wasm: `circuits/${circuit.name}.wasm`,
              pkey: `circuits/${circuit.name}_pk.key`,
              vkey: `circuits/${circuit.name}_vk.key`
            });
            results.push({ circuit: circuit.name, status: "compiled" });
          } else {
            results.push({ circuit: circuit.name, status: "failed" });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          results.push({ circuit: circuit.name, status: "error", error: errorMessage });
        }
      }

      res.json({ results });
    } catch (error) {
      console.error("Error recompiling circuits:", error);
      res.status(500).json({ message: "Failed to recompile circuits" });
    }
  });

  app.get("/api/metrics", async (req, res) => {
    try {
      const proofs = await storage.getRecentProofs(100);
      const verifiedProofs = proofs.filter(p => p.verified);

      const avgProofTime = 847;
      const circuitEfficiency = Math.round((verifiedProofs.length / proofs.length) * 100) || 92;
      const memoryUsage = "64MB";

      res.json({
        proofGeneration: `${avgProofTime}ms`,
        circuitEfficiency: `${circuitEfficiency}%`,
        memoryUsage,
        totalProofs: proofs.length,
        verifiedProofs: verifiedProofs.length,
        successRate: `${Math.round((verifiedProofs.length / proofs.length) * 100) || 100}%`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // 🔥 DBT API Endpoints - Enhanced Dual-Baseline Telemetry
  app.post("/api/detect", async (req, res) => {
    try {
      const { 
        from, 
        to, 
        actorA = 'user:A', 
        actorB = 'user:B',
        domain = DOMAIN
      } = req.body as {
        from: keyof typeof EMBEDDINGS;
        to: keyof typeof EMBEDDINGS;
        actorA?: string;
        actorB?: string;
        domain?: string;
      };

      if (!EMBEDDINGS[from] || !EMBEDDINGS[to]) {
        return res.status(400).json({ 
          error: "Invalid symbolic states", 
          available: Object.keys(EMBEDDINGS) 
        });
      }

      // Distance calculation (semantic pace proxy)
      const dist = vectorDistance(EMBEDDINGS[from], EMBEDDINGS[to]);

      // Baseline 1: Logic Verification
      const isForbidden = forbiddenTransition(from, to);
      const deltaLogic = logicResidualFromRule(isForbidden);

      // Baseline 2: Temporal Adherence  
      const deltaTemporal = temporalResidualFromDistance(dist);

      // Delta baseline (Δ) & divergence calculation
      const div = calcDiv(deltaLogic, deltaTemporal);
      const verdict = verdictFromDivergence(deltaLogic, deltaTemporal, div);

      // Get current actor integrities
      const integrityA = getIntegrity(actorA, domain);
      const integrityB = getIntegrity(actorB, domain);
      const detailsA = getIntegrityDetails(actorA, domain);
      const detailsB = getIntegrityDetails(actorB, domain);

      // Generate comprehensive reasons using DBT framework
      const reasons = generateDBTReasons(deltaLogic, deltaTemporal, div, from, to);

      // Consensus strength: inverse of divergence, clamped to [0,1]
      const consensusStrength = Math.max(0, Math.min(1, 1 - div));

      res.json({
        // Core metrics
        dist,
        delta: {
          logicResidual: deltaLogic,
          temporalResidual: deltaTemporal,
          divergence: div,
        },
        verdict,
        consensusStrength,
        reasons,
        
        // Actor context
        actors: {
          [actorA]: {
            integrity: integrityA,
            interactions: detailsA?.interactionCount ?? 0,
            averageDivergence: detailsA?.averageDivergence ?? 0.3,
          },
          [actorB]: {
            integrity: integrityB,
            interactions: detailsB?.interactionCount ?? 0,
            averageDivergence: detailsB?.averageDivergence ?? 0.3,
          },
        },
        
        // DBT metadata
        baselines: {
          logic: {
            name: 'Symbolic Consistency',
            checks: [
              {
                id: 'forbidden_transition',
                description: `Transition ${from}→${to}`,
                pass: !isForbidden,
                residual: deltaLogic,
              }
            ],
          },
          temporal: {
            name: 'Pace Adherence',
            expected: 'gradual semantic shift',
            observed: dist,
            normalizedDistance: deltaTemporal,
            description: `Vector distance ${dist.toFixed(3)} normalized to residual ${deltaTemporal.toFixed(3)}`,
          },
        },
        
        // Timestamp for trend analysis
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error in DBT detection:", error);
      res.status(500).json({ error: "Failed to perform DBT analysis" });
    }
  });

  app.post("/api/transition", async (req, res) => {
    try {
      const { 
        from, 
        to, 
        actorA = 'user:A', 
        actorB = 'user:B',
        domain = DOMAIN
      } = req.body as {
        from: keyof typeof EMBEDDINGS;
        to: keyof typeof EMBEDDINGS;
        actorA?: string;
        actorB?: string;
        domain?: string;
      };

      if (!EMBEDDINGS[from] || !EMBEDDINGS[to]) {
        return res.status(400).json({ 
          error: "Invalid symbolic states", 
          available: Object.keys(EMBEDDINGS) 
        });
      }

      // Calculate all DBT metrics
      const dist = vectorDistance(EMBEDDINGS[from], EMBEDDINGS[to]);
      const isForbidden = forbiddenTransition(from, to);
      const deltaLogic = logicResidualFromRule(isForbidden);
      const deltaTemporal = temporalResidualFromDistance(dist);
      const div = calcDiv(deltaLogic, deltaTemporal);
      const verdict = verdictFromDivergence(deltaLogic, deltaTemporal, div);

      // Get pre-update integrities
      const preIntegrityA = getIntegrity(actorA, domain);
      const preIntegrityB = getIntegrity(actorB, domain);

      // Generate comprehensive reasons
      const reasons = generateDBTReasons(deltaLogic, deltaTemporal, div, from, to);

      if (verdict === 'REJECT') {
        // Update integrity even for rejected transitions (attempted invalid moves reveal behavior)
        const postIntegrityA = updateIntegrity(actorA, domain, div);
        const postIntegrityB = updateIntegrity(actorB, domain, Math.min(div * 0.3, 1)); // counterpart smaller effect
        
        return res.status(400).json({
          ok: false,
          error: 'Invalid transition rejected by Dual-Baseline Telemetry',
          delta: {
            logicResidual: deltaLogic,
            temporalResidual: deltaTemporal,
            divergence: div,
          },
          verdict,
          reasons,
          integrityUpdates: {
            [actorA]: { before: preIntegrityA, after: postIntegrityA, change: postIntegrityA - preIntegrityA },
            [actorB]: { before: preIntegrityB, after: postIntegrityB, change: postIntegrityB - preIntegrityB },
          },
          chainExtended: false,
          timestamp: Date.now(),
        });
      }

      // Valid transition: extend proof chain
      const prevHash = globalThis.SKYLA_CHAIN?.length 
        ? globalThis.SKYLA_CHAIN[globalThis.SKYLA_CHAIN.length - 1].hash 
        : 'GENESIS';
        
      globalThis.SKYLA_CHAIN = appendProof(globalThis.SKYLA_CHAIN || [], {
        from,
        to,
        delta: dist,
        prevHash,
        deltaLogic,
        deltaTemporal,
        divergence: div,
      });

      // Update integrities for valid transitions
      const postIntegrityA = updateIntegrity(actorA, domain, div);
      const postIntegrityB = updateIntegrity(actorB, domain, Math.min(div * 0.5, 1)); // symmetric but softer

      const newProofNode = globalThis.SKYLA_CHAIN[globalThis.SKYLA_CHAIN.length - 1];

      res.json({
        ok: true,
        newState: to,
        proofHash: newProofNode.hash,
        proofIndex: newProofNode.idx,
        
        // DBT core data
        delta: {
          logicResidual: deltaLogic,
          temporalResidual: deltaTemporal,
          divergence: div,
        },
        verdict,
        consensusStrength: Math.max(0, Math.min(1, 1 - div)),
        reasons,
        
        // Integrity tracking
        integrityUpdates: {
          [actorA]: { 
            before: preIntegrityA, 
            after: postIntegrityA, 
            change: postIntegrityA - preIntegrityA 
          },
          [actorB]: { 
            before: preIntegrityB, 
            after: postIntegrityB, 
            change: postIntegrityB - preIntegrityB 
          },
        },
        
        // Chain metadata
        chainExtended: true,
        chainLength: globalThis.SKYLA_CHAIN.length,
        
        // Verification data
        baselines: {
          logic: {
            passed: !isForbidden,
            residual: deltaLogic,
            description: `Symbolic consistency: ${from}→${to}`,
          },
          temporal: {
            residual: deltaTemporal,
            rawDistance: dist,
            description: `Pace adherence: normalized distance ${deltaTemporal.toFixed(3)}`,
          },
        },
        
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error in DBT transition:", error);
      res.status(500).json({ error: "Failed to process DBT transition" });
    }
  });

  app.get("/api/proofchain", async (req, res) => {
    try {
      const chain = getProofChain();
      res.json({ chain });
    } catch (error) {
      console.error("Error fetching proof chain:", error);
      res.status(500).json({ error: "Failed to fetch proof chain" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

