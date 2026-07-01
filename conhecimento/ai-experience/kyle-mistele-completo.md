---
tipo: transcricao
fonte: aula-externa
tema: produto
evento: ai-experience
autor: "Kyle Mistele"
organizacao: "HumanLayer (CTO)"
sessao: "Loop Engineering from first principles"
evento-nome: "AI Engineer World's Fair"
pode-ir-comunidade: true
anonimizado: true
criado: 2026-07-01
modelo: whisper-large-v3
idioma: English
duracao-seg: 366
status: bruto-revisar
autorizado-usar: false
---
# Loop Engineering from first principles — Kyle Mistele (HumanLayer (CTO)) [bruto]

[00:00] This happens. I want to zoom out to the first great coding agent. Why did Cloud Code go from nothing to four billion, and I think now they're at nine billion in revenue, in under a year?
[00:12] Because there were great CLI agents before Cloud Code. You had Ader, you had CodeBuff, there was a bunch of tools in this category.
[00:17] They had all the same tools, read, write, edit, grab, bash. So what was the difference?
[00:22] The difference was that this was the first time that a model lab trained a model against the harness they were going to distribute it to users in.
[00:31] And it got really, really good at, this is just some of the tools, but it got really, really good at calling these sorts of tools in an agentic loop.
[00:38] In fact, the OpenAI team did a talk in November about basically if you are a harness builder and you don't own the model weights and you can't RL the model in your harness,
[00:49] you will always be at a disadvantage compared to somebody who owns both the model and the harness.
[00:55] And I'm going to cite a couple slides from my buddy Calvin French-Owen, who was a MTS on Codex during the initial launch.
[01:02] But LMs are just next-open predictors.
[01:04] This is a slide from over a year ago where basically as you're doing your agent loop, context window goes in, next step comes out.
[01:09] And
[01:11] we're trying to do this, I haven't actually timed this, but we're going to see if we can do coding agent reinforcement learning in 60 seconds.
[01:16] So what we're going to do is we want to train a model to get better at tool calling, better
[01:19] at solving software problems.
[01:20] We're going to generate a bunch of, we're going to give it a problem and we're going
[01:23] to generate a bunch of traces.
[01:24] Try to solve the problem a bunch of different times We going to score them all on correctness and test pass and all this stuff And then we going to reinforce We going to make the bad behavior less likely And we going to update the weights to make the good behavior more likely
[01:38] One of the classic ones here is SweetBench Multilingual.
[01:41] They're about 15-minute tasks.
[01:42] They're from open source repos like Redis, AQ, Django, and all this stuff.
[01:46] And they have binary one or zero rewards on,
[01:49] did you fix the problem you were trying to fix?
[01:51] And did you do it without breaking anything else?
[01:53] And we look at actually a real problem from one of these benchmarks.
[01:55] This is Fastlane, which is a Ruby project.
[01:58] Basically there was some issue where we weren't checking
[02:00] for nil and we have a stack trace blow up
[02:02] because we have a null-poor-increase action.
[02:04] And in this benchmark you have a base commit
[02:07] that we're gonna check out before the issue
[02:08] was solved by a human in the past.
[02:11] We're gonna give it a test patch that says
[02:13] here's what the behavior should be afterwards.
[02:16] We have a golden patch, both of these are hidden
[02:17] from the model.
[02:19] And so we have the agent go try to solve the problem.
[02:21] We store its patch, we undo all the changes it made
[02:24] any test files, because I'm sure you've seen models comment out tests just to get things
[02:28] working. And then we're going to apply our golden test match, and then we're going to
[02:33] run the test. All tests end in the new test pass, and if they both pass, then we get the
[02:38] reward, otherwise we don't. And so models are trying to get the test to pass. There's
[02:42] no way in this system that we can penalize it for poor program design or for eroding
[02:46] the maintainability of our systems. That's why we get things like this, try catches around
[02:50] things that probably don't need a try catch.
[02:53] Or things like this.
[02:54] I think Baiba gave us this example earlier
[02:56] of casting things to other things
[02:58] just so the model can just just wants to get the cast the path And so if you can verify the maintainability of the code it gets way harder to train on this So you remember this picture
[03:09] Verifying code quality and maintainability
[03:11] is orders of magnitude harder than the code runs in the test
[03:14] pass, because the cost function of bad architecture
[03:17] is measured in months and years.
[03:19] If you have a coding episode, and then you only
[03:22] find out months later that, like, ooh, somebody
[03:24] vibed this a little bit too hard,
[03:25] it's really hard to propagate that reward signal
[03:28] back across the gap.
[03:29] And now the frontier is getting better, slowly.
[03:32] And since I know someone's gonna be
[03:33] in the YouTube comments about this,
[03:34] yes, I know benchmarks and verifiers are different
[03:36] and they actually have to be separate data sets,
[03:38] but they're shaped the same and the structure
[03:41] of these benchmarks is directionally correct.
[03:42] So we'll look at these as like,
[03:44] what is the future of evaluating code maintainability?
[03:47] There's a really cool one called Sween Marathon
[03:49] from Abundant AI where they do like 400 hour tasks
[03:51] of like clone all of Microsoft Excel, every single feature.
[03:55] And they have some sophisticated reward channel stuff.
[03:57] Deep Sweep from Data Curve is also like large tasks
[04:01] on OSS repos that are not actually in the training set
[04:04] because they were never actually built in the real world.
[04:07] And we have Frontier Code from Cognition,
[04:09] which is multi-PR tasks.
[04:11] They do interesting things like, hey,
[04:12] if the model writes tests that don't fail
[04:13] on the pre-patch code, then it gets penalized.
[04:16] And we have a judge model that says,
[04:18] okay, did this follow all of our code quality rules?
[04:21] So we're getting better, but I think models judging quality
[04:23] can only go so far, because if the new model,
[04:25] if the model knew what good code looks like,
[04:28] it would probably write it in the first place And review agents and throwing more tokens at the problem it can raise the floor but we still constrained by what we can teach during RM And so I will posit that for now
[04:41] we're stuck reading the code,
[04:43] but we can still move pretty fast.
[04:44] And of course, there's a world where this is solved
[04:47] in the future, and if you wanna just keep yoloing prompts
[04:49] until you get to GPT-7, you don't have to think about this,
[04:52] by all means, please.
[04:53] But better less be damned, we've got some problems to solve,
[04:56] so let's engineer our way out of this.
[04:58] So turning the lights back on, we're going to put the code review back.
[05:02] We're going to embrace this approach of how do we plan up front to reduce the chance that
[05:06] we have a long or difficult review process.
[05:08] We're going to find leverage, we're going to use AI to help with this.
[05:12] The first thing we're going to do is we're going to do some sort of product review, understanding
[05:15] what problem we're solving, what's the desired behavior, maybe looking at mockups.
[05:19] Here's a product review I was working on yesterday with a mockup of a new feature.
[05:23] Once we have our product review, we're going to...
[05:25] And by the way, small stuff still just goes straight to the agent.
[05:28] But once we have the product review, we also do system architecture.
[05:31] A lot of people have been doing this for a while, component contracts, data models, constraints.
[05:36] This is an example of a doc that we built to understand how these systems are going to fit together.
[05:40] It looks like the high-level picture of it.
[05:43] From there, we do something that I think is really underemphasized in agent decoding these days, which is program design.
[05:49] I think people assume that once you get the architecture right, the model can just cook.
[05:52] But we often look into the types of method signatures,
[05:57] program layout and call stacks.
[05:59] So here's some examples,
[06:00] I don't think you'll be able to read this one,
[06:01] but this is like the level of abstraction we're at,
[06:03] is how are we actually gonna lay this stuff out
[06:05] and how are these systems
