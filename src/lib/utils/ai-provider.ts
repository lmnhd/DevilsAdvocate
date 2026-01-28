import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIProvider } from '@/lib/types/agent';

export interface ProviderConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
}

export class AIProviderManager {
  private providers: ProviderConfig[];
  private currentProviderIndex: number = 0;
  private backoffDelays = [1000, 2000, 4000, 8000]; // milliseconds
  private maxRetriesPerProvider = 3;

  constructor(providerChain: AIProvider[] = ['openai', 'anthropic', 'gemini']) {
    this.providers = providerChain.map(provider => this.getProviderConfig(provider));
  }

  private getProviderConfig(provider: AIProvider): ProviderConfig {
    switch (provider) {
      case 'openai':
        return {
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          apiKey: process.env.OPENAI_API_KEY || '',
        };
      case 'anthropic':
        return {
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
          apiKey: process.env.ANTHROPIC_API_KEY || '',
        };
      case 'gemini':
        return {
          provider: 'gemini',
          model: 'gemini-2.0-flash-exp',
          apiKey: process.env.GOOGLE_API_KEY || '',
        };
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  async executeWithFallback<T>(
    executionFn: (provider: ProviderConfig) => Promise<T>
  ): Promise<{ result: T; provider: AIProvider }> {
    let lastError: Error | null = null;

    for (let providerIndex = 0; providerIndex < this.providers.length; providerIndex++) {
      const provider = this.providers[providerIndex];

      for (let attempt = 0; attempt < this.maxRetriesPerProvider; attempt++) {
        try {
          const result = await this.retryWithBackoff(
            () => executionFn(provider),
            attempt
          );
          return { result, provider: provider.provider };
        } catch (error) {
          lastError = error as Error;
          console.warn(
            `Provider ${provider.provider} attempt ${attempt + 1} failed:`,
            error
          );

          // If it's the last attempt for this provider, move to next provider
          if (attempt === this.maxRetriesPerProvider - 1) {
            console.warn(`Provider ${provider.provider} exhausted. Trying next provider...`);
            break;
          }
        }
      }
    }

    throw new Error(
      `All providers failed. Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    attemptIndex: number
  ): Promise<T> {
    if (attemptIndex > 0) {
      const delay = this.backoffDelays[attemptIndex - 1] || 8000;
      await this.sleep(delay);
    }
    return fn();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getNextProvider(): AIProvider {
    this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
    return this.providers[this.currentProviderIndex].provider;
  }

  getCurrentProvider(): AIProvider {
    return this.providers[this.currentProviderIndex].provider;
  }
}
