---
tipo: transcricao
fonte: aula-externa
tema: produto
evento: ai-experience
autor: "Niels Rogge"
organizacao: "Hugging Face (ML Engineer)"
sessao: "How I automate my own job at Hugging Face using agents"
evento-nome: "AI Engineer World's Fair"
pode-ir-comunidade: true
anonimizado: true
criado: 2026-07-01
modelo: whisper-large-v3
idioma: English
duracao-seg: 1018
status: bruto-revisar
autorizado-usar: false
---
# How I automate my own job at Hugging Face using agents — Niels Rogge (Hugging Face (ML Engineer)) [bruto]

[00:00] ...the presuppositions of the dataset on the interface.
[00:03] And then I also opened PR's full requests on the regular face to add dataset charts or model charts to improve the documentation of those chart charts.
[00:12] But there's a problem. It's not really scalable for me to open all these GitHub issues with full requests because every single day there are hundreds of research papers coming out on the market.
[00:23] now with AI Boom.
[00:25] And yeah, also NERCS, for example,
[00:27] major AI companies, they are seeing a massive amount
[00:29] of papers.
[00:31] So can we automate this?
[00:33] Can we scale the pollution science with AI agents?
[00:36] So that's the second part of my thought.
[00:39] How can we scale this massive amount of research?
[00:45] So the idea is pretty simple.
[00:48] We should have AI agents which can help
[00:50] me do this outreach to all these researchers which are these loans or data sets as part
[00:56] of their research work. And I'm doing the outreach in an automated way. So this is the
[01:01] typical workflow that I was following. So basically whenever I saw a research paper,
[01:05] I first tried to find the GitHub URL of that paper, if it's available. Then I tried to
[01:12] write the reading of that GitHub file. And then I basically checked if there's anything
[01:16] new, interesting to be shared on the beginning phase.
[01:19] It could be that it's on the beginning phase already, in that case I check whether the
[01:23] model cards or data set cards are already properly present, whether the data data packs
[01:28] for example are there.
[01:29] If not, then I might open a pull request.
[01:33] Otherwise, if the artifacts are not yet on the beginning phase, I would get an issue.
[01:37] And then finally I also follow up on the author.
[01:39] So that's kind of the workflow that I have to automate with agents.
[01:43] And there are several ways to solve this. You could go with a workflow. These pictures are by the way taken from the blog post, Building Effective Agents by Entropic, which is a really great web page.
[01:56] So on the left side you see a workflow which is more deterministic. You basically use a lot of APIs and then stacks on a predefined file for 5-man, which is more predictable, it's more deterministic, you have more control over it.
[02:09] of course it's less flexible.
[02:12] And then on the other hand,
[02:13] you could have fully-fledged autonomous agents,
[02:16] which is an element in a loop that allows tools
[02:19] until it's done, which is more flexible,
[02:21] but also less predictable.
[02:24] At the time, yeah, of course,
[02:26] it doesn't have to be a binary story.
[02:28] You can have a workflow on one hand,
[02:29] you can have a fully-autonomous agent on the other hand,
[02:31] but you could of course also basically match
[02:33] these type of things for your use case.
[02:37] In my case, I went for a pretty deterministic workflow.
[02:42] Why?
[02:42] Because at the time that I was building this,
[02:44] this was in 2024, was at the time that Anthropic
[02:47] wrote their blog post, Building Active Agents,
[02:50] and there they actually said,
[02:51] try to avoid building agents if you really don't have to.
[02:55] Start simple, start with a single LLM API,
[02:59] avoid frameworks, actually I think those were great tips.
[03:03] So at the time I started building a workflow
[03:05] which basically replicated the workflow that I was doing
[03:07] when I was doing this outreach.
[03:10] So yeah, this is the whole pipeline.
[03:12] This is great, using the Scally Draw,
[03:13] the NCP server, and Persept.
[03:15] Pretty nice to create a visualization of your code.
[03:18] I'm not gonna go into the details,
[03:19] but basically it just replicates the workflow
[03:22] that I was doing when doing the outreach.
[03:25] And I use LLM APIs in each of the steps
[03:29] without any framework, without any agent framework.
[03:31] So it made it quite deterministic,
[03:34] and I have a lot of control over how this goes.
[03:39] In terms of the deployment of this workflow,
[03:41] it's a simple Chrome job.
[03:43] Chrome is just something that runs regularly.
[03:45] In my case, I run it once every night.
[03:48] When I'm sleeping, there's this agent,
[03:50] this agent is just a Chrome job,
[03:52] it's a JavaScript with an LLA tag,
[03:54] which is gonna read Chrome in the minutes of the parka papers
[03:58] and then it might open different issues,
[04:00] or it might open two requests on the same day.
[04:03] I'm using for this.
[04:05] I saw this very nice post, free Chrome jobs for the
[04:08] interactions.
[04:09] And actually it probably best to be pointing to Chrome jobs Because GitHub has a pretty generous tier If you want to get started with putting simple Chrome jobs on there
[04:19] it makes it really easy for me and UI to manage all these Chrome jobs.
[04:24] So yeah, I really like that I have a converse of GitHub issues being real.
[04:31] For the tracing part, I'm using Macfuse.
[04:35] Macfuse also has a boot here.
[04:38] Action is pretty great. I use it mostly for the tracing part, the observability part, just to see what is the LLM doing, what are the inputs, what are the outputs, what are the prompts, how much does it cost, latency, and so on.
[04:53] So yeah, I definitely recommend it.
[04:57] But yeah, as my agents are opening so many GitHub issues every night, I then end up with a massive amount of in-read GitHub notifications because people reply to those GitHub issues.
[05:09] And that's a lot of work to then reply to all of those issues. It's kind of like going through your mailbox.
[05:16] So in Devonder, could we also automate the follow-up to those GitHub issues?
[05:23] because initially I was still, the GitHub issue creation was done by an agent, but I was still the one involved in doing the follow-up.
[05:30] Now a few months ago I also automated the follow-up to those GitHub issues.
[05:35] Again, I would think how should you solve this, should you go for a more deterministic workflow, or can you go for fully autonomous agents,
[05:43] an element in the loop which runs with some tools and skills.
[05:47] Well, here I went for kind of a clear-fulness agent, so it's kind of flexible, it's a bit less predictable, but it works quite well.
[05:56] I went for this because in November of last year at AI Engineering in New York, there was a print and edit workshop by Entropic on the cloud agents as they did.
[06:07] And there they were actually saying that agents might be better than workflows, so they were kind of contradicting themselves.
[06:14] They also said that MOLs have become so good that you might actually now start to work with fully autonomous patients for their workflow.
[06:21] So this is why I went with this approach and I actually am using the cloud patient-sophisticated for this news piece.
[06:28] There was also a pretty nice talk by Cursor, also a AI engineer, this was in the European version in London a few months ago.
[06:37] There they talk about how they replaced 12,000 lines of custom codes,
[06:41] a pretty sophisticated workflow, with a very simple 299 code scale.
[06:46] Actually, it's pretty simple for me, like I can replace a lot of custom codes,
[06:51] thousands of lines of code, with nowadays just a simple agent with maybe a CLI as a tool and a scale, and that's it.
[07:01] Because the models have become so good.
[07:04] So in terms of the architecture, this is what it looks like.
[07:09] So it's actually just the cloud agency SDK, which is, I would say, a pretty good Python SDK for building an agent.
[07:16] Initially I was using the cloud models, and then I, since actually this week, I'm using the GLM 5.2 model,
[07:23] I link-base entrance providers, so I link-base the software service which basically wraps
[07:29] all the service providers like the weather, not AI, fireworks, through-brush and so on.
[07:34] So you can use a lot of open nodes in a unified way.
[07:38] It's automatic compatible, or it's automatic compatible, and then I deploy this on Moodle.
[07:45] Moodle is present here today.
[07:48] And it's mainly using Bash as a tool to basically do
[07:55] because it's using the
[07:57] quite a bit.
[07:58] So I combined it with the ,, which is actually
[08:01] all it needs.
[08:02] And then it might comment something
[08:05] as a full .
[08:07] And it also actually does the posting
[08:10] because eventually I just want to see the final results
[08:12] from our section of .
[08:15] So yeah, given that there's also a lot of hype on GLM 5.2 recently, for example, Bluestar saw great performance on their personal bench.
[08:23] Post bench is another one where it actually reads focus 4 and it cheaper So yeah there no reason not to use GLM Typekit 2 especially given that I work at Fagnotator
[08:34] For the deployment, as I said before, I used Model.
[08:38] It's pretty great if you want to deploy agents.
[08:42] My case, I'm using the batch processing feature.
[08:45] So they allow you to set up a massive amount of containers all in parallel.
[08:49] single container is basically one agent group that's processing one data issue.
[08:54] Super easy to use, I have to say, and the startups are also fairly fast.
[09:00] So I'd highly recommend if you're running agents that are, for example, running in the background, running on the network.
[09:07] And that's the way I can book it.
[09:41] the loop that people are talking about.
[09:43] And then finally it's when I post all the results
[09:46] on our Slack channel.
[09:49] So yeah, this is actually what it just posts.
[09:52] So what it does is it basically just posts a huge amount
[09:54] of paper case papers, which are research papers
[09:58] which people can make available in the paper case
[10:01] because every time someone mentions it in mobile cart
[10:04] or the other side of the cart, we can exit from that.
[10:06] And then it just posts all the artifacts
[10:08] that people have been building based on the outreach
[10:10] we do via GitHub. So yeah, I do this still in a manual form, so I just invoke this here
[10:17] and then after a few minutes these messages appear on our Slack channel.
[10:24] Yeah, I just included some fun results because to be honest it's quite fun to see people
[10:29] interacting with agents. To be honest I don't think it's close that it's an agent, why?
[10:36] I think if people know it's involved,
[10:38] then they might be like close the issue.
[10:40] And to me also, they post exactly the same stuff
[10:43] as I was doing before, mainly.
[10:45] So I don't actually see any reason to do that.
[10:49] So and then we see replies like this.
[10:52] Hi Niels, thanks a lot for your suggestion.
[10:54] I was looking for your guidance.
[10:56] I actually also, so often times people will use an agent
[10:59] to reply to my agents, so it's kind of the depth
[11:01] of the net nowadays.
[11:03] People make all their artifacts available on WickedBase,
[11:06] and out of the thousands of issues that are being created
[11:09] on WickedBase, actually so far,
[11:11] we had two negative comments.
[11:14] One guy saying, please close this slob,
[11:16] so he closed the issue, and another one,
[11:19] but most of the people, they just said,
[11:20] yeah, actually it makes perfect sense
[11:22] to make my rates on my website available on WickedBase.
[11:25] Why didn't I think of this?
[11:27] So it's kind of a win-win, I would say.
[11:29] I also post fun results on our Slack channel.
[11:35] Like for example, one time,
[11:36] someone, a researcher from Apple sent me a DM.
[11:39] Like, I saw you reached out to me.
[11:41] Yeah, technically it's my agent,
[11:42] just posting an issue regarding publishing
[11:46] a new couple of dark packs of an Apple paper
[11:49] on the main page.
[11:49] Or for example, it reaches out to Google DeepMinds
[11:52] to publish mathematics data sets.
[11:57] So all the time, I receive emails
[11:59] one on the right side, where they want to publish 400 gigabytes data sets on the interface,
[12:05] but this was also my agent just opening data issues.
[12:10] This is another fun result, so Apple OCRs, like a Chinese company, they migrated all
[12:16] their OCR models to a game case based on outreach by agents that created issues for me.
[12:23] So yeah, it's very nice.
[12:26] Another result is when it completes the default template of model cards on the Gamecase.
[12:34] So Meg Mitchell who also works at the Gamecase she has a paper called model cards for model reporting making sure that anyone documents their models in a proper way So we do provide this template which you can see on the left side in the git div and then the agent is just completing that template based on the content that it finds
[12:54] based on that paper, like the github.wp and the PDF itself and so on.
[13:01] Yeah, it's also quite funny to see, for example in this case, that it included me in the model
[13:07] and the mobile cart, it says, mobile cart authors,
[13:10] part of the community science team.
[13:12] I never prompted it this way, but it's very fun to see.
[13:15] Our people are saying thank you for helping me
[13:17] fix my mistakes, so those are all owned by the agents.
[13:24] I think the most popular issue that was created
[13:26] was this paper, Tiny Reverse Set Models,
[13:30] which you might have seen, was quite trending,
[13:33] both on TechnoCase and also on Twitter.
[13:35] So more than 60 people actually voted that issue so that the poll was released in the
[13:41] case.
[13:42] So this is again, I think, the one-way, so the vote went for the researcher, making their
[13:46] research more discoverable in the case, but it's also better for people then who want
[13:51] to build on top of that research and want to use it.
[13:54] So yeah, I have hundreds of these issues, I think I can show the next results, where
[14:01] people interact with the data.
[14:04] You might ask, I have a Void slot because you might think,
[14:08] OK, I'm agent spanning the whole internet with your github issues.
[14:12] Like, should you even do this?
[14:14] Again, we're already talking about the win-win.
[14:16] But a block host that I highly recommend,
[14:19] someone on Void that your agent is just hosting a slot,
[14:22] is the 11EvalsSKQ by Hamels.
[14:28] I'd say he's like the main expert when it comes to the .
[14:32] He also has a paid course, but he also publishes a course for free on my YouTube in-depth course.
[14:38] So I highly recommend to go to it if you want to learn more about how to evaluate your PPC.
[14:44] So my conclusion would be that open laws are actually getting great, especially now with
[14:50] GNN 5.2 here, HTTP 4 and so on. So yeah, we are able to now replace closed-source laws
[14:57] all of my other ones. For my use case, I would say angels are actually better than workflows.
[15:03] They only need single CLI, which is a legacy CLI. They need a single CL, and a sandbox,
[15:09] and that's all they need to do their work. And finally, don't forget about evolution.
[15:17] Finally, I can also discuss some other reports that I review as part of the community strategy
[15:23] very shortly. So I have a Twitter account that I created, it's called Daily Papers,
[15:30] and it actually uses the exact same workflow as my agents behind the scenes to post interesting
[15:34] research papers on text. It recently crossed 90,000 followers without the involvement of
[15:40] me, I just reply this, and it posts interesting research papers and artifacts from Wagonface
[15:46] every four hours or every time someone releases something cool on the game page.
[15:52] And I have Gemini determining the best visual to include in the tweet.
[16:00] For example, this recent tweet where I tweeted out that NVIDIA released an optimized version of GL in 5.2
[16:06] with more than 2,000 likes, which is quite cool to see.
[16:10] And the final effort that I'm working on right now is a revival of Papers with Code, which is a website that once existed, was acquired by Meika, and then sadly died.
[16:22] So I'm trying to revive it and making research and state of the art easier accessible. For now it is Papers with Code.co.
[16:32] So yeah, you can find match marks over there, for example, for OCR models, all OCR matches
[16:39] like you mentioned. But I'm also making it an educational resource so that people can
[16:44] learn about technical terms like MIT training on policy distillation and so on.
[16:50] So yeah, that was it for my talk. I hope you learned something. Thanks a lot for your attention.
