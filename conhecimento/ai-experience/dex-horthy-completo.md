---
tipo: transcricao
fonte: aula-externa
tema: produto
evento: ai-experience
autor: "Dex Horthy"
organizacao: "HumanLayer (Co-founder)"
sessao: "Harness Engineering is not Enough: Why Software Factories Fail"
evento-nome: "AI Engineer World's Fair"
pode-ir-comunidade: true
anonimizado: true
criado: 2026-07-01
modelo: whisper-large-v3
idioma: English
duracao-seg: 878
status: bruto-revisar
autorizado-usar: false
---
# Harness Engineering is not Enough: Why Software Factories Fail — Dex Horthy (HumanLayer (Co-founder)) [bruto]

[00:00] Well, if you're not working on critical systems, but most of us are working on teams and we don't fit in that box.
[00:06] So today I want to talk about how to build loops that work in large complex codebases.
[00:12] For systems that have real customers, real users, real regulatory obligations, and service level agreements,
[00:18] and everything else that keeps us from shipping YOLO 40,000 line PRs straight to production.
[00:24] In other words, I want to talk about how to build loops for the real world.
[00:27] If you're not aware, this post dates back to July. It went viral this past January, which is when a lot of us started building loops.
[00:34] And of course much more recently, I'm sure you're going to see this slide a lot this week, but Peter Steinberger said that we shouldn't be prompting coding agents anymore.
[00:44] We should just be designing loops that prompt our agents. Of course, Open Clause notoriously built on loops.
[00:51] loops, loops build the code, loops review the code, they merge and release the code,
[00:56] they find and fix the bugs, there's even loops for finding and fixing bugs in the loops that
[01:00] are merging the things, right?
[01:03] It's loops all the way down.
[01:06] It's a, Horse Journey also, the creator of Plot Code recently said that this is his entire
[01:11] job as an engineer now, is just writing loops to prompt Plot.
[01:15] And eventually, read all of it, right?
[01:17] So we might as well just not read any of it, right?
[01:20] investing in verification and in code review, but all this code is read-only.
[01:24] This was the thesis of a conference that was here in town last month. So a lot of
[01:29] smart people at the Frontier Labs think that this is the future of software
[01:32] development, and if you're doing this, you're moving 10x faster and everybody
[01:38] else is getting left behind. Now it's not clear how well this works yet. It took six
[01:45] months to fix the Clod Code terminal flicker. The OpenCode team wrote a
[01:48] renderer in a fraction of that time.
[01:51] And OpenClaw, of course, also notoriously
[01:53] had stability issues.
[01:55] What is abundantly clear, however,
[01:57] is that this shit is really expensive
[02:00] if you don't work at a frontier lab,
[02:02] have an unlimited token budget.
[02:04] And all this code that we're writing
[02:07] is actually really expensive, right?
[02:09] Matt Pocock talked about this recently.
[02:11] Bad code is much more expensive in the age of agents
[02:14] than it has ever been at any point in its past.
[02:18] So today I want to talk about what I think works in the real world and what we've started doing at HumanLayer.
[02:23] Which, to be clear, is still building loops, right?
[02:26] I think loops are super powerful, but we can design loops and still read the code.
[02:31] In fact, we can design loops to make it easier to read the code because the loops are making the code better.
[02:37] We can solve hard problems and complex code bases with loops.
[02:40] And we can build our software for that with three incrementally.
[02:44] But to do this is going to take some real engineering, y'all.
[02:47] So let's talk about control theory.
[02:50] Control theory is all about how we drive a dynamic system, which would be your code base,
[02:54] towards some desired stable or optimal end state.
[02:57] You have a sensor that measures the current state of the world.
[03:02] You have your set point, the desired state of the world, and the difference between those
[03:06] two things is your measured error.
[03:08] You have a controller that reads that measured error and turns it into a control signal about
[03:13] an incremental change to apply to the system.
[03:16] We have an actuator that applies that change to the system, which is undergoing disturbances
[03:20] in the meantime.
[03:21] Then we re-measure or re-compute our measured error, and we're back where we started.
[03:27] Now this sounds really complicated, and it can be.
[03:30] I have a twin brother actually who's an aerospace engineer.
[03:32] This is how they keep fighter jets from falling out of the sky Most of us probably actually use control loops on a daily basis right Kubernetes auto systems are built on control loops
[03:44] Infrastructure as code uses a desired state, current state, iterative change like control loop pattern.
[03:52] Postgres is auto-vacuum and React's virtual DOM both use or approximate control loops.
[03:58] Control loops are ideal when we have a system that we want to change,
[04:00] a problem we can measure, and a way to get feedback on the results of that change.
[04:06] Like what software engineers have always been taught to do,
[04:09] control loops change the system incrementally,
[04:11] instead of just trying to get straight to the end state immediately all at once,
[04:16] and risk blowing everything up, right?
[04:17] They help us to avoid oversteering and destabilizing the system,
[04:21] and it minimizes risk.
[04:23] So control loops are the opposite of what I'm going to call a blind Ralph loop.
[04:28] How do we avoid PRs that look like this?
[04:30] Because nobody wants to review this, right?
[04:33] Which is not to say that all Ralph loops are blind loops.
[04:36] The best Ralphs are actually applying control theory.
[04:39] I know [pessoa] is out in the hall somewhere wandering around.
[04:41] If you go talk to him, he's going to tell you the same thing, right?
[04:44] That Ralph is a teaching device, and I think some of us read it a little too literally,
[04:50] but this is how we should have always been building loops.
[04:53] But the other issue with Ralph loops, they're not incremental, right?
[04:56] It's just a bash loop.
[04:58] So we have to build a gem to control loops.
[05:00] And to do that, we start by defining a set point, which is the desired end state of our
[05:05] code base with respect to some property of it.
[05:08] And we add a sensor.
[05:09] There's a lot of ways to build a sensor.
[05:10] It can be strictly deterministic, your ESLint rules, your AST grep, your pack work, or it
[05:17] can be non-deterministic.
[05:19] You can have an agent and a skill and a bunch of natural language rules, a pipeline, like
[05:23] a combination of the two.
[05:26] So how do we build a gen-tric- oops, there we go.
[05:30] Now, this is all theory, right?
[05:32] Practically speaking, and because we're using agents,
[05:34] we can blur the lines a little bit between system components.
[05:37] So, AidenBuy's React Doctor, for example, is fantastic.
[05:41] It is a great way to catch all of the React slot
[05:45] that Claude snuck into your code base last week,
[05:48] but it's a hybrid sensor and controller.
[05:50] It tells you what are all the problems with your React code,
[05:53] and also, by the way, what are the top three things you should fix
[05:56] and how do you fix them.
[05:57] Similarly, our controller and actuator might actually just be a single agent deciding on
[06:03] an incremental change to make and then applying it in the same context window.
[06:06] But I want to zoom in on the controller a little bit, because without one, or without
[06:10] a well-tuned one, we might make too large of a change all at once, or we might make
[06:15] the wrong change entirely.
[06:16] And if you put that in a loop, you're in trouble pretty quickly.
[06:21] So we can use control loops to root out bad patterns and to clean up our code, but we
[06:25] We can actually use them for all sorts of things, right?
[06:27] We could make sure that our API is compliant with someone else's open API spec.
[06:32] We can make sure that our MCP server is compliant with whatever version of the MCP specification
[06:38] that we're currently on.
[06:40] I haven't checked.
[06:41] You could mirror a project from Python into TypeScript or vice versa.
[06:46] You could even maintain your beat-based slop fork of Next.js against the upstream.
[06:52] The key questions are, can we find something we can measure?
[06:56] Can we apply changes incrementally?
[06:58] Because it's really powerful, it's a great tool
[07:00] to have in your toolbox for building loops.
[07:01] It's language agnostic, it's out of band
[07:04] from your TypeScript config or ESLint rules,
[07:06] which if you're a TypeScript developer,
[07:08] you have watched Claude disable those with inline comments.
[07:12] So we can just write a simple rule
[07:14] that finds un procedures based on the pattern above Over time we can even layer on more rules that describe other patterns we want to get rid of with granular include and exclude paths If you have a multilingual monorepo like we do
[07:27] it'll work for any language you could possibly imagine.
[07:30] And we can just scan our code base,
[07:31] and it'll produce a long list of violations.
[07:34] Way too long, in fact.
[07:35] It'll give you about 50 keys per violation,
[07:38] so we're just going to filter it down to four,
[07:39] and we're going to sort it deterministically.
[07:41] Why are we doing that?
[07:42] At the beginning I said this was going to be practical, so we're going to step outside
[07:47] of our control loop paradigm for a second, because before we start incrementally migrating
[07:51] procedures one at a time, we need to enforce that all new procedures are using effect,
[07:55] right?
[07:56] So we're going to run a full scan once on name, sort all the violations deterministically,
[08:00] track it in our version control, and then on every new PR, we can see if the branch
[08:04] added any un-migrated procedures, right?
[08:07] So this is our control loop and our system is undergoing disturbances, in this case all
[08:13] of our teammates shipping Claude's log, and this is how we make sure that they're not
[08:16] undoing our loop's work.
[08:18] This doesn't map directly to a part of the control loop, but we can kind of like swim
[08:22] at it a little bit and call it a disturbance dampener.
[08:25] So now that we've stopped the bleeding, we can actually design our controller.
[08:28] For a simple controller, we can just deterministically pick the first violation from the list.
[08:32] We can use bash or jq, or we could get a little cleverer
[08:37] and use ast-grep to find the smallest un-migrated procedure
[08:40] and always pick the smallest one to reduce the risk.
[08:45] We could have an agent make the decision
[08:46] if we really want to.
[08:47] I don't think you should ever send an agent
[08:49] to do deterministic code's job, but you certainly can.
[08:52] In fact, depending on the complexity,
[08:53] we could have the agent pick the procedure to migrate
[08:56] and just do it at the same time,
[08:57] like we just talked about.
[08:59] But we can make this even more powerful, right?
[09:01] because we're not just migrating to effect for the sake of it.
[09:03] We're doing it because it's helpful for handling errors
[09:06] and for helping us instrument our code better.
[09:08] And so what we can do if we want to get really clever
[09:10] is we can look at our telemetry
[09:11] and figure out which procedures have the most errors
[09:14] or the least instrumentation or has a gap in our APM, right?
[09:18] And when we send a control signal to our actuator agent,
[09:21] we can include not just the procedure to migrate,
[09:23] but also all the data about the things
[09:26] that we're trying to fix with this migration
[09:28] so that the actuator agent can actually make the code better
[09:32] instead of just doing a one-to-one migration.
[09:39] There we go.
[09:40] So next is building our actuator.
[09:43] Our actuator is just an agent plus a skill.
[09:46] Bring your CLI coding agent of choice.
[09:48] You should spend a lot of time on the skills.
[09:50] Not all of that should be up front.
[09:51] You'll want to iterate on it over time based on what works.
[09:53] At HumanLayer, we like to build out what we call golden patterns by hand
[09:56] before setting the agent loose.
[09:58] These are just like idiomatic handwritten examples for the agent to follow because they're just pattern replicators and otherwise you're getting what's in the docs
[10:05] Or what the agent knows from the internet and so we pipe the skill
[10:10] Plus our control signal into our actuator agent and if the skill of course should include a response template the agents gonna work
[10:16] Work and work and it'll produce a final response and then we're going to deterministically commit and push and create a PR
[10:23] Using the final message as our PR description
[10:26] Now all we have to do is actually run the loop, right?
[10:29] My recommendation is to use GitHub Actions
[10:31] or your GitLab or your CircleCI
[10:34] or whatever else you're using,
[10:35] because it has access to your code,
[10:37] has access to your secrets,
[10:39] and it has great dispatch and scheduling prevenants, right?
[10:43] We don't need a new cluster for this.
[10:45] So we can run a workflow that runs a single iteration
[10:47] of the loop, sense, control, action weight,
[10:50] and creates a PR.
[10:51] Then we can schedule this to run once a day.
[10:53] Every morning we walk into the office for small incremental PR that low risk And when we first did this it was actually really frustrating and we turned the loop off And because we had to constantly update the skill
[11:05] we had to constantly check out the branch,
[11:07] change the skill, change the code, commit and push,
[11:10] and our loop was actually really high friction, right?
[11:13] But there's a better way to do this,
[11:15] where we can put a human on the loop
[11:16] in a really low friction way to re-steer it
[11:18] when it goes wrong.
[11:19] And the way to do this is to just create a feedback file
[11:21] It's tracked in version control,
[11:23] just as a markdown file, right?
[11:25] We can deterministically load it
[11:26] into our actuator agent's context,
[11:28] every time that it runs after we run the controller.
[11:31] Then we can add a label to the PR, right?
[11:33] Each workflow needs to be able to identify PRs
[11:35] that it created,
[11:36] since there might be a bunch of different loops running
[11:38] and we only want workflows to respond to feedback
[11:40] from comments on their PRs.
[11:42] We're going to add a comment trigger to each loop workflow.
[11:45] So when a user leaves a slash iterate comment on the PR,
[11:49] the loop workflow is gonna pick that up.
[11:51] It's going to deterministically load all of the PR context,
[11:54] the diff, the comments, the review comments,
[11:56] the description, into the agent's context
[11:58] along with the skill, and it's going to instruct the agent
[12:01] to fix the code, but also to update that feedback file.
[12:05] Looks kind of like this.
[12:06] And the benefit of doing this way is that now
[12:08] that feedback file with instructions
[12:10] is tracking your version control.
[12:12] You can see how you've changed it over time.
[12:13] You can revert it if you need to.
[12:17] So the next thing we're gonna do is add flow control.
[12:19] Because the other problem that we had when we did this
[12:21] was that if we were at a customer site for a week,
[12:24] or if we were traveling, or spent six days
[12:27] working on slides instead of writing code,
[12:30] the PRs from all of our loops would just stack up,
[12:32] they'd duplicate work, they'd conflict,
[12:35] and we wouldn't get around to doing it.
[12:36] And the loop's work is important,
[12:38] but it's not that important,
[12:39] and so now we just have all this junk we had to deal with
[12:42] that wasn't important.
[12:43] So this is actually a really easy problem to fix,
[12:46] because each loop and its workflow has a label
[12:49] that gets attached to PRs.
[12:51] When the workflow first runs,
[12:52] before we check out the code and install the dependencies
[12:55] and run our sense control actuate steps,
[12:59] we can just check and see if the last PR that we created
[13:02] or any PR with the loop's label on it is open.
[13:05] And if so, we just shut down, right?
[13:07] Because this means that the last time
[13:09] that a human reviewed the code from this loop
[13:13] was before the loop ran, right?
[13:15] No human reviewed the last output,
[13:17] so there's no reason to stack up even more work
[13:18] for humans to review.
[13:20] This way we have exactly one PR and most open
[13:22] per loop at a time, no stacking, no duplication,
[13:25] hopefully no conflicts.
[13:27] And of course, once you're feeling confident in the loop,
[13:29] we're gonna wanna speed it up, right?
[13:31] I have 150 RPC procedures to migrate.
[13:33] If I do one at a time, it's gonna take six months,
[13:35] which is way longer than I wanna wait.
[13:37] Fortunately, there's a lot of ways
[13:38] to pick up the velocity of our loop.
[13:41] We could have our controller pick three procedures
[13:43] to migrate instead of one at a time, or five.
[13:46] We could have our controller pick three or five and then do each of those in a separate implementation phase,
[13:52] which will be both cheaper and more reliable since each migration gets its own context window.
[13:57] Or we could just run the workflow four times and give one PR to each of four people on the team.
[14:02] So let's put it all together. We built a control loop that improves our coding preventively.
[14:07] And we're actually reading the code. It has adaptive flow control, so we're not creating a bunch of work that nobody wants to review.
[14:15] and we can re-steer it on the fly in a super low friction way.
[14:18] If you want to try this yourself, we built a skill.
[14:21] Please try it out.
[14:22] My Twitter handle is down there on the bottom.
[14:24] Please share it.
[14:25] I would love to see what you build.
[14:27] And if you get excited by this,
[14:29] at Human Layer, we're hiring here in San Francisco.
[14:30] Love to chat.
[14:31] Thank you so much.
[14:32] Thank you.
[14:32] Woo!
