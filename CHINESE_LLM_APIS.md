# Chinese LLM APIs Guide

Alternative AI providers with free tiers and competitive pricing, particularly strong for parsing, deep search, and reasoning tasks.

---

## 1. DeepSeek (Recommended for Reasoning & Search)

**Website:** [platform.deepseek.com](https://platform.deepseek.com)

DeepSeek is known for exceptional reasoning capabilities and competitive pricing. Their DeepSeek-V3 and DeepSeek-R1 models rival top Western models.

### Free Tier
- **Free credits:** $5 for new accounts
- **No credit card required** for initial signup

### Pricing (Very Competitive)
| Model | Input | Output |
|-------|-------|--------|
| DeepSeek-V3 | $0.14/M tokens | $0.28/M tokens |
| DeepSeek-R1 (Reasoning) | $0.55/M tokens | $2.19/M tokens |

*Significantly cheaper than GPT-4 or Claude*

### Setup
1. Go to [platform.deepseek.com](https://platform.deepseek.com)
2. Sign up with email
3. Navigate to API Keys
4. Create new API key

### Environment Variable
```env
DEEPSEEK_API_KEY=sk-...
```

### API Usage (OpenAI Compatible)
```typescript
import OpenAI from 'openai';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
});

const response = await deepseek.chat.completions.create({
  model: 'deepseek-chat', // or 'deepseek-reasoner' for R1
  messages: [{ role: 'user', content: 'Your prompt' }],
});
```

### Best For
- Deep reasoning tasks
- Code generation
- Complex analysis
- Cost-effective production use

---

## 2. Qwen (Alibaba Cloud)

**Website:** [dashscope.aliyun.com](https://dashscope.aliyun.com) or [chat.qwen.ai](https://chat.qwen.ai)

Alibaba's flagship LLM series with strong multilingual support and vision capabilities.

### Free Tier
- **1 million free tokens** for new accounts
- Additional free quotas for specific models

### Models
| Model | Best For |
|-------|----------|
| Qwen-Max | Complex reasoning |
| Qwen-Plus | Balanced performance |
| Qwen-Turbo | Fast responses |
| Qwen-VL | Vision + Language |

### Setup
1. Go to [dashscope.console.aliyun.com](https://dashscope.console.aliyun.com)
2. Create Alibaba Cloud account
3. Enable DashScope service
4. Generate API key

### Environment Variable
```env
DASHSCOPE_API_KEY=sk-...
```

### API Usage
```typescript
// Using OpenAI-compatible endpoint
import OpenAI from 'openai';

const qwen = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

const response = await qwen.chat.completions.create({
  model: 'qwen-max',
  messages: [{ role: 'user', content: 'Your prompt' }],
});
```

### Best For
- Multilingual tasks (especially Chinese)
- Document parsing
- Vision tasks (with Qwen-VL)

---

## 3. Moonshot (Kimi)

**Website:** [platform.moonshot.cn](https://platform.moonshot.cn)

Known for extremely long context windows (up to 200K tokens) - excellent for document parsing.

### Free Tier
- **15 RMB free credits** (~$2) for new accounts
- No credit card required

### Key Feature
- **200K context window** - Parse entire documents at once

### Models
| Model | Context | Best For |
|-------|---------|----------|
| moonshot-v1-8k | 8K | Quick tasks |
| moonshot-v1-32k | 32K | Medium documents |
| moonshot-v1-128k | 128K | Large documents |

### Setup
1. Go to [platform.moonshot.cn](https://platform.moonshot.cn)
2. Register with phone number (Chinese phone may be required)
3. Get API key from console

### Environment Variable
```env
MOONSHOT_API_KEY=sk-...
```

### API Usage (OpenAI Compatible)
```typescript
import OpenAI from 'openai';

const moonshot = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY,
  baseURL: 'https://api.moonshot.cn/v1',
});

const response = await moonshot.chat.completions.create({
  model: 'moonshot-v1-128k',
  messages: [{ role: 'user', content: 'Parse this document...' }],
});
```

### Best For
- Long document parsing
- PDF analysis
- Contract review

---

## 4. Zhipu AI (GLM-4)

**Website:** [open.bigmodel.cn](https://open.bigmodel.cn)

Tsinghua University's GLM series with strong Chinese language understanding.

### Free Tier
- **Free trial credits** for new accounts
- Generous free quota for GLM-4-Flash

### Models
| Model | Best For |
|-------|----------|
| GLM-4 | Complex tasks |
| GLM-4-Plus | Enhanced reasoning |
| GLM-4-Flash | Fast, cheap responses |
| GLM-4V | Vision tasks |

### Setup
1. Go to [open.bigmodel.cn](https://open.bigmodel.cn)
2. Register account
3. Get API key from console

### Environment Variable
```env
ZHIPU_API_KEY=...
```

### Best For
- Chinese language tasks
- Academic/research content
- Vision understanding

---

## 5. Baichuan

**Website:** [platform.baichuan-ai.com](https://platform.baichuan-ai.com)

Strong general-purpose Chinese LLM with good reasoning.

### Free Tier
- Free trial credits available
- Competitive pricing after trial

### Setup
1. Go to [platform.baichuan-ai.com](https://platform.baichuan-ai.com)
2. Register account
3. Generate API key

### Environment Variable
```env
BAICHUAN_API_KEY=sk-...
```

---

## Comparison: Best Use Cases

| Use Case | Recommended API |
|----------|-----------------|
| **Deep reasoning** | DeepSeek R1 |
| **Cost-effective production** | DeepSeek V3 |
| **Long document parsing** | Moonshot (200K context) |
| **Chinese language** | Qwen or Zhipu |
| **Vision + Language** | Qwen-VL or GLM-4V |
| **Balanced performance** | Qwen-Max |

---

## Adding to Your Project

### 1. Update env/index.ts

Add these optional environment variables:

```typescript
// Chinese LLM APIs (Optional)
DEEPSEEK_API_KEY: z.string().min(1).optional(),
DASHSCOPE_API_KEY: z.string().min(1).optional(),
MOONSHOT_API_KEY: z.string().min(1).optional(),
ZHIPU_API_KEY: z.string().min(1).optional(),
```

### 2. Create Provider in ai/providers.ts

```typescript
// DeepSeek
export const deepseek = env.DEEPSEEK_API_KEY
  ? createOpenAI({
      apiKey: env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com/v1',
    })
  : null;

// Qwen via DashScope
export const qwen = env.DASHSCOPE_API_KEY
  ? createOpenAI({
      apiKey: env.DASHSCOPE_API_KEY,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    })
  : null;

// Moonshot
export const moonshot = env.MOONSHOT_API_KEY
  ? createOpenAI({
      apiKey: env.MOONSHOT_API_KEY,
      baseURL: 'https://api.moonshot.cn/v1',
    })
  : null;
```

### 3. Add to Vercel Environment Variables

Add any of these to Vercel Dashboard → Settings → Environment Variables:

| Variable | Description |
|----------|-------------|
| `DEEPSEEK_API_KEY` | DeepSeek API key |
| `DASHSCOPE_API_KEY` | Alibaba/Qwen API key |
| `MOONSHOT_API_KEY` | Moonshot/Kimi API key |
| `ZHIPU_API_KEY` | Zhipu/GLM API key |

---

## Quick Start: DeepSeek (Recommended)

DeepSeek offers the best balance of quality, price, and ease of setup:

1. **Sign up:** [platform.deepseek.com](https://platform.deepseek.com)
2. **Get $5 free credits** (no credit card)
3. **Create API key**
4. **Add to Vercel:** `DEEPSEEK_API_KEY=sk-...`
5. **Use in code:** OpenAI-compatible API

```typescript
const response = await deepseek('deepseek-chat').chat.completions.create({
  messages: [{ role: 'user', content: 'Analyze this RFP...' }],
});
```

---

## Pricing Comparison

| Provider | Model | Input $/M | Output $/M |
|----------|-------|-----------|------------|
| **DeepSeek** | V3 | $0.14 | $0.28 |
| **DeepSeek** | R1 | $0.55 | $2.19 |
| **Qwen** | Max | $0.56 | $1.68 |
| **Qwen** | Plus | $0.11 | $0.33 |
| **Moonshot** | 128k | $8.40 | $8.40 |
| **OpenAI** | GPT-4o | $2.50 | $10.00 |
| **Anthropic** | Claude 3.5 | $3.00 | $15.00 |

*DeepSeek and Qwen-Plus offer significant cost savings*

---

## Notes

- All APIs are **OpenAI-compatible** - easy integration with existing code
- **DeepSeek** is the current leader for reasoning tasks at low cost
- **Moonshot** is best for very long documents (200K context)
- **Qwen** has the best Chinese language support
- Most require **no credit card** for initial free tier

