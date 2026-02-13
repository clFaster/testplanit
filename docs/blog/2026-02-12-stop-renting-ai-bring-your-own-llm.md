---
slug: stop-renting-ai-bring-your-own-llm
title: "Stop Renting AI — Bring Your Own LLM to Test Case Generation"
description: "Every test management vendor is racing to add AI-powered test case generation. But you're paying for AI you can't control. Here's why bringing your own LLM is a better approach."
authors: [bdermanouelian]
tags: [best-practices, thought-leadership]
---

<figure>
  <img src="/img/blog/byollm-select-source.png" alt="TestPlanIt AI-assisted Test Case Generation" />
  <figcaption>TestPlanIt AI-assisted Test Case Generation</figcaption>
</figure>

Every test management vendor is racing to add AI-powered test case generation. And to their credit, most of them aren't charging extra for it — they're bundling it into their existing per-seat pricing. TestRail includes AI in both their Professional ($37/user/month) and Enterprise ($74/user/month) tiers. PractiTest bundles SmartFox AI into their $54/user/month Team plan. BrowserStack includes it in their paid tiers.

So what's the problem?

You're paying for AI whether you use it or not. You don't get to choose the model. You can't see or modify the prompts. You have no control over where your requirements data goes when it's processed. And in some cases — like Qase's credit-based AIDEN system at $0.40 per extra credit — you hit real usage caps when you need it most.

There's a different approach. Plug in your own LLM and API key, choose the model you trust, and keep your data exactly where you want it. Here's why that matters.

<!-- truncate -->

## The Case for Bring-Your-Own-Key in Five Points

1. **Your data never has to leave your network.** Self-host your test management tool and point it at a local LLM. Requirements documents, user stories, acceptance criteria — none of it touches a third-party server. No vendor pipeline, no mystery data processing agreements.

1. **You pick the model — and can switch anytime.** No lock-in to whatever the vendor chose. Use GPT-4o, Claude, Gemini, or run Llama locally through Ollama. Optimize for your domain, not a vendor's bulk deal. TestPlanIt even lets you assign a different LLM provider to each project, so your fintech team can use one model while your embedded systems team uses another — each tuned to its specific domain.

1. **You pay only for what you use.** API calls to generate test cases from a typical requirements doc cost fractions of a cent. Most teams spend single-digit dollars per month. With a local model, the marginal cost is zero.

1. **No usage caps or credit systems.** Regenerate when requirements change. Experiment with prompts. Generate edge cases, negative tests, accessibility scenarios — without watching a credit balance.

1. **Prompts work out of the box — but you can see and customize them.** Built-in prompts handle the heavy lifting from day one. But unlike vendor black boxes, they're fully transparent and can be augmented to match your testing methodology without touching source code.

<figure>
  <img src="/img/blog/byollm-add-notes-guidance.png" alt="Augment prompts to match your testing methodology without touching source code." />
  <figcaption>Augment prompts to match your testing methodology without touching source code.</figcaption>
</figure>

---

## The Details

### The Privacy Argument Is Stronger Than You Think

This is the real differentiator, and it's one most vendors can't match.

When you use built-in AI from any SaaS test management tool, your requirements documents are sent to their infrastructure, processed through their chosen model provider, and governed by their data processing agreements. You're trusting a chain of vendors with what are often some of your most sensitive documents — requirements describe what your product does, how it works, and where its boundaries are.

For teams in healthcare, financial services, defense, or any regulated industry, this isn't a theoretical concern. It's a compliance question that requires real answers about data residency, retention, and processing.

Here's where things get interesting: if you can self-host your test management tool *and* point it at a locally-hosted LLM, your requirements data never leaves your network. Not to OpenAI, not to Anthropic, not to your test management vendor. The entire AI pipeline runs on infrastructure you control.

To my knowledge, TestPlanIt is the only test management solution where this is possible — fully self-hosted with support for any OpenAI-compatible API endpoint, including local models via Ollama, LM Studio, or similar tools. That's a capability no SaaS-only vendor can offer, regardless of how good their built-in AI is.

### The Bundled AI Problem Isn't Price — It's Control

Let's be fair: most vendors aren't gouging you on AI specifically. They're including it as part of their per-seat pricing. The issue isn't that AI costs too much. It's that you have zero say in how it works.

