---
tipo: palestra
fonte: ai-experience
evento: ai-experience
sessao: "Palestras expo vol. 3 — íntegras"
pode-ir-comunidade: true
anonimizado: true
criado: 2026-07-09
---
# Palestras expo vol. 3 — íntegras

> Áudio de salão, transcrição automática: erros de reconhecimento esperados. Nomes de plateia anonimizados como [participante].


## WTF Is the Context Layer? The Missing Infrastructure for Production Agents

[00:00] I don't know if the clicker is working.
[00:20] At the end, it's working.
[00:23] Thank you.
[00:25] The problem we solved is we say AI doesn't know your business.
[00:28] We fixed that.
[00:28] We work with an incredible group of companies around the world, ranging from GitLab and Zoom and Discord and Affirm to large enterprises like Masterbird and General Motors.
[00:40] And about a year ago, my co-founder and I went on stage and we said, at the dawn of the internet era, Bill Gates had written this very famous blog post and it said, content is king.
[00:54] And as we are at the dawn of the agentic era, content will be king.
[00:58] Since then, it seems like 2026 is the year of context,
[01:03] context graphs, anyone?
[01:06] You know, every two days you see some version of context
[01:10] popping up, and so what is going on?
[01:14] I believe the answer to this kind of is in this
[01:18] reality distortion field that we live in.
[01:21] I live here in the Bay Area, every day or two
[01:24] I have conversations with people which kind of go like,
[01:27] How far are we from AGI?
[01:28] And we have a debate, and we're like, well, one year, three years, so on.
[01:32] There is no doubt that the models are getting exponentially smarter by the day.
[01:37] Two years ago, they couldn't pass the bar.
[01:38] Today, if they were to take the bar, it was in the top 1% of test coders.
[01:43] On the other hand, they're not exponentially more useful by any benchmark.
[01:48] One out of five AI use cases actually make it to production.
[01:52] You know, 56% of CEOs say that there is zero financial benefit from AI today.
[02:00] So what's going on?
[02:01] I believe that in plain sight is actually how performance is measured in the human world.
[02:08] Cognitive intelligence doesn't really determine real-world effectiveness.
[02:13] In fact, only 10% of job performance variance is explained by IQ.
[02:18] And just think about it. Would you say your smartest, you know, teammate who scored the highest on the SATs is also your best teammate?
[02:26] Or would you say, no, it's the person who works the most and takes the most feedback and learns the fastest?
[02:34] In the real world, we care about performance. And performance is outcomes that you deliver in the real world.
[02:41] And performance is a function of two things. It's a function of intelligence, which is cognitive horsepower.
[02:45] That's what the model benchmarks measure every day.
[02:48] But it's also a function of context.
[02:50] This is what they say in this movement word
[02:52] as learning on the job, right?
[02:54] Knowledge and skills and expertise that will all over time.
[02:59] And in the last decade,
[03:01] we have compounded on one of those parameters.
[03:04] Intelligence has thousand X in the last decade.
[03:08] Just in the last six months,
[03:09] we have two X on that axis.
[03:11] On the other hand, context,
[03:14] the situated knowledge of your business,
[03:16] that's very moved.
[03:17] We've moved some data to the cloud,
[03:20] but that's about it.
[03:21] It's otherwise logged in dashboards,
[03:23] Slack threads, and the head of that analyst
[03:27] who might be leaving next week.
[03:31] And so the question ahead of us,
[03:32] and I really believe this is the next frontier,
[03:35] is how do we help AI build context about our business?
[03:40] And every time I'm faced with a question
[03:42] about how do we help AI do this,
[03:45] I always like to go back and understand
[03:46] how do we help humans do this.
[03:50] I'm going to take you into the life of, you know,
[03:53] an exemplar employee, Maya.
[03:56] Let's say she's a data analyst at Metcontext Burgers
[03:59] because I thought I was going to be creative
[04:01] and I'm not very creative.
[04:04] And, you know, let's say she's an analyst
[04:06] that everybody, you know, picks in your company, right?
[04:10] She's the person that everybody sends a message to,
[04:12] every morning when they're trying to solve a problem.
[04:14] So let's say this morning, there's a franchisee owner
[04:18] who sends her a message and says,
[04:19] why is my drive-through time up this week?
[04:22] Why is this metric up this week?
[04:24] Sounds like a really simple question.
[04:27] But it's actually a really complicated question to ask.
[04:30] Just to answer this one very simple question,
[04:34] Maya first needs to know what is drive-through time
[04:39] and who's asking, is it finance or is it, you know,
[04:42] my ops team and it might mean different things.
[04:46] But not just that, what does this week mean?
[04:48] Is the cutoff period Monday to Sunday?
[04:51] Is it Pacific time?
[04:52] Is it Easter time That knowledge that facts that the map of the business But not just that there expertise right There a diagnostic table What does a great analyst do
[05:06] They know that quarter three is a seasonal quarter because of weather patterns
[05:12] and they know to go check if the reason there's a spike is because of seasonality.
[05:17] They also know that the company launched a product just that quarter.
[05:22] And so, you know, to check if that's why the root cause analysis failed.
[05:27] This is expertise and skills that people pick up over time as they learn on the job.
[05:32] And then there's notes, right?
[05:34] There's, you know, persona scoping.
[05:36] Who's asking the question?
[05:37] How do I answer this question?
[05:40] And Maya, she's one of those, like, cool people.
[05:42] She nails it.
[05:42] She sends an answer, not just with the answer, but with the why and the root cause.
[05:47] And she finds the reason for it.
[05:49] how did maya learn to do this uh she just joined the company a year ago um first maya you know
[05:58] has like she joined and she got some training like all of us do but that's not where any of
[06:04] us learn right in our companies how do we learn we learn because you shadow like the best teammate
[06:11] and then you see why they're doing something and then you learn from that and then you make a
[06:15] Who here has learned more from a mistake than anything else?
[06:20] Right?
[06:22] You make a mistake and then you learn.
[06:24] Your manager gives you feedback
[06:27] and you learn not to do that again.
[06:28] You deal with an edge case and then you learn from that.
[06:32] That's how all of us humans learn at work.
[06:36] And so then the question is how do you help build
[06:39] the agentic Maya?
[06:42] And now I'm gonna walk you through our experiments
[06:44] learnings as we built this at Atman. Era one, this was roughly about 18 months ago now, we started on
[06:54] the track of bootstrapping agents. And the way we went about it was that we started this with our
[07:00] customer experience team and we did this jobs to be done analysis map, right? And so we said, hey,
[07:07] if you are someone on our customer experience team, what are all the things that you would
[07:11] do on a daily basis. And then we made some hypotheses. We said, you know, for example,
[07:17] one part of the job is documentation and meeting prep. We said, well, AI could probably do
[07:22] that job pretty well. And so we built the scaling factor. So on the other hand, relationship
[07:27] management is something that our customer experience team does. And we said, hmm, that
[07:31] doesn't sound like something AI is going to be able to do anytime soon. And so we built
[07:35] the scaling factor. And then we basically started bootstrapping these individual agents that were
[07:43] like built for that specific topic. Our team got creative. So we had Hermione, who was our health
[07:50] intelligence lead. And then we had, you know, Moneypenny, who was our financial risk analyst.
[07:55] And we just made that particular agent really good at doing that one thing. And that worked
[08:03] for some time.
[08:06] But then we realized there were some challenges
[08:07] with this approach.
[08:09] The first, context engineering.
[08:12] We got to the point by middle of last year
[08:14] where building an agent was really easy,
[08:16] took like five minutes.
[08:17] But giving it the business context
[08:19] that it took to actually get it to be accurate
[08:22] took forever.
[08:24] Quality of the agent,
[08:25] often dependent on the quality of context engineering.
[08:29] And that led to a lot of weird lost trust cases
[08:32] with our stakeholders.
[08:36] Then, as we started taking this into production,
[08:39] we started seeing that these agents
[08:41] basically were kind of like living on their own island.
[08:44] Now imagine, for example, if you're in a human team
[08:47] and your marketing changes positioning on your, you know,
[08:50] and then they come to the town hall
[08:51] and they tell you that they changed positioning.
[08:53] And so then, you know, the SDR on your team
[08:56] or your sales development rep,
[08:57] they know that they should use that new positioning.
[09:00] This is like the infrastructure that we've built for humans
[09:02] inside our organizations.
[09:04] Agents?
[09:05] Didn't have them.
[09:06] So our marketing team had these agents
[09:08] and they started making changes to that.
[09:10] And then our SDR agent on our website
[09:12] was still pitching the old version.
[09:15] We had no idea how any of these things were even connected.
[09:18] So we didn't even know how to run this as a team of agents.
[09:23] When an agent gets something wrong, this is hard.
[09:26] It was really hard to trace back what happened.
[09:28] Was it the model?
[09:29] Was it the agent?
[09:30] Was it the context?
[09:31] How do we even go back and fix this?
[09:35] And over time, we started dealing with context fraud.
[09:40] We had, the hard part about this was
[09:43] agents all had their own memory systems
[09:45] to a certain extent.
[09:46] So they were learning,
[09:48] they were all learning separately,
[09:49] they were learning differently.
[09:51] It became very very difficult very quickly to say okay what is the single version of Truthier look like And then over time we actually went through in the last 12 months we gone through cycles of
[10:04] at the agentic year, about 12 months ago,
[10:06] we were using one of these no-code type builders
[10:08] called Relevance.
[10:10] We went from there into Google ADK,
[10:12] then we tried Glean.
[10:14] Started this year, we moved to Cloud Code.
[10:17] Now we are kind of like 50-50 Cloud and Codex.
[10:19] and every single time as these changes happened,
[10:25] our context got trapped in each of these individual systems.
[10:30] So, starting this year,
[10:31] as general purpose agents started to become a thing,
[10:34] we said, what if there was a different approach
[10:36] with general purpose agents?
[10:39] Again, going back to the human world,
[10:41] well, Maya, she's not an individual star.
[10:44] She's part of a team, right?
[10:45] And, you know, you talk about these dream teams
[10:47] like Maya and someone who runs customer support
[10:50] and someone who launches ads.
[10:52] These people work really well together.
[10:54] And often these dream teams are built on shared context.
[10:58] They have a shared language.
[11:01] They have a shared picture of what's true today.
[11:04] They have shared playbooks.
[11:06] They have shared norms, who's allowed to make what decision.
[11:10] And then they learn together.
[11:12] I think this is the most important part of it.
[11:13] They have compounding learning loops of what good looks like.
[11:16] and they have shared memory that, you know,
[11:19] oh, we launched this thing last quarter
[11:21] and it was terrible
[11:22] and we're not going to make that mistake again, right?
[11:25] And so we said, is there a way to bring that
[11:27] into the way we think about AI in our companies?
[11:31] And so the mental model we started working on
[11:33] was we said, okay, we have these teams of humans
[11:36] and they're across the board
[11:39] and can these people essentially start
[11:41] building domain skills?
[11:43] So each of them is responsible
[11:45] for a certain set of skills.
[11:47] All of this goes into this common one place,
[11:50] which is this one company brain of sorts, right?
[11:54] I like to think of this as the context here.
[11:56] And then this has a bunch of retrieval mechanisms,
[11:59] which then drops to the general purpose agent
[12:01] across the ecosystem.
[12:04] So then we started the experiment.
[12:07] This is some version of what our marketing team
[12:10] ended up building.
[12:11] So you'll see on the left,
[12:13] those are all the systems that our marketing team
[12:15] So data systems, our social and community platforms,
[12:19] our ad platforms, our analytics platforms.
[12:23] And then you'll see this agent block.
[12:26] We built this very specifically for having openness.
[12:31] So we had Cloud Code at CoWork.
[12:33] We also had our own Claw that we deployed,
[12:36] which has essentially talks in our Slack channels.
[12:41] And then we used some external products
[12:43] like Qualified and Artisans.
[12:45] In the middle is kind of this context here that our team started building.
[12:50] So think of it as our best SEO person was building an SEO skill.
[12:56] Our best competitive and talent person was building the best competitive and talent skill.
[13:00] And that kind of became this common rapport that we were building into and pulling out
[13:05] from.
[13:06] This sort of became our living brain.
[13:09] Over time we realized there were some things that we needed in this brain, right?
[13:14] we realized we needed a data graph.
[13:15] Like if, for example, an autonomous ads agent,
[13:19] we realized it needs to do analysis on a daily basis,
[13:21] or like which tables should I go pull from?
[13:24] We needed a library of skills.
[13:26] We also needed some other things, semantics, metrics,
[13:29] what is ARR, how do you measure that?
[13:32] What's the qualified lead in our company?
[13:35] And org structure, entities, things like that.
[13:39] Over the last six months,
[13:41] we ended up creating about 300 skills
[13:43] and 40 agents in this team, which has been incredible.
[13:48] But then, with this approach too,
[13:50] we realized that there were some challenges.
[13:52] We realized that context kind of needs to be managed
[13:56] like code.
[13:59] So some challenges, let's pick skills.
[14:02] Dependency management became really complicated.
[14:05] So for example, we have this competitive intelligence skill
[14:08] and it learns from the market
[14:10] on what's changing in the market, and it improves.
[14:15] It feeds a category positioning skill,
[14:18] which then feeds our sales battle card skill.
[14:21] Now each of these skills is learning and evolving,
[14:24] but every time they learn and evolve,
[14:25] it breaks something downstream,
[14:28] and these skills very quickly start getting out of here
[14:30] and start shifting.
[14:32] Who owns skill quality became another thing,
[14:34] like who eventually owns the quality of this.
[14:37] Security and governance was a nightmare.
[14:40] We had secrets hard-coded in .env files.
[14:43] It was, people were downloading these public skill repos.
[14:47] The whole thing was like a nightmare.
[14:49] And then I talked about context portability across all these multi systems I started this talk by saying WTF is a context here These are the problems that a context here is meant to solve
[15:02] The question I'd like to ask is, what does the GitHub for context look like?
[15:09] Few thoughts.
[15:11] Company context means lifecycle management, collaboration, and versioning, just like code
[15:16] does.
[15:16] you know there's questions like what's local context what's global context how do i keep
[15:23] this updated so on some thoughts in this can skills have a profile just like code does
[15:30] can that have a self-learning loop that's baked into it what does quality management look like
[15:39] can you have security and postures posture management associated with that that's really
[15:44] at the first step. I see this as like having something that has built-in versioning and
[15:50] quality and dependency management. So you should be able to say, hey, this thing impacts
[15:54] all these other things. This is the approver. This is the maintainer. These are the contributors.
[15:58] How do you build like kind of human plus AI workspaces that these skills are managed
[16:04] via? Second thing, every interaction creates more context than harnessing this is gold.
[16:12] Deshbing, I know a lot of talks about self-improvement loops.
[16:16] We have found that with traces,
[16:19] deploying a specific harness that actually specializes
[16:23] in being able to go and reverse construct stuff like that.
[16:26] So think of it as AI that's reading through all your traces
[16:29] and almost brings it back to your maintainer loop
[16:31] and says, approve, reject, approve, reject,
[16:35] improve this over time.
[16:36] That's the compounding learning loop.
[16:38] And the third, often a lot of people ask me this question, which is like, how do I start?
[16:45] Because my business is really disparate and I have all these like 60 systems and how do I even start?
[16:50] One of the biggest learnings we've had is context is hidden in business systems.
[16:55] And across this context quality can really compound.
[16:59] So, for example, if you're able to connect your Salesforce and your HubSpot to your data warehouse,
[17:04] to your application layer, and then you're able to reverse construct how these things
[17:08] are actually connected one to another, context today gets lost in every one of those hops.
[17:13] But if you can reverse construct that and then deploy AI on top of it, we've seen incredible
[17:20] accuracy in being able to reverse construct the first version of your company.
[17:25] So I'll end with this.
[17:30] The way I think about a context layer is it's a system that turns knowledge and expertise and norms that we talked about at Mayanos into a machine usable context for AI systems.
[17:43] At a very high level, the way I like to think of it is it looks like this.
[17:50] It continually is mining context from your business systems.
[17:55] It's feeding this in to that one company brain.
[17:58] It's harnessing this in skills and context development life cycles as your teams go and deploy these agents.
[18:05] And then it has a bunch of ways you can retrieve it.
[18:08] So MCP, SQL, vector retrieval, hybrid assembly, all these different ways that you retrieve it and pull back from traces and build this compounded learning loop.
[18:19] Today, we're largely building agents by hard coding context.
[18:26] The scale of this problem I truly believe is underhand because with scale this can become
[18:35] really unsustainable and a little dangerous.
[18:36] Like all of us know this old joke which is if you ask sales and finance the revenue number,
[18:43] you're going to get two different numbers.
[18:46] we're fast approaching a moment of starting to deploy autonomous systems where the same thing is starting to happen.
[18:54] So I'll end with one last thing. I started this presentation by saying context is king.
[19:00] I'd like to end it by saying context is also IP.
[19:05] Something I think a lot about is in a world where you and your competitor have access to the same models and the same intelligence,
[19:14] what differentiates a company?
[19:16] What differentiates a customer support agent
[19:19] at American Express versus Amazon?
[19:23] That's how you do business.
[19:25] That's what makes your company special.
[19:28] Context is how we take and encode our culture and our norms
[19:32] into something that we will be proud of
[19:36] as we build autonomous frontier firms.
[19:40] And that's all I had.
[19:41] you can find me
[19:44] at Rukalpa on Twitter
[19:45] or write to me.
[19:47] We are actively working with folks
[19:50] on the frontier on going and shipping
[19:52] the things.


