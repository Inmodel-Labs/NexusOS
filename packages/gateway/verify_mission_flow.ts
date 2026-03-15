// packages/gateway/verify_mission_flow.ts
/**
 * Verification script for NexusOS Mission Control
 * Tests the Gateway -> Workflow -> MissionFeed (DO) connection.
 */

async function verify() {
  const GATEWAY_URL = 'http://localhost:8788';
  
  console.log('--- 1. Testing Gateway Health ---');
  try {
    const health = await fetch(`${GATEWAY_URL}/health`);
    console.log('Health:', await health.json());
  } catch (e) {
    console.error('Gateway not reachable. Did you run "npx wrangler dev"?');
    return;
  }

  console.log('\n--- 2. Testing Mission Submission ---');
  const mission = await fetch(`${GATEWAY_URL}/api/v1/agents/coder/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instruction: 'Verify the mission control wiring',
      metadata: { openclaw_session: 'test-session' }
    })
  });
  const missionData: any = await mission.json();
  console.log('Mission Started:', missionData);

  if (missionData.id) {
    console.log('\n--- 3. Verifying Mission in D1 ---');
    const status = await fetch(`${GATEWAY_URL}/api/v1/missions/${missionData.id}`);
    console.log('Mission Status:', await status.json());
    
    console.log('\n--- 4. Verifying WebSocket Endpoint ---');
    console.log('Manual check: Open dashboard and look for connection green indicator.');
  }
}

verify().catch(console.error);
