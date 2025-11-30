import Anthropic from '@anthropic-ai/sdk';
import { query } from '@anthropic-ai/claude-agent-sdk';

console.log('SDK imported successfully');
console.log('Anthropic SDK version:', Anthropic.VERSION);
console.log('Agent SDK query function imported:', typeof query === 'function');
console.log('SDK is ready to use');