## Agent Memory Is a Solved Problem. Agent Learning Is Not.

[00:00] We are a company, haven for customer support, and growth vector for a coordinated go-to-market within sales and marketing.
[00:07] And we run two agents externally for our customers and users.
[00:11] The first one is PerfAdvisor, which is an agentic database admin.
[00:15] So it runs databases for our customers, has a database company, pretty useful.
[00:19] And Voyager, which helps them migrate and modernize from other databases to a cloud-native one.
[00:24] So for agents, we failed to ship anything and make it work at all.
[00:30] It was really hard.
[00:31] We've been trying for almost a year before we realized we were failing at the data problem.
[00:38] And if a database company is failing at a data problem, be it for agentic, it becomes personal.
[00:43] So yes, it became personal.
[00:45] We're like, what the hell is going on?
[00:46] And when we then realized that a lot of people were asking us, yes, we can do scalable vectors, we can do scalable graph, we can do scalable relational.
[00:53] know. People came to us and said, more scale, more performance, less cost. We're like, wait a minute,
[00:58] at some point, this is ridiculous, right? It's breaking the laws of physics. So what is the real
[01:04] failure, right? When you cut everything apart and just go to the core, it's because agent A,
[01:10] my agent, is doing some work and I need to work with, say, one of you guys, say maybe Heather,
[01:16] right? Who's going to be showing a demo. And I am not able to give that context. I'm only able to
[01:21] give the output. The output being an MD file, a PDF, a document, a something, but I'm not able to
[01:30] give the reasoning behind it, right? So what does this lose? This loses reasoning. This loses the
[01:36] dead ends, the number of failures you've had before you actually succeeded, and it loses the
[01:40] whole context, right? That means Heather's agent is going to be re-deriving all of this stuff,
[01:46] and it's not for free. You're burning tokens and paying somebody else for it.
[01:49] This is the same as a group of humans working together.
[01:53] When a new person joins the team, they're going to be told, we're going to do X.
[01:59] And they come up with 50 reasons why we should do something else.
[02:02] And each time, yes, we considered that two weeks ago, two months ago.
[02:06] That's not how humans operate.
[02:08] We actually bring the person in and say, okay, look, this is the context.
[02:11] This is the history of the project.
[02:12] This is how it's done.
[02:14] Now let's go from here.
[02:15] That context is missing for agents.
[02:17] so five things misconceptions okay really quick more memory agentic memory is not learning it's
[02:26] just more memory right like it's more expensive shared state is not shared knowledge just because
[02:32] you can share something with somebody else like an md file or something doesn't mean your shared
[02:37] knowledge rag transcripts let me rag everything is not equal to learning and quality it just means
[02:43] there's a whole bunch of garbage there and now LLMs get to burn even more tokens to give you
[02:47] even worse results. Fine-tuning is not scalable. You cannot, you know, save and persist lessons
[02:55] that agents have come up with through fine-tuning and building custom infrastructure. And a bigger
[03:00] context window is the surest way to quickest failure in an expensive manner, right? Because
[03:05] it doesn't do anything, your context rots. Every single one of these is a architecture gap, right?
[03:10] So, this is what we realized we needed to plug for ourselves.
[03:16] And we've been finding a lot of users are really enjoying and really liking this approach of thinking about context.
[03:23] Firstly, if there's a context that agent A can share with agent B, it closes the lost context problem.
[03:29] They're working on the same context.
[03:32] Second thing is, this context can degrade.
[03:35] That means not everybody can contribute to that context.
[03:38] It's just like code.
[03:39] Not anyone can contribute. You need to go through a process of supervised promotion and only then does it make it durable.
[03:46] And lastly, you need to be able to ask the question, where the hell did this piece of information come from?
[03:51] It makes no sense at all. And be able to trace it back to something, a data source, a person, a conversation from which it was extracted.
[04:00] And that's the first step to improving your context. So.
[04:04] We started building this by assuming how hard can it be.
[04:09] So the first thing we did was, it's just a knowledge base,
[04:12] we throw everything in the knowledge base,
[04:13] it's gonna be great, right?
[04:15] And how wrong we were, we built a whole distributed
[04:18] rag pipeline, extremely scalable, very elastic, amazing,
[04:22] it was just amazing, right?
[04:23] And it didn't do anything good for us.
[04:24] And then we said, you know what,
[04:26] this whole shared stuff doesn't work,
[04:27] we'll let every agent spin up a tiny database,
[04:30] we a database company how hard can it be Tiny Postgres make it efficient Well we realized that every repeatable workflow was being reinvented on the fly Didn work at all And then we said okay fine
[04:42] we'll just have some backend
[04:43] that does a whole bunch of processing,
[04:45] and we'll just not even bother with the UI
[04:47] because agents don't need UI.
[04:49] And then we realized we couldn't tell what was going on.
[04:51] No human in the loop equals really bad results.
[04:55] Okay, and then we thought,
[04:56] okay, at least we have the RAG pipeline.
[04:58] Well, it turned out even that was shitty
[05:00] because we took all the best components
[05:03] from the whatever the academia says,
[05:06] and we put it all in there and we got poor numbers.
[05:10] 14% faithfulness using an MD benchmark, public benchmark.
[05:14] 20% on a PDF, 57% context precision
[05:17] using all of this other stuff.
[05:19] And when we actually started looking and tracing
[05:22] and doing our traces and tuning and experimenting,
[05:25] we realized a lot of things were off.
[05:27] And as we improved them one variable at a time,
[05:30] we were able to jump to 65, 74, 82, right?
[05:33] And here's the kicker.
[05:35] Our context chunks, which is a context size,
[05:38] went down from over 7,000 chunks to about 1,000 chunks.
[05:43] So one-seventh the context size, a lot higher precision,
[05:48] and a lot less money burned on tokens, right?
[05:51] So that's where Mako comes in.
[05:54] What is Mako?
[05:55] It's an agent-native persistence layer that takes all the mistakes we made and all the things we got right and puts it into one box.
[06:02] And the way Mako works, it exposes a data pack.
[06:06] As a database company, we don't call it a database because it has multiple types of databases.
[06:11] Vector, graph, relational, NoSQL, whatever.
[06:14] And what it does is stores aspects of the context, knowledge base, memory, conversations, observability, a lot more.
[06:22] right and what it enables is it enables agents to come in and push pieces of their context into a
[06:29] private space and promote that to a shared space right and then other agents or humans that come in
[06:37] can now go against that promoted high quality context and quickly retrieve stuff and you can
[06:44] now continue to add more people and more agents and do the handoff efficiently right hopefully
[06:49] that makes sense. The idea is take the durable, repeatable workflows and make it infrastructure.
[06:57] Okay, before we go into a demo, right, a confession. This slide deck that you're looking at
[07:04] was built using Mako as the context persistence layer, right? The way it worked was Heather,
[07:11] I was going to give you, show you the demo, actually wrote up an outline and created a
[07:16] data pack in Mako and simply sent me a share request.
[07:20] And she said, I'm doing the demo.
[07:22] Here's the outline of my demo.
[07:23] Here's the rough talk track that needs to lead up to it because that's what makes sense.
[07:27] I took it and I'm sure she used some agent harness.
[07:31] I don't know what it is.
[07:31] I really don't know.
[07:32] I didn't ask her.
[07:33] I didn't even have a meeting with her.
[07:35] She just sent me this.
[07:36] I plugged it into my cloud desktop and said, take this outline and break it down for me.
[07:41] And it gave me a few bullet points.
[07:43] This is what you're talking about.
[07:44] I'm like, okay, great.
[07:45] I want to change a couple of things, changed a couple of things and said, here's the new outline.
[07:50] Can you build me my slide deck based on this? And it did. And that diagram on the left, it built a really crappy diagram.
[07:56] Right. It didn't look good at all. So I said, like, you know what? Everyone's saying this cloud design is the rage.
[08:02] So why don't I give that thing a go? And it actually did a better job. So, you know, there you go.
[08:06] That image came from cloud design. Everything else came from cloud desktop.
[08:09] Shot it back to Heather and, you know, Heather took the final pass over it to get to hook it up with the demo.
[08:14] and here we are.
[08:16] So we barely talked, right?
[08:18] We didn't need to,
[08:19] we just shared context
[08:20] and our agents did the work
[08:21] and you can go,
[08:24] you can watch it.
[08:25] I think maybe I'll invite Heather
[08:27] to talk to this slide
[08:28] and the thing after.
[08:29] I hope the demo is good
[08:30] because I haven't seen it myself.
[08:31] So yeah.
[08:38] The idea is to watch
[08:42] collective knowledge grow over time, right?
[08:44] So what Miko provides that I was able to use for this is a resumability. So resumability I'm going to show you is being able to start a session and then kill it and then start it again with the same agent. Right now, if you do it with something like Cloud Desktop, they have projects for this. So if you do a Cloud project, everything's together or if you turn on memory.
[09:05] But in this case I guess like two months ago I turned off all the memory on all of my IDEs Because it doesn matter What if I use something while I on the go like a mobile app Maybe I use ChatGVT It isn as sophisticated right as some of my coding IDEs
[09:20] And so maybe I want to continue working on that topic.
[09:24] I can do that because all of the contacts are shared in our cloud now.
[09:28] And by sharing, I mean that obviously ChatGVT is a different agent, but it's still my account.
[09:35] So I should be able to get to it, right?
[09:37] But because we're security-focused and security-minded,
[09:39] we don't want just any agent to get to it.
[09:41] So I have to promote the kind of memory that that agent can also retrieve
[09:46] in a collective pool.
[09:48] And because you do this, the cost itself goes down tremendously.
[09:51] Because the first time I figure stuff out, I'm going back and forth with my LLM.
[09:56] I'm burning lots of tokens to get to an end goal,
[09:59] whether that is code or it's just a knowledge work.
[10:02] But the next time that I want to retrieve it from another agent or another session,
[10:07] it doesn't need to burn through that.
[10:08] It just calls to the MECO memory, and then it brings it right back with far less tokens.
[10:13] So we're already saving a lot of token spend.
[10:17] The alternative to this would be to just, again, keep things in empty files
[10:20] or keep things where you have to constantly traverse with every single agent,
[10:25] sell them, and burn through tokens again and again in order to retrieve.
[10:29] Does that make sense?
[10:30] The difference here is just an MCP tool call.
[10:33] So to kind of prove that out, because we have sensational internet here,
[10:38] I have recorded this for you at a little bit of a faster speed, hopefully.
[10:44] All right, see, this is resumability.
[10:46] So here I'm saying that I want to store the conversation in a certain data pack, right?
[10:52] Let's call it the early access launch.
[10:54] And I want to put a piece of information in it.
[10:56] In this case, our sign-up email failed, true story, because we actually only used the SES's sandbox instead of the prod.
[11:04] So we kind of went over the limit there when we were testing things.
[11:08] And that's a good piece of information for maybe our ops team, right?
[11:13] So in this process, it's calling Datapack create because I've connected the NCP server to plot here,
[11:21] and I've created a skill that will tell it what to do.
[11:25] you can decide how often you want it to call
[11:27] or if you just want to do it judiciously here.
[11:30] And so now it's storing the incident fact
[11:32] as a searchable memory with memory add,
[11:35] and then it's done now.
[11:36] So the data pack has been created,
[11:39] there's a conversation in there,
[11:40] and it'll be retrievable in the future sessions.
[11:43] That sounds great. Awesome.
[11:45] Now I've killed that session,
[11:47] and notice I'm not in projects.
[11:49] This is just a new chat window.
[11:51] Now I'm going to ask the same question so I can resume.
[11:55] before I had to again have to make sure I turn on cloud memory or turn or put it
[11:59] inside of a project but it's not in either one of these I could be logged in
[12:03] with the same account in like quad at AI which would be technically a different
[12:08] agent so I'm trying to prove that you can at least resume your sessions after
[12:11] maybe days with the same agent so the failure result there was actually that
[12:17] it tried to search first instead of creating a conversation a new
[12:22] conversation here. We want to save every one that we do, so it's the MCP server
[12:26] instructing to create a new conversation for it so we can store this. And see now
[12:32] they searched Miko and it found that hey this is what happened back in May, it was
[12:37] able to pull things back out. All right for shareability, let's go ahead and get
[12:46] this done. If you notice this is a completely different IDE. In this case
[12:49] it's Codex. So I've asked it questions like, okay, do you have any known cause for the sign-up emails
[12:57] that are failing? And so it's going to look and it's going to look and it says, no, I don't see
[13:02] anything. I don't see anything I'm looking. It did say that it saw that there was a brand new
[13:09] data pack that it's connected to, but it can't actually see anything. And why is that? Because
[13:16] I actually haven't shared that private memory from my cloud desktop yet into a shared space.
[13:22] So right now, those memories are still private. If you notice, the early access data pack
[13:27] is seen because I have connected it, but I just haven't promoted it yet. So in that case,
[13:33] I'm going to go to sign out. I'm going to sign in with my other account here to show
[13:39] you that, yes, I do have access to this data pack, and I need to promote that piece of
[13:44] memory into a shared knowledge space allow it to go ahead and go through And then it says it doesn see it But I said well same question Let try it again So now that I promoted it
[13:59] into that space, sped it through your pleasure here, because we all know how long-winded
[14:06] our old limbs can get, now it can find that piece of memory. It can find the piece of
[14:12] because I have allowed that one piece to go. It's very fine-grained. It doesn't
[14:15] have to be. You can open the whole data pack if you want as a maintainer to it,
[14:19] but this is much more ideal if you're just trying to give bespoke pieces of
[14:25] information, maybe best practices, maybe something that is the ongoing process
[14:29] that you want to keep going. And then like the last part of this is the cost.
[14:36] How do you even know that it saves you tokens?
[14:40] If you go into your data pack, you can look at the conversations that are stored in there
[14:45] and how they were done.
[14:46] Because we give you embedded length use traces for free in this, and you can actually look
[14:51] at the decision trace all the way down to the tool call and prove whether or not it
[14:55] called as much and burned as many tokens.
[14:59] Right.
[15:01] Right.
[15:08] So human promotions today kind of equal the training signal for self-improving orchestration tomorrow.
[15:14] Every human that says this is worth keeping is kind of a labeled example of what good promotion looks like.
[15:19] So you can actually start training maybe in the future an agent that's trained on your taste and your preferences long term.
[15:26] But right now, we're keeping the human in the loop.
[15:29] Those calls are just a signal, but this is actually how it starts to learn.
[15:33] The biggest lift that I saw is that when something goes wrong, maybe in a support situation,
[15:40] it's hard to constantly have calls call the same server that's down all the time,
[15:47] and then it's tail as old as time.
[15:49] Hey, do you know if this is down? Is that down? Slack starts blowing up.
[15:52] How do your agents handle that?
[15:54] They're all also wasting tokens calling the same thing.
[15:56] If they had access to the data pack, the first agent would hit it and then tell everybody that it happened and all the other agents would know that it already happened.
[16:12] So, yeah.
[16:15] So, thank you, Heather.
[16:16] I think, you know, pretty awesome demo.
[16:18] I think if you folks are following along what happened, Heather was in charge of the early access and launch of Mako, right?
[16:26] and obviously used a data pack, which is Mako,
[16:29] to launch Mako recursively.
[16:32] The first few people had a lot of trouble
[16:34] accessing their data packs on Mako,
[16:36] and she created a data pack for troubleshooting issues
[16:41] with Mako, a different data pack,
[16:42] and so that's the thing that she was talking about.
[16:45] A lot of us in the company, it's shared with us,
[16:48] so we're all able to look at it,
[16:49] load it into our agents and able to iterate with it.
[16:52] The folks that are in engineering,
[16:54] They load it straight into their, you know, cloud code or codex or, like, you know, whatever the coding agents are.
[17:00] Like, I myself am more of a cloud desktop kind of user.
[17:03] I use it for other things, like, you know, a user that wanted to get access, couldn't get access, apology email, like, go to cloud, help me design it.
[17:11] I have a data pack, actually, that is my voice of how I speak.
[17:15] And same thing for posting on LinkedIn.
[17:17] I think it can get tiresome if you want to keep writing it in your voice.
[17:20] You know, sometimes training a data pack for the context to do so will help.
[17:24] So a lot of these things get automated away
[17:26] and it just makes it much, much quicker to assemble, right?
[17:29] And obviously if a new person comes into the team,
[17:32] very easy to share this context with them,
[17:34] have them get up to speed, have them contribute to it,
[17:37] either willingly or unwillingly, right?
[17:39] Sometimes they're just doing things they don't even know
[17:41] and you extract patterns out of it.
[17:42] Oh, this is really great.
[17:43] We should make this a thing, right?
[17:44] So like, yeah, so I think these are some of the things.
[17:48] Anyways, I think the bottom line is
[17:49] we're trying to get it closer and closer
[17:51] to how humans work, which is,
[17:53] How can you capture tribal knowledge?
[17:54] How can you share that?
[17:55] How can you give controls over sharing?
[17:57] And how can you actually tell what's going on, right?
[18:00] Yeah.
[18:00] So you should try it for free.
[18:03] Yeah.
[18:03] If you want.
[18:04] Yeah, try it for free.
[18:05] I think the left side is, you know, on the website, makodata.ai, which will take you to a login.
[18:11] There's a free tier.
[18:12] You can sign up and just hook it up to one of your agents and, you know, get your agents to start learning right away.
[18:17] And the right side is Discord.
[18:19] We'd love to hear from you.
[18:20] If you do try it out, you know, do drop us a note.
[18:22] We're working on improvements. That's how we communicate what we're building. So do join us on digital


