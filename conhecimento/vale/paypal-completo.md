---
tipo: transcricao
fonte: aula-externa
tema: aquisicao
pode-ir-comunidade: true
anonimizado: true
criado: 2026-06-25
evento: vale-2026
origem-video: IMG_0028.MOV
modelo: whisper-large-v3
duracao-seg: 4015
idioma: English
chars: 49547
cjk-chars: 0
re-transcricao: large-v3 (substitui tentativa turbo)
autorizado-usar: true
status: bruto-revisar
---
# Palestra Vale 2026 — IMG_0028.MOV (re-transcrição large-v3)

> Re-transcrição em **whisper-large-v3** (o turbo anterior alucinava no trecho bilíngue).
> Origem: vídeo `IMG_0028.MOV` — 66:55. Idioma predominante: English. Chinês detectado: 0 caracteres.
> Identificar (Geoffrey Moore vs PayPal) pelo conteúdo e renomear depois.

## Transcrição original (large-v3, com timestamps)

[00:00] It's a very interesting fact that no human is reading your APIs nowadays.
[00:06] So even if there's an API dog, I simply give it a snake to claw or curse it and let it read for me.
[00:14] Right? So, agent experience is the new user experience.
[00:22] The famous book on user experience, if you have read, by Steve Krug,
[00:27] He defines user experience as, don't make me think.
[00:32] And I think that it's not different for AI agents as well.
[00:37] For AI agents, when AI thinks extra that necessary,
[00:43] that increases the chances of hallucinations,
[00:47] which increases the chances of human fixing,
[00:50] and that eventually increases token's worth.
[00:53] And we know AI subsidies are handy.
[00:56] So we better think about the agent experience and try to count or try to help the AI agent with extra thinking.
[01:06] Let me give you an example. Complete the sentence. Actions speak louder than words.
[01:16] There's no words you can say that. Actions speak louder than words.
[01:21] All that it does is not good.
[01:25] Bite the dust.
[01:30] Bullet.
[01:32] Hands at the end.
[01:36] What else?
[01:38] Bullet.
[01:39] Bullet, okay.
[01:40] You all are correct.
[01:43] Yeah, it can be anything, you know, for hair.
[01:48] Because in the absence of context,
[01:52] all the options have equal probability.
[01:55] And you know that AI has a probabilistic system.
[01:59] So if you're not counting it in the right context,
[02:02] you should not blame it for bringing burger.
[02:06] Okay. So here are some best practices for agent experience.
[02:11] Number one, use AI for intelligent tasks, no brainer.
[02:16] Provide right context, not more context.
[02:21] Because if you've done everything, you will have context locked.
[02:25] Which is becoming a very buzzword.
[02:28] The third one is use automation for repetitive or deterministic tasks.
[02:33] So we are trying to just use AI for everything which actually, you know,
[02:38] increases destinations and token runs.
[02:41] So how can we prevent that? There's a way.
[02:44] So now this is a quiz. Don't answer, just raise your hands.
[02:48] If I give a prompt, implement the checkout flow using PayPal API, from where will the AI pick up the API source?
[02:58] From an official box? From an old official SDK? From an unofficial third party library? Or any of the above?
[03:08] Yes?
[03:12] Any of the above.
[03:18] Anyone else?
[03:20] D, any of the above.
[03:22] Yeah, any of the above.
[03:24] .
[03:34] So the answer is D, any of the above.
[03:36] What's your name?
[03:37] For a gift.
[03:38] For a gift.
[03:39] Can you please pass?
[03:40] Thank you, you're right.
[03:45] So, the thing is, you know,
[03:49] last year at PayPal DevBase,
[03:53] so I was having dinner with Nathaniel,
[03:56] and he discussed the exact same problem,
[03:59] that coding agents are guessing wrong SDKs
[04:04] to code applications.
[04:05] It's not their mistake because I have not given it enough context.
[04:11] I did not say which name of API.
[04:13] It might have a version from maybe 2010 or 20, whenever.
[04:20] So, it's up to it to pick up the API source.
[04:24] If we close the look at how AI coding tools integrate APIs,
[04:32] there are three steps.
[04:33] Number one, fetch the API source, which is OpenAPI's back-to-back.
[04:38] Number two is that translate into destination format.
[04:42] For example, I'm writing an agent in C sharp.
[04:45] So I have to convert that OpenAPI to C sharp before building that agent.
[04:52] And number three is GenBit, the artifact which is an application or an AI agent.
[04:58] Another quiz. Which two of these tabs are 100% deterministic or does not require intelligence among these three?
[05:08] Translate and Intend.
[05:13] Anyone else?
[05:16] Fetch.
[05:19] Fetch. There are two.
[05:22] Fetch and Intend.
[05:25] Fetch and Translate. What's your name?
[05:27] [participante].
[05:28] [participante]. That's for you.
[05:33] So Fetch and Translate, they are 100% deterministic and they are boring tasks.
[05:42] They don't require AI or any kind of intelligence because your OpenAPI is a contract
[05:50] and you can exactly translate into an SDK in any language.
[05:56] If you ask like thousands of times,
[06:00] the result will be the same.
[06:02] So if you can provide these two with the help of automation,
[06:07] then the burden on AI will be only on the intelligent bit
[06:12] or the non deterministic bit, which is the generate bit.
[06:15] Now the question is, again, which I asked earlier,
[06:19] Can we use docs and SDKs built for humans here?
[06:24] Yes.
[06:24] Yes.
[06:25] Yes, we can, but those will not be enough
[06:29] because those are built for humans.
[06:33] They don't have enough context for AI to understand them.
[06:37] Imagine I give you a set of Lego blocks
[06:40] and don't give any instructions.
[06:42] You will eventually figure it out,
[06:44] but what if I give you the instruction as well?
[06:46] You will make that model very quickly.
[06:48] similar with the AI.
[06:50] So, what we did actually,
[06:55] we combined SDKs, API docs,
[06:58] plus some of the skills which Mark was talking about,
[07:01] plus NCP, and named that as context plugins.
[07:07] Now they have enough context,
[07:09] enough resources for the AI to know about an API
[07:14] before building anything on top of it.
[07:18] So context plugins are live, you go to developer.paypal.com, you can try them in cursor, vs code or cloud code.
[07:28] And since like PayPal, a massive enterprise and a very serious fintech company, so you cannot simply make a demo and just like put in the production.
[07:46] And that's the biggest difference. I'm not going to give any demo here. I've been seeing a lot of demos which only show happy path and they don't work in production.
[07:55] Because AI, without any context, can take you to the happy path. But there are certain things such as authentication, retries, webhooks, callbacks, so many things which come to you when you are trying to put things in production.
[08:10] and an estimation is that if 1x is the happy path then 3.5x is what you actually ship.
[08:17] And if I give you an example, so I went on TextPlugin in a production app using PayPal API
[08:25] and what I found that it compiled, the demo was fine, but never captured the money.
[08:32] So on my right side, you can see over here,
[08:37] There is a boolean paid variable.
[08:41] So if paid is true,
[08:43] you can return okay payment complete.
[08:45] What if I am a hacker and in the browser,
[08:49] I simply pass demo and I get paid is true.
[08:54] My order payment will be completed.
[08:57] Because the AI did not think of any edge case,
[09:01] it only took happy path and built it.
[09:04] But context plugin, since it's grounded in
[09:06] the real SDK, it actually puts all the checks. If order status is not approved, then make order paid.
[09:18] So there are so many edge cases you can find which are not there in the happy path or the AI written demo.
[09:28] So I'm going to quickly show a few results which were performed on production codebases.
[09:35] if you're familiar with Nobcommerce and Eshop,
[09:38] both are .NET applications,
[09:40] been running for many years now.
[09:43] So, we asked two things.
[09:45] One is software migration,
[09:47] like migration, older version of PayPal to newer version.
[09:51] And then second experiment was to integrate PayPal
[09:55] from scratch in these applications.
[09:58] So there were four experiments.
[10:00] So Nobcommerce migration, Nobcommerce new,
[10:02] Eshop migration and Eshop new.
[10:04] and you can see the results.
[10:06] With the agent only, you can find so many compiled and run-time errors.
[10:11] And the green ones are showing the errors.
[10:16] So, I will not say this was completely error-free.
[10:18] I will not claim that, but the errors are much more reduced over there.
[10:23] Similarly, token consumption.
[10:26] You can see from green bits, other tokens can be consumed by context plugin,
[10:32] and these red ones are by agents only.
[10:36] And I'm not talking only about the API integration because these coding agents,
[10:42] they have to write so much more logic than API integration.
[10:47] So if I ask, for example, this is my favorite test which we performed,
[10:52] Opus 4.7 versus Sonnet 4.6, which one will win?
[10:58] Of course Opus. But, this is very interesting. When we give Cortex plugin to Sonnet 4.6, the session time of Opus was 80 minutes to complete the same task while Sonnet did it in 42 minutes.
[11:13] So it's 47% faster. Total cost is reduced. Of course Opus is expensive. There were unconnected bugs. Three in Opus, one in Sonnet.
[11:25] And the code quality where Opus 1 is like 2.5 out of, like there was 30 out of 40 and here 27.5 out of 40.
[11:37] But this was not the integration code only because they were completing a whole use case which had much more code besides integration.
[11:46] So, with the right context, how much can you save on your AI cost?
[11:53] So, time for conclusions. When the model becomes commodity, context is the competitive advantage.
[12:02] Go grab this advantage before your competitors.
[12:07] Number two, every business must translate into the next interface. We have seen the web era,
[12:12] we have seen the app era, and now we are witnessing the agent era. Go build for that.
[12:18] And lastly, one API source of truck in, every consumption surface out.
[12:25] So from the same open API, you can have everything. I just showed you context plugins,
[12:31] but there are CLIs, copilots, docs, mcptools, SDKs. So you're building not for agents only.
[12:40] There are millions of humans who are also making applications. So it should be a building stack for
[12:47] for the MSPEL.
[12:49] So that's it.
[12:50] Thank you very much.
[12:53] Again, .
[13:00] Any questions?
[13:03] Yeah, I understand the resolve of this,
[13:06] but how exactly it's executed.
[13:08] What kind of process flow is it?
[13:11] Is it like intercept the API request
[13:14] and they inject something like a more complex.
[13:18] And what kind of complex to inject?
[13:21] I can point you to the website
[13:24] where the whole case study is written,
[13:26] every prompt, what was the setup,
[13:28] every version of the AI is written over there.
[13:31] So maybe we can share,
[13:34] can you share some notes with the participants
[13:36] or industry people?
[13:37] We can update something afterwards.
[13:39] Or you can go to idiomatic.ios
[13:41] and you can find this case study over there.
[13:43] So as a company, what does it take to implement?
[13:49] What it takes if you have an open API spec, then you can break it.
[13:55] And from that specification, all you have to do is publish SDKs so that API can use it.
[14:06] So what is added and what that's like basically?
[14:10] SDKs, core samples, MCPs, and skills.
[14:15] So all of them are automatically generated by yourself.
[14:20] So in that sense,
[14:21] it's language-specific, fine-ing.
[14:23] Yeah, exactly. Thank you.
[14:24] Thank you for that.
[14:25] Have you a good example or answer to that question?
[14:29] Will be discussed by Nathaniel coming up next in terms of
[14:33] an example of an implementation plus the context
[14:37] from API Now.
[14:39] It'll give us a good grounding for a good real life example
[14:43] of how you can create an SDK, distribute it,
[14:48] and provide hooks and contexts into it
[14:52] for agentic usage, which is what Adil's presentation talks
[14:56] about that aspect of it.
[14:58] The next piece of this conversation
[14:59] is using that in the real world.
[15:03] Thank you.
[15:04] Thank you, buddy.
[15:12] Hi.
[15:12] I have a question.
[15:13] So I think to support, there's a metrics of code policy.
[15:18] So how would you define that metrics for code policy?
[15:22] Is it like a position task, or they don't have hallucinations?
[15:28] Again, this is a big case study. I can point out the website, but there's not only a grant equation, but the completion of code, the test cases it has written, and other things.
[15:40] So yeah, there's a big metric for that.
[15:44] .
[15:57] .
[16:04] .
[16:13] and we level out the head.
[16:15] You know, for me personally, I always inclined to use the latest one.
[16:18] But if my job is getting done, then what's the issue?
[16:23] But saying that, this one, again, very honestly, this was a lab experiment done on a smaller application.
[16:32] What we found, and we are still figuring it out, that if you increase the size of applications,
[16:38] for example select a very big application then Sonic is not good enough to hold all the context and to fix it So for that you have to use Open But still if you using the same model the results will still be better
[16:54] Thank you.
[16:59] How is it delivered? Like, is this kind of CK? What's the RTP?
[17:04] So there are two ways to do it.
[17:07] If you see here, we can talk about that.
[17:11] I'll give it down.
[17:12] Oh, you can give it down.
[17:13] OK.
[17:14] Cool.
[17:14] Sure.
[17:18] So let's say I'm building my own context plugin.
[17:22] But I'm shipping my agent to a lot of flights.
[17:25] And the context plugin is very huge.
[17:29] So do I have a search tool for my agent
[17:33] to like travel through the context plugin?
[17:35] Or do I like create embeddings or something?
[17:38] Like what is the best approach?
[17:40] Yeah, you know, context plugin does not have
[17:43] an encryption vision of agents.
[17:45] Then different, so an agent can use context plugin,
[17:48] it has deterministic things inside.
[17:51] Yes, so what if I have a lot of context like docs
[17:55] and a lot of skills and my agent is like having problems
[17:58] with like, you know.
[17:59] That's a great question because there is
[18:01] as MCP with an ask tool, which perform a rag kind of
[18:07] 45-day structure and it only takes that chunk out
[18:11] of the context, which is required.
[18:13] And it also on the spot can respond to all agents
[18:16] to perform particular tasks and we can move back
[18:19] to the main one.
[18:24] So you say that building an application from a demo
[18:29] So, with the context plugin, like, how it changes, like, with the context plugin, if
[18:36] I build a demo, will it be production-ready?
[18:41] Or how it is compared to production-ready?
[18:46] That's a great question, but again, you know, when it comes to API integration, context
[18:53] Context learning can help you over here, but when it comes to the other parts of code production, then it's a lot.
[19:02] But, for example, if you're using a good SDK, you have webhooks, you have vegetation, you have retries, authentication, everything is taken care of.
[19:11] And all of them are part of context learning.
[19:14] So these best practices not only save time, but ensure that your architecture contains all those things.
[19:23] Thank you so much.
[19:29] So first of all, thank you for the great presentation.
[19:32] This is [participante], who we put that easy.
[19:34] And I'm wondering if you see this,
[19:36] of course, this is an example of value implementation, right?
[19:39] But let's start thinking about a pattern,
[19:41] about a specification, right?
[19:43] And why Salesforce is not implementing a plugin
[19:47] that works like this, which is a context for Salesforce,
[19:50] or ServiceNow, or the rest of the companies,
[19:53] doing the same pattern for the same specification.
[19:56] Do you see as a possible specification instead of just
[19:59] an implementation for this particular case?
[20:01] That's a great question. Thank you for that.
[20:03] Sir, the issue is not context-plugged
[20:05] did not go on in a day.
[20:06] So, idiomatic has been generating code for the last 12 years.
[20:10] So, all that experience, all the headspace handling
[20:14] over those years is now encapsulated
[20:16] in that context-plugging.
[20:18] So, any company can do it if they have that kind of experience.
[20:21] Code generation in an SDK building,
[20:23] AI just added one layer of it.
[20:26] But the engine is there all the way around.
[20:30] Thanks so much.
[20:31] [participante] Yeah,
[20:32] just to add on to that.
[20:33] So this is of being used by ,,
[20:37] but this is a very generic contract
[20:38] plugin that can bring in their APIs
[20:40] and generate that currently being deployed
[20:42] by other fortified companies.
[20:44] [participante]
[20:47] Thank you.
[20:49] Bye.
[20:51] I was just curious to know, are there any design differences in the SDKs that we can
[20:59] create for like humans and then for independent consumption?
[21:03] I mean like not integrated but like high level.
[21:06] That's a great question.
[21:07] I have been asking my developers, why you want to build this whole big SDK?
[21:12] Why don't you just like make a smart one where you can keep the domestic parts and other parts.
[21:17] So we are working on that.
[21:19] But so far what we have found that the SDK is 100% translation of your open API stack.
[21:25] So the more detailed it is, it's better for the consumption of AI as well.
[21:30] What we need is to add things on top of it, for example, skills to tell what are the best practices
[21:36] to solve certain kind of application and how to grab things from SDKs.
[21:42] So, so far I'm not saying this is a final result.
[21:46] My engineers are saying that you should be using the same SDK
[21:50] because that's very powerful.
[22:02] Thank you.
[22:16] I'm going to try to follow that.
[22:19] I don't have any bribes, so you have to bear with me.
[22:29] Okay, so I'm going to talk about the context of the plugin a little bit more,
[22:33] specifically because it's part of my home.
[22:36] That's not what I'm trying to share.
[22:39] Apologies.
[22:39] Yes.
[22:45] There we go.
[22:46] It is a part of my product, but I'm going to talk about myself a little bit.
[22:51] I'm a product manager by trade. I went to school for chemistry.
[22:57] I have hazarded writing code many times across my career.
[23:02] I'm certainly technical enough to be working on server SDK products,
[23:06] but you do not want me shipping your enterprise code, especially if I'm writing a plan.
[23:12] So that's an important nuance, because now we have these tools.
[23:15] You add things like a context plugin.
[23:18] So I'm actually going to give you guys a little coding demo
[23:22] up here in real time.
[23:25] I'll probably break a few rules, so bear with me.
[23:32] So this is the PayPal.
[23:34] .
[23:36] No?
[23:36] OK.
[23:38] Let's try that again.
[23:43] Is it back?
[23:45] OK.
[23:50] So I went and grabbed this context plugin.
[23:54] This is an installed script for Cloth.
[23:56] Pretty straightforward.
[23:59] You can see the mcp.json has installed.
[24:03] You can open that if you want.
[24:04] It's pretty straightforward.
[24:05] You've seen one of these before.
[24:06] You've seen them all.
[24:07] I'm going to launch a little quad window.
[24:16] And I kind of preset the prompt because I
[24:19] don't want to deal with this.
[24:21] Here's where I'm breaking rules out of my sandbox credentials
[24:23] in the prompt.
[24:24] Enjoy if you want.
[24:25] You're going to be gone by the end of the night.
[24:27] .
[24:31] So I'm just going to let this run in the background.
[24:33] And then I'm going to talk about the context plugin a little bit
[24:36] so I can get to the why, what does this matter?
[24:38] Go ahead.
[24:40] So the deal has covered pretty extensively.
[24:43] It's a portable interface.
[24:44] You can bring it wherever you want.
[24:45] It's an authoritative source.
[24:47] It takes up the guesswork.
[24:51] In this case, with a Gymatic, how it works is kind of unique.
[24:57] Plenty of tools will answer questions.
[24:59] The context plugin has two layers of interface.
[25:02] Or sorry, inference.
[25:03] One is your actual AI coding agent.
[25:06] And the other is the context plugin itself,
[25:08] which is an expert on the SDK.
[25:11] This helps get precision in the context that loads.
[25:14] This is what helps reduce token usage.
[25:18] This is what proves the way that the agent actually
[25:22] updates the SDK.
[25:24] You can think of it this way.
[25:26] The agent is having a conversation
[25:28] with the context plugin.
[25:29] It's not just scanning your library and figuring it out.
[25:33] It's giving active instruction.
[25:35] This is important.
[25:37] It improves the way that it operates.
[25:42] We went over some of the stats and figures here
[25:45] in the case studies, right?
[25:48] 91% reduction in compiling runtime errors,
[25:50] significant reduction in manual fixes, total consumption.
[25:55] All these things are massive improvements.
[25:57] Anyone who's budget conscious wants this.
[25:59] Anyone who wants to trust things wants this.
[26:07] Even when you stack this up against open source tools
[26:09] like Contact7, has anyone heard of Contact7?
[26:13] Great, I'll give you a quick primer.
[26:17] Contact7 scans every GitHub repo for all major tech companies.
[26:22] And it services their documentation
[26:24] in markdown format through an MCP service.
[26:28] And at the start of this entire AI development
[26:33] cycle that we live in, it was probably the best tool
[26:37] you could use to improve your coding outcomes when
[26:40] you're working with agents.
[26:43] Even versus context 7, we see extremely improved performance
[26:48] because the context is not just the docs.
[26:51] It's the conversation.
[26:52] It's the expertise.
[26:53] It's the opinion.
[26:56] So what is that?
[26:59] The person who builds software is changing.
[27:02] I'm a product manager.
[27:04] More and more product managers are going to be shipping code.
[27:09] Designers are shipping code.
[27:11] Business development people are shipping code.
[27:15] This is massive.
[27:16] 84% of developers use AI coding.
[27:19] 63% of new developers are not professional developers.
[27:23] They're just making it work.
[27:25] 4-to-1 citizen developers will outnumber professional coders.
[27:31] Obviously, we still need professional coders.
[27:33] You guys were talking about the off stuff that went over my head.
[27:37] Someone needs to make that work for me.
[27:39] So it's still a thing.
[27:41] But as the builders change, the way that we build changes.
[27:48] I don't want to read the docs.
[27:50] I don't want to figure out the architecture.
[27:52] I want to tell Claude to build me a one-time checkout that lets me add my little cart and
[27:59] come back.
[28:00] I don't want to have to think about it.
[28:05] You have an opportunity if you're trying to drive a good developer experience to not just
[28:10] provide documentation, to provide support for the entirety of the developer experience.
[28:17] people integrate, to help people upgrade, debug, maintain.
[28:23] Future developers aren't even going to touch your product
[28:26] if there's not an MSP server or CLI that they can interface
[28:30] with or something they can plug in.
[28:33] They're looking for leverage.
[28:34] They're looking to move faster and to do more with less.
[28:39] If they're going to sit down and code
[28:41] like a traditional developer, it's
[28:43] just going to be more expensive to get the same results.
[28:47] But if they can trust your tool, if you can build that trust
[28:51] by providing not just the bare minimum,
[28:54] but the complete agentic development experience
[28:57] through tools like a context plugin,
[29:00] through tools like a CLI, whatever
[29:04] tool du jour of next month is going to be,
[29:07] this stuff is going to continue to change and evolve.
[29:10] You have an opportunity to win the hearts and minds of people
[29:13] that don't want to learn the ins and outs
[29:16] and the gritty details of how the code works,
[29:18] they want your product and they want it today.
[29:22] They want to ship it now.
[29:24] So I originally had planned to talk a lot more
[29:28] about the context plugin.
[29:30] Adil, you covered so much of it for me,
[29:32] so I'm just going to get to that point.
[29:35] This is essentially the end of my presentation here.
[29:39] But what I would love to do is ask the question, how many
[29:44] of you actually are developers or write code?
[29:49] OK, so that's about half of the room.
[29:52] How many of you work in tech?
[29:55] I mean, I'm assuming everybody, right?
[29:59] OK.
[29:59] No.
[30:00] Who feels like they would benefit,
[30:02] who's not a developer, from having the ability
[30:05] to ship solutions that they need?
[30:07] Not having to work for a week, something they can do today
[30:10] or tomorrow.
[30:13] Close days.
[30:15] Exactly.
[30:16] Why would you not?
[30:17] This isn't to say that developers are going away.
[30:20] I know that's a scary concept.
[30:22] I think the priorities are shifting.
[30:25] They've moved left.
[30:28] Developers get to focus on things
[30:29] like providing the context, providing
[30:32] the authoritative opinion, providing the services that
[30:35] allow you to debug properly, providing the upgrade guides
[30:39] that allow these things to roll out.
[30:41] And this is actually an advantage.
[30:44] You can now control the way that your products get implemented
[30:47] in ways you never could before.
[30:52] You get to provide best practices that actually
[30:55] get implemented, not just breeze over.
[30:58] You can provide quick upgrade paths,
[31:00] because it's no longer a two-month project.
[31:03] It's somebody in a day or two, and then you ship it.
[31:07] So there's a huge advantage here.
[31:10] Context plugins are just the surface, just the start.
[31:15] This can allow you to ship and enable shipping more things
[31:20] than you'd consider in the past.
[31:23] So I'll pause there.
[31:25] Do we have any questions?
[31:32] Thank you.
[31:33] My name is [participante].
[31:34] Question for both you and Adil.
[31:38] is I can greatly see the biggest gap in the industry right now
[31:43] between having better API context for the coding
[31:47] agents or governance around the agents
[31:52] day-to-day systems.
[31:54] Where do you see the biggest gap?
[31:57] I think the biggest gap that I see is understanding.
[32:02] I think most of us aren't spending enough time
[32:06] tinkering and experimenting and seeing what needs to be true
[32:11] for an AI agent to be reliably successful, right?
[32:15] A lot of people are like, well, we gotta make this
[32:18] and everything work.
[32:21] Let's just throw a roadmap together.
[32:22] And the reality is you have to sit down and watch it fail.
[32:26] Why did it fail?
[32:27] What was missing?
[32:28] What's the context that wasn't there?
[32:29] What do we iterate on?
[32:32] You kind of have to get to understand these tools.
[32:35] I find that most people don't have an in-depth understanding
[32:39] of how the AI works, what types of contexts are important
[32:43] for it to be successful, and how they can start to deliver
[32:47] and structure those things.
[32:50] Because you don't have an understanding,
[32:51] you're not able to define a way to get to that solution,
[32:55] to get to that level of support.
[32:58] So that answers your first question.
[33:00] I actually have lost the second question,
[33:02] if you want to read it.
[33:04] I think both context and governance are part of it.
[33:12] I was reading an article where it was identified as
[33:15] seven harnesses around AI models.
[33:18] So security governance context observability and three more So we not having it Context is all of it You have to have everything in order to you know maximize the senator office
[33:33] Thank you.
[33:37] I'm going to finish my demo real quick.
[33:41] So serves up.
[33:43] Can somebody just go to localhost3000 for me?
[33:47] That's a joke.
[33:48] That's a joke.
[33:52] So here's the demo app.
[33:54] Pretty simple.
[33:56] You have the cart.
[33:58] We recommend PayPal.
[34:00] Everyone has access to the localhost.
[34:04] I have to use my sandbox to come.
[34:06] Apologies, there's a bar in my way.
[34:22] And I'm back to the shop, we're completed,
[34:26] confirmation done.
[34:28] It was a three line prompt,
[34:30] and I know this is just a demo, right?
[34:31] That's the one .
[34:37] The fun thing with this too,
[34:40] I don't think we got the plan in this one,
[34:42] it's always a different mode.
[34:43] This actually built test automation as part of its setup,
[34:47] which is kind of ridiculous.
[34:49] That's the type of thing that you can start to deliver an opinion on into your developer experience when people are using agents.
[34:59] You can start to define, these are the tests that you need to run.
[35:03] These are the types of checks you need to go through against your sandbox environment, against your production environment.
[35:10] Here's the CLI interface that lets you check if the order was actually created.
[35:15] These are the type of opportunities you can provide.
[35:18] You need to give the agents backstops, ways to answer,
[35:22] did I do this correctly, ways to ensure
[35:25] that they're up to the standards that you would recommend
[35:29] before shipping.
[35:31] And so we really get to take over and provide
[35:37] a uniform development experience and development
[35:40] and integration quality.
[35:42] We literally have never been able to.
[35:46] You don't have to sit around and negotiate, like, OK,
[35:48] what are we going to put from scope?
[35:52] Like, we have a week to deliver.
[35:54] I guess it's going to be testing.
[35:56] The first thing that goes, analytics,
[35:58] first thing that goes, you can ensure these things are
[36:01] part of the V1 by shipping the right support
[36:05] and handing it over to HMS.
[36:08] I'll pause there.
[36:10] Demo complete.
[36:11] Demo gods were with me.
[36:13] Thank you.
[36:16] Do we have any more questions?
[36:18] I do have one.
[36:25] So again, thank you, Boris, for the demo and presentation.
[36:28] So a few years back, there was this saying that going from 0% to 90% down was three months,
[36:34] and then going from 90% down to 100% took nine months.
[36:38] And now with AI, I'm seeing that even being more extreme.
[36:42] going from 0% to 90% down takes a week,
[36:45] and then the remaining 10% that compliance
[36:49] and making it work in the press for any harnessing
[36:51] takes way too long.
[36:53] Do you think with this that part-time is kind of a big
[36:56] challenge, that this really gets you to that 99% slash 100%
[37:02] done really in the time that it was supposed to be?
[37:05] I think this is part of the puzzle.
[37:09] Is anybody here familiar with the harness term that's
[37:12] been floating around the valley lately?
[37:16] So you mentioned the word compliance, standards,
[37:20] all these different buzzwords that tend to slow us down,
[37:25] that are usually company specific.
[37:28] Sometimes they're external.
[37:32] The context plug-in itself doesn't solve all of those
[37:34] things for you.
[37:36] It does allow you to ship your standards,
[37:41] but when you think about the person integrating,
[37:43] who actually has to deploy this checkout that I just built,
[37:47] they need to be investing into their harness,
[37:50] into the system that they put in place,
[37:53] including MCP servers, including skills, including CLIs,
[37:57] sometimes including agents.
[37:59] They need to be investing in their harness
[38:02] to incorporate things like compliance requirements,
[38:06] like coding standards, the more you invest in your system,
[38:11] again, this is why I say the focus moves left,
[38:14] the more you invest in your system, the faster you're going to be able to move.
[38:18] Because you solve your problem not just for that one instance,
[38:22] but you can start to solve that problem moving forward.
[38:26] So that's one piece.
[38:27] There's another piece that I think is important
[38:30] that people need to maybe be open to shifting their minds around.
[38:34] I think it needs to be okay to ship quickly and not be perfect,
[38:41] but to instead set up the way you develop and the way your platform works
[38:47] so that you can start to catch the issues rapidly, right?
[38:52] Can you integrate logging into your harness, right?
[38:58] Can you create a system that starts to self-heal?
[39:01] If you listen to Lenny's podcast at all,
[39:05] and you got to listen to the founder of the Cloud Code,
[39:08] they literally have an agent pointed at a Slack channel
[39:12] that proposes a PR based on feedback
[39:15] they're getting live in real time,
[39:17] like once or twice a day.
[39:19] Now I'm not saying you ship every one of those PRs,
[39:21] but if you've set up your system to catch the failures,
[39:26] to have the right amount of context captured there
[39:29] so that you can quickly identify and patch.
[39:32] Then a lot of these things that are maybe like softer parts of the experience,
[39:36] it's okay if it's not perfect the first time.
[39:39] Get it out the door.
[39:40] Get some miles on the grid.
[39:42] In the same way that we can ship features faster,
[39:46] we can squash bugs so much faster.
[39:50] And additionally, if you set your harness up right,
[39:53] you can be probing proactively to find these issues in production. Now obviously
[40:01] tokens are, you know, the free token era is maybe leaving, we'll see what happens. But I mean
[40:11] there's too much opportunity here for that to be a permanent problem. The price
[40:17] will always be reasonable, there will always be paths.
[40:21] And the thing that the deal was able to demonstrate
[40:26] is when you have a good harness like the context plugin,
[40:29] you don't need the premium model.
[40:31] You don't need Fable or Cloud 4.8 to look at your error logs
[40:37] and start to identify problems in code.
[40:40] You could probably do that with 4.5.
[40:42] You could probably do that with Quim
[40:45] or one of these open source models
[40:47] if you're interested in standing up your own server.
[40:51] Frankly, we're going to see people do that more and more
[40:53] and train them on their code bases.
[40:56] And it starts to leverage these AI artists more
[41:00] so that they can actually start to multiply the output that they
[41:04] produce instead of just offloading the thinking
[41:08] and moving at the same pace for more money.
[41:12] Thank you so much.
[41:14] Is that your question?
[41:15] 100%.
[41:17] Hi.
[41:19] Mostly an interest in .
[41:22] My question is perhaps a little bit unfair,
[41:23] so I think you can start to allude to it, which
[41:26] is, if you went back 12 months, we were just brand new
[41:29] to MCP.
[41:31] People were token maxing, and there
[41:33] was this concept of context blogging really didn't exist,
[41:37] as far as I can tell.
[41:38] And today, this is an exciting development.
[41:40] We have figured out how to make models,
[41:42] will iterate much more efficiently.
[41:45] Question is, how would you prognosticate
[41:49] for what's going to happen in the next 12 months,
[41:52] both from the perspective of a tooling platform,
[41:55] a developer-focused tooling platform like API Nike,
[41:58] as well as from the perspective of someone like PayPal
[42:00] that's providing services and it's
[42:05] .
[42:06] How do you think those two evolve in the next six
[42:10] to 12 months?
[42:11] I don't usually do this and I promise I don't mean anything by it.
[42:14] What does prognosticate mean?
[42:16] Um, predict.
[42:18] Okay, how can I predict?
[42:20] Um, I think I'm going to take you back about 12 months,
[42:26] which literally around this time I was having dinner with Adil and [pessoa]
[42:31] talking about all of the experimenting and coding I've been doing
[42:36] with Claude, Gemini, and I was using RooCode, if you've ever heard of that,
[42:40] which shuttered recently.
[42:45] And at that time, I was already implementing the frameworks
[42:51] that we now know as skills in my own context files
[42:55] and in my own agents and things like that.
[42:58] And so I think you'd be surprised how much ahead
[43:02] of the curve you could get for all of this tooling
[43:05] if you just take time to play around with it
[43:08] and being curious, to look at, like, that failed.
[43:14] Why did it fail?
[43:14] What can I do differently for it to be successful?
[43:17] If you take that approach, I promise
[43:18] you will find techniques that are going to get you further
[43:24] than what is currently defined.
[43:27] The talking points, I think, are just
[43:30] starting to catch up to the tools that people are using.
[43:34] So now, as far as what is this going
[43:37] to look like in 12 months.
[43:40] Again, I said this earlier, if you
[43:44] don't have an AI-powered developer experience,
[43:49] I'm not using your platform on anything
[43:51] that I'm going to try to use.
[43:54] Because it's not worth my time, especially
[43:56] if I can choose another tool that I know is shipping
[44:00] something like a context plugin.
[44:03] I used PostHog recently for funsies on a little side project.
[44:07] It's great.
[44:08] It has everything I need, including I can set up
[44:10] my monitoring dashboards in PostHog via their CLI, which
[44:15] they shipped a comprehensive skill set for.
[44:18] So if you don't get me to a point
[44:21] where I can focus on the problem I'm trying to solve
[44:24] and not all of the nuances of how to solve it,
[44:27] I can focus on making sure the system I have in place
[44:30] is going to scale and solve my headaches over time,
[44:34] and I don't want to use your tool.
[44:35] So if I were to extrapolate that,
[44:38] and I'm obviously very bullish on all these things,
[44:43] then I think these types of offerings
[44:49] are going to be kind of the battleground
[44:51] for the winners and the losers
[44:53] in the agentic coding tooling era.
[44:56] Can I add a little bit more to that?
[45:01] I think if we take a step back and we think about where the industry is going, we're going
[45:08] to see an acceleration of tools like this out there.
[45:13] So what do we see at Big Apple?
[45:15] We see more businesses being started on smaller sizes across the globe.
[45:23] So we see a bigger influx of sole-preneurs getting to production faster, leveraging tools like this, because they're able to go from zero to prod in a way that leverages the most recent capabilities that are offered out there.
[45:41] and I'm presupposing what Nathaniel said,
[45:43] which most companies are going to realize
[45:46] that this is the way forward,
[45:47] and they will invest in tooling like this,
[45:49] which means that they're shifting their focus
[45:51] from human development
[45:53] to agentic assistant development
[45:55] or agentic native development.
[45:58] And so you'll start to see more businesses
[46:00] that are going live,
[46:02] that are smaller in scope and in function, right?
[46:06] You'll see more focus there.
[46:07] What happens after that?
[46:09] You might see waves of consolidation.
[46:11] you might see, et cetera, et cetera.
[46:13] The second, I think, larger trend that you're starting to see
[46:17] is that because of these capabilities,
[46:20] you see businesses attack global
[46:22] before they attack a local market only,
[46:25] which expands their TAM pretty exponentially.
[46:29] And so, again, going back to the examples that you saw tonight,
[46:33] one could suppose that the ability to find product market fit
[46:37] becomes easier in a global context
[46:39] once you've figured out regulation, capabilities,
[46:43] and you can start to leverage the tools to help you with that.
[46:47] For larger organizations, we see an increase in thoroughness
[46:52] and a focus on internal efficiency.
[46:55] So what we saw coming out that would take six months
[46:58] is now taking a month to a week to hours.
[47:03] And so a good example of that from PayPal is that we would see merchants
[47:06] merchants that used our technology that were stuck on older versions,
[47:10] that would take six months to upgrade.
[47:13] They would push that off, causing them to fall further and further behind,
[47:17] losing out on some of the capabilities that we offer you.
[47:20] Now, with AI-assisted tooling, we see that move down to two hours
[47:24] for the technical migration, and then the rest of the spend on validation.
[47:29] I think that that's what you're going to see in the market.
[47:34] Quick question.
[47:35] Thank you.
[47:35] This is a follow up to what [participante] or the gentleman here are you yourself in that there's a great deal of information about the 36 million plus GitHub developers, but there was something on the screen that spoke about four in one citizen developers.
[47:50] So how does this best practice information
[47:52] get out to the citizens, developers in the world who
[47:56] are, whether they're doing hackathons,
[47:59] or they're on the Discord server, or they're in Roblox,
[48:02] or whatever?
[48:03] How does the best practices that you're describing
[48:07] get to that particular segment of the population,
[48:11] in your opinion?
[48:12] Well, I think the most obvious piece
[48:14] is you have to make it as easy as possible to access.
[48:18] And that's why I'm packing Chia into something where I can copy-paste a command.
[48:23] I don't.
[48:24] That's pretty critical.
[48:26] The other side of that is awareness and distribution.
[48:32] I personally don't know exactly what the right access channels to market to and to influence these developers are.
[48:42] Maybe YouTube is heavier at this point in time.
[48:45] It's certainly a ton of data content,
[48:48] but YouTube is always following Zeitgeist.
[48:51] I think that's going to be an emerging conversation
[48:53] as the traditional developer changes,
[48:56] as the traditional tech company starts to change,
[48:58] especially when you get closer to consumer products in tech
[49:03] versus like deep tech.
[49:06] We're probably going to see different behaviors.
[49:08] It's going to be a learning experience.
[49:11] Maybe I'll just add a little more on top of what
[49:13] I totally agree with that.
[49:15] I think when we look at market prediction of a lot of these SaaS companies that are your bigger,
[49:21] like the bigger ones, not just the banks but the rest of them,
[49:26] their valuations are going down because there's a prediction of lower output long term because of AI coming in and taking over.
[49:35] I kind of predict the opposite, which I think a lot of these solo producers will get you to about 80%
[49:40] 80% and then need help to go into production,
[49:43] and need help to go to scale, need help
[49:46] to go into some of these different markets,
[49:48] and will need help on the go-to-market side.
[49:51] I think that that's where we are now.
[49:54] Whether or not the tooling gets so much better,
[49:58] and I'm sure it will, to not need that last mile,
[50:02] .
[50:03] But for now, I actually see an expansion
[50:05] in the market of developer talent being needed but more focused and less general It sort of like guilds where you have specialities within the guilds because the hands as
[50:18] you say, where that citizen developer, whomever, needs to get that expertise to find to last
[50:26] mile.
[50:27] Beyond last mile.
[50:28] It'll be that, marketing, sales, positioning.
[50:33] Maintenance.
[50:34] It's all of that that happens.
[50:36] We were at an event last night,
[50:39] and we were talking about agent deployment scale
[50:43] and production processes.
[50:46] There's a lot yet to be defined and written there.
[50:49] And so I think that there's still a lot more for us to go.
[50:53] Truly, we're at the onset.
[50:54] So I agree with Nathaniel's comment
[50:56] and Nathaniel's comment earlier about we're not entering
[50:58] an era of scarcity or development need.
[51:01] I think it's accelerating.
[51:03] Well, if I may, I wasn't speaking about so much as scarcity more than this best practices
[51:08] that were being described here could reach a larger audience and that they're not going
[51:12] to get it in high school, they're possibly not going to get this in college, and this
[51:16] kind of best practice of creating new environments is necessary for a wider audience to understand.
[51:25] Yeah, so there still needs to be people who are deeply educated or at least deeply informed
[51:32] about how the technology works, defining these best practices,
[51:36] creating new libraries.
[51:37] That's true.
[51:38] I think in some ways that becomes more important.
[51:42] Frankly, I think a lot of developers
[51:44] who love that kind of thing might get the opportunity
[51:47] to spend more time working on that and less time trying
[51:50] to meet shipping deadlines for that button
[51:53] that marketing wants to color change.
[51:55] You know what I mean?
[51:57] Again, the focus gets to shift left.
[52:02] Like you get to define some of the infrastructure
[52:05] that I'm even talking about servicing instead
[52:09] of being on the line coding away just to shift features.
[52:13] Now, that's going to be some people's journey.
[52:16] Some of us use more agents to utilize those outputs.
[52:20] How that all structures, it's going to be exciting to see.
[52:25] Do you think there will be times where agents can hire a human,
[52:28] like start with your direct human or
[52:32] like let's say you have MVP coming in,
[52:36] then you have to go for compliance, security,
[52:38] and what this agent can hire this particular human with expertise,
[52:41] with experience, and they can take it from there,
[52:44] then they pass it off to the next .
[52:46] I saw that on the episode of A Person of Interest.
[52:49] Yeah.
[52:50] This sounds like a great movie plot.
[52:53] I think there's already tools out there that are agent-kind humans for human-like models.
[53:00] But I think you'll also see something else, which is a proliferation of task-specific agents
[53:07] that are very narrowly focused on a specific given job.
[53:11] That will then hand to agent two, three, and four for their jobs.
[53:15] And you'll have an orchestration layer that sits on top of all of that,
[53:18] and that will orchestrate your end-to-end flow.
[53:20] So we've seen this movie before in different varieties
[53:24] and flavors and technology.
[53:27] Many of us in this room have probably worked those different
[53:29] types of transform and load type jobs that require
[53:34] an orchestration layer that sits on top.
[53:35] So that's where we are here with AI.
[53:43] Anymore?
[53:46] Oh, we haven't talked much about the events.
[53:49] Is it in the area of the context or is there a responsibility of the application?
[53:56] I don't know.
[53:58] That's a good question. We haven't talked about emails. Did you guys use emails while you were building?
[54:06] So, it's not reflecting the API actually, and it's not on the client side.
[54:15] So, no, it's not part of our tech study, but on the client side, yes, we can support some best practices.
[54:23] So, now I'm curious, because while you were developing and while you were on the journey of creating overhead,
[54:29] .
[54:30] And what do you do ?
[54:34] Or I think that I said, well, I'll
[54:36] and stuff like that.
[54:37] I don't know.
[54:38] And then I have to try with the team.
[54:40] I don't code anymore.
[54:42] Yeah.
[54:43] They might lose me.
[54:44] I don't know.
[54:45] They might lose me.
[54:46] That's an interesting question, though,
[54:48] because we haven't talked about emails at all.
[54:51] If anyone's used Skill Creator on Cloud Code,
[54:55] evals or reception data on gates at the end of the process
[54:59] that determine if the skill is good or not
[55:01] and what needs to change.
[55:03] So someone asked earlier, how do you get to that last percent?
[55:09] How do you achieve quality?
[55:11] One concept when you think about having agents operate in loops,
[55:17] we've all seen like OpenClaw and Ralph, the Ralph loop.
[55:22] That was in one one.
[55:25] The concept of evals, which essentially are similar to requirements in a lot of ways,
[55:32] start to emerge as options, which you can set up,
[55:38] so that you care less about the guts in between and more about the outputs,
[55:44] and you evaluate against that.
[55:45] So that's one way to think about getting higher leverage when you're using AI agents.
[55:51] Are we shipping evals currently in this context plugin?
[55:54] No.
[55:55] Could there be a place for emails in the larger picture of how PayPal enables developers to do agentic development?
[56:04] Likely, yes. We, as far as I know, have not talked about it. But it's an interesting thought experiment.
[56:13] Even if it's not shipped out to the investment, it's more about like, how do you standardize your product?
[56:19] Yeah, 100%.
[56:21] I know that you have a way change in like,
[56:24] you are already .
[56:26] Yeah.
[56:27] What are you promising to them?
[56:28] What is it?
[56:30] Yeah, in constructs like emails, they're
[56:33] going to be increasingly a utilized tool
[56:36] for ensuring that consistent quality over time,
[56:40] over frontier models, over harness ships, whatever
[56:43] is changing.
[56:46] Any other questions?
[56:48] One more?
[56:49] Yeah.
[56:50] All right.
[56:50] Let's maybe one more after you if there's anybody in the ..
[56:56] Yeah.
[56:57] Sure.
[56:58] Sorry, you didn't see me.
[57:00] We'll go.
[57:02] So you talked a lot about different proposals
[57:06] and ways to go in.
[57:09] But in Brazil, we are very worried
[57:13] about the time of production of like a new feature called greens or any other one and
[57:22] my question is about how to bring that to the team like in a way to build the systems
[57:31] other than the features like seeing
[57:33] in not having a short term vision.
[57:39] How do I bring that instead of building features
[57:44] other than systems?
[57:46] So I think your question is about how can you
[57:51] start to shift away from just focus on the feature output
[57:56] and instead of focusing on investing in the system
[57:58] or the harness that you're using to develop
[58:02] like the various features of Clot or KineRoddy or Codex
[58:07] or whatever tool you're using.
[58:10] I think one of my favorite pieces of advice that I've
[58:18] heard, if you ask the agent to do something
[58:25] and you get an output that's not correct,
[58:28] don't reprompt the agent.
[58:30] Go back, fix your system, fix your harness,
[58:33] you can adjust it, prompt again, see what changes.
[58:37] If you really adhere to focusing on fixing the harness
[58:42] as you go, instead of re-prompting
[58:46] and like micromanaging the agent,
[58:48] the compounding effect over time
[58:51] that you'll get in that harness is tremendous.
[58:54] Now realistically, that is a huge commitment to make, right?
[58:58] especially if you have things you need to get done,
[59:02] because you might have spent four out of five days
[59:05] this week refining your harness, and then day five,
[59:09] everything gets built and shipped.
[59:11] Now, if you think about normal development trajectories,
[59:14] if your engineering manager is watching you do this
[59:17] and you write down code, and you're saying
[59:19] it's gonna be done on Friday, he's probably biting his nails
[59:22] and not happy about what you're doing.
[59:25] So it's a mind frame shift.
[59:29] The more you think system first, the more you're
[59:31] going to get the leverage downstream.
[59:34] Yeah, and about the time of the
[59:37] future cloud brings, do you think
[59:42] about bringing security to safety to the team
[59:47] that the vision that we should build systems instead
[59:51] of building futures only?
[59:54] How do you bring that vision, not just to the team,
[59:58] that of the developer team, but to the business team?
[60:02] Like, we are building this because of bringing
[60:05] that compound .
[60:11] So this is something I get to spend time on freely
[60:14] in my home little side projects, which are mostly focused on me
[60:17] just learning, to be honest with you.
[60:21] These are conversations that are ongoing in the teams
[60:25] I actually work with.
[60:28] I don't know that I have a final answer there.
[60:31] But I think the reality is we all want to get more done.
[60:37] Who doesn't want to ship more features?
[60:39] So we just continue to have discussions
[60:43] about how can we invest in repeatable workflows
[60:48] and use cases that we can solve with these types of tools.
[60:52] I'm still figuring it out in terms
[60:53] of within the larger context of a corporate environment
[60:57] and within an engineering team.
[60:59] And I'm the product manager, so I
[61:01] get maybe limited response when I tell my engineers how
[61:05] to do their coding.
[61:07] So that's dangerous for everyone.
[61:11] But I've had really, really good experiences.
[61:14] I migrated an entire website from React PWA to Next.js overnight with a skill that I spent
[61:22] a week and a half working on.
[61:25] It was great.
[61:26] Just for fun.
[61:28] We have one more question here.
[61:30] So I'm just curious with the new development and easier adoption, do we see a lot of traction
[61:36] compared to last year?
[61:38] Do we see a lot more people integrating with PayPal with this new capability?
[61:44] So that's a fair question.
[61:46] We've kind of launched this in a soft way right now,
[61:50] and just kind of seeing how it goes.
[61:53] So I think the discoverability of the feature right now
[61:58] is pretty nimble.
[62:00] When you see people use it, it's pretty exciting
[62:03] to see it.
[62:04] But I think without some kind of marketing effort,
[62:07] it's hard to see what the actual legs will be.
[62:12] So we have one more question here.
[62:14] So I think let's shift the focus from the language models and coding models to something like Apple Intelligence.
[62:23] After this, just deepening to this Apple Intelligence in WWDC, what do you think about Apple Intelligence?
[62:32] What do you see PayPal doing in iPhones or mobiles?
[62:37] Like, until now, most of the language models
[62:40] are focused on B2B or something like developer-focused.
[62:45] Like, nothing is going to the last mile.
[62:47] I mean that for customers and stuff.
[62:50] What do you think that Apple can bring into the table
[62:53] with a platform or collaborate on maybe what
[62:56] can contribute on top of Apple ?
[63:00] Honestly, I don't.
[63:02] I haven't started thinking about it.
[63:04] I'm actually an Android user.
[63:08] So that's a hard one.
[63:11] I do have a general opinion here.
[63:13] I think we're so far ahead on coding
[63:16] because there's a lot of money to be made there.
[63:18] It's very easy to capitalize the value you drive there.
[63:24] It's also more refined because it is more .
[63:28] The answer is much more finer.
[63:30] As you get closer to user experiences
[63:33] and things like customer support.
[63:36] I think the framing, I'm going to use the word harness again,
[63:40] that's probably necessary to make those actually seamless
[63:44] is tremendous in comparison to what you need
[63:48] to implement an SDK.
[63:51] So if that's related to Apple intelligence,
[63:55] I think we're going to see more investment in those spaces.
[63:58] But I also think the juice is less worth the squeeze.
[64:02] I don't care what the code looks like,
[64:03] if it's working perfectly, right?
[64:06] But I care about how my conversation felt
[64:09] when I call support.
[64:11] It's gonna be a while, I think,
[64:12] until agents really know that one down.
[64:15] Just a follow up question.
[64:16] What do you think about privacy
[64:18] if you are just charting across multiple systems
[64:22] and everything, right?
[64:23] You're just sharing all the user information,
[64:26] but Apple intelligence is something like internal,
[64:28] which is pretty much private,
[64:30] And every data is private.
[64:33] It's mostly around the private .
[64:35] So what do you think about those things?
[64:37] Again, I'm not an iPhone user.
[64:41] I don't know that Google is much better,
[64:43] but I don't have a response to that.
[64:47] Thank you, Nathaniel.
[64:48] OK, thanks.
[64:53] Quick shout out.
[64:54] Thank you all for joining us this evening.
[64:57] Thanks to the speakers for these wonderful conversations.
[65:01] Especially to the audiences in engaging
[65:04] into these conversations.
[65:06] It was really enlightening.
[65:08] And we still have the venue until 8 p.m.
[65:12] And by the way, thanks to the APAL team
[65:15] for being wonderful co-sponsors.
[65:21] Kind of helping us set this up.
[65:25] And we have some swag and maybe some drinks left in the end.
[65:28] And we have them at 8.
[65:29] So feel free to mingle around and discuss more if you want.
[65:34] Thank you all, everybody.
[65:35] Have a nice evening.
[65:36] SPEAKER 1, SPEAKER 2, SPEAKER 3, and SPEAKER 4,
[65:42] and the audience.
[65:45] SPEAKER 1, SPEAKER 3, and the audience.
[65:48] SPEAKER 4, and the audience.
[65:51] SPEAKER 5, SPEAKER 6, and the audience.
[65:54] The last one is Olson.
[65:56] Olson is the last one.
[65:58] Marco, Miguel, and Olson.
[66:02] Olson is the last one.
[66:04] How many colors are there?
[66:08] This was the first one.
[66:10] This one is the last one.
[66:12] This one is the last one.
[66:14] This one is the last one.
[66:16] The last one is the last one.
[66:18] Who asked the question?
[66:20] I asked the question.
[66:22] I don't know.
[66:25] I was just going to say 10 minutes.
[66:27] 10 minutes.
[66:28] You know, 10 minutes for each one?
[66:35] It's fun to do it all at once.
[66:38] Yep.
[66:41] It's been a long time, and thank you.
[66:44] Thank you.
[66:48] Let's do some networking.
[66:52] Thank you.
