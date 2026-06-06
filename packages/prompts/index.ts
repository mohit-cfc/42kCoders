import prompts from './prompts.json';

export interface PromptConfig {
  system: string;
}

export interface Prompts {
  intent_classifier: PromptConfig;
  response_generator: PromptConfig;
}

export const sharedPrompts = prompts as Prompts;
export default sharedPrompts;