## AI in GTM at Notion

[00:00] In the same sphere, this is a new college that I work in.
[00:04] GTM, at most companies, involves the spider web of tools, like what you see here,
[00:10] and it's stitched together by customer notes, proposals, contracts that are passed back and forth.
[00:17] Over the last few months, a small team of myself, we've been trying to turn the spider web into a unified GTM system.
[00:25] We're still in the midst of it, but we've learned a ton that I'd like to share with you.
[00:29] today. So this isn't really a new problem. We've been wrestling with pieces of it for years,
[00:37] lifecycle messaging, product recommendations, sales automations, customer data, and onboarding.
[00:45] But the solutions were fragmented because of the online technology forcing them.
[00:51] Then over the winter break, our CEO Ivan spent it building a video game, and he came back convinced
[00:58] software engineering could be applied to many problems that were previously unwieldy or too costly.
[01:05] At the same time, our ability to execute skyrocketed with agentic technology and the breadth of problems we've solved into.
[01:15] The costly, time-consuming, and previously unsolvable spaghetti could now be sorted.
[01:21] So what we found is that GTM had become a systems problem.
[01:26] That made us realize we could chip away at this holistic.
[01:30] In case you don't know, Notion's platform is a collaborative brain for human and agents to think together.
[01:37] Over the years, we've evolved into a context layer for your company, and AI agents can act on it.
[01:44] Notion's business moves between self-serve growth and sales assist, and customers move between these two notions all the time.
[01:53] The problem is that customers experience one journey. Internally, it is supported by disconnected systems that don't actually talk to each other very well.
[02:05] These processes were rife with human error and put a lot of cognitive burden on our teams.
[02:11] For example, sales reps are probably not the strongest at managing systems, but their strength is in sussing out human signals during the buying process.
[02:21] So every time they had to context switch between after a call, doing research, drafting follow-up, they were spending less time with our customers and customer problems.
[02:33] Most companies have separate systems for sales assist and product-led growth.
[02:38] And this is actually also true for us.
[02:41] Marketing runs on one set of tools, sales on another, customer ops on a third.
[02:46] but all of them are looking at a customer independently and making decisions separately.
[02:53] So what we set out to build is a single decision system that spares the self-serve growth and sales assist,
[03:00] and it can help the customer decide the next step so that everything is cohesive.
[03:07] Our vision is for this system to be programmable, proactive, and continuous.
[03:12] When we started, we faced some challenges. There was no single source of truth. So customer data was spread across Salesforce, Gong, Outreach, Zoom Info, and many more. Product usage lifted snowflake. And a decade of the most important context lifted notes, meaning notes. Yes, our sales reps do use Notion for that too.
[03:35] Notion employees were actively using MCPs and their own agents to solve problems already, but they were innovating within their own departments.
[03:45] So it was single player mode, or you could say here, single department mode. Marketing, sales, both tools for sales, and each tool serves a tiny slice of that customer dream.
[03:58] And it would make it really hard to create something that was more holistic.
[04:03] When we tried to automate across all of that, we hit some roadblocks.
[04:09] First, data quality.
[04:10] Conflicting systems of records, wrong contacts tied to different accounts.
[04:15] One bad mapping was enough to lose trust for sales revenue.
[04:19] Secondly, data latency.
[04:21] Every vendor added a hop.
[04:23] And this lag was causing us to act on stale data, and that meant we were automating on yesterday's world.
[04:30] Third, and this is a big one.
[04:32] structured and unstructured data.
[04:35] Most important facts about the customer were left in notes,
[04:39] like the champion just left, or don't contact this customer again,
[04:44] or they're blocked illegal.
[04:46] And so these are exactly the types of notes that help sales rep move forward
[04:50] and decide what to do next.
[04:52] And if an automation couldn't see it or process it,
[04:55] it could do something catastrophically wrong.
[04:59] So our project team consisted of CX,
[05:03] RebOps, product, engineering, sales.
[05:07] And after brainstorming together,
[05:09] we all kept finding the same patterns
[05:11] underneath that complexity.
[05:16] Every workflow could be reduced to four questions.
[05:19] What do we know about the customer What should happen next How do we execute that safely and did it work That became our architecture
[05:30] So the system has four layers.
[05:33] Know a context layer we can trust about every customer.
[05:36] Decide, choose the single next best step for them.
[05:41] Act and fire on concrete action.
[05:44] That could be a life cycle email, an app nudge, or a task handed to a rep.
[05:49] And then learn, watch what happened, and feed it back into the decision so that it's a loop.
[05:56] But this architecture is missing something important.
[06:02] The most important part is that humans and agents are operating on the same loop.
[06:08] Concretely, this means that the context needs to be displayed so that humans and agents can read and operate on it together.
[06:16] So you can see that they're working in the same system.
[06:19] but they might have different roles.
[06:21] Agents do the repetitive work at scale,
[06:24] like gathering context, researching,
[06:27] drafting recommendations, and writing artifacts.
[06:30] Humans provide the judgment, adding nuance,
[06:34] deciding what to do next and if a recommendation is correct,
[06:37] and owning the customer relationship.
[06:40] We found that instead of building an AI layer
[06:43] on top of our business, we designed our architecture
[06:46] so that the agent can operate as another operator within the same system as humans.
[06:53] Before we built the system, we made some choices about how we were going to implement this.
[06:59] Firstly, we deliberately chose not to let an agent talk directly to a customer.
[07:04] For sales assist workflows, humans stay in the loop by default and approve anything the agents do.
[07:11] The agents do the busy work.
[07:13] That decision also has a security dimension too.
[07:18] If a prospect fills out a contact sales form online, we treat that as untrusted user input.
[07:24] And so trust boundaries don't break down, especially because there's an agent in the middle.
[07:30] Secondly, routing and eligibility became a first class primitive.
[07:35] Eligibility used to be scattered all over the place.
[07:38] place. We had one checker role in email tool, another in sales, and we pulled that all into
[07:44] one place so that these rules can be consumed across our code base, product, sales, engineering,
[07:52] and these are like customer segmentations or signal definitions. And then a single classifier
[07:59] will route what the customer should do, and this will actually prevent double send from our system
[08:04] and create very cohesive communication.
[08:07] And last but not least, we decided that it was very important to own the contact layer,
[08:13] and we decided to rent everything else.
[08:16] Since we are a lean team, we will not build our own email vendor or enrichment services like Clay.
[08:22] We use Clay.
[08:24] And we believe that we understood our customers the best, so we will not give that away.
[08:32] So let's get into what we built.
[08:34] The first step was to gather a consolidated view of all of our customers.
[08:40] Snowflake, which is our data warehouse, is where we compute this truth.
[08:44] We ingest data from all the vendors in our GTM stack to Snowflake.
[08:48] We run daily transforms, and in some cases, real time, to produce a small set of modeled versions of entities.
[08:56] These are accounts, contacts, workspaces, eligibility, and facts.
[09:01] And this also has clear ownership of what teams or tools they come from and timestamps. DynamoDB is our key value store, and it's where we compute our truth, or serve our truth. We publish a denormalized key addressable profile that agents can quickly query in milliseconds with no joints.
[09:20] We also persist agent persistent or generated artifacts.
[09:25] And these are research snippets, summarize notes, rolling summaries.
[09:29] And these unstructured data are also keyed by the same IDs so that downstream systems can read all of this in one shot.
[09:40] So this data was normalized and of course, we brought it into Notion so that we could work with structured and unstructured data at the same time.
[09:48] So some of the data I showed you in the boxes earlier, there's like product usage data, there's activity logs from across our vendor stack, and then we also have like unstructured data that, like I mentioned, that is most important for sales context with research reports and notes.
[10:05] And this turned out to be powerful for two reasons. First, our internal GTM teams didn't need to jump between many tools anymore.
[10:16] They could use Notion itself, a tool they were already using, to explore context, investigate accounts, answer questions, and they could even take actions like sending to Nooks or sending to Outreach.
[10:30] This is a tool that they were very familiar with, and they didn't need to open seven tabs anymore.
[10:36] Secondly, because we weren't building an AI layer, humans, workflows, and agents could all operate from the same source of truth.
[10:44] In a very literal sense we are using Notion to grow with Notion The next primitive we decided that we needed was a way to turn customer events into actions
[10:58] The unit here is a signal.
[11:00] A signal is a single customer event that's important enough to change what should happen next for a customer.
[11:06] Some are user-driven, like a customer hitting their AI limit,
[11:10] or maybe they reached out to contact sales.
[11:14] But some of them are not user-initiated at all, which are these external signal examples I listed here, like company raising funding, hiring signals, or shifting their tech stack.
[11:25] Those external signals are what allowed us to be proactive instead of reactive.
[11:31] So this is the signal service that watches the customer profile, decides whether a single action is available, decides who should own that action,
[11:43] and then it emits a concrete task
[11:45] following the architecture I described before.
[11:48] And this task could be for a human or an agent.
[11:51] If there's a task for a sales rep,
[11:53] that actually just lands in their Notion database,
[11:56] and they can quickly view it and act on it.
[12:00] What's interesting about the way we built our GTM systems
[12:03] is that if there is no signal about a customer,
[12:06] the marketing component of our system kicks in.
[12:09] We have a predictive engine
[12:11] that will recommend product features most relevant for that customer.
[12:15] And it will send out lifecycle emails and in-app nudges or multi-channel communication
[12:20] to drive a customer towards adoption automatically.
[12:26] So diving deep into a small slice of what happens when we decide what action should be emitted,
[12:34] this is for the sales workflow.
[12:36] and we shadowed our best reps to capture something that was the most competitive job
[12:41] and encoded it as a durable multi-agent workflow.
[12:46] Every signal becomes a workflow on Temporal, which is something we rent,
[12:51] and a single run will touch enrichment, web search, draft generation, and more.
[12:57] Each of these is a network call that could fail or rate limit,
[13:01] And so temporal lets us focus on writing the sequential logic for our GTM use cases, while it will handle the retries, dedupes, and handling and going back to exactly where failures left off.
[13:16] And one malformed transcript can't take down the whole batch, which is really important to us.
[13:22] So an example of a cold outbound signal for us, we'll have a research subagent do concurrent web researches.
[13:30] Then it'll draft like an email and those emails, there should be three of them, so they're scored.
[13:37] And then a review agent will pick the highest scoring one and make any updates if necessary.
[13:42] And this also operates on a loop so that the email drafts are approved.
[13:47] And then when it's ready, this email draft will land in the sales task that is available for them to act on.
[13:54] For more reactive signals, after a follow-up call, the GOM transcript will come in, our agent will parse the transcript, and then again it will extract the critical sales MEDPIC data, metrics, economic buyer, decision criteria, plan, and champion, and draft a grounded follow-up for that.
[14:17] Every LLM step is traced so that we can evaluate quality and improve over time.
[14:24] The third layer is what turns this automation into a system that self-improves.
[14:30] Every action is a decision log, and every outcome threads back to the decision that caused it.
[14:37] So the naive version of this is a data analyst coming in and trying to understand if the output of this could be better.
[14:44] The rebuilt version of this is wiring our engagement history back into the decision layer
[14:49] so that the system decides whether or not to continue a thread, advance to the next step, or pivot.
[14:56] The system will continue to do that with the lifecycle message performance history as well.
[15:02] So these verification loops are really critical so that the system can self-heal and continuously improve.
[15:09] Let's see how an agent and human work together in this shared customer view.
[15:14] In the customer view, a rep can come here and see the product usage, the recent activity,
[15:19] and get an answer using that same data.
[15:22] They used to find all of this across many different tabs,
[15:26] and now they can just come through each day.
[15:28] The rep can ask an agent,
[15:30] and the agent will reply querying our context later.
[15:35] We can also use Notion custom agents,
[15:37] which are shareable across companies,
[15:40] to access this data context for recurring automated workflows.
[15:45] In the task view, a rep starts their day
[15:48] with an already prioritized task toolbox.
[15:51] And they already know how to move forward with their accounts and contacts.
[15:56] And the email draft for each task is already pre-researched and available for them to review.
[16:02] The human is still in the loop and actually adds their own judgment and taste and sales secret sauce But they no longer starting from the same slate And this is more than just one help one red be productive Our goal is actually to raise the floor for the entire team
[16:21] So a new sales rep coming in, they can learn the notion sales process,
[16:27] understand what signals are important to look for,
[16:30] understand which playbooks are effective,
[16:33] and basically know what good follow-up looks like.
[16:36] Reps who are ramping can still learn from the patterns of the strongest reps without needing every lesson to be passed down manually.
[16:45] So one of the questions that we came across along every step of the way is a classic question, do we build or buy?
[16:55] And it's very tempting and trendy to say build everything.
[16:59] But what we found is that there are still key areas to build and rent access to at every single layer.
[17:08] Internal agents are actually cheaper and faster to build than most people assume.
[17:12] And so since we have the most data on our data model, we build it there first, and then we rented the generalizable parts later.
[17:21] So for us, the build versus buy is a per-layer decision.
[17:26] We will not build a lot of these tools like orchestration, email, CRM.
[17:31] Vendors do that really well.
[17:33] We refuse to outsource the context layer because that's where our edge is.
[17:38] Our generic tools can't capture all of our esoteric data models or workflows,
[17:43] and we do not want that context layer to be something we can't debug.
[17:47] And so, as I mentioned before, that context layer is an notion.
[17:53] It's built off of plain Markdown, a language that agents are fluent in,
[17:58] and we have databases and hierarchies that they can navigate easily.
[18:03] At the same time, this is well designed for human,
[18:06] so this is what lets our engineers, agents, and GTM work off the same context.
[18:12] And this has all the data synced across sources.
[18:16] Ultimately, the reason to see if we can do all of this is to see if we can get a better
[18:23] throughput on deals.
[18:24] It's very early for us, we're still building this out, but the initial signs are promising.
[18:29] In the last 13 weeks, we are already seeing enterprise reps have increased qualification
[18:35] or qualified opportunities, and on the lifecycle marketing side, users who received context-aware
[18:41] recommendations were 63% more likely to take the next step.
[18:45] This is the early days with a lot more features you want to build, but our thesis that was building a single system on know, decide, act, and learn seems to be right so far.
[18:57] A few key takeaways from entering this world as an engineer in the last six months is that before you build, shadow your best human.
[19:07] I talked to many sales reps, and when they opened their computers, I saw how many tabs and tools they were navigating between.
[19:15] And that was a chaos, but it was also the spec.
[19:18] And so if you encode a mediocre process, you get a mediocre agent.
[19:23] Start with the most legible workflow.
[19:25] That's the one that's documented and repeated.
[19:27] And let humans stay in the loop on where there are risky possibilities.
[19:33] Model GTM as primitives, entities, context, triggers, actions, eligibility rules,
[19:40] and the alien world becomes the system you can engineer.
[19:42] Last but not least, be headless by default. Design for agents as operators and not just co-files.
[19:49] If humans and agents can't lead from the same substrate, you're basically building two systems that will eventually drift apart.
[19:57] For us, that layer is no-should.
[20:00] Right now, humans are the primary consumer of GTM data and agents are helping at the edges.
[20:06] Soon, agents will become an army of first-class consumers within the system, moving from drafting to acting within guardrails.
[20:15] By creating the best context and substrate for humans and agents to collaborate together now, you're setting up your team to sprint faster.
[20:24] Yeah, and feel free to contact me if you want to ask a question.
[20:29] Thank you!
[20:29] Thank you.
[20:35] Laura will be outside for questions.
[20:39] And our next speaker starts in five minutes, Arman from Brown.
[20:59] Hey, Flora, could you send me the presentation by later on?
[21:05] Oh, yeah, of course.
[21:07] You can send it to me now if you want or via LinkedIn later.
[21:11] Sure, I can send it to you via LinkedIn.
[21:13] What's your name?
[21:14] [participante].
[21:14] [participante], okay, yeah, just add me and I can send you the slides.
[21:17] Okay, thank you.
[21:29] Thank you.


