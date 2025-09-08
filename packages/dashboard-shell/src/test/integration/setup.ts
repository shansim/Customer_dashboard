/**
 * Integration Test Setup
 * 
 * Setup configuration specifically for integration tests including:
 * - Extended timeouts for complex interactions
 * - Mock implementations for external dependencies
 * - Test utilities and helpers
 */

import '@testing-library/jest-dom';

// ============================================================================
// Extended Timeouts for Integration Tests
// ============================================================================

// Increase default timeout for integration tests
const originalTimeout = 5000;
const integrationTimeout = 15000;

beforeEach(() => {
  vi.setConfig({ testTimeout: integrationTimeout });
});

afterEach(() => {
  vi.setConfig({ testTimeout: originalTimeout });
});

// ============================================================================
// Global Mocks for Integration Tests
// ============================================================================

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock ResizeObserver for layout tests
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver for scroll-based tests
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock requestAnimationFrame for animation tests
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 16);
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// ============================================================================
// Console Suppression for Clean Test Output
// ============================================================================

// Suppress console warnings during tests unless explicitly needed
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  console.warn = (...args: any[]) => {
    // Only show warnings that are test-relevant
    const message = args[0];
    if (typeof message === 'string' && (
      message.includes('Warning: ReactDOM.render') ||
      message.includes('Warning: componentWillReceiveProps') ||
      message.includes('act()')
    )) {
      return;
    }
    originalConsoleWarn(...args);
  };

  console.error = (...args: any[]) => {
    // Only show errors that are test-relevant
    const message = args[0];
    if (typeof message === 'string' && (
      message.includes('Warning:') ||
      message.includes('The above error occurred')
    )) {
      return;
    }
    originalConsoleError(...args);
  };
});

afterEach(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// ============================================================================
// Test Environment Cleanup
// ============================================================================

afterEach(() => {
  // Clean up any timers
  vi.clearAllTimers();
  
  // Reset window size to default
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
  });
  
  // Clear any localStorage/sessionStorage
  localStorage.clear();
  sessionStorage.clear();
  
  // Reset document title
  document.title = 'Test';
});

// ============================================================================
// Custom Test Utilities
// ============================================================================

/**
 * Wait for multiple conditions to be true
 */
export const waitForAll = async (conditions: (() => boolean)[], timeout = 5000) => {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (conditions.every(condition => condition())) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  throw new Error('Timeout waiting for all conditions to be met');
};

/**
 * Simulate user interaction delay
 */
export const userDelay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock network delay for realistic testing
 */
export const networkDelay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create a mock touch event
 */
export const createTouchEvent = (type: string, touches: any[]) => {
  return new TouchEvent(type, {
    touches,
    targetTouches: touches,
    changedTouches: touches,
    bubbles: true,
    cancelable: true
  });
};

/**
 * Create a mock keyboard event
 */
export const createKeyboardEvent = (type: string, key: string, options: any = {}) => {
  return new KeyboardEvent(type, {
    key,
    code: key,
    bubbles: true,
    cancelable: true,
    ...options
  });
};

// ============================================================================
// Integration Test Helpers
// ============================================================================

/**
 * Helper to test responsive behavior
 */
export const testResponsiveBehavior = async (
  renderFn: () => void,
  assertions: {
    mobile: () => void;
    tablet: () => void;
    desktop: () => void;
  }
) => {
  // Test mobile
  Object.defineProperty(window, 'innerWidth', { value: 600 });
  window.dispatchEvent(new Event('resize'));
  renderFn();
  await userDelay();
  assertions.mobile();
  
  // Test tablet
  Object.defineProperty(window, 'innerWidth', { value: 768 });
  window.dispatchEvent(new Event('resize'));
  await userDelay();
  assertions.tablet();
  
  // Test desktop
  Object.defineProperty(window, 'innerWidth', { value: 1200 });
  window.dispatchEvent(new Event('resize'));
  await userDelay();
  assertions.desktop();
};

/**
 * Helper to test authentication flows
 */
export const testAuthFlow = async (
  steps: Array<{
    action: () => Promise<void>;
    assertion: () => void;
    description: string;
  }>
) => {
  for (const step of steps) {
    try {
      await step.action();
      await userDelay();
      step.assertion();
    } catch (error) {
      throw new Error(`Auth flow failed at step: ${step.description}. Error: ${error}`);
    }
  }
};

/**
 * Helper to test navigation flows
 */
export const testNavigationFlow = async (
  routes: Array<{
    path: string;
    expectedContent: string;
    action?: () => Promise<void>;
  }>
) => {
  for (const route of routes) {
    if (route.action) {
      await route.action();
    }
    
    // Wait for navigation to complete
    await waitFor(() => {
      expect(screen.getByText(route.expectedContent)).toBeInTheDocument();
    });
  }
};

// ============================================================================
// Performance Testing Utilities
// ============================================================================

/**
 * Measure component render time
 */
export const measureRenderTime = async (renderFn: () => void): Promise<number> => {
  const start = performance.now();
  renderFn();
  await userDelay(50); // Allow for render completion
  const end = performance.now();
  return end - start;
};

/**
 * Test for memory leaks in component lifecycle
 */
export const testMemoryLeaks = async (
  renderFn: () => { unmount: () => void },
  iterations = 10
) => {
  const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
  
  for (let i = 0; i < iterations; i++) {
    const { unmount } = renderFn();
    await userDelay(10);
    unmount();
    await userDelay(10);
  }
  
  // Force garbage collection if available
  if ((global as any).gc) {
    (global as any).gc();
  }
  
  const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
  const memoryIncrease = finalMemory - initialMemory;
  
  // Allow for some memory increase but flag significant leaks
  const maxAllowedIncrease = 1024 * 1024; // 1MB
  
  if (memoryIncrease > maxAllowedIncrease) {
    console.warn(`Potential memory leak detected: ${memoryIncrease} bytes increase`);
  }
  
  return memoryIncrease;
};

// Make utilities available globally for tests
declare global {
  var waitForAll: typeof waitForAll;
  var userDelay: typeof userDelay;
  var networkDelay: typeof networkDelay;
  var testResponsiveBehavior: typeof testResponsiveBehavior;
  var testAuthFlow: typeof testAuthFlow;
  var testNavigationFlow: typeof testNavigationFlow;
  var measureRenderTime: typeof measureRenderTime;
  var testMemoryLeaks: typeof testMemoryLeaks;
}

globalThis.waitForAll = waitForAll;
globalThis.userDelay = userDelay;
globalThis.networkDelay = networkDelay;
globalThis.testResponsiveBehavior = testResponsiveBehavior;
globalThis.testAuthFlow = testAuthFlow;
globalThis.testNavigationFlow = testNavigationFlow;
globalThis.measureRenderTime = measureRenderTime;
globalThis.testMemoryLeaks = testMemoryLeaks;