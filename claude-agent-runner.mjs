#!/usr/bin/env node
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createHmac } from 'node:crypto';

// All sensitive values must come from environment variables - never hardcode secrets
// These will be set when the script is executed
const apiKey = process.env.ANTHROPIC_API_KEY;
const webhookUrl = process.env.WEBHOOK_URL;
const webhookSecret = process.env.WEBHOOK_SECRET;
const projectId = process.env.PROJECT_ID;
const tasks = [
  {
    "description": "Build task card component displaying title, description, due date, priority badge, and status indicator",
    "id": "TASK-002"
  },
  {
    "description": "Implement quick-add task input field for rapid task creation with minimal fields",
    "id": "TASK-004"
  },
  {
    "description": "Implement filter panel with checkboxes/dropdowns for status, due date, priority, list, and tags",
    "id": "TASK-010"
  }
];
const githubUrl = process.env.GITHUB_URL;
const githubToken = process.env.GITHUB_TOKEN;

// Validate required environment variables
if (!apiKey) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required');
}
if (!webhookUrl) {
  throw new Error('WEBHOOK_URL environment variable is required');
}
if (!webhookSecret) {
  throw new Error('WEBHOOK_SECRET environment variable is required');
}
if (!projectId) {
  throw new Error('PROJECT_ID environment variable is required');
}

// Set API key for SDK
process.env.ANTHROPIC_API_KEY = apiKey;

// Progress update helper with HMAC signature
async function sendProgressUpdate(status, currentTask = '', completedTasks = [], filesChanged = [], buildStatus = undefined, error = undefined) {
  const timestamp = new Date().toISOString();
  const payload = {
    projectId,
    status,
    currentTask,
    completedTasks,
    filesChanged,
    buildStatus,
    error,
    timestamp,
  };

  console.log(`[ProgressUpdate] Sending progress update:`, {
    status,
    currentTask: currentTask.substring(0, 100) + (currentTask.length > 100 ? '...' : ''),
    completedTasksCount: completedTasks.length,
    filesChangedCount: filesChanged.length,
    buildStatus: buildStatus || 'N/A',
    hasError: !!error,
    errorPreview: error ? error.substring(0, 200) + (error.length > 200 ? '...' : '') : 'N/A',
    timestamp,
  });

  const hmac = createHmac('sha256', webhookSecret);
  hmac.update(JSON.stringify(payload));
  const signature = hmac.digest('hex');

  // Fire and forget - don't let webhook failures block agent execution
  // Use a timeout to prevent long waits
  const fetchWithTimeout = async (url, options, timeout = 5000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  // Don't await - make it non-blocking
  fetchWithTimeout(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      signature,
    }),
  }, 5000).then(async (response) => {
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error');
      console.error(`[ProgressUpdate] ⚠️ Webhook returned error: \${response.status}`, errorText.substring(0, 200));
    } else {
      console.log(`[ProgressUpdate] ✅ Progress update sent successfully (status: \${response.status})`);
    }
  }).catch((fetchError) => {
    // Log but don't throw - webhook failures are non-fatal
    // The agent should continue even if webhook is unreachable
    console.warn(`[ProgressUpdate] ⚠️ Webhook update failed (non-fatal, continuing):`, {
      name: fetchError?.name || 'Error',
      message: fetchError?.message || String(fetchError),
      errorCode: fetchError?.code || 'N/A',
      webhookUrl: webhookUrl.substring(0, 50) + '...',
      status,
    });
    // Don't throw - continue execution even if webhook fails
  });
}