## Prompt, Memory, Weights: The Architecture Decisions Most AI Teams Make by Accident

[00:00] For most enterprise AI systems, the interesting entering problem is not the model itself.
[00:09] The model consumes tokens and produces tokens.
[00:13] Your knowledge lives in files, databases, and API.
[00:18] The key architecture decision is how that knowledge reaches inference.
[00:24] from the prompt or the context, through the retrieval of memory layer, or by model adaptation such as fine tuning.
[00:36] Today, I am going to argue that this is a decision that most enterprise teams make by accident.
[00:46] and the part to make it on purpose is to recognize that this is not a ladder that you climb.
[00:56] These are three different tools for three different jobs.
[01:03] So how is this an accident? Well there are two mechanisms. One is the obvious one, the other one not so much.
[01:10] So the obvious one is that teams escalate. You don't get the right answer from your model.
[01:18] The easy thing is go put something in the proper prompt. Like go fix the prompt.
[01:23] Still wrong? Maybe there is something with the memory system or the retrieval system.
[01:29] Just take a look there. Even then if you're wrong, hey you know what? Let's fine tune the model.
[01:36] doesn't happen very often but yes sometimes teams reach out to find you in the morning.
[01:43] There is a layer underneath it. The teams that are not escalating are still making these decisions every day.
[01:52] Every edit that you make to the prompt decides what behaviour is in the prompt.
[02:00] Every document that you index decides what knowledge is held in the memory and every training sample that you bake in, every training sample that you identify will bake something into the weights.
[02:18] All these are architectural decisions, none called on a graph.
[02:25] Let me make it a little concrete for you all.
[02:28] So, an ass scene has played out actually.
[02:32] An internal support assistant just released.
[02:37] In a few weeks, the product manager makes some changes to the props to fix the tone of the support assistant.
[02:45] After a few weeks, the support team adds refund policy documents to your retrieval and memory system.
[02:53] I'll talk about retrieval and memory and teaching it. I'm treating it all as memory, but I'll come to that.
[02:58] And then, since your model is not, your agent is not giving you the right answers, an engineer shoves the product catalog into the products.
[03:11] And after a few weeks the machine learning team decides to train the model or fine tune the model on support tickets from 6 months ago, from up to 6 months ago.
[03:24] All decisions look fine, look okay, except one by the way. But even I have made such decisions in my journey.
[03:34] I have made such decisions of doing such things without giving it a lot of thought.
[03:39] So when the new product catalog is launched, looks easy right?
[03:48] Oh the engineer has shoved the product catalog into the prompt, let's put the new product catalog there.
[03:53] And you would think that everything is working fine.
[03:56] But your model or your agent is still giving you product names that don't even exist.
[04:03] How did that happen? Well, the product catalog lived into the weights where you fine tuned it on your support ticket.
[04:13] And that is the accident Your model your your architecture was accumulated it was not designed That is the accident It is what six months of normal product work led to Nobody owned it Meaning anybody owned a piece of it
[04:35] okay um nobody asked the diagnostic question nobody asked where this should take where this
[04:46] thing should live that diagnostic those diagnostic questions are the lens we are going to talk about
[04:53] and the rest of the talk is is about the lens okay so the first part is prompt
[05:00] What is the job of the prompt? The job of the prompt is behavior, is stone, is the persona of the agent.
[05:08] Things that are small, stable and editable. The wrong job for the prompt is to store facts.
[05:18] You don't put product catalog into the prompt because you are unnecessarily providing context to your model and paying the cost for it.
[05:27] and then you have too many tokens you run into lost in the middle problem the
[05:33] diagnostic for prompters is the small knowledge small table and about how to
[05:38] behave rather than what to know
[05:44] a concrete example for a good prompt use cases a customer support agent for a
[05:53] product SAS right
[05:57] now this agent it has a professional tone it is it offers human escalation
[06:06] after three failures and it provides you complete next steps now this changes per
[06:14] query per user this is this this exact thing belongs to the product and one of
[06:22] thing is prompt is something I'm not only talking about system prompt I'm talking about
[06:27] authored instructions for your model so they could also come from
[06:32] md file they will also come from other things right but this is what I mean by prompt here
[06:40] the second path is memory the job of memory is to ground your model or your
[06:49] agent in a knowledge that is current, large and citable. Current meaning it changes
[06:58] faster than you can find you. It changes every now and then. Large is because it
[07:05] cannot be held anywhere, it cannot be held in a box. And citable because production
[07:09] AI systems need to be able to point to the source of the knowledge. This is
[07:15] This is what belongs to memory.
[07:18] Now, when I use the term memory, people think of agent memory, knowledge that is acquired
[07:25] about people, about a person who is interacting with the agent.
[07:30] What I am also referring to here is external memory, which you retrieve using RAC and all
[07:37] that.
[07:38] The refund policy.
[07:39] It's not being managed by your agent, it is managed by an external application.
[07:44] That is included here. So I am talking both about the agent memory and the memory of the enterprise.
[07:50] The wrong job for memory is sharing behavior or thinking about how to reason with the memory.
[08:03] Now of course you can have a graphical kind of rack which will help the agent do reasoning, but that's exactly his job.
[08:12] for reading you've got to have the right model because if your model cannot
[08:17] reason over two or three or five documents it won't be able to reason
[08:20] over 50 that you provide the more content doesn't have to be not able to
[08:24] read so the diagnostic or the question you need to ask is is the knowledge to
[08:29] learn to fit changing faster than I can retrain and another important aspect is whether it has some access control whether it is scope for user you would want to have that in memory if there
[08:44] some kind of access control that this user cannot see the other person's
[08:48] information or the data or whatever you've got to have that knowledge in
[08:53] memory because then you can control who sees what
[08:58] A good example for storing something in external memory or memory is a code assistant, right?
[09:08] Which has access to all your repos in the organization.
[09:16] So, would you fine tune your model to learn the code?
[09:22] No, it's a simple one, right?
[09:24] It changes very often. You wouldn't do that.
[09:26] You'd find it important to learn reflexes, not facts, typically.
[09:30] And would you stuff it in the prompt? No, you don't stuff such things into the prompt.
[09:34] You may stuff, or you may add certain things that are important in the context window.
[09:40] That's something different. But you wouldn't stuff the entire code base into the prompt.
[09:45] Or even a part of it, if it has no use there.
[09:51] Now the other important thing is,
[09:53] The input or access to write, for your code, you need to make sure that you are chunking properly, you are using code as well chunking, with AST perhaps.
[10:06] And then the other important thing is use fair play. You should perhaps denormalize things such as what is the repo this code is for.
[10:17] get a code chunk you have to create metadata about which repo it belongs to, what are the
[10:23] users who are allowed to commit and all that because that is what is going to help you
[10:29] get the exact data that you need versus creating a rag mush where you are returning a lot of
[10:34] chunks back from the database without at the end then confusing the model.
[10:42] So again the diagnostic is something that's too last to fit, changing faster than you
[10:47] can reframe the model and it's scoped at a certain level.
[10:51] It could be a user, it could be a repo or whatever.
[10:54] All that knowledge belongs to memory.
[10:57] It could be external memory which is your applications database or it could be your
[11:02] agent memory as well.
[11:04] Now let's come to the more interesting part which is weights.
[11:11] So, what belongs to the wave?
[11:20] Something that stopped changing, that is what belongs to the wave.
[11:23] And the only access that drives this life is rate of change.
[11:30] You can lock in what has stopped changing and perhaps repain.
[11:35] I am not saying just lock in what has stopped changing and just go repain your model.
[11:38] No, that's not what you do all the time.
[11:40] have a very strong reason to retrain your model so what you do is you log in what's
[11:46] changing and then go from there but if you get it wrong then you could freeze
[11:50] the boundary that's still moving and it's not as subtle as like hey can I
[11:56] nobody's gonna retrain their model or like or fine tune their model on pricing list
[12:04] nobody does that it is more subtle than that right and a current version of that
[12:09] that is, let's say there is an internal document assistant and the support team or your team
[12:20] decides to fine tune the model because it's not giving the right answers.
[12:26] So to teach the domain, it says, you know what, let's fine tune this model on all our
[12:31] documentation.
[12:33] Let's fine tune the model on maybe not all the documentation but runbooks and procedures.
[12:38] And what happens for that There is an issue If you do that your model will be giving you information that old This was actually a retrieval problem If the model was not giving the right answer what the model needed was the right terms the right pieces of documentation So basically instead of fixing the retrieval problem
[13:04] the team actually went ahead and fined you the model.
[13:07] That's not what you do.
[13:09] Runbooks procedures, these are facts.
[13:11] These belong to either your agent memory, not there,
[13:15] but of course your external memory.
[13:17] That is where these things should reside.
[13:21] not if the if the model is not
[13:25] oh sorry
[13:29] if your model is not giving the right answers
[13:31] fix the retrieval problem
[13:33] don't just go out and fine tune your model
[13:35] ok
[13:37] and if you flip it
[13:39] same access if you reverse it
[13:43] a good use case where I could
[13:45] fine tune this let's
[13:47] say it's a hard ambiguous problem
[13:49] such as content moderation or claims processing right when you begin you can
[13:55] use a frontier model that makes recommendations and rules corrected
[13:59] although inconsistently over a period of time patterns will emerge patterns will
[14:07] emerge and you will have sort of a center which is sort of fixed and stable
[14:13] and then you will have the contested edge. The rates of human overrides will
[14:22] black line after a certain point and you will most likely emerge in a
[14:27] pattern where you have a contested edge where we still need humans but at a center
[14:31] which is pretty stable. Now that center is something you can find in your model
[14:37] but when you do that you have to monitor for drift is there a drift in my center and if that happens then you are going to run into problems
[14:46] and actually a stable version of that is I don't know have you heard of medical face coding I think we must have like ICD 10 course
[14:55] doctors notes are mapped to like codes for different purposes like insurance purposes and all that
[15:01] So Mount Sinai, IMO Health actually, there are 70,000 of such codes by the way.
[15:11] So would you find your model to learn those codes? They don't change so often. You won't.
[15:18] That's fact. That's knowledge. You should not be looking at finding your model.
[15:23] One of the obvious reasons is that they change sometimes and the other is
[15:29] You will need a large test table, training data to even find your model on it.
[15:34] What you find in your model is on the reflex.
[15:37] Whether it is understanding the format of the input and whether it is able to...
[15:46] And when you have to make selection about the format, like which one is the right one,
[15:51] that's where you find your model to do that.
[15:54] So the diagnostic for fine tuning is has the information stopped changing, has the humans
[16:06] converged and more important you should either have one of these two reasons.
[16:12] Is it because are you fine tuning because your model is not capable or are you fine
[16:16] tuning to save cost and a lot of times it's not capability.
[16:21] Frontier models are quite capable.
[16:23] usually comes down to cost.
[16:25] Where you can have a small,
[16:27] if you have a nice pattern in your work,
[16:30] you can actually perhaps use a small model,
[16:33] fine tune it and run the volume sheet, right?
[16:39] So, if you don't remember everything from the talk,
[16:45] this is a simple one, right?
[16:47] This table helps me decide,
[16:49] you can bounce your current AI system against this
[16:53] and decide, this is the wrench basically
[16:57] that helps you decide what list to read.
[16:59] Of course there can be exceptions.
[17:01] I'm not saying this is always the rule.
[17:03] There can be exceptions to this,
[17:05] but prompt is more about behavior,
[17:07] memory is about what to know and facts,
[17:09] and weights are about how to read.

