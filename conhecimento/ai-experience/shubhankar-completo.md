---
tipo: transcricao
fonte: aula-externa
tema: produto
evento: ai-experience
autor: "Shubhankar Srivastava"
organizacao: "Browserbase (Founding Sales Engineer)"
sessao: "Hill-climbing Skills: How to Improve Agents Without Touching the Model"
track: "Track 4 / Room 2009"
tags-evento: "Agents, Reliability"
pode-ir-comunidade: true
anonimizado: true
criado: 2026-06-30
modelo: whisper-large-v3
idioma: English
duracao-seg: 2408
origem-audio: "WhatsApp Audio 2026-06-30 at 01.36.35.mp4"
status: bruto-revisar
autorizado-usar: false
---
# AI Experience — Hill-climbing Skills (anonimizado)

> whisper-large-v3. Idioma: English. Anonimizado para distribuição — preservados timestamps, conteúdo, números, figuras públicas, autores e o palestrante.

[00:00] Here, and that's what we're going to be looking at, how we improve the reliability of these browser agents.
[00:06] I want to give you all a few examples of where these agents suck to.
[00:12] If I zoom in a bit, you'll see this browser agent is trying to go on Google flights and click on the...
[00:20] it's trying to drag the time filter and it's unable to figure out how do I drag that.
[00:26] Dragging is a tricky operation for these agents to do,
[00:29] and it gets super confused.
[00:30] It doesn't know what the HTML element for that is,
[00:33] what the JavaScript for that is,
[00:34] it's not really able to do this.
[00:36] And it gets stuck, and it's not able to move my flight tickets.
[00:40] Another example I wanted to show is the browser
[00:43] engine of OpenTable.
[00:44] Let's say I have my open clock, or my organization,
[00:48] and I need to book out the date night.
[00:50] And I go, hey, go to OpenTable and find me some,
[00:53] and look at the In-App Hypotel it runs into, right?
[00:56] And it's just like, access denied.
[00:58] I don't know what happens here,
[01:00] but like, can my browser agent get around these issues?
[01:03] Can they be more reliable?
[01:04] Can they book my date and my restaurant?
[01:06] Is the biggest question I wanted to ask here.
[01:10] And this is where we sort of look at different ideas
[01:14] to improve the reliability of these agents.
[01:18] And part of them,
[01:20] actually let's dig into the root cause here, right?
[01:23] Like, why this is happening.
[01:26] We have these Opus models, these five files,
[01:29] super nice general work,
[01:30] this might have used codecs, computer use, very nice,
[01:33] but when you wanna sort of do long running,
[01:38] tricky websites like the Open Tables or the Google Flites,
[01:43] it sort of becomes very difficult to run these in caption,
[01:46] and these site-specific tricks,
[01:47] or these JavaScript that you need to run on your browser,
[01:50] the agent doesn't know about them, right?
[01:53] And the most important thing is, every run starts from zero.
[01:56] You're not really having any sort of learning
[01:59] baked into your run.
[02:01] I think Gorkesh talked about this a couple days ago.
[02:03] It's like, why is progress on computer use
[02:06] still so slow today?
[02:08] While the computer use seems like a verifiable problem,
[02:12] why is it still not solved?
[02:14] Essentially, there's no learning happening.
[02:16] Every agent run is a start from scratch run,
[02:21] and it's not learning from its production races,
[02:24] and these browser agents, I call them geniuses,
[02:26] they'll never learn.
[02:28] And some people might say,
[02:29] oh, why don't you fine tune on something,
[02:31] some like, open table or restaurant websites,
[02:34] but it's not really scalable, right?
[02:37] If you're thinking of building agents,
[02:38] you can't really be fine tuning
[02:39] for every new task that comes up.
[02:41] You want some, you want a modality
[02:45] where it can learn from its production races
[02:48] and get better over time.
[02:49] This is when we sort of started thinking about, this is like four to six months ago where
[02:56] [pessoa] came up with this idea of auto research.
[02:59] This is an efficient loop, right?
[03:02] And this loop sort of takes a verifiable problem statement and goes at it, tries it again and
[03:09] again, every single lesson.
[03:11] And we're like, okay, let the doer and the teacher go at it.
[03:15] And the key thing that happens is there's a strategy.md file that is essentially the artifact across multiple runs.
[03:24] After every iteration, the teacher thinks about what happened, looks at the screenshot, looks at the logs,
[03:31] and then thinks, oh, you did not click on this button.
[03:35] You should actually click on this button instead.
[03:37] And it puts that in the strategy.md file, and that artifact carries over to the next iteration, and it improves from there.
[03:45] Maybe we'll go back to our demo and see what happened.
[03:48] All right, so iteration number one,
[03:51] there was a failure here,
[03:52] and the learning from this iteration
[03:55] was skip the entire form calendar widget
[03:58] because you can just do a query parameter
[04:02] and you don't really need to click around, right?
[04:04] The agent was smart enough in this instance
[04:06] to think, oh, I'm wasting so many tokens
[04:09] and I'm wasting so much time clicking around
[04:11] where I can just use Google Flags query parameter.
[04:14] Now this is obvious in hindsight, but maybe as a human I would have thought this and I
[04:19] wouldn't have written this complicated query parameter myself.
[04:25] So this is the learning from the first iteration.
[04:27] Now it's going and doing things in iteration number two.
[04:30] It'll keep going on till it feels like it has maxed out all the tricks, it has maxed
[04:36] out all the JavaScript hacks that it could do, and then think about, okay, this is the
[04:44] skill that I can use from here. The key thing that I want to also talk about is at the end of this converged loop, the output that I want is a skill.md file. This skill.md file would be what I give to my future agents and it would have a collection of all the hacks or all the tricks or all the learnings from previous runs. We'll look at that in a little bit.
[05:14] what that skill might look like.
[05:16] It will look like, hey, a pre-filled URL is mandatory.
[05:20] Don't go around and waste your clicks and tokens
[05:24] clicking on these buttons.
[05:25] There is a reopen bug in the calendar.
[05:28] Don't do this.
[05:30] If you wanna move the drag,
[05:33] if you wanna drag your timestamp thing,
[05:35] use just your injection,
[05:37] don't try to do it with the mouse, right?
[05:39] These are the kind of tricks that are now persisted
[05:43] for every future run and gives me so many more savings
[05:47] from a performance, reliability, and cost perspective.
[05:53] Now, we'll go back to our run and see if it has passed.
[05:58] Okay, so iteration number two has passed.
[06:00] And if you can see the savings in cost are like four X.
[06:07] This chart is being created on the fly.
[06:10] So it started from $12 and second one is $3.
[06:13] And keep in mind, my agents here are both for the newer
[06:18] and for the future.
[06:23] Now iteration three just came in,
[06:26] the number of films decreased, the latency is also better,
[06:30] but there was a failure in iteration number three.
[06:32] There's something that is sort of over-corrected on
[06:35] and iteration number four should probably be learning
[06:37] from that and you'll see if it does that.
[06:41] But it's doing its own thing.
[06:43] I want to show some previous runs that I did
[06:46] just in preparation for this demo.
[06:49] So for example, I went to Autobrowse and I was like,
[06:52] hey, go to the AI engineers website and tell me which docs
[06:56] and workshops are talking about head climbing.
[06:59] And I did that across multiple iterations
[07:01] and you can see the replay of each of these.
[07:03] These are replays that are coming from browsers.
[07:05] super helpful and important for observability perspective.
[07:09] And as you can see, it sort of got better
[07:13] in terms of cost, 7.4x.
[07:17] Even though it was able to pass in all the iterations,
[07:21] I still got improvements in cost.
[07:23] Now, I want you to actually see
[07:25] what are the learnings from the skill, right?
[07:28] How do you sort of persist all of these learnings?
[07:32] It says, go straight to the sharing page.
[07:35] If there are open errors, don't try, retry blindly,
[07:38] run this, type the keyword into the session,
[07:42] search input, wait briefly, so like have these pages,
[07:45] because sometimes websites take a lot of time to load,
[07:48] so you can have these kind of tricks,
[07:50] and then read the results.
[07:52] You know, like, there's a lot of learning
[07:55] that's happening in these skills.
[07:57] Maybe I wanted to show some interesting ones.
[08:00] I want to show this open table one,
[08:01] Because I started with this blocker of access denied
[08:06] when we started this demo, and if we go to the screenshot,
[08:12] this was the access denied thing that we got, right?
[08:14] In iteration number one.
[08:16] Let's see how it learned from it.
[08:18] It realized that the block is environmental,
[08:22] because the website doesn't want this agent to do something.
[08:26] In iteration number two, it figured
[08:28] that if I move a query parameter,
[08:30] And if I put a latitude, longitude, metro ID,
[08:33] I automatically get that UI that works.
[08:38] Do not open slash R, that's blocked,
[08:40] and do not reload slash S.
[08:43] These are the places where the blocks kick in.
[08:45] If you don't do that and follow this technique instead,
[08:49] your agent will work, right?
[08:51] And as you can see, it went from $6.22 to $0.51.
[08:56] to $0.51, the time taken went from 189 seconds
[09:00] to 27 seconds, and the skill it came up with was here.
[09:06] With the search URL, do the date math like this.
[09:11] This is the known metro pins for San Francisco,
[09:15] and follow these steps, right?
[09:17] Never call slash R because that will return access denied.
[09:21] These are the kind of learnings
[09:22] where humans would never have done,
[09:24] where you just sort of embrace the virtual lesson
[09:26] and let agents do the job and they can find these tricks for you.
[09:31] I want to also show a few examples of the kind of improvements we see.
[09:40] The reason why this problem is so close to my heart is because I, from a sales perspective,
[09:46] am deploying these browser agents into production.
[09:51] The sale is only done when the browser agent is successful,
[09:54] So reliability is like the most important thing for me.
[09:57] And this is the key tool that I take to my customers and I like just fire your agents let them do this auto research thing and your agents will be successful in production
[10:08] And these are the kind of success methods that people are looking for, up to 16x cheaper, 12x cheaper, 3x cheaper, on different tasks.
[10:17] Of course, every lab is different.
[10:19] The bottlenecks are different, so you might see variance there,
[10:23] but the idea is you can climb on these .
[10:32] I want to go back to a live demo and see if there's any
[10:38] .
[10:39] So we have a graduated skill, and the skill applied into it,
[10:43] no further learning.
[10:44] The results are showing correctly.
[10:46] one-way business class samples to go to New York,
[10:49] July the fourth, what carrier bag included,
[10:52] and there is this AAS is $49, right?
[10:55] So it was, it would get all this,
[10:56] and I can sort of watch the entire replay
[10:59] and see if that is accurate,
[11:01] and what they would have figured out this entire skill.
[11:04] The fast pass encode the head code query
[11:07] that you are strongly prefer.
[11:10] Again, like I know I'm showing these things,
[11:12] but when I first started looking at this,
[11:15] the results here. This was like my moment of like, this is the mythos moment for browser
[11:21] agents, you know, like just reverse engineering the hell out of things. I look at this with
[11:25] some of my customers. The customers are mind blown. Earlier, they would be writing scripts
[11:31] for each of their websites. They would be like, hey, I need to spend so many engineering
[11:38] hours on like just reversing these websites. How can I scale this to 100, 1,000 websites?
[11:44] and now our customers actually build these entire pipelines of these skills that get generated on the fly,
[11:52] pull requests that get created automatically. If there is a failure in production, an agent kicks in and starts healing the skill as well.
[12:00] There's a lot of engineering that we can do around this to leverage this technique.
[12:07] I want to also show what we've done with this.
[12:12] we actually went ahead and created this product called browse.sh.
[12:17] We were like, if we can do this for one website, we can do this for five,
[12:21] why not do this for like 500 websites and give it for free for anybody to do this?
[12:26] And like, if you remember in the 19, like, or wherever, like, in the 19, before internet,
[12:32] you had the yellow pages, you had details about accessing people, businesses, etc.
[12:39] etc., this is Yellow Pages for browser agents, right?
[12:42] It has details about how to do any task on any website on the web.
[12:48] I want to actually show this to you all.
[12:53] You can actually install Browse CLI and use all these skills completely for free.
[12:59] We've eaten up the token costs ourselves and we're making this available for you all.
[13:05] So if I go to, let's say, search products on Amazon,
[13:09] I can see the entire scale is over here.
[13:11] When should you use the scale?
[13:13] How should we look at pricing, availability, whatever?
[13:18] This is how you use this.
[13:20] Not only is it on Amazon, screenshots.
[13:24] And I just give this browse skills CLI to my open clock.
[13:29] And it just knows when to pull the all scales.com scale,
[13:33] when to pull the weather dot dove skill,
[13:36] and this makes my life so much easier.
[13:39] We essentially are running the same
[13:41] auto-research loops behind the scenes,
[13:44] and making this available for you.
[13:47] In fact, if you want to, you can go here
[13:49] and be like, hey, go and make a skill for me
[13:53] to look up this event since I'm just over the suite.
[13:59] Do this generator scale,
[14:02] So it's sort of blue this way, this will send you an email and you can then use your skill in whatever agent you want.
[14:10] So we've done this for other agents and I'm going to talk about how can you potentially do this for any other domain.
[14:21] I think coding agents is like one place where I've seen this frustration where the agent is relearning the repo conventions every time.
[14:31] It's not applying the linting rules for FA and I tell it every time.
[14:34] Maybe you can have your cloud MD and agents MD and improve that, but the fundamental premise is like,
[14:42] the agent should not be relearning your tasks from zero, right?
[14:49] As soon as a research agent, we run a bunch of deep research agents for our internal workflows,
[14:55] And every time it struggles and tries to really learn, oh, I pulled this information from Wikipedia, but I did not pull it from this other website.
[15:06] And I was like, why not?
[15:07] Like, we always do this other website.
[15:10] You should learn from your previous cases, and you should pull information.
[15:15] Internal ops, you have all these dashboards, all these databases, all these internal tools, but your agents don't know which ones work and which ones are preferred.
[15:23] ideally you should be applying this for research technique.
[15:28] And the two conditions that are required is that
[15:32] A, you should have a replayable environment of some sort
[15:35] so that you can run these loops,
[15:37] and B, you should have some sort of verifiable,
[15:40] some sort of quantifiable metric for you to run these loops.
[15:44] Yes, I can't believe that.
[15:53] Thank you.
[16:23] Yeah.
[16:24] Yeah, exactly.
[16:25] So I think the question is like how do you know that the auto research loop is accurate,
[16:30] whether it is converging and when it says it's converging, it's actually converging.
[16:35] When it says it's good, it's actually good.
[16:38] When it says it's bad, it's actually bad.
[16:41] Like how do I have confidence on what the agent is saying and what the group is doing?
[16:51] I think that's where I want to talk about the verifiable path of your...
[16:55] For Karpathy, it was quite easy because he was looking at the log loss of the experiment
[17:01] when you're straight in neural networks.
[17:03] It's very easy to see whether your log loss has gone wrong or not.
[17:07] But in many real world scenarios, that is not the case.
[17:10] For browser agents, as I explained, whether you book a flight ticket or not, that might be straightforward.
[17:17] but did you find the best flight options for me?
[17:21] Might be slightly fuzzy and might not be the best.
[17:47] Yeah, if I understand this correctly, you're saying like one mistake in the loop can sort of throw off the entire research run.
[17:58] And how do you prevent against that?
[18:01] I actually see where some iterations actually fail.
[18:07] For example, if we look at the previous slide,
[18:15] there's like failures happening after
[18:17] they're having successes, right?
[18:20] So it's not always that once you succeed,
[18:22] all the future iterations will always be successful.
[18:25] I think it's the design of your loop
[18:27] where you can make it resilient to failures,
[18:33] where it doesn't over index on those,
[18:35] and still sort of corrects itself from any mistake that happened in previous ones.
[18:40] I think we're trying to sort of prevent like, what is it called, exploding sort of loss sort of scenarios.
[18:48] I think we could do that. In fact, Karthami talks about this like, this is one way of doing auto research.
[18:55] You can actually auto research on different ways of doing auto research itself.
[18:59] It's like, is the teacher doer loop the best?
[19:02] Should there be a multi-agent architecture to do this?
[19:05] Or is there any other approach that might actually work better for research tasks in neural networks versus browser agents?
[19:13] You would have different designs of your groups to prevent situations like those.
[19:18] And I think going back to my point, as long as you have a verifiable outcome or some quantifiable metric,
[19:25] I think you should be able to design a good loop view.
[19:31] Retaining the environment, I think, sometimes is under-discussed, but extremely important.
[19:38] Then you were talking about Jorkesh, he said, having verified the law firm is important,
[19:41] but also you should have extremely grindable environments or extremely grindable use cases as well.
[19:51] If your agent cannot grind through failures,
[19:56] it will be difficult for it to go for multiple iterations and fix it since So do you have like coding agents is a good example because you can start from a Docker image or you can start from a particular VC2 and you can replay from different parts of the stack
[20:15] But maybe knowledge work is probably not that easy to replay.
[20:20] Maybe there's like a lot of different human in the loop actions that make it very hard to replay from a particular point in time.
[20:27] So investing in your environment also can be super rewarding in these cases.
[20:37] Amazing. I just wanted to share the URLs of the Autographs group that I demoed today.
[20:47] So if you scan the QR, you'll be able to probably pick up for that.
[20:51] And also the second QR here is the skill itself.
[20:55] you can just use slash autobrowse on your cloud core or codecs and be like, hey, slash autobrowse, use Opus 4.8 on both of these,
[21:03] feature and reward, and go create a skill for me to do this.
[21:11] I'm looking at one of these questions.
[21:14] And also, if any of you have ideas of something you want to sort of put the agent against,
[21:21] feel free to type it in the Slido, and we can actually try it live.
[21:25] But let's move to this question.
[21:26] Is there a way to optimize convergence?
[21:29] I think this is the same question that we were just talking about.
[21:33] High cost is interesting because you might think that doing longer iterations
[21:40] might become costlier over time.
[21:43] I have run a bunch of evals on this where I can throw a sonic at this problem,
[21:49] but run it for longer iterations, versus throwing focus for lesser iterations.
[21:53] I think you can get the same job done by throwing Sonic.
[21:58] Larger number of iterations, but still cheaper overall.
[22:02] Also, this cost is amortized, right?
[22:04] Like one auto-browse loop that we probably ran
[22:07] is like maybe $30, $40, it's super complicated,
[22:10] $100 at most.
[22:12] So this is amortized as long as those costs
[22:15] make sense for you, to deploy this interruption
[22:18] just for it.
[22:19] But there's a lot of interesting things
[22:22] that you could do with evading the kind of loop
[22:24] that you're generating.
[22:26] Yes, I will share the slides as well.
[22:29] I can do this on the GitHub itself.
[22:35] Did you check how you thought about
[22:38] auto-research in your auto-browsers?
[22:41] I mean, the process was fairly straightforward.
[22:44] Took the GitHub repo that Karpathy put out,
[22:48] And then there's all this context about my customers
[22:52] that I have, where I was like, hey, these customers face
[22:55] these kinds of reliability problems.
[22:58] The way I solve it for them is I go into their office,
[23:01] I sit with them, very forward deployed,
[23:04] and I try to sort of just brute force
[23:06] and reverse engineer this.
[23:08] This is what I do.
[23:09] So I am the HR agent.
[23:11] Can you automate me out of the process
[23:14] and create a loop borrowing from our party
[23:17] and build the same thing.
[23:19] And of course, there's a lot of iterations on top of that.
[23:22] There's a lot of engineering as well to simplify this.
[23:27] But yes, that was the process of doing this.
[23:33] Can you use this in proxy?
[23:34] Can you use this on the website?
[23:36] Yes.
[23:37] Again, this goes back to the environment
[23:39] that you designed.
[23:40] Browse-based, the infrastructure that all of this
[23:42] is running off, gives you the ability
[23:44] to log into websites.
[23:46] say, reuse those cookies in future runs
[23:50] so you don't have to log in every time.
[23:53] Makes it super easy for you to replicate real-world workflows.
[23:58] And yes, you can use proxies as well
[24:00] if you have particular IP addresses,
[24:03] virtual IP addresses, you can bring those in as well.
[24:07] A lot of success is definitely
[24:09] in the infrastructure and environment,
[24:12] especially in these adversarial scenarios
[24:15] like CAPTCHAs and .
[24:17] So making the infrastructure as good as possible
[24:20] is definitely a value.
[24:28] Any ask for something that you might want to run live?
[24:33] Yes.
[24:34] One question.
[24:34] You're having the future analyze the whole trajectory
[24:38] of the work once more on how exactly
[24:41] is this going to be designed?
[24:42] Actually, I wanted to show the code as well.
[24:46] So if you look at the GitHub, you'll
[24:48] be able to find this file.
[24:52] Essentially, it lists out the entire group,
[24:55] what's happening.
[24:56] But to answer that question, the teacher and the doer
[25:01] are working one after the other for every loop.
[25:08] So the teacher is finding learnings in every iteration.
[25:12] Maybe if I show the demo over here,
[25:17] let's go to the one we just did.
[25:18] Iteration one had these learnings,
[25:21] and then iteration two had some other learnings.
[25:24] You should include the explicit ISO date
[25:27] in this particular format.
[25:29] Iteration three would have some other learnings.
[25:31] The date reservation still opens the bad pages,
[25:34] wasting three goals.
[25:35] reading today's date, or having the computer compute today,
[25:40] so it's figuring out something about the date line.
[25:42] So in every iteration, the teacher is learning something new
[25:46] and putting this back into strategy.mp.
[25:49] Maybe I'll make this real by looking at the traces
[25:51] for all of these runs.
[25:55] So, over here, these are all my runs.
[26:01] So for example, this is the open table reservation.
[26:05] example. And this was the strategy that the teachers sort of attended to every time. So,
[26:12] step zero, you do this, so on and so forth. This was the task. This was the prompt that
[26:18] I gave, find new reservations for a mixed restaurant. And these were the kind of traces
[26:23] that it was sort of learning from. It would take screenshots, it would take these sort
[26:28] of traces, at every step it's doing browse, open, this is what the password is, that
[26:34] that turn number two, now snapshot, snapshot essentially
[26:37] takes the accessibility tree, and this is the snapshot.
[26:40] So it's reading this entire thing,
[26:43] and every step thinking of my workman, right?
[26:46] And workman from, yeah, hey, this is like machine code.
[26:50] I won't show this entire thing.
[26:52] But yeah, this is the summary that it also writes,
[26:55] and a page ratio.
[26:57] So yeah, there's a lot of engineering tweets
[27:00] that you can do to suit this to your domain as well.
[27:04] And the easiest way to read this is
[27:11] we put it on your one in all the browsers
[27:16] and you can do something with this.
[27:22] Is this part of single apps?
[27:26] Because generally you want to get
[27:29] examples of lots of apps in a very good way.
[27:33] So if you are not implying in the data,
[27:36] you're implying for a company with no tasks,
[27:39] you're actually trying to implying for a whole set
[27:42] of tasks and then panning it .
[27:48] Such a good question.
[27:49] I think that goes back to how do you increase the reliability
[27:55] of your agents?
[27:58] Reliability is an engineering problem.
[28:02] you can design your harness to go for one skill for each task,
[28:07] or you can take one skill for every task that you will ever
[28:10] see.
[28:11] I think it entirely depends how you do the artist engineering.
[28:16] It entirely depends on the use case that you have.
[28:19] And we run evals with all these different strategies
[28:22] and see which one works for you.
[28:24] For us, this was ..
[28:26] Sometimes that doesn't work.
[28:27] .
[28:46] Yeah, and this is where, again, the harness comes into picture.
[28:51] If the harness has the intelligence to bring in skills
[28:55] from OpenTable and from Resi and Google reservations.
[29:01] Maybe it can bring all of those in,
[29:03] figure out what is the best way to book me a date night.
[29:07] That's your solution, right?
[29:08] Like the hardest should be able to figure out
[29:11] which tools to use to get the job done.
[29:14] That's like how I would go about it.
[29:18] Figure out what are the most common use cases
[29:20] that your customers have.
[29:22] for those use cases, what's the best scale files, prompts, tools, maybe you want to do like specific tools for specific use cases, right?
[29:30] Maybe you want to generate tools for all use cases.
[29:33] Like that's the same argument here, is like use one scale for each, or one scale for all.
[29:39] And, you have to cross all these strategies and then let the harness figure it out.
[29:43] All the questions are about the flow of the chat box.
[29:46] Yes.
[29:47] How can you return this?
[29:48] I mean it's a very similar concept as this.
[29:52] So DSBY.
[29:55] I think both guys were onto something really cool.
[29:58] They were around three, four years ago
[30:01] when they started building DSBY and I think we have been doing a lot of research along these lines as well actually beneath the paper about how to build the right sort of verifiers for your agents
[30:18] I think running evals is straightforward until you start questioning, okay, how should I eval my eval?
[30:25] Like, do I need to put all these humans to verify all these runs, or is there a good verifier that I can build here, and all that uses the learnings from these papers?
[30:38] We can share all that at the GitHub.
[30:45] Also seeing if there's any questions here.
[30:48] Where are all these skills stored, retrieved at scale?
[30:53] Right now for this repo, all of these get stored in my .jot over here.
[30:59] So each of these is a scale file.
[31:01] This was my recipe .
[31:03] I wanted to cook some dinner yesterday, so I was like, hey, make me some recipes.
[31:09] So all of these are currently in my local skills folder.
[31:15] But if you want to ship this introduction, of course,
[31:20] you can take this into your agent loop.
[31:24] Or if you want to, I think, for browser message,
[31:27] the publicly available skills that we have,
[31:30] adding new to a set of storage to store all these skills
[31:33] and make them on the move.
[31:36] Perhaps.
[31:39] Websites change frequently.
[31:40] What's a strategy for monitoring that and keeping
[31:43] website skill updated? This is such a great question. And this is what I was alluding to earlier.
[31:50] How do you keep these skills updated because the website's going to change?
[31:55] The current working theory that we have right now is you don't want to waste tokens running
[32:03] auto research every day. You want to probably trigger, or if it's failing, at any particular point,
[32:10] in corruption. So we build these loops or systems where as soon as we run into any corruption
[32:18] failure, we run an auto research loop to see what went wrong, to heal it, create a code request,
[32:25] that goes directly to a human engineer and they fix it. Our team is getting us updated.
[32:31] So yes, there is that notion of corruption failure when this might happen, but it's a trade-off. You
[32:38] You can't run an auto-research, or you can't run a sample run
[32:43] every two hours, every three hours,
[32:44] to see if the skill is working perfectly.
[32:48] There's different ways of having the Cron jobs
[32:53] check for the accuracy of these skills.
[32:56] This is actually one thing that I'm actively working on
[32:58] with the customer right now to implement.
[33:00] And there's all these questions, right?
[33:02] People don't want 100% accuracy, people
[33:04] I'm from like the extra group of .
[33:07] That's the .
[33:10] What you need is criteria here in the example.
[33:13] separate from the ..
[33:14] It seems to do some .
[33:17] What is the criteria being used?
[33:21] So again, this is the design of the auto research group.
[33:25] There's one way of telling your auto research that, hey,
[33:28] I want to focus on just success.
[33:31] As soon as you get me success, I'm fine.
[33:33] just give that to me. That's typically not what everybody wants to do. People want to
[33:39] minimize on latency, because maybe this is a real-time run where you're focused on how
[33:45] quickly can you get the job done. So if that is the optimizing metric, you focus on getting
[33:51] it as fast as possible. But I've seen sometimes these research groups are so smart, they realize
[33:56] that browsers are not needed at all, and they just reverse engineer the API, and they file
[34:02] API and that's the fastest that you'll ever get. So sometimes I've seen situations where
[34:08] it finds a solution that works in 520 seconds. Sometimes there's a number of talents. You
[34:17] want to minimize your context too and you want to minimize the number of talents it
[34:22] takes to complete the task. In my instance, I think what I have done is it's your decision
[34:29] to pass after merge whenever you want to pause it.
[34:33] I'm not really concerned about the cost.
[34:36] I care most about reliability.
[34:39] So keep doing it as long as you feel it's relevant
[34:41] and then the teacher, agent's job to call it a day
[34:46] may not be so important.
[34:48] But yeah, you can try all different strategies.
[34:53] If website supports Velent CT, will this use it?
[34:56] Valency is so cool.
[34:58] It's essentially this concept.
[34:59] I don't know if everybody knows this,
[35:01] but it's this concept of making your website programmable.
[35:07] It's come out in this new Google Chrome release recently,
[35:10] where you tell your website that if anybody
[35:14] wants to book a reservation, they can do XYZ on the website.
[35:19] It's kind of like an API, but it's on the browser.
[35:23] Right now, I don't think our research group supports this, but I don't think it would be too hard to do that.
[35:33] In fact, we recently shipped support for WebMCP with our SDKs that we launched.
[35:38] We also made some tools for website owners to ship WebMCPs at scale.
[35:44] But yeah, this is an interesting one. We've not really seen a lot of adoption with WebMCP as yet.
[35:52] Ground proof or pass?
[35:54] That's interesting.
[35:55] I think as long as the job was done, as long as, for example,
[35:59] in Google Flights, if it found the cheapest flights,
[36:04] in OpenTable, it found a reservation.
[36:06] So it evaluates itself.
[36:09] It's typically a binary.
[36:12] And yeah.
[36:14] I fully embrace the virtual lesson.
[36:17] I try not to put many guardrails in these valuations.
[36:24] Have you considered the verifier as a service
[36:26] for browsing tasks, including something that allows us
[36:29] to mock certain site X-Lite purchases?
[36:33] I might have to ask a follow up on that.
[36:39] What do you mean by verifier as a service for a VCH?
[36:42] I'm mostly at the beginning.
[37:12] So do you mean that, yeah, if I understand correctly, you have different environments
[37:25] that you can use for R and trading, and you want more what happens if I am replicating
[37:31] Amazon, if I click on purchase, what happens afterwards?
[37:34] No, because we try to rely more on real world websites.
[37:45] Browser-based, we have the privilege of being able to access most of the web with our access to the current websites and capture servers, etc.
[37:56] So we try to mimic the real world as much as possible.
[38:00] as possible, but we've been seeing a lot of these higher
[38:02] environments where people are making websites to trade
[38:06] and build browser agents that are really good at like
[38:09] browsing Salesforce, really good at like browsing SAP.
[38:14] We try to do that on real world.
[38:19] Are edge captures easy for the skill to move past
[38:22] as it opens in Dero?
[38:24] What is the point of edge captures for website owners?
[38:27] Edge capture, if I'm understanding this,
[38:29] is like putting it on a capture, kind of like Google reCAPTCHA.
[38:36] Yeah, I will probably talk about this separately.
[38:40] I don't think we can talk about what captures we can solve
[38:43] or not.
[38:44] But it's not a totally intensive job, per se,
[38:47] because it's a thing that's done as an infrastructure .
[38:50] That's right.
[38:53] We don't really need to use an AI to solve a capture.
[38:57] It's all had the chrome binary layer and it's very out of the box.
[39:04] How does the teacher evaluate the newer and better skin-mounted scratch-away techniques?
[39:08] So, it evaluates the newer by essentially reading these traces.
[39:14] For every iteration, there is this folder that is created.
[39:19] There are these, these are the ones.
[39:22] it has a broad agent SDK rule, and it essentially figures out what the learnings from that are.
[39:30] Actually, I think I have a slide that talks about this.
[39:38] This is kind of like the prompt for this, where it says that you're a broad graduation agent,
[39:44] you can use these tools, and the strategy or ending gets injected at every iteration.
[39:51] And this is how the teacher evaluates the teacher's job.
[39:59] So yeah, it reads the traces, has the system prompt,
[40:02] it has the previous strategy, and it
[40:04] comes up with the next strategy.
