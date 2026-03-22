/**
 * Code Runner Service
 * Handles code execution and evaluation with AI feedback
 */

import { reviewCode } from './ollama';

/**
 * Execute JavaScript code in a sandboxed environment
 */
export function executeJavaScript(code) {
  const logs = [];
  const errors = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  // Capture console output
  console.log = (...args) => {
    logs.push({
      type: 'log',
      content: args.map(formatArg).join(' ')
    });
  };
  console.error = (...args) => {
    logs.push({
      type: 'error',
      content: args.map(formatArg).join(' ')
    });
  };
  console.warn = (...args) => {
    logs.push({
      type: 'warn',
      content: args.map(formatArg).join(' ')
    });
  };

  const startTime = performance.now();
  let result = null;
  let error = null;

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(code);
    result = fn();
  } catch (e) {
    error = {
      name: e.name,
      message: e.message,
      stack: e.stack
    };
  }

  const executionTime = performance.now() - startTime;

  // Restore console
  console.log = originalLog;
  console.error = originalError;
  console.warn = originalWarn;

  return {
    success: !error,
    logs,
    result,
    error,
    executionTime: executionTime.toFixed(2)
  };
}

/**
 * Format an argument for console output
 */
function formatArg(arg) {
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return String(arg);
    }
  }
  return String(arg);
}

/**
 * Run test cases against code
 */
export function runTestCases(code, testCases, functionName = 'solution') {
  const results = [];

  for (const testCase of testCases) {
    try {
      // Create a function that includes the user's code and runs the test
      const testCode = `
        ${code}
        return ${functionName}(${JSON.stringify(testCase.input)});
      `;
      
      // eslint-disable-next-line no-new-func
      const fn = new Function(testCode);
      const startTime = performance.now();
      const actual = fn();
      const executionTime = performance.now() - startTime;

      const passed = JSON.stringify(actual) === JSON.stringify(testCase.expected);
      
      results.push({
        passed,
        input: testCase.input,
        expected: testCase.expected,
        actual,
        executionTime: executionTime.toFixed(2),
        error: null
      });
    } catch (e) {
      results.push({
        passed: false,
        input: testCase.input,
        expected: testCase.expected,
        actual: null,
        executionTime: null,
        error: e.message
      });
    }
  }

  return results;
}

/**
 * Execute code with AI evaluation
 */
export async function executeWithAIReview({
  code,
  language,
  question,
  testCases,
  model = 'llama3'
}) {
  // First execute the code
  let executionResult;
  let testResults = [];

  if (language === 'javascript') {
    executionResult = executeJavaScript(code);
    
    if (testCases && testCases.length > 0) {
      testResults = runTestCases(code, testCases);
    }
  } else {
    // For non-JS languages, we can't execute locally
    executionResult = {
      success: true,
      logs: [{ type: 'info', content: `[Simulated ${language} execution]` }],
      result: null,
      error: null,
      executionTime: '0'
    };
  }

  // Get AI review
  let aiReview = null;
  try {
    aiReview = await reviewCode({
      model,
      code,
      language,
      question,
      testResults: testResults.length > 0 ? testResults : null
    });
  } catch (e) {
    console.error('Failed to get AI review:', e);
  }

  return {
    execution: executionResult,
    testResults,
    aiReview,
    summary: generateSummary(executionResult, testResults)
  };
}

/**
 * Generate a summary of the execution results
 */
function generateSummary(execution, testResults) {
  const lines = [];

  if (execution.error) {
    lines.push(`❌ Execution Error: ${execution.error.message}`);
  } else {
    lines.push(`✓ Execution completed in ${execution.executionTime}ms`);
  }

  if (testResults.length > 0) {
    const passed = testResults.filter(r => r.passed).length;
    const total = testResults.length;
    
    if (passed === total) {
      lines.push(`✓ All ${total} test cases passed`);
    } else {
      lines.push(`⚠ ${passed}/${total} test cases passed`);
    }
  }

  return lines.join('\n');
}

/**
 * Format execution output for display
 */
export function formatOutput(executionResult) {
  const lines = [];

  for (const log of executionResult.logs) {
    const prefix = log.type === 'error' ? '❌ ' : log.type === 'warn' ? '⚠️ ' : '';
    lines.push(prefix + log.content);
  }

  if (executionResult.error) {
    lines.push('');
    lines.push(`❌ ${executionResult.error.name}: ${executionResult.error.message}`);
  } else {
    lines.push('');
    lines.push(`✓ Execution complete (${executionResult.executionTime}ms)`);
  }

  return lines.join('\n');
}

export default {
  executeJavaScript,
  runTestCases,
  executeWithAIReview,
  formatOutput
};