*(parte 2 da gravação — timestamps reiniciam)*

[00:00] to circulate you need to build a right harness around it so that these things can circulate
[00:08] your prompt or your context window has information it generates signals some of them becomes durable
[00:14] memory okay now when you are restarting a new session things get pulled out from the memory
[00:23] into the prompt or context window and that's when you're going from the memory to the prompt
[00:27] So this is, lot of teams have built this architecture, but what people are looking to, are focusing on building with the right side.
[00:36] The memory to mind healing flow. Okay? Now what happens is when you build an engineering system, for a period of time, you will have retrieval patterns.
[00:45] You will have formats that you think the model should reflexively know.
[00:51] So those things move from your memory to fine tune.
[00:58] Once you have fine tuned, so that's memory to a Wix.
[01:03] Once you have fine tuned what is worth retrieving changes If you have changed if you have fine tuned your model on the formats of like notes and the ICB codes you don have to retrieve certain examples
[01:17] from your memory or external memory each time
[01:19] and provide it to the model,
[01:20] because now the model knows the format
[01:23] of the reflection link.
[01:24] You don't have to provide examples to it,
[01:25] say hey this is the format of that one format.
[01:28] So that's weights to memories.
[01:31] And so basically, this becomes a loop
[01:34] over a period of time and the agent gets better at its job
[01:40] by the virtue of doing its job.
[01:46] That's the art of tech.
[01:48] So, what I would like to conclude with this,
[01:51] the model is the easy part.
[01:56] What you build around the model,
[01:57] the artists around the model that helps you
[02:01] store the right information at the right place
[02:03] and circulate among them is the key architecture that you are developing.
[02:07] Thank you.


## LLM Knowledge Bases: a practical guide

