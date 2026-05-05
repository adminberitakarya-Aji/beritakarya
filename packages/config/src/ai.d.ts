export declare const AI_CONFIG: {
    readonly model: "gpt-4o";
    readonly maxTokens: 1000;
    readonly timeoutMs: 30000;
    readonly maxRetries: 3;
    readonly retryDelayMs: 1000;
    readonly rateLimits: {
        readonly perUserPerHour: 20;
        readonly perSitePerHour: 200;
    };
    readonly prompts: {
        readonly language: "Indonesia";
        readonly newsStyle: "gaya penulisan berita Indonesia yang formal dan faktual";
    };
};
export type AIAction = 'rewrite' | 'expand' | 'headline' | 'seo' | 'grammar' | 'readability' | 'layout' | 'caption';
//# sourceMappingURL=ai.d.ts.map