// Main execution
async function main() {
  console.log('[AgentScript] ==================== STARTING AGENT SCRIPT ====================');
  console.log('[AgentScript] Project ID:', projectId);
  console.log('[AgentScript] Webhook URL:', webhookUrl);
  console.log('[AgentScript] Number of tasks:', tasks.length);
  console.log('[AgentScript] Tasks:', tasks.map(t => t.id + ': ' + t.description).join(', '));
  console.log('[AgentScript] API Key configured:', !!apiKey);
  console.log('[AgentScript] Working directory:', process.cwd());
  
  await sendProgressUpdate('running', 'Starting task execution...', [], []);

  const completedTaskIds = [];
  const filesChanged = [];

  // Configure Agent SDK options
  // System prompt loaded from .claude/CLAUDE.md via settingSources: ['project']
  // Model is hardcoded to claude-haiku-4-5 for cost optimization
  const sdkOptions = {
      model: 'claude-haiku-4-5', // Hardcoded to Haiku 4.5 - do not change
      settingSources: ["project"],
      allowedTools: ["Read","Write","Edit","Glob","Grep","Bash","BashOutput"],
      disallowedTools: ["WebFetch","WebSearch"],
      permissionMode: 'default',
      plugins: [],
    cwd: process.cwd(),
  };
  
  console.log('[AgentScript] SDK Options configured:', {
    model: sdkOptions.model,
    settingSources: sdkOptions.settingSources,
    allowedToolsCount: sdkOptions.allowedTools?.length || 0,
    disallowedToolsCount: sdkOptions.disallowedTools?.length || 0,
    permissionMode: sdkOptions.permissionMode,
    pluginsCount: sdkOptions.plugins?.length || 0,
    cwd: sdkOptions.cwd,
  });
  
  // Check if CLAUDE.md exists
  const { existsSync, readFileSync } = await import('node:fs');
  const claudeMdPath = '.claude/CLAUDE.md';
  const claudeMdExists = existsSync(claudeMdPath);
  console.log(`[AgentScript] CLAUDE.md exists at \${claudeMdPath}: \${claudeMdExists}`);
  
  if (claudeMdExists) {
    const claudeMdContent = readFileSync(claudeMdPath, 'utf-8');
    console.log(`[AgentScript] CLAUDE.md content length: \${claudeMdContent.length} characters`);
    console.log(`[AgentScript] CLAUDE.md preview (first 500 chars): \${claudeMdContent.substring(0, 500)}...`);
  }
  
  sdkOptions.hooks = {
      SessionStart: [{
        hooks: [async (input, toolUseID, options) => {
          console.log('[AgentScript] [Hook] SessionStart triggered');
          console.log('[AgentScript] [Hook] SessionStart input:', JSON.stringify(input, null, 2));
          await sendProgressUpdate('running', 'Initializing Claude Agent SDK...', [], []);
          return { continue: true };
        }],
      }],
      SessionEnd: [{
        hooks: [async (input, toolUseID, options) => {
          console.log('[AgentScript] [Hook] SessionEnd triggered');
          console.log('[AgentScript] [Hook] SessionEnd input:', JSON.stringify(input, null, 2));
          const allTaskIds = tasks.map(t => t.id);
          await sendProgressUpdate('completed', 'All tasks completed', allTaskIds, filesChanged, 'success');
          return { continue: true };
        }],
      }],
      PreToolUse: [{
        hooks: [async (input, toolUseID, options) => {
          console.log(`[AgentScript] [Hook] PreToolUse triggered - Tool: \${input.tool_name}, ID: \${toolUseID}`);
          console.log('[AgentScript] [Hook] PreToolUse input:', JSON.stringify(input, null, 2));
          if (input.tool_name === 'Write' || input.tool_name === 'Edit') {
            const filePath = input.tool_input?.file_path || input.tool_input?.filePath;
            if (filePath && !filesChanged.includes(filePath)) {
              console.log(`[AgentScript] [Hook] File change detected: \${filePath}`);
              filesChanged.push(filePath);
              await sendProgressUpdate('running', '', completedTaskIds, filesChanged);
            }
          }
          return {
            continue: true,
            hookSpecificOutput: {
              hookEventName: 'PreToolUse',
              permissionDecision: 'approve',
            },
          };
        }],
      }],
      PostToolUse: [{
        hooks: [async (input, toolUseID, options) => {
          console.log(`[AgentScript] [Hook] PostToolUse triggered - Tool: \${input.tool_name}, ID: \${toolUseID}`);
          console.log('[AgentScript] [Hook] PostToolUse input:', JSON.stringify(input, null, 2));
          
          // Capture tool execution results to verify what was actually done
          if (input.tool_name === 'Write' || input.tool_name === 'Edit') {
            const filePath = input.tool_input?.file_path || input.tool_input?.filePath;
            const fileContent = input.tool_input?.content || input.tool_input?.file_content;
            const toolResult = input.tool_result;
            
            console.log(`[AgentScript] [Hook] PostToolUse - File operation detected:`);
            console.log(`[AgentScript]   - Tool: \${input.tool_name}`);
            console.log(`[AgentScript]   - File path: \${filePath || 'N/A'}`);
            console.log(`[AgentScript]   - Content length: \${fileContent ? fileContent.length : 'N/A'} characters`);
            console.log(`[AgentScript]   - Tool result: \${toolResult ? JSON.stringify(toolResult).substring(0, 500) : 'N/A'}`);
            
            if (filePath && !filesChanged.includes(filePath)) {
              console.log(`[AgentScript] [Hook] File change detected: \${filePath}`);
              filesChanged.push(filePath);
              await sendProgressUpdate('running', '', completedTaskIds, filesChanged);
            }
          } else if (input.tool_name === 'Bash' || input.tool_name === 'BashOutput') {
            const command = input.tool_input?.command || input.tool_input?.cmd;
            const toolResult = input.tool_result;
            
            console.log(`[AgentScript] [Hook] PostToolUse - Bash command executed:`);
            console.log(`[AgentScript]   - Command: \${command || 'N/A'}`);
            console.log(`[AgentScript]   - Tool result: \${toolResult ? JSON.stringify(toolResult).substring(0, 500) : 'N/A'}`);
          } else {
            console.log(`[AgentScript] [Hook] PostToolUse - Tool: \${input.tool_name}`);
            console.log(`[AgentScript]   - Tool result: \${input.tool_result ? JSON.stringify(input.tool_result).substring(0, 500) : 'N/A'}`);
          }
          
          return { continue: true };
        }],
      }],
    };

  // Track task statuses for table display
  const taskStatuses = tasks.map(t => ({ id: t.id, description: t.description, status: 'pending' }));
  
  // Log initial task status table (using formatted log instead of console.table for better visibility)
  console.log('[AgentScript] ==================== TASK STATUS TABLE ====================');
  console.log('[AgentScript] | Status    | Task ID              | Description');
  console.log('[AgentScript] |-----------|----------------------|----------------------------------------');
  taskStatuses.forEach(t => {
    const status = t.status.padEnd(9);
    const id = t.id.padEnd(20);
    const desc = t.description.substring(0, 50) + (t.description.length > 50 ? '...' : '');
    console.log(`[AgentScript] | \${status} | \${id} | \${desc}`);
  });
  console.log('[AgentScript] ============================================================');

  // CRITICAL: Process ONLY the tasks provided (maximum 3 most critical tasks)
  // This ensures Claude Code focuses on the most important work only
  console.log(`[AgentScript] Processing \${tasks.length} task(s) (maximum 3 allowed)`);
  
  for (const task of tasks) {
    // Update task status to running
    const taskStatus = taskStatuses.find(t => t.id === task.id);
    if (taskStatus) {
      taskStatus.status = 'running';
    }
    
    console.log(`[AgentScript] ==================== TASK \${task.id} ====================`);
    console.log(`[AgentScript] Task ID: \${task.id}`);
    console.log(`[AgentScript] Task Description: \${task.description}`);
    console.log(`[AgentScript] Completed tasks so far: \${completedTaskIds.length}`);
    console.log(`[AgentScript] Files changed so far: \${filesChanged.length}`);
    
    // Log updated task status table (using formatted log instead of console.table for better visibility)
    console.log('[AgentScript] ==================== TASK STATUS TABLE ====================');
    console.log('[AgentScript] | Status    | Task ID              | Description');
    console.log('[AgentScript] |-----------|----------------------|----------------------------------------');
    taskStatuses.forEach(t => {
      const status = t.status.padEnd(9);
      const id = t.id.padEnd(20);
      const desc = t.description.substring(0, 50) + (t.description.length > 50 ? '...' : '');
      console.log(`[AgentScript] | \${status} | \${id} | \${desc}`);
    });
    console.log('[AgentScript] ============================================================');
    
    await sendProgressUpdate(
      'running',
      task.description,
      completedTaskIds,
      filesChanged
    );

    const taskPrompt = `Task: \${task.description}

You are implementing this task in a React + Vite + TypeScript project. 

IMPORTANT: You must actually create or modify code files to complete this task. Simply acknowledging the task is not sufficient.

To complete this task:
1. Read existing files to understand the codebase structure
2. Create new files or modify existing ones with actual implementation code
3. Ensure all code follows TypeScript and React best practices
4. Use the brand colors and fonts specified in CLAUDE.md
5. Test your implementation if needed

The task is only considered complete when you have created or modified actual code files (not just documentation or configuration).

Execute the necessary file operations and code changes to complete this task.`;

    console.log(`[AgentScript] Task prompt length: \${taskPrompt.length} characters`);
    console.log(`[AgentScript] Starting SDK query for task \${task.id}...`);

    let finalResult = null;
    let messageCount = 0;
    try {
      const queryResult = query({
        prompt: taskPrompt,
        options: sdkOptions,
      });

      console.log(`[AgentScript] SDK query initiated, iterating messages...`);

      try {
        for await (const message of queryResult) {
          messageCount++;
          console.log(`[AgentScript] ==================== MESSAGE #\${messageCount} ====================`);
          console.log(`[AgentScript] Message type: \${message.type}`);
          console.log(`[AgentScript] Message subtype: \${message.subtype || 'N/A'}`);
          console.log(`[AgentScript] Has error: \${!!message.error}`);
          console.log(`[AgentScript] Has result: \${!!message.result}`);
          
          // Log full message for debugging (truncate if too large)
          const messageStr = JSON.stringify(message, null, 2);
          if (messageStr.length > 2000) {
            console.log(`[AgentScript] Full message (first 2000 chars):`, messageStr.substring(0, 2000) + '...');
          } else {
            console.log(`[AgentScript] Full message:`, messageStr);
          }

          if (message.type === 'result') {
            console.log(`[AgentScript] Result message received, subtype: \${message.subtype}`);
            if (message.subtype === 'success') {
              finalResult = message.result;
              console.log(`[AgentScript] ✅ Task \${task.id} completed successfully`);
              console.log(`[AgentScript] Result type: \${typeof finalResult}`);
              
              // Log full result object to see what Claude Code actually did
              if (finalResult && typeof finalResult === 'object') {
                console.log(`[AgentScript] Result keys: \${Object.keys(finalResult).join(', ')}`);
                const resultStr = JSON.stringify(finalResult, null, 2);
                if (resultStr.length > 5000) {
                  console.log(`[AgentScript] Full result (first 5000 chars):`, resultStr.substring(0, 5000) + '...');
                } else {
                  console.log(`[AgentScript] Full result:`, resultStr);
                }
              } else {
                console.log(`[AgentScript] Result value:`, finalResult);
              }
              
              // Break out of loop once we have a success result
              // The process may exit with code 1 during cleanup, but we already have the result
              console.log(`[AgentScript] Success result received, breaking from message loop`);
              break;
            } else {
              const errorMsg = `Task execution failed: \${message.subtype}`;
              console.error(`[AgentScript] ❌ Task \${task.id} failed with subtype: \${message.subtype}`);
              throw new Error(errorMsg);
            }
          } else if (message.type === 'error') {
            const errorDetails = {
              message: message.error?.message || 'Unknown error',
              name: message.error?.name || 'Error',
              stack: message.error?.stack || 'No stack trace',
              cause: message.error?.cause || null,
              // Capture Anthropic-specific error properties
              anthropicError: message.error?.anthropicError || message.error,
              anthropicStatusCode: message.error?.status || message.error?.statusCode || null,
              anthropicErrorType: message.error?.type || null,
            };
            console.error(`[AgentScript] ❌ SDK error message received:`, errorDetails);
            
            // Create error with all Anthropic details
            const error = new Error(`Agent SDK error: \${errorDetails.message}`);
            // Attach Anthropic error details to the error object
            if (errorDetails.anthropicStatusCode) {
              error.status = errorDetails.anthropicStatusCode;
              error.statusCode = errorDetails.anthropicStatusCode;
            }
            if (errorDetails.anthropicErrorType) {
              error.type = errorDetails.anthropicErrorType;
            }
            if (errorDetails.anthropicError) {
              error.anthropicError = errorDetails.anthropicError;
            }
            if (errorDetails.cause) {
              error.cause = errorDetails.cause;
            }
            throw error;
          } else if (message.type === 'assistant') {
            console.log(`[AgentScript] Assistant message received (message #\${messageCount})`);
            // Assistant messages may contain tool calls or execution details
            if (message.content) {
              const contentStr = typeof message.content === 'string' 
                ? message.content 
                : JSON.stringify(message.content, null, 2);
              if (contentStr.length > 1000) {
                console.log(`[AgentScript] Assistant content (first 1000 chars):`, contentStr.substring(0, 1000) + '...');
              } else {
                console.log(`[AgentScript] Assistant content:`, contentStr);
              }
            }
            // Check for tool calls in assistant message
            if (message.tool_calls || message.toolCalls) {
              const toolCalls = message.tool_calls || message.toolCalls;
              console.log(`[AgentScript] Assistant tool calls:`, JSON.stringify(toolCalls, null, 2));
            }
          } else if (message.type === 'tool_use' || message.type === 'toolUse') {
            console.log(`[AgentScript] Tool use message received (message #\${messageCount})`);
            console.log(`[AgentScript] Tool use details:`, JSON.stringify(message, null, 2));
          } else if (message.type === 'tool_result' || message.type === 'toolResult') {
            console.log(`[AgentScript] Tool result message received (message #\${messageCount})`);
            console.log(`[AgentScript] Tool result details:`, JSON.stringify(message, null, 2));
          } else {
            console.log(`[AgentScript] Unknown message type: \${message.type}`);
            console.log(`[AgentScript] Full unknown message:`, JSON.stringify(message, null, 2));
          }
          console.log(`[AgentScript] ============================================================`);
        }
      } catch (iteratorError) {
        // If we already have a success result, the process exit error is just cleanup
        // Don't fail the task if we successfully completed it
        if (finalResult) {
          console.log(`[AgentScript] ⚠️  Iterator error after success result (likely process cleanup):`, {
            name: iteratorError?.name || 'Error',
            message: iteratorError?.message || String(iteratorError),
          });
          console.log(`[AgentScript] ✅ Ignoring cleanup error since task already succeeded`);
          // Continue execution - we have the result
        } else {
          // No result yet, this is a real error
          console.error(`[AgentScript] ❌ Iterator error before result:`, {
            name: iteratorError?.name || 'Error',
            message: iteratorError?.message || String(iteratorError),
            stack: iteratorError?.stack || 'No stack trace',
          });
          throw iteratorError;
        }
      }

      console.log(`[AgentScript] Finished iterating messages. Total messages: \${messageCount}`);

      if (!finalResult) {
        console.error(`[AgentScript] ❌ No result received from agent after \${messageCount} messages`);
        throw new Error('No result received from agent');
      }
      
      console.log(`[AgentScript] ✅ Task \${task.id} completed with result`);
    } catch (error) {
      // Update task status to failed
      if (taskStatus) {
        taskStatus.status = 'failed';
      }
      
      // Log updated task status table (using formatted log instead of console.table for better visibility)
      console.error('[AgentScript] ==================== TASK STATUS TABLE (WITH ERROR) ====================');
      console.error('[AgentScript] | Status    | Task ID              | Description');
      console.error('[AgentScript] |-----------|----------------------|----------------------------------------');
      taskStatuses.forEach(t => {
        const status = t.status.padEnd(9);
        const id = t.id.padEnd(20);
        const desc = t.description.substring(0, 50) + (t.description.length > 50 ? '...' : '');
        console.error(`[AgentScript] | \${status} | \${id} | \${desc}`);
      });
      console.error('[AgentScript] ============================================================');
      
      const errorDetails = {
        name: error?.name || 'Error',
        message: error?.message || String(error),
        stack: error?.stack || 'No stack trace available',
        cause: error?.cause || null,
        code: error?.code || null,
        errno: error?.errno || null,
        syscall: error?.syscall || null,
        // Capture Anthropic SDK specific error details
        anthropicError: error?.anthropicError || null,
        anthropicStatusCode: error?.status || error?.statusCode || null,
        anthropicErrorType: error?.type || null,
      };
      
      console.error(`[AgentScript] ==================== ERROR IN TASK \${task.id} ====================`);
      console.error(`[AgentScript] Error Name: \${errorDetails.name}`);
      console.error(`[AgentScript] Error Message: \${errorDetails.message}`);
      console.error(`[AgentScript] Error Code: \${errorDetails.code || 'N/A'}`);
      console.error(`[AgentScript] Error Errno: \${errorDetails.errno || 'N/A'}`);
      console.error(`[AgentScript] Error Syscall: \${errorDetails.syscall || 'N/A'}`);
      console.error(`[AgentScript] Error Stack:\n\${errorDetails.stack}`);
      if (errorDetails.cause) {
        console.error(`[AgentScript] Error Cause:`, errorDetails.cause);
      }
      // Log Anthropic-specific error details if available
      if (errorDetails.anthropicError) {
        console.error(`[AgentScript] Anthropic Error:`, errorDetails.anthropicError);
      }
      if (errorDetails.anthropicStatusCode) {
        console.error(`[AgentScript] Anthropic Status Code: \${errorDetails.anthropicStatusCode}`);
      }
      if (errorDetails.anthropicErrorType) {
        console.error(`[AgentScript] Anthropic Error Type: \${errorDetails.anthropicErrorType}`);
      }
      console.error(`[AgentScript] Task ID: \${task.id}`);
      console.error(`[AgentScript] Task Description: \${task.description}`);
      console.error(`[AgentScript] Completed Tasks: \${JSON.stringify(completedTaskIds)}`);
      console.error(`[AgentScript] Files Changed: \${JSON.stringify(filesChanged)}`);
      console.error(`[AgentScript] Total Messages Received: \${messageCount}`);
      
      // Include all error details in the error message
      let fullErrorMsg = `\${errorDetails.message}`;
      if (errorDetails.anthropicStatusCode) {
        fullErrorMsg += `\nAnthropic Status Code: \${errorDetails.anthropicStatusCode}`;
      }
      if (errorDetails.anthropicErrorType) {
        fullErrorMsg += `\nAnthropic Error Type: \${errorDetails.anthropicErrorType}`;
      }
      if (errorDetails.stack) {
        fullErrorMsg += `\nStack: \${errorDetails.stack}`;
      }
      if (errorDetails.cause) {
        fullErrorMsg += `\nCause: \${JSON.stringify(errorDetails.cause)}`;
      }
      
      await sendProgressUpdate('error', `Task failed: \${task.description}`, completedTaskIds, filesChanged, undefined, fullErrorMsg);
      throw error;
    }

    // Update task status to completed
    if (taskStatus) {
      taskStatus.status = 'completed';
    }
    
    completedTaskIds.push(task.id);
    console.log(`[AgentScript] ✅ Task \${task.id} marked as completed`);
    console.log(`[AgentScript] Total completed: \${completedTaskIds.length}/\${tasks.length}`);
    
    // Verify that files were actually changed
    try {
      const { exec } = await import('node:child_process');
      const { promisify } = await import('node:util');
      const execAsync = promisify(exec);
      const gitStatusCheck = await execAsync('git status --porcelain', {
        maxBuffer: 10 * 1024 * 1024,
      });
      const changedFiles = (gitStatusCheck.stdout || '').split('\n').filter(l => l.trim()).length;
      console.log(`[AgentScript] Files changed after task \${task.id}: \${changedFiles}`);
      
      if (changedFiles === 0 && filesChanged.length === 0) {
        console.warn(`[AgentScript] ⚠️  WARNING: Task \${task.id} completed but no files were changed. This might indicate the task didn't actually generate code.`);
      }
    } catch (verifyError) {
      console.warn(`[AgentScript] ⚠️  Could not verify file changes: \${verifyError}`);
    }
    
    // Log updated task status table (using formatted log instead of console.table for better visibility)
    console.log('[AgentScript] ==================== TASK STATUS TABLE ====================');
    console.log('[AgentScript] | Status    | Task ID              | Description');
    console.log('[AgentScript] |-----------|----------------------|----------------------------------------');
    taskStatuses.forEach(t => {
      const status = t.status.padEnd(9);
      const id = t.id.padEnd(20);
      const desc = t.description.substring(0, 50) + (t.description.length > 50 ? '...' : '');
      console.log(`[AgentScript] | \${status} | \${id} | \${desc}`);
    });
    console.log('[AgentScript] ============================================================');
    
    await sendProgressUpdate(
      'running',
      `Task completed: \${task.description}`,
      completedTaskIds,
      filesChanged
    );
  }
  
  // Verify all tasks are completed before building
  const allTasksCompleted = completedTaskIds.length === tasks.length;
  if (!allTasksCompleted) {
    const errorMsg = `Cannot build: Only \${completedTaskIds.length} of \${tasks.length} tasks completed`;
    console.error('[AgentScript] ❌', errorMsg);
    console.error('[AgentScript] Completed tasks:', completedTaskIds);
    console.error('[AgentScript] All tasks:', tasks.map(t => t.id));
    throw new Error(errorMsg);
  }
  
  // Log final task status table (using formatted log instead of console.table for better visibility)
  console.log('[AgentScript] ==================== FINAL TASK STATUS TABLE ====================');
  console.log('[AgentScript] | Status    | Task ID              | Description');
  console.log('[AgentScript] |-----------|----------------------|----------------------------------------');
  taskStatuses.forEach(t => {
    const status = t.status.padEnd(9);
    const id = t.id.padEnd(20);
    const desc = t.description.substring(0, 50) + (t.description.length > 50 ? '...' : '');
    console.log(`[AgentScript] | \${status} | \${id} | \${desc}`);
  });
  console.log('[AgentScript] ============================================================');

          console.log('[AgentScript] ==================== ALL TASKS COMPLETED ====================');
          console.log('[AgentScript] Starting build process...');
          console.log('[AgentScript] Completed tasks:', completedTaskIds);
          console.log('[AgentScript] Files tracked by hooks:', filesChanged.length, 'files');
          console.log('[AgentScript] Files tracked by hooks:', filesChanged);
          
          // Check actual files in the working directory
          console.log('[AgentScript] Checking actual files in working directory...');
          try {
            const { readdirSync, statSync } = await import('node:fs');
            const { join } = await import('node:path');
            
            function getAllFiles(dir, fileList = []) {
              const files = readdirSync(dir);
              files.forEach(file => {
                const filePath = join(dir, file);
                // Skip node_modules, .git, and other ignored directories
                if (file.startsWith('.') && file !== '.claude' && file !== '.gitignore') {
                  return;
                }
                if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') {
                  return;
                }
                try {
                  const stat = statSync(filePath);
                  if (stat.isDirectory()) {
                    getAllFiles(filePath, fileList);
                  } else {
                    fileList.push(filePath);
                  }
                } catch {
                  // Skip files we can't read
                }
              });
              return fileList;
            }
            
            const allFiles = getAllFiles(process.cwd());
            console.log('[AgentScript] Total files in working directory:', allFiles.length);
            console.log('[AgentScript] Sample files:', allFiles.slice(0, 30).map(f => f.replace(process.cwd() + '/', '')).join(', '));
            if (allFiles.length > 30) {
              console.log('[AgentScript] ... and', allFiles.length - 30, 'more files');
            }
          } catch (dirError) {
            console.log('[AgentScript] ⚠️ Could not list directory files:', dirError);
          }
  
  await sendProgressUpdate('running', 'Running build command...', completedTaskIds, [], 'building');
  
  const { exec } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execAsync = promisify(exec);

  console.log('[AgentScript] Executing: npm run build');
  console.log('[AgentScript] Working directory:', process.cwd());
  
  try {
    const { stdout, stderr } = await execAsync('npm run build', {
      maxBuffer: 10 * 1024 * 1024,
    });
    
    console.log('[AgentScript] Build stdout length:', stdout?.length || 0);
    console.log('[AgentScript] Build stderr length:', stderr?.length || 0);
    
    if (stdout) {
      console.log('[AgentScript] Build stdout:', stdout.substring(0, 1000) + (stdout.length > 1000 ? '...' : ''));
    }
    
    if (stderr) {
      console.log('[AgentScript] Build stderr:', stderr.substring(0, 1000) + (stderr.length > 1000 ? '...' : ''));
    }
    
    // Only fail if stderr contains actual errors (not just warnings)
    if (stderr && !stderr.includes('warning') && !stderr.includes('WARN')) {
      console.error('[AgentScript] ❌ Build failed with errors in stderr');
      throw new Error(`Build failed: \${stderr}`);
    }
    
    console.log('[AgentScript] ✅ Build completed successfully');
    await sendProgressUpdate('completed', 'Build successful', completedTaskIds, [], 'success');
    
    // Commit and push code to GitHub if repository URL is provided
    if (githubUrl && githubToken) {
      console.log('[AgentScript] ==================== COMMITTING CODE TO GITHUB ====================');
      await sendProgressUpdate('running', 'Committing code to GitHub...', completedTaskIds, filesChanged);
      
      try {
        // Verify git is initialized
        console.log('[AgentScript] Checking if git repository is initialized...');
        try {
          await execAsync('git rev-parse --git-dir', {
            maxBuffer: 1024 * 1024,
          });
          console.log('[AgentScript] ✅ Git repository is initialized');
        } catch {
          console.log('[AgentScript] ⚠️ Git repository not initialized, initializing...');
          await execAsync('git init', {
            maxBuffer: 1024 * 1024,
          });
          console.log('[AgentScript] ✅ Git repository initialized');
        }
        
        // Configure git
        console.log('[AgentScript] Configuring git user...');
        await execAsync('git config user.name "VibeStack Agent"', {
          maxBuffer: 1024 * 1024,
        });
        await execAsync('git config user.email "hello@vibestack.codes"', {
          maxBuffer: 1024 * 1024,
        });
        console.log('[AgentScript] ✅ Git user configured');
        
        // Check if remote exists, if not add it
        console.log('[AgentScript] Checking git remote...');
        let remoteExists = false;
        try {
          const remoteResult = await execAsync('git remote get-url origin', {
            maxBuffer: 1024 * 1024,
          });
          remoteExists = true;
          console.log('[AgentScript] Remote origin exists:', remoteResult.stdout?.trim() || '(unknown)');
        } catch {
          console.log('[AgentScript] Remote origin does not exist, will be added');
        }
        
        // Configure remote URL with token
        const repoUrl = new URL(githubUrl);
        const remoteUrl = 'https://' + githubToken + '@' + repoUrl.host + repoUrl.pathname;
        
        if (remoteExists) {
          console.log('[AgentScript] Updating remote URL...');
          await execAsync('git remote set-url origin ' + remoteUrl, {
            maxBuffer: 1024 * 1024,
          });
        } else {
          console.log('[AgentScript] Adding remote origin...');
          await execAsync('git remote add origin ' + remoteUrl, {
            maxBuffer: 1024 * 1024,
          });
        }
        console.log('[AgentScript] ✅ Remote URL configured:', remoteUrl.replace(githubToken, '***'));
        
        // Check git status
        console.log('[AgentScript] Checking git status...');
        const { stdout: gitStatus } = await execAsync('git status --porcelain', {
          maxBuffer: 10 * 1024 * 1024,
        });
        
        if (!gitStatus || gitStatus.trim().length === 0) {
          console.log('[AgentScript] No changes to commit');
          // Check if there are any commits
          try {
            const logResult = await execAsync('git log --oneline -1', {
              maxBuffer: 1024 * 1024,
            });
            console.log('[AgentScript] Last commit:', logResult.stdout?.trim() || '(no commits)');
          } catch {
            console.log('[AgentScript] No commits found in repository');
          }
        } else {
          console.log('[AgentScript] Changes detected:');
          console.log(gitStatus);
          console.log('[AgentScript] Total changes:', gitStatus.split('\n').filter(l => l.trim()).length, 'files');
          
          // Remove temporary files that shouldn't be committed
          console.log('[AgentScript] Cleaning up temporary files...');
          const tempFiles = [
            'claude-agent-runner.mjs',
            'read-stdout.mjs',
            'read-stderr.mjs',
            'verify.mjs',
          ];
          
          for (const tempFile of tempFiles) {
            try {
              await execAsync('rm -f ' + tempFile, {
                maxBuffer: 1024 * 1024,
              });
              console.log('[AgentScript] ✅ Removed temporary file: ' + tempFile);
            } catch {
              // File might not exist, that's OK
            }
          }
          
          // Ensure .gitignore excludes temporary files
          console.log('[AgentScript] Updating .gitignore to exclude temporary files...');
          try {
            // Check if .gitignore exists and contains our exclusions
            const gitignoreCheck = await execAsync('grep -q "claude-agent-runner.mjs" .gitignore 2>/dev/null || echo "missing"', {
              maxBuffer: 1024 * 1024,
            });
            const gitignoreContent = gitignoreCheck.stdout || '';
            
            if (gitignoreContent.includes('missing')) {
              // Add exclusions to .gitignore
              const gitignoreEntries = tempFiles.map(f => f + '\n').join('');
              await execAsync('echo "' + gitignoreEntries + '" >> .gitignore', {
                maxBuffer: 1024 * 1024,
              });
              console.log('[AgentScript] ✅ Updated .gitignore');
            } else {
              console.log('[AgentScript] ✅ .gitignore already configured');
            }
          } catch {
            // If .gitignore doesn't exist, create it
            try {
              const gitignoreEntries = tempFiles.map(f => f + '\n').join('');
              await execAsync('echo "' + gitignoreEntries + '" > .gitignore', {
                maxBuffer: 1024 * 1024,
              });
              console.log('[AgentScript] ✅ Created .gitignore');
            } catch {
              console.log('[AgentScript] ⚠️ Could not update .gitignore (non-fatal)');
            }
          }
          
          // Remove any temporary files from git index if they were already tracked
          console.log('[AgentScript] Removing temporary files from git index...');
          for (const tempFile of tempFiles) {
            try {
              await execAsync('git rm --cached ' + tempFile + ' 2>/dev/null || true', {
                maxBuffer: 1024 * 1024,
              });
            } catch {
              // File might not be tracked, that's OK
            }
          }
          
          // Add all changes (excluding files in .gitignore)
          console.log('[AgentScript] Adding changes (excluding temporary files)...');
          await execAsync('git add -A', {
            maxBuffer: 10 * 1024 * 1024,
          });
          console.log('[AgentScript] ✅ All changes staged');
          
          // Verify no secrets are being committed
          console.log('[AgentScript] Verifying no secrets in staged files...');
          try {
            const stagedFiles = await execAsync('git diff --cached --name-only', {
              maxBuffer: 10 * 1024 * 1024,
            });
            const filesList = (stagedFiles.stdout || '').split('\n').filter(f => f.trim());
            console.log('[AgentScript] Files to be committed:', filesList.length);
            
            // Check if any temporary files are still staged
            const tempFilesStaged = filesList.filter(f => tempFiles.some(tf => f.includes(tf)));
            if (tempFilesStaged.length > 0) {
              console.error('[AgentScript] ⚠️ Warning: Temporary files still staged:', tempFilesStaged);
              // Remove them from staging
              for (const file of tempFilesStaged) {
                await execAsync('git reset HEAD "' + file + '" 2>/dev/null || true', {
                  maxBuffer: 1024 * 1024,
                });
              }
              console.log('[AgentScript] ✅ Removed temporary files from staging');
            }
          } catch {
            console.log('[AgentScript] ⚠️ Could not verify staged files (non-fatal)');
          }
          
          // Get actual file count and list from git status (more accurate than filesChanged array)
          let actualFilesChanged = 0;
          let actualFilesList = [];
          try {
            const gitStatusAfterCleanup = await execAsync('git status --porcelain', {
              maxBuffer: 10 * 1024 * 1024,
            });
            const statusOutput = gitStatusAfterCleanup.stdout || '';
            const statusLines = statusOutput.split('\n').filter(l => l.trim()); // Fixed: escape newline in template literal
            actualFilesChanged = statusLines.length;
            actualFilesList = statusLines.map(line => {
              // Extract filename from git status line
              // Format examples: "?? filename", " M filename", "A  filename", " M src/file.ts"
              // Git status format: <status> <filename> or <status><space><space><filename>
              const trimmed = line.trim();
              // Remove status prefix (2 chars like "??", " M", "A ", etc.)
              // Status is always at the start, followed by space(s), then filename
              const match = trimmed.match(/^.{1,2}s+(.+)$/);
              if (match && match[1]) {
                return match[1].trim();
              }
              // Fallback: if no match, try splitting by whitespace and take everything after first part
              const parts = trimmed.split(/s+/);
              if (parts.length > 1) {
                return parts.slice(1).join(' ').trim();
              }
              return trimmed; // Fallback to full line if parsing fails
            }).filter(f => f && f.length > 0 && !f.includes('\n')); // Fixed: escape newline in template literal
            console.log('[AgentScript] Actual files to commit:', actualFilesChanged);
            console.log('[AgentScript] Files list:', actualFilesList.slice(0, 20).join(', ') + (actualFilesList.length > 20 ? '...' : ''));
            if (actualFilesList.length > 20) {
              console.log('[AgentScript] ... and', actualFilesList.length - 20, 'more files');
            }
          } catch {
            // Fallback to filesChanged array if git status fails
            actualFilesChanged = filesChanged.length;
            actualFilesList = filesChanged;
            console.log('[AgentScript] Using filesChanged array count:', actualFilesChanged);
            console.log('[AgentScript] Files from hooks:', filesChanged.slice(0, 20).join(', ') + (filesChanged.length > 20 ? '...' : ''));
          }
          
          // Commit changes
          const taskList = completedTaskIds.map(id => '- ' + id).join('\n'); // Fixed: escape newline in template literal
          const filesList = actualFilesList.length > 0 
            ? '\n\nFiles in this commit:\n' + actualFilesList.slice(0, 50).map(f => '- ' + f).join('\n') + (actualFilesList.length > 50 ? '\n... and ' + (actualFilesList.length - 50) + ' more files' : '')
            : '';
          const commitMessage = 'feat: Generated code by Claude Code Agent\n\n' + // Fixed: escape newlines in template literal
            'Tasks completed: ' + completedTaskIds.length + '\n' +
            'Files changed: ' + actualFilesChanged + filesList + '\n\n' +
            'Completed tasks:\n' + taskList;
          
          console.log('[AgentScript] Committing changes...');
          console.log('[AgentScript] Commit message preview:', commitMessage.substring(0, 200) + '...');
          // Escape quotes and newlines for shell command properly
          // Use proper escaping for double-quoted shell command
          const escapedMessage = commitMessage
            .replace(/\\/g, '\\\\')  // Escape backslashes first (\ in template →  in code)
            .replace(/"/g, '\"')     // Escape double quotes
            .replace(/$/g, '\$')    // Escape dollar signs
            .replace(/`/g, '\\`')  // Escape backticks (need double escape in template literal)
            .replace(/\\n/g, '\\n');    // Escape newlines (backslash-n in template becomes newline in code, then escape for shell)
          const commitResult = await execAsync('git commit -m "' + escapedMessage + '"', {
            maxBuffer: 10 * 1024 * 1024,
          });
          console.log('[AgentScript] ✅ Commit successful');
          if (commitResult.stdout) {
            console.log('[AgentScript] Commit output:', commitResult.stdout);
          }
          
          // Verify commit was created
          try {
            const verifyCommit = await execAsync('git log --oneline -1', {
              maxBuffer: 1024 * 1024,
            });
            console.log('[AgentScript] ✅ Commit verified:', verifyCommit.stdout?.trim() || '(unknown)');
          } catch {
            console.log('[AgentScript] ⚠️ Could not verify commit');
          }
        }
        
        // Push to current branch (create it if it doesn't exist remotely)
        console.log('[AgentScript] Pushing to GitHub...');
        console.log('[AgentScript] Remote URL configured:', remoteUrl.replace(githubToken, '***'));
        
        // Get current branch name
        let currentBranch = 'main'; // Default fallback
        try {
          const branchResult = await execAsync('git branch --show-current', {
            maxBuffer: 1024 * 1024,
          });
          const branchName = (branchResult.stdout || '').trim();
          if (branchName) {
            currentBranch = branchName;
            console.log('[AgentScript] Current branch:', currentBranch);
          } else {
            console.log('[AgentScript] ⚠️ No current branch detected, using default: main');
            // If no branch, create and checkout main
            await execAsync('git checkout -b main', {
              maxBuffer: 1024 * 1024,
            });
            currentBranch = 'main';
            console.log('[AgentScript] ✅ Created and checked out main branch');
          }
        } catch (branchError) {
          console.log('[AgentScript] ⚠️ Could not determine current branch, using default: main');
          // Try to create main branch if it doesn't exist
          try {
            await execAsync('git checkout -b main', {
              maxBuffer: 1024 * 1024,
            });
            currentBranch = 'main';
            console.log('[AgentScript] ✅ Created and checked out main branch');
          } catch {
            console.log('[AgentScript] ⚠️ Could not create main branch, will try to push anyway');
          }
        }
        
        let pushStdout = '';
        let pushStderr = '';
        let pushSucceeded = false;
        
        // Push to current branch with -u flag to set upstream (creates branch if it doesn't exist)
        try {
          console.log('[AgentScript] Attempting to push to ' + currentBranch + ' branch (with upstream)...');
          const pushResult = await execAsync('git push -u origin ' + currentBranch + ' 2>&1', {
            maxBuffer: 10 * 1024 * 1024,
          });
          pushStdout = pushResult.stdout || '';
          pushStderr = pushResult.stderr || '';
          pushSucceeded = true;
          console.log('[AgentScript] ✅ Push to ' + currentBranch + ' succeeded');
        } catch (pushError) {
          console.log('[AgentScript] Push to ' + currentBranch + ' failed, error:', pushError?.message || String(pushError));
          pushStdout = pushError?.stdout || '';
          pushStderr = pushError?.stderr || pushError?.message || String(pushError);
          
          // If current branch push fails, try main as fallback
          if (currentBranch !== 'main') {
            try {
              console.log('[AgentScript] Attempting fallback push to main branch...');
              const pushResult = await execAsync('git push -u origin main 2>&1', {
                maxBuffer: 10 * 1024 * 1024,
              });
              pushStdout = pushResult.stdout || '';
              pushStderr = pushResult.stderr || '';
              pushSucceeded = true;
              console.log('[AgentScript] ✅ Push to main succeeded');
            } catch (mainError) {
              console.log('[AgentScript] Push to main also failed, error:', mainError?.message || String(mainError));
              pushStdout = mainError?.stdout || pushStdout;
              pushStderr = mainError?.stderr || mainError?.message || pushStderr;
              pushSucceeded = false;
            }
          } else {
            pushSucceeded = false;
          }
        }
        
        // Always log the full output
        console.log('[AgentScript] ==================== GIT PUSH OUTPUT ====================');
        if (pushStdout) {
          console.log('[AgentScript] Push stdout (full):');
          console.log(pushStdout);
        } else {
          console.log('[AgentScript] Push stdout: (empty)');
        }
        if (pushStderr) {
          console.log('[AgentScript] Push stderr (full):');
          console.log(pushStderr);
        } else {
          console.log('[AgentScript] Push stderr: (empty)');
        }
        console.log('[AgentScript] =====================================================');
        
        if (pushSucceeded) {
          console.log('[AgentScript] ✅ Code committed and pushed to GitHub');
          await sendProgressUpdate('completed', 'Code committed and pushed to GitHub', completedTaskIds, filesChanged, 'success');
        } else {
          throw new Error('Git push failed. Stdout: ' + pushStdout.substring(0, 500) + ', Stderr: ' + pushStderr.substring(0, 500));
        }
      } catch (gitError) {
        const gitErrorDetails = {
          name: gitError?.name || 'Error',
          message: gitError?.message || String(gitError),
          stack: gitError?.stack || 'No stack trace',
          code: gitError?.code || null,
          signal: gitError?.signal || null,
        };
        
        console.error('[AgentScript] ==================== GIT ERROR ====================');
        console.error('[AgentScript] Git Error Name:', gitErrorDetails.name);
        console.error('[AgentScript] Git Error Message:', gitErrorDetails.message);
        console.error('[AgentScript] Git Error Code:', gitErrorDetails.code || 'N/A');
        console.error('[AgentScript] Git Error Signal:', gitErrorDetails.signal || 'N/A');
        console.error('[AgentScript] Git Error Stack:\n', gitErrorDetails.stack);
        
        // Log the actual git command output if available
        if (gitError.stdout) {
          console.error('[AgentScript] Git Error stdout:', gitError.stdout);
        }
        if (gitError.stderr) {
          console.error('[AgentScript] Git Error stderr:', gitError.stderr);
        }
        // Also check if the error has a message property with more details
        if (gitError.message && gitError.message !== gitErrorDetails.message) {
          console.error('[AgentScript] Git Error additional message:', gitError.message);
        }
        
        // Log git status to see what happened
        try {
          const statusResult = await execAsync('git status --porcelain', {
            maxBuffer: 10 * 1024 * 1024,
          });
          console.error('[AgentScript] Git status after error:', statusResult.stdout || '(empty)');
        } catch {
          console.error('[AgentScript] Could not get git status after error');
        }
        
        // Try to see if commit succeeded but push failed
        try {
          const logResult = await execAsync('git log --oneline -1', {
            maxBuffer: 10 * 1024 * 1024,
          });
          console.error('[AgentScript] Last commit:', logResult.stdout || '(no commits)');
        } catch {
          console.error('[AgentScript] Could not get git log');
        }
        
        // Don't fail the entire process if git push fails - code generation succeeded
        console.warn('[AgentScript] ⚠️ Git commit/push failed, but code generation succeeded');
        await sendProgressUpdate('completed', 'Build successful (Git push failed)', completedTaskIds, filesChanged, 'success');
      }
    } else {
      console.log('[AgentScript] ⚠️ GitHub URL or token not provided, skipping git commit/push');
    }
  } catch (buildError) {
    const buildErrorDetails = {
      name: buildError?.name || 'Error',
      message: buildError?.message || String(buildError),
      stack: buildError?.stack || 'No stack trace',
      code: buildError?.code || null,
      signal: buildError?.signal || null,
    };
    
    console.error('[AgentScript] ==================== BUILD ERROR ====================');
    console.error('[AgentScript] Build Error Name:', buildErrorDetails.name);
    console.error('[AgentScript] Build Error Message:', buildErrorDetails.message);
    console.error('[AgentScript] Build Error Code:', buildErrorDetails.code || 'N/A');
    console.error('[AgentScript] Build Error Signal:', buildErrorDetails.signal || 'N/A');
    console.error('[AgentScript] Build Error Stack:\n', buildErrorDetails.stack);
    
    throw buildError;
  }
  
  console.log('[AgentScript] ==================== AGENT SCRIPT COMPLETED SUCCESSFULLY ====================');
}

main().catch((error) => {
  const fatalErrorDetails = {
    name: error?.name || 'Error',
    message: error?.message || String(error),
    stack: error?.stack || 'No stack trace available',
    cause: error?.cause || null,
    code: error?.code || null,
    errno: error?.errno || null,
    syscall: error?.syscall || null,
  };
  
  console.error('[AgentScript] ==================== FATAL ERROR ====================');
  console.error('[AgentScript] Fatal Error Name:', fatalErrorDetails.name);
  console.error('[AgentScript] Fatal Error Message:', fatalErrorDetails.message);
  console.error('[AgentScript] Fatal Error Code:', fatalErrorDetails.code || 'N/A');
  console.error('[AgentScript] Fatal Error Errno:', fatalErrorDetails.errno || 'N/A');
  console.error('[AgentScript] Fatal Error Syscall:', fatalErrorDetails.syscall || 'N/A');
  console.error('[AgentScript] Fatal Error Stack:\n', fatalErrorDetails.stack);
  if (fatalErrorDetails.cause) {
    console.error('[AgentScript] Fatal Error Cause:', fatalErrorDetails.cause);
  }
  console.error('[AgentScript] ==================== EXITING WITH CODE 1 ====================');
  
  process.exit(1);
});