[00:00] It's a great way to get your thoughts onto paper.
[00:02] It's going to be like 200 words per minute at least, the average.
[00:06] Unless you're an absolute Olympic typist, it will be faster than any other method they have.
[00:11] So I suggest getting some sort of voice input tool just to get down context.
[00:16] There are a number of these.
[00:17] And by the way, for the people who aren't paying for Whisper and Close subscriptions,
[00:21] you're in luck. You don't have to pay anymore for this kind of stuff.
[00:24] There are local models that can do this.
[00:26] So a bit of a side tangent on toolchains that you should probably check out.
[00:30] I love highlighting this one.
[00:31] It's called Handy.
[00:32] It's an open source tool for voice dictation that just uses a local model, stays on device, very easy to use.
[00:39] There's another one called Voice Inc., which is very similar.
[00:42] This one, I believe, is like a $20 lifetime fee just to get updates in the app.
[00:47] Might as well do it just to support the developer.
[00:49] That's the one that I use.
[00:50] And it gives you a hotkey as well as a mobile app.
[00:53] So if you wanted to get something down, you can just hold either the option key or the function key on your computer,
[00:59] and it will start writing down everything that you're saying, and it will turn it into a formatted set of sentences, paragraphs, etc. on the other side.
[01:08] Cut off a little at the end there. You can see the punctuations are coming in great.
[01:13] And this whole set here with all these paragraph breaks, this was just one long transcription I wrote down after listening to a podcast.
[01:20] This was just me listening to the Acquire podcast about the founding of Walt Disney.
[01:25] A little bit offbeat for me, but I thought it was an interesting read just about how these sorts of businesses are founded.
[01:33] So I decided to take out a voice dictation app and write it down.
[01:36] And that's what I've been doing for all of my notes at this point.
[01:39] Either coming to my computer or on my phone, I just kind of type into it to get all the raw data.
[01:43] data. And the reason I'm suggesting you do this is if you want to get to a point where you can
[01:49] actually have elements generate, wikis, visualizations, etc., you need a lot of raw data. You need a lot of
[01:55] raw materials. So don't worry if you're being a little bit scrappy, a little bit wrangly, you're
[02:00] not formatting things with perfect bullet points. That's fine. The goal should just be get down as
[02:05] many thoughts in the moment as possible. Maybe it's a meeting transcript. Maybe it's research
[02:10] notes after you've read an important passage, whatever it is, just being able to get your
[02:14] idea down on the paper makes it very effective for LLM to go access it later.
[02:20] So now let's talk a little bit about turning those raw materials into something more useful.
[02:24] This is another note that I took about the founding of Ferrari.
[02:27] I went down a little radical when I started listing this guy.
[02:30] And this is what you can get to if you just ask an LLM to do a little bit of recon for
[02:36] you.
[02:36] So you'll notice that in the center is the same note, same sort of style, like a voice dictation transcript.
[02:43] But we've got some more details now.
[02:44] We can see the tags that are for the topics.
[02:48] So we can see this was a podcast.
[02:49] It's related to these focus areas.
[02:52] You can also see the source.
[02:53] It was able to pull down the URL and find it.
[02:55] It also wrote down when it was enriched.
[02:57] We'll talk about why and do that in a second.
[02:59] And at the bottom, it also finds some backlinks.
[03:02] This is related to another podcast you were listening to.
[03:04] Let's go ahead and link them together and that web gets tighter and tighter more things that you get down
[03:10] And the way that you can get from this to something like this is through an agent skill as you might expect
[03:17] so I have a skill for that right over here and
[03:20] It's just called enrich note original. So right here
[03:24] It's just showing how you might instruct an agent to take one of those new files and turn into something that's more useful
[03:30] So here it's just saying let's go ahead and reach that note
[03:34] Put a little timestamp on there so if we ask the agent to do another pass, it remembers
[03:38] that some other agent did it in the past.
[03:41] Have it generate some tags.
[03:43] I actually put all of my tags into this little preference folder over here.
[03:48] That way the agent isn't inventing new tags every time it goes through and tries to add
[03:52] more detail.
[03:53] This gives it a concrete list of things to look through.
[03:56] I actually instruct the agent to be reluctant to add new tags because Claude loves to get
[04:01] creative.
[04:02] So just telling it, please don't do that.
[04:05] Use the instructions.
[04:06] We can really find a pattern.
[04:07] Go ahead and add something to this list.
[04:09] You can go ahead and do that.
[04:11] Also telling it to go research the source with web tools.
[04:13] At this point, all the agents have web search.
[04:15] If not, EXA is a great little tool that you can add into your harness to go find that for you.
[04:21] The last one is those related notes.
[04:22] So find backlinks use some file calls find related notes using key term search and put them into the box and we have that interconnected web And to run this skill you can of course do it manually with whatever harness
[04:36] I'm going to be using Warp just to show you here because totally unbiased, I'm a really big fan of
[04:41] Warp, can you believe it? But it also does give you access to any model including OpenWay, so if
[04:47] you've never been one to experiment with like GLM 5.2, which is very good at this sort of task,
[04:52] you certainly can. In fact, I'll go ahead and flip over to that just to try it.
[04:56] And I'll go ahead and call this skill by hopping into
[05:00] our little node here. I might go ahead and call
[05:03] enrich node, and then I'll pull in this node from earlier
[05:07] around that file path, and just tell it to go ahead and add
[05:11] more detail to this guy. And I can show you a completed run of this too.
[05:16] Right over here, we can see this was
[05:19] we'll talk about this in a moment, but asking it to do it on sort of automation across all of your notes.
[05:24] It will go ahead and find any notes that weren't enriched in the past.
[05:30] So remember that at the top here we gave it a little timestamp every time it gets enriched.
[05:35] So the next time we ask an agent to do it, it will just look for anything that's not tagged yet.
[05:38] It will go through, run that whole flow across all of those notes.
[05:41] It will make some modifications to the files.
[05:43] And then on the other side, you get a more organized notebook than you had before.
[05:47] thing you've had before. It's very easy to do. We'll let this guy cook in the background while I talk a little bit about weight.
[05:54] So the next step, after we've gone ahead and combined everything into related ideas, you might be fine with this, actually.
[06:01] I'll show you how useful this is just on its own. So this is like a total mind dump of everything in here.
[06:08] Like this was me reading The Left Hand of the Doge. It's a very good book, by the way. And you can see I was just taking fair notes
[06:14] across different chapters whenever I found something interesting, and it was able to combine all those
[06:18] related notes so I could just click through and find them. So I'm not punting around
[06:22] where did I save in my Apple Notes the last time I wrote about this like two weeks ago.
[06:26] It's able to find it by related topics. So if you're someone that
[06:30] likes following Wikipedia rabbit holes, it kind of invented Wikipedia rabbit holes
[06:34] of your own thoughts. Kind of fun. But if you want to make this a little
[06:38] bit more browsable, we might tell it to generate a wiki on top of this.
[06:42] So take that set of raw ingredients and cook it together into something a little bit more hearty.
[06:48] I don't know. Weird metaphor.
[06:50] Let's go ahead and do these wikis.
[06:52] So these are a couple that I generated around topics that I'm interested in.
[06:56] One of them is probably pretty cool, you know, latest in AI news.
[07:00] Anytime I listen to a podcast or read a research document about the system cards of the Wix models, for example,
[07:09] I want to have a wiki that actually pulls all of that in and groups them by related topics.
[07:15] So this wiki that you're seeing right here, if we click into it, it'll give you a set of people, places, and things, basically.
[07:24] So we get all of our sources. So these are some of the topics that we're most interested in.
[07:30] We can see a few in here. Some of them expected, some of them not.
[07:34] You can see like a Ralph Loop rabbit hole, for example.
[07:36] You see a number of concepts that are pulled out
[07:39] of all of these ideas.
[07:41] And then down here we see some people,
[07:42] all the people you might expect, some maybe not.
[07:44] Like this is something that it pulled together
[07:47] from an intersection with AI and music.
[07:49] Adam Neely is actually a jazz musician
[07:51] that's been talking about how AI has affected
[07:53] the music industry.
[07:55] So I wrote that down, found it was a little bit interesting.
[07:57] Pulled it into our latest AI wikis
[07:59] that we can find easily.
[08:01] Also organizations, you would expect all of these, I assume.
[08:04] This one were music related.
[08:06] This one, the thing you should go try after this talk, etc.
[08:10] And all of that is generated programmatically.
[08:13] I didn't write any of this.
[08:15] Because all I have time to do is generate the raw ingredients, not connecting it all together myself.
[08:20] So to have an agent generate this, this is actually a gist from Andre Carpenter.
[08:26] This is where the all-in-all knowledge-based idea kind of came together.
[08:29] You can find this really easily now.
[08:31] you just search his name and then wiki. It's kind of got a lot of uses. So this is the simple
[08:39] principle of it. We want to take a raw directory, which is where we're taking all of our spare
[08:43] Apple notes from earlier, and we want to combine it into whatever focus area that we care about.
[08:49] So we grab the raw sources we create a wiki and really you can tweak this to taste as much as you He even calls us an idea So what I did to generate that Lady latest AI wiki was just describing these are the things that I care about They in this raw folder Here the rest
[09:06] of his gist. Go ahead and generate a wiki for me. And on the other side, you end up with something
[09:11] very organized like this. The same one here is for another topic too. It's a little off beat.
[09:16] This one was because I was listening to the Bible in a Year podcast. This is something I wanted to
[09:21] I studied recently, totally outside of my wheelhouse, with a number of characters that I forget the name of.
[09:27] If anyone's read religious texts, you know that all the names sound very similar and can be hard to pronounce.
[09:32] So having something that can pull together all the people with references to what each of them did is very useful.
[09:38] So I can click through here, and it generated sort of an entry for who that character is.
[09:44] You can imagine it's also useful in the workspace.
[09:45] If you take a lot of meeting notes and you want to have a people section of all the people they've met with, interesting clients if you're in customer success, it can generate all of those for you.
[09:55] And then it can create back links over to any related meetings you've had with them, maybe the source links.
[10:01] So going back to our raw notes, if you want to go to the raw materials, you can click through and find those.
[10:07] Really all we're trying to do is make sense of all these notes that we take every day and make it something a little bit more browsable, a little bit more readable.
[10:13] So the next thing I want to talk about beyond that is it's really nice that you can ask an agent to generate these on demand,
[10:21] but as we can see with our little agent running in the background, it can take time for an agent to go generate these things.
[10:29] So ideally, we have a flow that will sort of do this in the background for us, maybe while we sleep,
[10:36] maybe on an automated schedule or something like that.
[10:38] So that's kind of the next thing to talk about, which is taking these skills that enrich the notes, generate wikis, update them for you over time, and turn it into something that runs on a cadence, maybe daily, maybe weekly.
[10:53] And there's a little platform over here.
[10:55] There's a number of ones that do it, by the way.
[10:57] If you play with, like, Codex app, they have an automations tool that spins up tasks to run your machine every day.
[11:02] But it means your laptop has to be cracked open when it runs because it's a local automation.
[11:06] If you want something that runs in the cloud, I will shout out that we do have something called oz.dev.
[11:13] If you go search for that in your web browser, it'll help you set up with automated schedules, as well as other triggers, like maybe a Slack message, iMessage, whatever you want to set up.
[11:24] These I set up on schedules.
[11:26] So this was one that I set up with the wiki skill that I showed you a little bit earlier.
[11:31] And I encoded it into this set of instructions right here.
[11:35] So the way this guy works, I'll just go ahead and whiteboard this for you live, show you how it works, is we create an automation that takes our folder of Markdown,
[11:45] syncs it into a box, maybe like a cloud sandbox, powered by Docker if you need it, otherwise known, and then sync it back up when the engine's done.
[11:54] So the way that I've set it up is using the Obsidian headless CLI.
[11:58] So Obsidian has a really nice tool that lets you take a bunch of Markdown on your computer and sync it somewhere else and then pull it back down.
[12:06] You can also just do like a Git clone, too, if you want to be a little bit less creative.
[12:10] Put all of your notes in a GitHub folder.
[12:12] So that way a cloud agent can pull it down and do it for you.
[12:15] I prefer using Obsidian CLI for this just because it avoids having to like push and pull your notes.
[12:22] No one has time for that.
[12:23] I just want it to sync in the background.
[12:24] That's what this does.
[12:25] So it's a tool that you can install into a cloud sandbox.
[12:29] It'll sync down that folder of Markdown.
[12:31] You can run a process inside of it.
[12:34] Maybe you have like your rich note skill that I was showing you earlier.
[12:37] Just instruct the agent, run a rich note across end notes that are not enriched yet.
[12:44] And then let it do all of its tool calls and code diffs.
[12:47] And then by the time it's done, it'll sync it back up.
[12:50] That's really the flow. It's super simple.
[12:53] And that's what we've instructed this Cloud Runner to do.
[12:56] So, fair throw in with us, no problem.
[12:59] All this is, is a cloud sandbox that will stand up every day and it will instruct the
[13:03] agent to do this.
[13:05] So this is the prompt.
[13:06] And the prompt is, I gave you the obsidian CLI in your environment.
[13:10] Use that, pull down that wiki, go ahead and update it, and I put in some special instructions
[13:15] for my own setup, and then sync it back up.
[13:17] So that way when I come back to my computer in the morning, I wake up to a perfectly fresh
[13:22] that I can review.
[13:24] It like the daily paper but it your own which is so exciting We see another schedule I set up over here for the enrich note phase generating those backlinks making it easier for you to navigate around everything I made that a skill Again we tell it to sync everything down
[13:38] We tell it to run enrich note, and then we push it back up.
[13:41] So by the time I go on my computer, there everything is.
[13:45] And I can show you one of these runs.
[13:47] You can actually do it in your browser.
[13:49] So over here, this is where it was running enrich note across all of our notes from earlier.
[13:53] and we can see that same thing I was showing you
[13:56] but this was from the cloud
[13:57] so while I was sleeping I looked at all the notes that I took
[14:00] throughout the day and it tied
[14:02] them all together in something that was easy to browse
[14:04] which is super clean
[14:06] super easy to use
[14:07] we can also take a look back
[14:09] if we want to at that run from earlier
[14:12] just to see if it did its job
[14:13] yeah look at that
[14:14] it was just a jumbled mess
[14:16] now we're seeing here's the podcast
[14:18] I did some web search I found it
[14:20] so if you want to go listen to it again there it is
[14:22] we have a heading now, and we have some related notes, the Ferrarian podcast.
[14:26] We have some notes from some other founder podcasts.
[14:28] There we go.
[14:29] Don't have to do any work anymore.
[14:31] All you have to do is voice dictate on your phone, and all this stuff comes out on the other side.
[14:35] The last thing I want to talk about, just to expand your mind a bit beyond the markdown,
[14:41] doing something a little bit more exciting, is turning all of your thoughts into visualizations,
[14:46] graph views, charts, whatever you want to do.
[14:49] And that's something that I've set up inside this notes app I've been showing you this whole time.
[14:54] You can also look at HTML pages inside of here.
[14:57] So I told it, because I wanted to, like, hey, I want to take all these markdown files,
[15:01] and I want you to just build with HTML and Tailwind some sort of graph view.
[15:06] So instead of me clicking around the wiki and following a bunch of links,
[15:09] I want to see a bird's eye view of everything that we're writing down here,
[15:13] figure out common patterns and common areas of interest.
[15:16] We can look at them right here.
[15:18] And this is not a tool that you have to install, by the way.
[15:21] I told an agent, build this for me.
[15:23] You can do that now.
[15:24] So we see some stuff in the center that's very straight thoughts.
[15:27] I'm a scattered person.
[15:28] It makes sense.
[15:29] We have some books.
[15:31] Clearly, I need to read more.
[15:32] We have some interest in, like, startup founding here.
[15:36] We have AI and engineering.
[15:37] Of course, we have faith and scripture because I was reading the Bible in the years I mentioned earlier.
[15:41] We see all of that grouped up inside here.
[15:43] I also told it, let's make these notes, something clickable.
[15:46] So now I can see whatever note that was.
[15:49] I can see how it's connected to something else.
[15:51] So we can see this is connected to a number of ideas.
[15:54] You can just kind of walk around the graph.
[15:56] It's useful just to get an idea of what you're actually interested in
[15:59] and where you have gaps in your thinking.
[16:01] But it's also useful if you want to drill down.
[16:03] And also just to show you this is something that you control.
[16:06] It's like, can you put it in space?
[16:09] I don't know.
[16:09] Let's put it in space.
[16:10] How about that?
[16:10] Now it's in space.
[16:12] So it looks a little bit more like a sort of constellation.
[16:14] So we can click in there, we can sort of look around, see how everything is connected.
[16:18] It's really nice.
[16:20] You can also connect it to like a burndown chart.
[16:22] If you're trying to build up a habit tracker of how often you're writing notes on certain things,
[16:27] you can invent one of those. This is kind of like a GitHub chart.
[16:30] Clearly I don't have a super consistent habit, but it's building, and we can track it inside of here.
[16:35] Whatever you want to put together, you can just ask an agent to do it.
[16:39] And that's really the end of the talk. That's everything I wanted to share with you all.
[16:43] with you all. If I have any sort of parting gifts or things to check out, I'll first call out, like,
[16:48] if you want that automation platform, Aus.dev. It's built by Warp, warp.dev slash Aus, however you
[16:54] want to look it up. This is the tool that you can use to set up schedules to update notes in the
[17:00] background. And if you want to try that little notes app I was showing you, hubble.mp, it's
[17:04] free and open source. We're open to contributions. There's a lot of things missing, as you can
[17:08] So if you're looking for an Apple Notes that's Asian accessible, here we go.
[17:12] This is what you can go try out.
[17:14] I hope to see you in the issue logs.
[17:17] With that, it's been great chatting with y'all.
[17:20] I will, oh, I'm supposed to plug myself, aren't I?
[17:23] Let me plug myself. There we go.
[17:25] If you need to follow me, there I am.
[17:27] I'm at developer relations at Evermore.
[17:29] You can find the whole team both at the booth and also on Twitter and everywhere else.
[17:33] And also our site, which will be up tonight.
[17:36] So yeah, with that, I'll let y'all go.
[17:38] Hope you enjoyed the rest of the conference.
[17:39] Thank you.


## The Building Blocks of GTM Orchestration