You don't know which model processes your data. You can't see the system prompts that shape the output. If the generated test cases don't match your methodology — too generic, wrong format, missing edge cases — your only option is to manually edit every result or hope the vendor's product team eventually improves things.

TestPlanIt takes a different approach. It ships with built-in prompts that generate solid test cases from day one — you don't need to be a prompt engineer to get value immediately. But those prompts are fully visible in the source code, and the platform includes a built-in feature to augment them without modifying any code. Want more focus on negative testing? Add that guidance. Need output that matches a specific regulatory template? Augment the base prompt with your requirements.

This gives you the best of both worlds: you start productive on day one, but you're never stuck with output you can't improve. That kind of iterative refinement compounds over time — your AI-generated test cases get meaningfully better because you're tuning the process, not filing feature requests and hoping.

<figure>
  <img src="/img/blog/byollm-review-import.png" alt="AI-generated test cases get meaningfully better because you're tuning the process." />
  <figcaption>AI-generated test cases get meaningfully better because you're tuning the process.</figcaption>
</figure>

### Model Flexibility Is a Real Advantage

LLMs are evolving fast. Different models have genuinely different strengths — some handle complex business logic better, others excel at edge case identification, others are stronger with domain-specific jargon. The best model for generating test cases from a fintech requirements doc may not be the best for an embedded systems spec.

When a vendor bundles AI, they pick one model (or one provider) for everyone. When you bring your own key, you can optimize for your domain. And when a better model ships next quarter — and one will — you can switch without waiting for your vendor to update.

<figure>
  <img src="/img/blog/byollm-edit-model-integration.png" alt="When a better model ships next quarter, you can switch without waiting for your vendor to update." />
  <figcaption>When a better model ships next quarter, you can switch without waiting for your vendor to update.</figcaption>
</figure>

TestPlanIt takes this further by letting you assign a different LLM provider to each project. A team working on a healthcare platform can point their project at a model that excels with medical terminology and regulatory requirements, while a team building a consumer mobile app can use a different model optimized for UI and accessibility scenarios — all within the same TestPlanIt instance. This per-project flexibility means you're not just choosing the right model for your organization, you're choosing the right model for each specific context. As your projects evolve or new models emerge, you can re-tune individual projects without disrupting anyone else.

### The Cost Math Still Favors BYOK

Even though vendors bundle AI into their pricing rather than charging separately, the math is worth understanding. Processing a requirements document through an LLM consumes a few thousand tokens — often well under a penny per generation. Heavy usage across hundreds of requirements might cost a few dollars per month.

You're not paying a premium for AI specifically, but you are paying $37–74 per user per month for a platform whose AI you can't control. With a self-hosted tool and your own API key, the AI component costs what it actually costs — pennies. With a local model, it costs nothing beyond the compute you already own.

### Credit Systems Create the Wrong Incentives

Not every vendor bundles cleanly. Qase's AIDEN system uses credits — included credits on paid plans, with extra credits at $0.40 each. This creates exactly the wrong incentive: you start rationing AI usage instead of using it freely.

AI test case generation is most valuable when you use it liberally — regenerating after requirement changes, trying different approaches, generating comprehensive coverage across functional, negative, accessibility, and performance scenarios. Credit systems encourage you to be conservative precisely when you should be thorough.

Your own API key means your usage is bounded only by your actual budget, which for most teams is trivially small.

<figure>
  <img src="/img/blog/byollm-ai-models-list.png" alt="Usage is bounded only by your actual budget." />
  <figcaption>Usage is bounded only by your actual budget.</figcaption>
</figure>

## The Bigger Picture

The BYOK approach reflects a broader philosophy: tools should give teams capabilities, not create dependencies. When your test management tool provides the framework for AI integration but lets you bring the intelligence layer, you get flexibility, control, and transparency.

And when that tool can be fully self-hosted alongside a local LLM, you get something no SaaS vendor can match: complete data sovereignty over your entire AI-powered testing workflow. Your requirements stay on your servers. Your test cases are generated on your infrastructure. Your prompts are yours to see and improve.

TestPlanIt is built on this philosophy. Connect any OpenAI-compatible LLM provider — cloud or local — with your own API key. Built-in prompts work immediately, with full transparency and a built-in way to augment them for your needs. Full control over model selection, data handling, and costs. No per-user AI surcharges, no credit systems, no black-box prompts. And if your data can't leave your network, self-host the entire stack.

The best AI features aren't the ones bundled into your subscription. They're the ones you actually control.
