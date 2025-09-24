// Configuration settings for the application
export const config = {
  // API Configuration
  llm: {
    baseUrl: process.env.LLM_API_URL || 'http://localhost:5000',
    timeout: 3600000, // 1 hour in milliseconds
    maxRetries: 1,
    endpoints: {
      execute: '/api/simple/execute',
      research: '/api/simple/research',
      status: '/api/simple/status',
    }
  },
  
  // UI Configuration
  ui: {
    maxNoteLength: 10000, // Maximum characters for a single note
    maxNotesHistory: 100, // Maximum notes to keep in history
    maxQuizHistory: 50, // Maximum quiz attempts to keep
    progressUpdateInterval: 30000, // 30 seconds
  },
  
  // Development Configuration
  isDev: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Feature Flags
  features: {
    enableProgressTracking: true,
    enableRetries: true,
    enableOfflineMode: false,
  }
};

// Validate configuration
export function validateConfig() {
  const errors: string[] = [];
  
  // Validate LLM configuration
  if (!config.llm.baseUrl) {
    errors.push('LLM base URL is required');
  }
  
  try {
    new URL(config.llm.baseUrl);
  } catch {
    errors.push('LLM base URL must be a valid URL');
  }
  
  if (config.llm.timeout < 1000) {
    errors.push('LLM timeout must be at least 1000ms');
  }
  
  if (config.llm.maxRetries < 0) {
    errors.push('LLM max retries must be non-negative');
  }
  
  // Validate UI configuration
  if (config.ui.maxNoteLength < 1) {
    errors.push('Max note length must be positive');
  }
  
  if (config.ui.maxNotesHistory < 1) {
    errors.push('Max notes history must be positive');
  }
  
  if (config.ui.maxQuizHistory < 1) {
    errors.push('Max quiz history must be positive');
  }
  
  if (config.ui.progressUpdateInterval < 1000) {
    errors.push('Progress update interval must be at least 1000ms');
  }
  
  // Validate environment consistency
  if (config.isDev && config.isProduction) {
    errors.push('Cannot be both development and production environment');
  }
  
  // Validate feature flags
  if (typeof config.features.enableProgressTracking !== 'boolean') {
    errors.push('enableProgressTracking must be a boolean');
  }
  
  if (typeof config.features.enableRetries !== 'boolean') {
    errors.push('enableRetries must be a boolean');
  }
  
  if (typeof config.features.enableOfflineMode !== 'boolean') {
    errors.push('enableOfflineMode must be a boolean');
  }
  
  // Validate endpoint paths
  const endpoints = Object.values(config.llm.endpoints);
  for (const endpoint of endpoints) {
    if (!endpoint.startsWith('/')) {
      errors.push(`Endpoint '${endpoint}' must start with '/'`);
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
  
  return true;
}

// Initialize and validate configuration on import
export function initConfig() {
  try {
    validateConfig();
    console.log('Configuration validated successfully');
    return config;
  } catch (error) {
    console.error('Configuration validation failed:', error);
    if (config.isProduction) {
      throw error; // Fail fast in production
    }
    console.warn('Continuing with potentially invalid configuration in development mode');
    return config;
  }
}