[00:00] Okay, and obviously in the last few years, agents have really like deepened our ability to go and like push the level of automation that you can do on behalf of operators, like as close as possible to those points of execution.
[00:14] So like really specifically, I'm a golfer. Suppose I want to offer golfers at East Coast construction companies an incentive to like try ramp, talk to sales, whatever.
[00:25] and we want to be able to go and spin up an audience of golfers at East Coast
[00:30] construction companies, spin up like an incentive, let's go offer like some
[00:34] pro-B1 golf balls to these people, go create like outbound sequences, generate
[00:40] the copy, generate creative for paid ads and for web, maybe show some in-app
[00:45] notifications for your customers, and do all of that seamlessly by just
[00:49] describing the intent, right? And probably more than just this one sentence.
[00:55] So a few years ago, we kind of identified a few fundamental challenges here.
[01:01] As was previously mentioned, the necessary data for this was just messy, inconsistent across systems.
[01:07] Everybody is operating off of a different source of truth, and that makes it effectively impossible to go and distribute some coordinated action across these different go-to-market teams and channels.
[01:19] The next is that reps were just buried in busy work.
[01:23] Even if you have the best intentions, I want to go and run this campaign, I want your help doing it, the reality is that our sales teams are in back-to-back-to-back-to-back meetings all day.
[01:34] They're outbounding, they're selling, and the operational burden of doing everything in between sales was just really high, which made really scaling out experimentation and creativity challenging.
[01:48] And similar to that, just the coordination and distribution are expensive.
[01:53] If you're like, I have this idea, I'm going to go write this proposal, this enabling material,
[01:57] I'm going to go try to convince a bunch of people to go and use all this.
[02:00] That's just a really challenging thing to do on any pace that's not on the order of months.
[02:08] So over the last few years, we've been trying to solve this problem from the ground up.
[02:14] How can we start with that ingestion and consistency problem and the quality,
[02:20] which is just like on the roadmap every quarter.
[02:24] How can we then go build those vertical efficiency
[02:27] and growth levers, saving people time
[02:30] and managing operations and execution,
[02:33] as well as how can we improve conversion rates,
[02:36] make people more performant by being
[02:38] able to scale some of these more informed and personalized
[02:42] and creative strategies?
[02:43] And then how can we extend this horizontally?
[02:46] Teams have very common workflows at some level.
[02:50] Everybody wants to outbound.
[02:51] Everybody has meetings.
[02:52] How can we go take the patterns that we build for one team
[02:55] and start to just mirror it to others?
[02:58] And now kind of where we're at is like this distribution
[03:01] and coordination problem, right?
[03:02] How can you go and execute across multiple channels
[03:05] simultaneously through just like the description of intent?
[03:11] So yeah, I'll get into the building blocks really broadly.
[03:16] go-to-market agents are complicated. In order to do this effectively, your agents have to
[03:23] understand pretty much the entirety of your company, how you go to market, why products
[03:27] are useful, how to segment your buyers, your prospects, your customers from people who
[03:33] have never heard about you and you have no information on them and they have no information
[03:37] on you, all the way to customers who are actively using your products who have a totally different
[03:43] set of problems that you have to work with.
[03:49] And to just start to get a little technical here,
[03:54] we started with this consistent data foundation problem.
[03:58] And if you're looking at this and you're like,
[04:00] that looks like a CDP, yeah, you're right.
[04:04] We effectively went and built an internal customer data
[04:09] platform at Ramp, where we're effectively
[04:12] doing your very traditional things, we're going to take CRM data, product data, enrichment
[04:17] data, web data, buying signals, you know, whether it's things that are internally modeled,
[04:23] like we think that this customer has a high propensity to attach to procurement or treasury all the way to things that are like external signals like funding announcements as well as like interaction data right
[04:38] Emails, meetings, calls, page views.
[04:41] and on the signal side of this, right,
[04:45] we have some set of real-time events that are coming in,
[04:48] things like emails, you can go type them onto a Kafka topic,
[04:52] consume them, and then funnel them back into both,
[04:56] like a Postgres database that backs all this,
[04:59] enables us to maintain transactional guarantees,
[05:02] referential integrity between the entities that exist
[05:05] and the different entities that exist, right,
[05:07] between your CRM, between your product,
[05:10] between third parties,
[05:11] and attribute everything to the right level of detail, which we found to be a pretty important problem,
[05:17] as well as all the associated metadata around capturing where did this come from, when did it come in,
[05:23] as well as starting to embed a lot of this data.
[05:27] So much sales data is just inherently unstructured.
[05:32] You have call transcripts, you have emails, you have notes, and the ability to search across that is really valuable.
[05:39] We have a set of online batch jobs, which are really just calling a lot of APIs for the most part.
[05:46] Rent, addressable market, it's pretty much like the entire U.S. and now expanding internationally.
[05:53] So being able to kind of like pre-compute, pre-process, pre-ingest like all this enrichment data about who we can sell to and who we're already selling to is really important for us.
[06:04] And then, as previously mentioned, a ton of work has gone into the offline piece of this with dbt, snowflake, pulling everything into our warehouse, doing a lot of offline batch compute, and then piping that in via reverse CTL back into the same layer.
[06:22] Next, more tactically, the way we tend to approach these problems is solve for one team first, then scale horizontally.
[06:30] As I mentioned before, you have a very overlapping set of problems that exist.
[06:36] Everybody wants to do automated outbound, everybody wants to prepare for meetings, whereas
[06:41] certain teams may have problems or things that they do that are isolated to them, like
[06:47] QBR generation.
[06:48] To get into an example, one of the things that we shipped is pre-meeting briefs.
[06:58] For AMs and account managers, they kind of manage the customer relationships that exist,
[07:05] trying to ensure that customers are using RAMP as best as possible.
[07:10] And there's a lot of important context that goes into a meeting.
[07:16] It's like, what are we talking about?
[07:18] Who are we meeting with?
[07:20] What is the AM trying to do?
[07:22] What are the product usage information?
[07:25] What are the account vitals?
[07:26] What's the agenda that we want to tackle?
[07:28] And similarly, what is the customer trying to do?
[07:31] Do they have open tickets that they're trying to address?
[07:34] Did they email us saying that there's a specific thing they're trying to talk about?
[07:38] And how can we pull this together for AM so that they can go in prepared
[07:41] and kind of manage the operational piece of just being in back-to-back-to-back meetings all day?
[07:50] Again, technically, the place to start with this is obviously for trying to generate a pre-meeting brief.
[07:56] We need to know what these meetings are.
[07:58] So we can pipe in meeting events, do some hydration,
[08:02] map things like attendee emails, meeting titles,
[08:07] back to the accounts that we're meeting with.
[08:09] This is like a sneaky, hard problem at RAMP
[08:11] because you have the same emails that can work on behalf
[08:13] of multiple businesses.
[08:15] So it's kind of like a fuzzy match.
[08:17] And we can go and persist that.
[08:18] So that way, every downstream consumer of like,
[08:21] hey, I care about this meeting doesn't
[08:23] have to go and like re-compute this from the ground up.
[08:27] And also, as mentioned in the previous talk,
[08:30] we've also built a system around durable execution.
[08:34] That's pretty agnostic to the trigger that comes in.
[08:37] Everything is represented as a durable thread
[08:40] built around temporal, representing each tool call
[08:43] and model call as an activity.
[08:45] That way, if a worker goes out for some reason,
[08:49] it can resume execution from where it left off,
[08:52] pulling together all the state that it accumulated at that point in time instead of starting back from the beginning of the thread and trying to reprocess everything which would be very inefficient and slow There also great out capabilities for things like config scope tool calls
[09:09] Different agents are going to have access to different sets of tools, which give them access to different information, different integrations, and different skills that might be necessary to actually perform the work.
[09:20] And similarly, there's things like human in the loop tooling to just pause execution, get input, resume.
[09:31] And then getting to the unstructured piece of this, as I mentioned, like unstructured information is probably like the most valuable thing you're sitting on within your warehouse or your notes or wherever you store this today.
[09:44] So we have some sort of real-time data coming in, meeting transcripts, emails.
[09:49] We have some sort of batch jobs that are pulling in enablement materials, product knowledge, playbooks, chunking them, embedding them, putting them in Turbo Puffer.
[10:00] And it allows agents to go and search, like, what do I care about? What am I trying to answer right now?
[10:06] now and doing some combination of vector search, attribute
[10:10] search, keyword search in order to pull information scoped
[10:14] to a specific account, for example,
[10:16] without having to pull in the full raw corpus into agent
[10:20] context, which would also be very inefficient, very
[10:24] expensive.
[10:26] And similarly, we've gone and built a skill library
[10:28] to allow people to customize their agents.
[10:31] Getting back to the meeting reads example,
[10:33] different people have different formats that they care about.
[10:36] they have different information that they care about,
[10:39] and allowing them to kind of represent that in text,
[10:42] giving that to the agent to pull it together
[10:44] has been very valuable for getting adoption.
[10:48] And putting all this together,
[10:49] you get an operational background agent, right?
[10:52] You have like, every night we're gonna go
[10:53] and generate these things,
[10:55] fan out a set of agents that are gonna go
[10:56] and compute per account meeting prep,
[11:00] which gives, or which use some set of tools,
[11:03] giving them access to that online CDP in Postgres
[11:06] I've mentioned, the vector database, meeting prep skills
[11:09] that we own at the system level, as well as
[11:12] custom instructions that users are providing themselves.
[11:17] And getting into the extending the blocks,
[11:21] the goal for these foundations is to speed up the next thing.
[11:24] Meetings are super important.
[11:26] We want to be able to generate things like post-meeting
[11:28] follow-ups and things like automatic CRM updates, which
[11:32] can pull in the transcript and say, hey,
[11:34] we discussed this potential expansion opportunity.
[11:37] Let me go and pre-fill all the information needed
[11:39] to create that opportunity, get a thumbs up from a rep,
[11:41] and just make it happen.
[11:45] And similarly, we want to extend it horizontally
[11:47] to other teams, which is mainly an exercise of creating
[11:50] specific skills, data integrations, and just data
[11:54] injection itself, where we can say, OK, email,
[11:58] call transcript embeddings, custom instructions,
[12:01] generalizable, but if we're building this for AEs who are handling pre-sales opportunities,
[12:09] we need to go and focus more on third-party data instead of a bunch of product data that
[12:12] we have already, and that needs to be incorporated into our customer data platform.
[12:17] The skills need to go to reference a different set of information that we have on the people
[12:23] that we're trying to sell to.
[12:26] And similarly, we built this in a way where employees have access to the same tools and
[12:31] skills that are being used for the background agents that we're creating.
[12:33] We set up what we call our GTM MCP and this is basically just like a
[12:39] window into the same exact tools that we've set up for these background agents
[12:43] so that way the things that we build are just kind of automatically federated out
[12:48] to people who want to go and build their own agents, they want to go chat with the
[12:51] information that we're setting up and build their own automations. And they're
[12:56] building a ton of them This is just like a glimpse into some of the analytics that we done taking the reasoning generated by the MCP tool calls that are being executed remotely And this compounds because like when people go and build their own thing and they go and connect to our MCP they basically telling us like here a problem that I have here how I trying to solve this problem And we can go to work with them to be like okay we can just go into production this distribute this to everybody who probably has similar problems and they give us the prompts and the skills and the even applications that they vibe coding
[13:37] to just really simplify our ability
[13:39] to just go and productionize these use cases.
[13:45] So now you're probably wondering,
[13:48] what about that golf example
[13:49] that I had mentioned at the beginning,
[13:52] the orchestration problem?
[13:54] The point that I'm trying to convey by talking about all these specific things that we're
[13:59] doing is that these vertical builds that we're creating are the foundation of multi-team,
[14:06] multi-channel distribution.
[14:09] If we want to be able to say, here is a playbook, here's how you sell procurement, here's how
[14:14] you sell to construction, or here are wacky experiment ideas that we have, like offering
[14:21] pro v1s to golfers, which is actually like,
[14:24] it works really well.
[14:27] We need to be able to say like,
[14:29] take in that corpus of information
[14:31] and things that people are trying to do
[14:33] and federate that out through the background agents
[14:35] that are actually creating these artifacts
[14:36] that people are like using to operationalize,
[14:39] like go to market and execute.
[14:42] So for my pro v1 golf example,
[14:47] the goal is to funnel this into ramp revenue,
[14:49] the internal application that we have built,
[14:53] and go and effectively funnel this
[14:56] into some of these vertical solutions that we've created.
[14:58] So you can say, for SDRs, we wanna go and create an audience,
[15:01] up here are the golfers that we wanna send things to,
[15:04] we can go and generate personalized copy and sequences
[15:07] that they can go and send,
[15:08] and if we wanna go and create web landing pages
[15:10] and spin up the images and the creative
[15:13] that we'll point these email sequences to,
[15:16] and we can do all that through just the description of,
[15:19] here's my intent, get the people who own these channels
[15:21] to review them and sign off,
[15:23] and really allowed us to just move a lot quicker
[15:26] in how we ship and scale creatively
[15:32] across all these different go-to-market channels.
[15:34] So the goal of this is to ship faster, ship safer,
[15:39] scale our teams, become more efficient,
[15:42] and with these campaigns, we can go and execute them
[15:45] across multiple channels
[15:47] with consistent audience targeting.
[15:50] Agents can go into old context on multiple things
[15:53] that are like options, right?
[15:55] We can go and execute this campaign or that campaign
[15:57] or that experiment and balance the like traditional
[16:00] multi-armed banded problem of like exploring
[16:03] like new possibilities versus like being safe
[16:06] and like going into just known returns.
[16:10] And then we can build in guardrails as well
[16:12] to go and effectively like manage compliance rules,
[16:16] rules of engagement, being context aware,
[16:19] making sure we're not doing the same thing
[16:21] over and over again.
[16:23] And yeah, just do this on behalf of everybody.
[16:28] Those are the building blocks
[16:29] of good market orchestration.
[16:31] Thank you everybody.
[16:35] And I'll probably end with one question.
[16:39] And there we go.
[16:46] So just curious, how would you approach building something like this for a smaller company or for a company that's just getting started?
[16:56] Yeah, I think a few people before have mentioned something similar.
[16:59] But I would go and find the very specific use cases that you can build automation around and just solve really specific problems that exist first.
[17:11] Like three years ago, there was two of us and we were building automated outbound.
[17:15] So we were just trying to figure out how can we go and use GPT 3.5 and put personalized copy into some sequences and go and pull data from wherever to go and generate that.
[17:29] And by doing these things and solving these problems, you get a really good understanding of how this works, how it could extend to other teams, and solving real problems as you go.
[17:39] The reality is that you can't spend a year going and building some really complicated system architecture that is perfect.
[17:47] You have to piece together the vertical solutions and stick them together.
[17:53] Thank you.
[17:54] We now have a break for lunch, and we're back.


