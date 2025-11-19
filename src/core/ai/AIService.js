export class AIService {
    constructor() {
        this.config = {
            provider: 'openai', // 'azure', 'anthropic', 'openai'
            apiKey: localStorage.getItem('story_ai_key') || null,
            endpoint: localStorage.getItem('story_ai_endpoint') || null, // For Azure
            model: 'gpt-4o'
        };
    }

    configure(config) {
        this.config = { ...this.config, ...config };
        if (config.apiKey) {
            localStorage.setItem('story_ai_key', config.apiKey);
        }
        if (config.endpoint) {
            localStorage.setItem('story_ai_endpoint', config.endpoint);
        }
    }

    async generate(prompt, context = {}) {
        if (!this.config.apiKey) {
            throw new Error("AI API Key not configured");
        }

        const systemPrompt = this.buildSystemPrompt(context);
        
        switch (this.config.provider) {
            case 'openai':
                return this.callOpenAI(prompt, systemPrompt);
            case 'anthropic':
                return this.callAnthropic(prompt, systemPrompt);
            case 'azure':
                return this.callAzure(prompt, systemPrompt);
            default:
                throw new Error(`Unknown provider: ${this.config.provider}`);
        }
    }

    buildSystemPrompt(context) {
        return `You are an expert presentation designer and coding assistant for "Story", a modern presentation tool.
        Context: ${JSON.stringify(context)}
        
        When asked for code, output ONLY valid JavaScript code without markdown backticks unless specified.
        When asked for JSON, output ONLY valid JSON.`;
    }

    async callOpenAI(userPrompt, systemPrompt) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'OpenAI API Error');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async callAnthropic(userPrompt, systemPrompt) {
        // Anthropic API implementation
        // Note: Anthropic requires a proxy usually due to CORS, but assuming local dev or proxy exists
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': this.config.apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 4096,
                system: systemPrompt,
                messages: [
                    { role: "user", content: userPrompt }
                ]
            })
        });

        if (!response.ok) {
            throw new Error('Anthropic API Error');
        }

        const data = await response.json();
        return data.content[0].text;
    }

    async callAzure(userPrompt, systemPrompt) {
        // Azure OpenAI implementation
        const url = `${this.config.endpoint}/openai/deployments/${this.config.model}/chat/completions?api-version=2023-05-15`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': this.config.apiKey
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ]
            })
        });

        if (!response.ok) {
            throw new Error('Azure API Error');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
}

export const aiService = new AIService();
