// Polyfills for Jest test environment

// Mock structuredClone if not available
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  };
}

// Mock expo winter globals
global.__ExpoImportMetaRegistry = {
  resolve: jest.fn(),
  register: jest.fn(),
};
