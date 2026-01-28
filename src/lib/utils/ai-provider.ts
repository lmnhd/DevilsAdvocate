/**
 * AI Provider Rotation Service
 * Implements intelligent provider rotation with exponential backoff
 * Chain: OpenAI (primary) → Anthropic (fallback) → Gemini (last resort)
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type AIProvider = 'openai' | 'anthropic' | 'gemini';

export interface AICallOptions {
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  retries?: number;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  tokensUsed: number;
  responseTime: number;
  retries: number;
}

interface ProviderConfig {
  provider: AIProvider;
  model: string;
  available: boolean;
}

/**
 * Provider rotation order
 */
const PROVIDER_CHAIN: AIProvider[] = ['openai', 'anthropic', 'gemini'];

/**
 * Exponential backoff delays (milliseconds)
 */
const BACKOFF_DELAYS = [1000, 2000, 4000, 8000];

/**
 * Maximum retries per provider
 */
const MAX_RETRIES_PER_PROVIDER = 3;

/**
 * Default models for each provider
 */
const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-4-turbo-preview',
  anthropic: 'claude-3-5-sonnet-20241022',
  gemini: 'gemini-pro',
};

/**
 * Initialize API clients
 */
class AIProviderService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private gemini: GoogleGenerativeAI | null = null;

  constructor() {
    this.initializeClients();
  }

  private initializeClients(): void {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Initialize Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    // Initialize Gemini
    if (process.env.GOOGLE_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    }
  }

  /**
   * Get available providers in rotation order
   */
  private getAvailableProviders(preferredProvider?: AIProvider): ProviderConfig[] {
    const providers: ProviderConfig[] = [];

    // If preferred provider specified, try it first
    if (preferredProvider) {
      const isAvailable = this.isProviderAvailable(preferredProvider);
      if (isAvailable) {
        providers.push({
          provider: preferredProvider,
          model: DEFAULT_MODELS[preferredProvider],
          available: true,
        });
      }
    }

    // Add remaining providers in chain order
    for (const provider of PROVIDER_CHAIN) {
      if (provider === preferredProvider) continue;
      
      const isAvailable = this.isProviderAvailable(provider);
      providers.push({
        provider,
        model: DEFAULT_MODELS[provider],
        available: isAvailable,
      });
    }

    return providers.filter(p => p.available);
  }

  private isProviderAvailable(provider: AIProvider): boolean {
    switch (provider) {
      case 'openai':
        return this.openai !== null;
      case 'anthropic':
        return this.anthropic !== null;
      case 'gemini':
        return this.gemini !== null;
      default:
        return false;
    }
  }

  /**
   * Call AI with automatic provider rotation and exponential backoff
   */
  async callAI(prompt: string, options: AICallOptions = {}): Promise<AIResponse> {
    const {
      provider: preferredProvider,
      model,
      temperature = 0.7,
      maxTokens = 2000,
      systemPrompt,
      retries = MAX_RETRIES_PER_PROVIDER,
    } = options;

    const startTime = Date.now();
    const providers = this.getAvailableProviders(preferredProvider);

    if (providers.length === 0) {
      throw new Error('No AI providers available. Please configure API keys.');
    }

    let lastError: Error | null = null;
    let totalRetries = 0;

    // Try each provider in the chain
    for (const providerConfig of providers) {
      const providerModel = model || providerConfig.model;

      // Retry up to MAX_RETRIES_PER_PROVIDER times per provider
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const response = await this.callProvider(
            providerConfig.provider,
            prompt,
            {
              model: providerModel,
              temperature,
              maxTokens,
              systemPrompt,
            }
          );

          return {
            ...response,
            responseTime: Date.now() - startTime,
            retries: totalRetries,
          };
        } catch (error) {
          lastError = error as Error;
          totalRetries++;

          // Apply exponential backoff before retry
          if (attempt < retries - 1) {
            const delay = BACKOFF_DELAYS[Math.min(attempt, BACKOFF_DELAYS.length - 1)];
            await this.sleep(delay);
          }
        }
      }
    }

    // All providers and retries exhausted
    throw new Error(
      `All AI providers failed after ${totalRetries} attempts. Last error: ${lastError?.message}`
    );
  }

  /**
   * Call specific provider
   */
  private async callProvider(
    provider: AIProvider,
    prompt: string,
    options: {
      model: string;
      temperature: number;
      maxTokens: number;
      systemPrompt?: string;
    }
  ): Promise<Omit<AIResponse, 'responseTime' | 'retries'>> {
    switch (provider) {
      case 'openai':
        return this.callOpenAI(prompt, options);
      case 'anthropic':
        return this.callAnthropic(prompt, options);
      case 'gemini':
        return this.callGemini(prompt, options);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async callOpenAI(
    prompt: string,
    options: { model: string; temperature: number; maxTokens: number; systemPrompt?: string }
  ): Promise<Omit<AIResponse, 'responseTime' | 'retries'>> {
    if (!this.openai) throw new Error('OpenAI client not initialized');

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await this.openai.chat.completions.create({
      model: options.model,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      provider: 'openai',
      model: options.model,
      tokensUsed: response.usage?.total_tokens || 0,
    };
  }

  private async callAnthropic(
    prompt: string,
    options: { model: string; temperature: number; maxTokens: number; systemPrompt?: string }
  ): Promise<Omit<AIResponse, 'responseTime' | 'retries'>> {
    if (!this.anthropic) throw new Error('Anthropic client not initialized');

    const response = await this.anthropic.messages.create({
      model: options.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      system: options.systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';

    return {
      content: text,
      provider: 'anthropic',
      model: options.model,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    };
  }

  private async callGemini(
    prompt: string,
    options: { model: string; temperature: number; maxTokens: number; systemPrompt?: string }
  ): Promise<Omit<AIResponse, 'responseTime' | 'retries'>> {
    if (!this.gemini) throw new Error('Gemini client not initialized');

    const model = this.gemini.getGenerativeModel({
      model: options.model,
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
      },
      systemInstruction: options.systemPrompt,
    });

    const result = await model.generateContent(prompt);
    const response = result.response;

    return {
      content: response.text(),
      provider: 'gemini',
      model: options.model,
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
const aiProviderService = new AIProviderService();

/**
 * Main function to call AI with automatic provider rotation
 */
export async function callAI(prompt: string, options?: AICallOptions): Promise<AIResponse> {
  return aiProviderService.callAI(prompt, options);
}

export default aiProviderService;
