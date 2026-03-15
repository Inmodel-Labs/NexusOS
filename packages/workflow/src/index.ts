// packages/workflow/src/index.ts
import { NexusOSPipeline } from './pipeline';

export { NexusOSPipeline };

export default {
  async fetch(request: Request) {
    return new Response("NexusOS Workflow Entrypoint");
  }
};