## Why We Killed Our Multi-Agent Pipeline: Lessons From Pharma Commercial Intelligence

[00:00] So today, to round out our graph track today, we have two distinguished colleagues, a partner and a director of AI engineering at ZS.
[00:14] So these two distinguished colleagues are going to walk through how you can use domain knowledge with graphs, deterministic pre-processing, and reference-based context management in your agentic architectures.
[00:27] So one year ago, they built a system that actually broke.
[00:31] However, they had to diagnose what the problem was.
[00:34] So they found out that instead, they needed to build a system that the agent actually had what it needed.
[00:41] So please welcome Subbaya and Abhilash to the stage.
[00:45] Thank you so much, everyone.
[00:50] Thank you. Thanks for the kind introduction.
[00:53] Okay, so I'm Subbaya. I head AI engineering at CS.
[00:57] I'm Amrush, Director of Agent Delegate CSI.
[01:00] So, CS, we are a tech firm.
[01:02] We work with many of the top companies in the world, including a lot of the top pharmas, actually.
[01:06] So, today's talk, I think we wanted to, as I think already introduced, right, we wanted to talk from our experience, right, building multi-agent pipelines.
[01:14] What are the mistakes we did, right, and what did we learn and how did we fix them?
[01:18] So, I'm going to orient it more on pharma, commercial domain, and for people in the room, probably who are not aware, quickly.
[01:25] Pharma has two main functions, one is R&D, the drug discovery and the clinical trials part, and then there's the commercial, how do you take a drug to a patient.
[01:34] And within commercial, there are different functions, like once you create a drug, what is the performance of a brand, how is the drug performing in different markets.
[01:44] Then there are things like your field force, your reps, how effectively are they engaging with everyone.
[01:50] with everyone. There are things around patient journey, how patients are adopting a drug,
[01:54] right? I think if there is any therapy switch which is happening. So as you can think about,
[01:58] there is a lot of analytics which really happens in a commercial domain. And how do typically
[02:04] analysts work? So there are four steps, right? What analysts do, right? So first, there is
[02:10] always something called a signal detection, right? So signal can be something like, okay,
[02:14] the prescriptions what a doctor is writing, maybe is there a drop in the prescription?
[02:18] So that's a signal. So once you've got a signal, the second thing what an analyst does is why is this signal really failing? What is the reason for it? So is it like there is a competitor drug which has come in? Because of that, is it reducing? Is it because maybe a pair coverage for the drug has reduced? Or maybe the reps on the ground, they're actually not taking the benefits to the doctors.
[02:40] And once you arrive at the reason, the next step becomes, okay, what is the action do you take?
[02:46] So if reps, suppose if reps, the coverage is not good in a particular region, should we have to increase that?
[02:53] And once you do that, what is the outlook, right?
[02:55] Is my brand, is my sales performance, is it going to improve, right?
[02:59] So these are the four things which happens.
[03:02] Now, for some of the top farmers, what we have done is, how do we, in an agentic way, right?
[03:07] I think, how do we actually make this analytics work?
[03:10] So what we did, we built agents for every step.
[03:13] Signal detection.
[03:14] We said, okay, we'll have an agent for signal detection.
[03:17] It'll identify the signals for me.
[03:19] Second, what are the root cause for the signals?
[03:22] So in this case, we have two agents.
[03:24] One, we call it a source localization.
[03:26] So for example, if my sales is dropping at a national level,
[03:29] is it because it's dropping at, say, a particular region,
[03:32] or is it dropping for a payer?
[03:34] So we need to understand that.
[03:35] We are trying to identify the source of it.
[03:37] And then once we understand what is the real reason, right?
[03:40] I think the sales performance has gone down.
[03:44] That's another agent, the driver attribution agent.
[03:46] And then the last step is your synthesis right So depending on the cost now what is the action you have to take and what is outlaw Like typically how an analyst used to do And all of this used to have an orchestrator agent which connects all these agents together
[03:59] So now, what happened? Once we had the system, what did it generate, right?
[04:03] It generated something, an information packet like this, right?
[04:06] It clearly tells you the signal, right? So first it says maybe my branch prescriptions have dropped 18% in some territory, right?
[04:13] in some time frame, maybe four weeks.
[04:15] It then tells you the reason.
[04:16] Why did it drop, right?
[04:19] The reason it says because a payer actually, right,
[04:22] the coverage for this drug has actually moved it to a lower tier.
[04:26] So for a patient, it's expensive actually to buy this drug.
[04:30] The action it says, okay, because doctors are writing less prescriptions,
[04:35] maybe send more sales reps to talk to doctors, right,
[04:38] and increase the number of prescriptions that you're writing.
[04:40] And then if you take this action, maybe your outlook, your sales performance is going to increase.
[04:45] So all of this looks good, high level, but then if you look at it closely, it's not very coherent.
[04:52] The cause is right, it identified the right cause, because patients can't afford the drug.
[04:57] But the action it said, it didn't really focus on the pay up part, the insurance part of it.
[05:03] It just said reps, focus more reps actually.
[05:07] and then outlook because the action is wrong the outlook is not going to match
[05:10] so at each level if you see it is actually derived the right fact but then
[05:15] there is no single agent which is only which understands the end-to-end
[05:18] picture basically so why did this happen like why did it
[05:23] fail right so obviously it's not the llm which
[05:27] failed right it's the way how we stripped the work
[05:29] right because we tried mimicking the behavior and we did it
[05:33] The first key issue is like a language model is actually determining your signals.
[05:39] So signals like things like your sales drop is a simple information which you can use statistical methods to actually go and fetch this information.
[05:46] You don't need a language model actually to fetch this information.
[05:50] Second is as you have multi-agents, there is a lot of context handoff which is happening and context is actually getting lost at each of these handoffs.
[05:57] So for example, the driver attribution agent is actually determining the right cost, but then the next agent, the synthesis agent, is actually not able to understand why is that, right?
[06:08] The payers are finding the drug to be expensive.
[06:10] It's not understanding the weightage of an insurance coverage going through.
[06:14] So that is the key information, right, which is getting lost.
[06:17] And the last big piece is there's no shared understanding of the business domain knowledge for all these agents.
[06:23] All these agents don't understand metrics, right?
[06:26] So things like DRX, the number of transactions, the number of prescriptions which a doctor writes, right?
[06:30] What is the relationship between them?
[06:32] Why does it go up or down?
[06:34] So those are the reasons.
[06:36] So then what did we do?
[06:38] So I called Abhilash to come and solve for this.
[06:42] Thank you, Subbiya.
[06:44] So we had like three problems.
[06:46] So we were thinking how are we going to solve this.
[06:49] Our first instinct was we'll go back to the droid board.
[06:53] We'll start designing it again.
[06:54] So maybe the topology was wrong.
[06:56] the skills were wrong, the tools were wrong, or maybe we had to decide a better handoff or a better schema between agents.
[07:06] But we took a step back, we didn't do any of that. We, like all of us, we went back to Cloud Code.
[07:14] So we opened a very plain MD directory, I ran Cloud Code, then give it just bash and a database,
[07:23] database, then give it an actual signal which we identified, then started observing what
[07:28] it is doing. So while we look at what code does, we are able to figure out, fix all the
[07:33] three issues we discussed The first part So what was happening is the agent was looking at data and deciding on a signal Sometimes it applied some statistical methods Sometimes it barely looked at the data and said this is a signal
[07:51] Sometimes it's actually a signal.
[07:52] Sometimes it's a noise.
[07:54] This is something we don't want an agent to do.
[07:57] This is a completely deterministic workflow.
[07:59] So we separated it out from the agenting system.
[08:02] So we built a pure deterministic workflow with different statistical methods.
[08:06] we put card rates, we put thresholds, we put prioritization.
[08:11] Everything happened before the agent even kicks starts.
[08:15] So we run an automated pipeline which scans through the data,
[08:19] identifies signals for each of the KPIs, anything happening with that,
[08:23] any anomalies which is happening, any threat which is appearing, any threat which is breaking.
[08:28] Based on that, we identified a signal, we put it on a queue.
[08:31] The moment a signal comes to the queue, the agent makes up.
[08:34] So the agent's job is to investigate, not to identify.
[08:40] The second part.
[08:42] So mainly the issue which we previously once mentioned,
[08:47] there is no coherence in the output which the agents produced.
[08:50] So we started consolidating.
[08:52] We looked at how Cloud Code operates.
[08:54] It's able to do a lot of operations.
[08:56] So we started designing around that.
[08:59] So it's repeatedly writing a function and querying database.
[09:02] So we give it a tool for that.
[09:04] So this consolidated the entire process into a single agent.
[09:09] That doesn't mean that we didn't do pathless. We still do pathless.
[09:13] What we removed is, do we need distributed reasoning?
[09:17] We didn't want the judgment to be distributed between agents.
[09:20] That we wanted to consolidate to a single agent.
[09:23] So that's what example code we did.
[09:25] Then occasionally we observed code code.
[09:27] It's launching sub-agents dynamically for a very particular focus task.
[09:32] So we did the same thing. Because suppose you want to understand if a productivity in a particular region, that's an investigation which you need to write.
[09:40] That you can still delegate to a sub-agent. You can get back the results back. Not the reasoning or the judgment, that is still controlled by the main agent.
[09:49] But the investigation part of it we did, we delegated it to a sub-agent. So these are some of the things we kept based on observing what the court was doing.
[09:58] code was doing. So that gives us a more lighter architecture than what was initially there.
[10:04] But still it doesn't solve the problem. That's why you see a knowledge graph in the diagram.
[10:09] So it still doesn't have the business context. It still doesn't understand all the entities,
[10:16] the domain, the KPIs, how do they relate to each other. So that's something we wanted
[10:24] because the agent was looking at data, looking at tables, then time to infer the relationship,
[10:29] which was not scalable. And it often produced relationship which is not actually existing in the data.
[10:36] So what we did? So we've been working in this field for a whole lot of years.
[10:45] So we've been doing this for our clients. So we have a lot of domain experts who understand the pharma domain very well.
[10:50] We are doing commercial analytics for the clients.
[10:52] So we start with them, start building a knowledge graph.
[10:54] We start trying to map out the domain.
[11:00] So we are able to build a knowledge graph.
[11:02] We are able to identify different entities, their relationship with each other.
[11:05] So if you see, there are like geographic entities.
[11:08] There are pairs.
[11:09] How geographic entities connect to a pair or an account?
[11:13] How does this connect to a brand?
[11:15] Then from brand or pair, how does it go to a KPI?
[11:19] How does a KPI relate to like a secondary KPI,
[11:23] the original KPI?
[11:24] How does one KPI drives another KPI?
[11:26] So we started mapping out all of this information
[11:28] and then creating our knowledge graph.
[11:31] Once we have the knowledge graph then we wanted the agent to navigate the knowledge graph So the knowledge graph is not just something the agent looks up for data It is the control plane for the agent
[11:45] So what do I mean by that?
[11:47] So the knowledge graph dictates what the agent can look into,
[11:52] what path it can take, what investigation hypothesis it can evaluate.
[11:57] So for example, if you want to do this analysis,
[11:59] the root of the problem, say something like your TRX is declining at a national level.
[12:04] This could be when you do source localization, so that's our contract for how to find the pair.
[12:10] This might happen within a region, it could be concentrated in a territory,
[12:14] it could be concentrated in a combination of a territory or a pair or an account.
[12:18] So there are a whole lot of dimensions which they need to evaluate.
[12:21] Now, it's a lot of permutation combination.
[12:25] So the knowledge graph guides the agent on how to find where this is concentrated.
[12:30] Then the why part of it. Why it is happening.
[12:34] When you figure out that something is concentrated at, say the decline is concentrated at a particular region, now you need to figure out the why.
[12:41] This is where the KPS and regulations comes in.
[12:45] Once the agent is able to narrow down the where, then he is able to go and figure out the why part of it, which KPS is driving about.
[12:54] Gram acts as the control surface. So agent, every edge is a hypothesis. So the agent can go and evaluate the hypothesis. It doesn't go outside of this.
[13:07] So that gives a more bounded surface for the agent to investigate. So like everyone was mentioning about loops, so we also build a loop.
[13:18] So what the agent is, so the agent first start with an entity, it goes to the graph, it looks at the neighborhood of the graph, then it figures out the edges. So it scores some hypothesis. It will go back to the original data, evaluate that hypothesis, look at the actual numbers, then reason over it.
[13:42] then it will either find it contradicting or it finding supporting the evidence supporting
[13:49] the hypothesis. If it is supporting it, it started traversing through the graph. So this
[13:54] repeats this until it run out of all the hypothesis or it is able to figure out the root cause.
[14:01] So this concludes this run. This run is going to be able to figure out the root cause of
[14:07] So once you build this, so maybe like after like 50 plus turns, a whole lot of tokens,
[14:14] it's able to produce something and the analyst was able to produce maybe 3 or 4 weeks in
[14:20] like maybe 20-30 minutes.
[14:22] Thank you.
[14:23] So just to wrap it up, key takeaways.
[14:28] First thing is I think we should not be introducing human constraints or design constraints into
[14:32] architecture.
[14:33] I think let the architecture be derived actually.
[14:36] Number one. Second, I think any complex workflows will have deterministic parts and agentic parts. Don't let agents actually run the deterministic part, right? So I think we need to break that off. The third, you need to have one agent, right, which owns the reasoning into it, right? This agent can actually take the call to use sub-agents, tools, skills to actually use one of the other tasks basically, right? But you need one agent to own the reasoning.
[15:02] And the last probably the most important,
[15:06] I think graph cannot be treated just as a lookup layer.
[15:09] I think graph has to be treated as a control plane
[15:11] which the agent uses to navigate
[15:13] and takes the next decisions basically.
[15:17] Okay, with that, I think, thank you.
[15:19] Thanks, thanks for the talk.
[15:25] Thank you, Sophia, and thank you, Adilash.
[15:28] Thank you so much for this incredible talk.
