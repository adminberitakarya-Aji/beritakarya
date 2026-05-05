"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_CONFIG = void 0;
exports.AI_CONFIG = {
    model: 'gpt-4o',
    maxTokens: 1000,
    timeoutMs: 30000,
    maxRetries: 3,
    retryDelayMs: 1000,
    rateLimits: {
        perUserPerHour: 20,
        perSitePerHour: 200
    },
    prompts: {
        language: 'Indonesia',
        newsStyle: 'gaya penulisan berita Indonesia yang formal dan faktual'
    }
};
//# sourceMappingURL=ai.js.map