---
tipo: transcricao
fonte: aula-externa
tema: produto
evento: ai-experience
pode-ir-comunidade: true
anonimizado: true
criado: 2026-06-30
modelo: whisper-large-v3
idioma: English
duracao-seg: 3246
status: bruto-revisar
autorizado-usar: false
---
# AI Experience — 2026-06-30 (transcrição bruta)

> Transcrição automática (whisper-large-v3) de "Nova Gravação 6". Idioma detectado: English.
> PII NÃO revisada — material bruto. Anonimizar/destilar antes de qualquer uso na comunidade.

[00:00] We're going to play some music, I guess.
[00:05] There's a little play button on this thing.
[00:07] I've never seen what that does until now.
[00:10] So, very replaceable to just turn a ticket into an implementation.
[00:15] So, a product engineer is able to recognize that you can still fail after finishing the implementation
[00:22] if it doesn't produce customer value.
[00:25] That's not just your PM's job.
[00:27] Okay, and then Wayne Allen, brilliant guy, this was an awesome episode.
[00:32] He said that the product concern is building the right thing, and engineering concern seems to be building the thing right.
[00:38] However, building the right thing is downstream of building the right thing.
[00:42] I said this wrong on the podcast, so I repeated it.
[00:46] Building the thing right is downstream of building the right thing.
[00:50] So I relate to that.
[00:52] The products that I build are getting worse and worse.
[00:54] Hopefully not on the products that you built, of course.
[00:58] No, nobody in this room heard this episode last week.
[01:01] She is a director of product or a YouTube product
[01:09] at .
[01:10] She's a wonderful, wonderful person.
[01:13] But she said it's very easy to get the look and feel really
[01:18] quickly and just decide, you know what, I'm going to ship
[01:20] this.
[01:21] So she's on the main thing.
[01:23] And it's really easy to be like, oh, I can't ship this.
[01:25] But then she says, you can build something that historically feels functional,
[01:29] but it's not actually scalable, doesn't address the best cases.
[01:32] And the real key, and this is where we've come in to describe what she is,
[01:37] is to actually take ownership of that, to look at the prototype and be like,
[01:41] yeah, this is what I'm going to throw this in on her cursor or whatever,
[01:44] and re-implement this in two hours with my framing, my systems thinking, everything,
[01:51] so that I can take ownership and accountability over it.
[01:53] The reason that matters is because if you know that you're going to be paged at 2 in the morning to deal with issues,
[01:59] then you're going to take a lot of care in the system, in the playground that you create for your agents
[02:04] to make sure that they're successful in their communities.
[02:07] And Aaron Grant says you can do the wrong thing incredibly fast.
[02:10] I feel like you're making a ton of progress.
[02:12] I'm going to do the right thing.
[02:13] Yeah, so, so bad because, like, you get so far into it.
[02:18] You're like, I can't stop now.
[02:19] Some cost fallacy is not a thing.
[02:21] and yeah so how to do the right thing incredibly fast or at least directionally correct
[02:26] so
[02:31] I just want to establish things so nobody leaves the room that we are not I'm not saying now it's
[02:38] time for you to all be product managers that is not what I'm saying at all so let's talk about
[02:42] what where the line is between a product engineer and a product manager
[02:46] Okay, so your job as a product engineer is to connect the customers, understanding what
[02:53] the customer needs to the technical choices that are being made so that you don't paint
[02:58] yourself into a corner and you don't overbuild.
[03:01] So you're going to design a work flow shape, is there a building strength, failure modes
[03:06] and a small slice?
[03:07] All of these things are technical decisions that you make and you make them better by
[03:11] understanding the upstream where requests are coming in, where the ideas are coming from.
[03:18] Yeah, and we'll dive into each one of these a little bit more here in a second. So this is one
[03:24] of my favorite, the smallest life thing. I just love this. So how many of you have seen this
[03:30] before? I'm not sharing anything new, right? Okay, so you got your waterfall. Okay, well by the end
[03:35] we'll have something useful. In actual, it's like we got useful, but it's different every single
[03:39] we've got to rebuild it from scratch almost every time.
[03:42] In AI, it's like, here's the whole thing,
[03:45] and your job is to whittle it down
[03:47] to the actually useful thing
[03:50] that you're trying to accomplish here.
[03:52] What's interesting, actually,
[03:53] this image also makes me think of how Instagram started.
[03:57] Instagram was originally an app called Bourbon,
[04:00] which was basically a four-square clone,
[04:02] so they were having people check in to things.
[04:05] I think it was alcohol-related.
[04:07] I don't drink alcohol, so I don't know that world very well,
[04:09] But I think that's what it was all about.
[04:11] Oh, yeah.
[04:11] I don't know.
[04:13] But yeah, so they realized after watching user behavior
[04:19] that the only feature anybody really cared about
[04:21] was sharing photos.
[04:22] And so they just gutted everything else
[04:25] and just made it about sharing photos.
[04:26] And they had a pretty nice exit.
[04:28] So good for them.
[04:31] OK, Bob was also on the podcast just last week.
[04:34] And he had this experience as a software engineer.
[04:38] He was working making these little mini computers for a company that did like telephone lines and stuff.
[04:44] And so he'd make this software for the guy who would go up the telephone pole and fix stuff.
[04:50] And his boss said, have you ever been on the track?
[04:52] Have you ever like seen what it's like?
[04:54] He's like, no.
[04:55] Okay, well, you're getting on the track.
[04:56] You're going out.
[04:57] And he said it totally changed the way that he thinks about building software for people.
[05:01] Because that guy that they're trying to use the software, well, he's hanging off of this pole.
[05:05] and he's realizing, okay, so there's like 30 things I can think of to improve this software
[05:09] and make it easier for that guy to use this.
[05:12] So seeing your users use your software is humbling.
[05:18] So in his mind, a product engineer lives half in the technology and half in the customer's house.
[05:24] There's deeply human-sized product engineering.
[05:26] His podcast episode is coming out, I think, tomorrow or the next week.
[05:29] So if you're interested in hearing more from him, or really any of one of these episodes,
[05:34] So it's really good, you should definitely check it out.
[05:36] I had Randy Bruce on a couple weeks ago,
[05:37] and he also feels that engineering judgment
[05:40] comes from technical experience married to human issues.
[05:44] So being able to attach what the human actually means
[05:48] to that technical expertise you have,
[05:51] that's what makes a product engineer a product engineer,
[05:53] not a product manager.
[05:57] Okay, like I said, we've got a ton of these.
[05:59] I'm probably over-indexed on the number of quotes.
[06:02] But Ronan is awesome too.
[06:04] It's about launching a product,
[06:06] it's not about the cool API.
[06:07] And in fact, there are so many instances
[06:12] that I can think of where somebody would come to me
[06:14] and just talk about their solution.
[06:15] All of a sudden, like, oh wow, it does this,
[06:17] and it does that, and it does this, and it does that.
[06:19] And I'm thinking none of those things
[06:21] matter to me whatsoever.
[06:22] Like, okay, that's kind of cool,
[06:25] but I already do this one thing,
[06:26] and it's not so much better that I want to switch
[06:30] from my current workflow to that thing.
[06:31] And it's just so clear to me that these people are so excited about their solution that they've totally lost the plot of the problem that they're trying to solve for users.
[06:41] So it's really easy to fall into that as an engineer.
[06:45] And therefore, a great way for you to stand out as an engineer in your company is to be a product-minded engineer.
[06:53] So you have the technical capabilities, but you also understand what the user is ultimately trying to do and what your company is trying to do to solve the problems.
[07:01] So, a lot of the decisions that we make as engineers shape what the products end up being.
[07:09] And the reason that is so important is because changing architecture is really expensive.
[07:16] You might think, well no, Kent, it's literally just like, I don't know, a million tokens,
[07:20] and I can be from one database to another, or I can be from monorepo to microservices,
[07:27] or monolith to microservices or whatever.
[07:32] Depending on the size of your app, maybe that is the case.
[07:35] But it is really expensive on the way that it impacts
[07:39] the rest of the team and on the way it impacts the user.
[07:43] Change is expensive.
[07:45] And if you say, okay, well, it's just a couple
[07:48] of million tokens, what if I could hire you
[07:50] or I could hire somebody who made the right choice
[07:52] the first time because they understand the product.
[07:55] I've got a higher end person who can do it right the first time and cost me less.
[07:59] So it's all about the primitives. This is Reece. He works...actually he just made a startup.
[08:05] And really cool. He's saying it's all about having the right primitives that you can build online.
[08:11] It's really difficult to build a really great solution on top of those wrong primitives.
[08:16] So your engineering expertise matters. Hopefully that...you know what?
[08:21] this is going, I gotta talk about Michael.
[08:25] Who here knows Michael at WorkOS?
[08:27] This guy rocks, and WorkOS is really cool,
[08:30] but he, WorkOS is an authentication platform,
[08:34] and he was deciding, okay, so with this new platform,
[08:37] do I make it land at an on-prem thing,
[08:40] like I sell you a license,
[08:41] now you can run this authentication thing on-prem,
[08:44] or do I make it like an open source thing,
[08:47] with like a commercial arm or whatever?
[08:49] And after interviewing and talking to a lot of customers,
[08:51] he realized, oh no, if there is some sort of security problem,
[08:55] then we need to push out a fix immediately,
[08:57] and we can't wait for people to upgrade some NPM package
[09:00] for that, and so therefore, I would make it
[09:03] a hosted solution.
[09:04] And so your technical expertise and understanding,
[09:07] married to the understanding of the user
[09:10] and actual problems, is going to make a significant impact
[09:14] on the direction that you take the product.
[09:16] Oh gosh, you know what, it's been way too long since you've actually done anything, so we're going to skip over this.
[09:23] Hopefully you get the point. There is a line between product manager and product engineer, and both of them need to really understand the actual problems that the user has.
[09:34] So, one of the things that you are doing as a product engineer is building a system for your underlings to be successful in.
[09:47] Even years ago, before we had AI agents, you would have a team lead, and their job was to make sure that that system that you're working in is very efficient for you.
[09:57] So you've got good testing, you've got good architecture, it's very obvious which Lego
[10:01] blocks to put together to build out different features.
[10:04] These primitives are very important.
[10:06] We are now all team leads over however many agents you're able to run at once, and it's
[10:11] your job to make sure that that playground is a really nice playground and you don't
[10:15] make time to sit.
[10:16] Okay, I'm going to skip ahead here.
[10:20] And, gosh, I really want to get you all doing stuff here really quick, so I don't want to
[10:26] I don't want to miss anything.
[10:28] Oh, there's so many things that you miss if you don't have product understanding.
[10:35] I got to tell this story.
[10:38] Who knows Don Norman?
[10:40] Ever heard of Don Norman?
[10:41] This guy, legend.
[10:42] He's 90 years old when he comes on my podcast.
[10:44] That, first of all, is pretty wild.
[10:46] And he has so much.
[10:48] This is the guy who invented the term user experience when he was at Apple.
[10:54] like, yeah, kind of cool too.
[10:57] And just delights work as well.
[11:00] How many of you are familiar
[11:01] with the Three Mile Island incident?
[11:04] Okay, 1979 in Pennsylvania, there's a nuclear reactor,
[11:08] something terrible goes wrong,
[11:10] and like there's a coolant issue and whatever.
[11:14] It was a technical issue.
[11:16] These operators made some bad decisions
[11:18] based off of the technical problems they were experiencing.
[11:22] So they bring in Don to kind of be like, what happened?
[11:24] Why did these operators make such a terrible decision?
[11:28] And he looked at the problem totally differently.
[11:30] He said, you know what, actually, it was not their fault.
[11:33] They're smart, they're competent.
[11:35] The problem was the system.
[11:36] The system was wrong.
[11:38] User error does not exist.
[11:39] That is his assertion.
[11:41] So if you want to learn more from Don,
[11:43] Design of Everyday Things is like a canonical book.
[11:46] You absolutely should read or listen to that.
[11:48] And he also wrote Design for a Better World,
[11:50] also really great initiative there too.
[11:54] So, sorry, I had to jump, this guy is fabulous
[11:58] and really understands users.
[12:00] Okay, so before we get into talking about the specific app
[12:05] and the frameworks that we're gonna get into,
[12:07] I wanted to double check if there are any questions.
[12:10] So let me pull those up and we'll get to our example
[12:18] software here in just a second.
[12:20] We've got one question in here.
[12:22] How many features are too many for an MVP?
[12:25] That depends on like,
[12:28] tons of factors, but I would actually say
[12:30] that that is the wrong question.
[12:32] The question is, and we'll get into some of the frameworks
[12:36] here in a little bit that will kind of help answer this,
[12:38] but the question really is,
[12:39] what is the minimal thing that you can do
[12:42] to demonstrate that you solve a problem
[12:44] for your target audience?
[12:47] And in particular, if you're entering a space
[12:49] that's already overcrowded, you want to niche down as well,
[12:53] and that's hard to find.
[12:54] So we'll talk a little bit more about this,
[12:56] but since there are no other questions on here,
[12:58] does anybody have a question that they didn't put on here
[13:00] but they want to ask?
[13:02] Go ahead, you can just yell it, and I will repeat it.
[13:05] Oh, we've got a couple.
[13:06] Is there a link to my slide?
[13:07] There will be at the end.
[13:10] Right now it's local host, so I can't,
[13:12] but at the very end, there is actually a link to my slide.
[13:16] So, ha ha, you have to stay,
[13:19] while we're watching data.
[13:22] How do you evaluate software engineers
[13:24] in the hiring process of product engineering?
[13:26] Okay so this is a great question Hiring is really really tough to say within that everybody knows already
[13:40] Having really good technical expertise, as I explained, is still very important.
[13:46] I would not be doing coding challenges at all. That is, like...
[13:51] I certainly wouldn't be doing any coding challenges where I say, no, you are not allowed to use an agent to do this.
[13:59] Like, what are you hiring them to do?
[14:01] Like, how awful is it to work at your company that I can't use an AI agent?
[14:04] Goodness.
[14:05] So, no, instead, you're going to be talking about systems.
[14:08] You're going to be talking about how to, in fact, I would probably take a couple of the things that we're going to do here in a second,
[14:14] and I would just ask them, like, here's an example.
[14:17] What are the questions that you're going to ask to figure out what the core problem is?
[14:21] And then once they say, okay, yeah, we've got what the core problem is, now from there, what are the system implications from that discovery of the core problem?
[14:33] That would be how my interview for that would go.
[14:36] That's a great question.
[14:38] I lost it.
[14:39] Okay.
[14:40] When you stop talking to customers and start billing, I think that you do both constantly, always.
[14:44] You do not stop.
[14:46] It's a feedback loop that continues to go.
[14:49] So we'll get into this a little bit as we go further on in the workshop here as well.
[14:55] Not only do we want to build, but how do you use it?
[14:58] Traction is the new most.
[15:00] Okay, so I don't actually talk about this specifically.
[15:03] Distribution is definitely a typical problem.
[15:06] You just get to be able to talk about it on a YouTube channel.
[15:08] That's the answer.
[15:09] No, just kidding.
[15:11] Yeah, that actually is a really difficult one.
[15:13] I have heard that people will just spend an unreasonable amount of money on marketing and advertisement, and that seems to work for them.
[15:20] So, yeah, this is not something we're really going to talk about, and I'm not prepared to answer it.
[15:27] So, sorry to not be all that helpful about it.
[15:31] Okay.
[15:32] Oh, did I just mark one that I didn't answer?
[15:35] What did that question say?
[15:37] I think it moved on me.
[15:38] There's a bad user experience right there.
[15:40] Somebody who works at Slido can go fix that.
[15:43] Okay, I'll answer like three more questions and then we'll move on.
[15:47] Would you recommend product managers stay in product teams and product engineers?
[15:51] Oh, goodness. As far as the organization is concerned,
[15:54] often applications end up looking a lot like their org chart.
[15:59] So I would, I definitely feel personally that your product manager should be very integrated with engineering.
[16:10] That communication layer should be very tight.
[16:14] And your engineers should also not be siloed from other engineers in the organization.
[16:19] Because one important thing for a product engineer to do is not only look at their slice of the application,
[16:25] but also step back and see at least their neighbors.
[16:29] Because if you don't, then you'll end up building things that are already solved for you
[16:33] by other primitives that are within the organization.
[16:36] And so you're just rebuilding the same thing.
[16:39] So you need to at least go one neighbor out and one neighbor up and down.
[16:45] And this is actually the same with programming languages.
[16:48] Like if you're a React developer, then you need to understand how JavaScript and the browser work
[16:53] so that you can use React effectively, even though you're not necessarily using all the features
[16:58] that are included there because the framework is doing that for you.
[17:02] So it's the same sort of idea.
[17:04] Tip, highlight the questions that bring the focus.
[17:06] How do I highlight the questions?
[17:09] All right, we're doing a product lesson right now.
[17:14] That is a useful tip.
[17:15] It seems like a good idea.
[17:16] Oh, is that what that is?
[17:17] All right, there we go.
[17:18] User error.
[17:19] No, it's not.
[17:20] It doesn't exist.
[17:23] Okay, so if I highlight it, okay, that's cool.
[17:26] Should all engineers be product engineers?
[17:29] Well, in my estimation, if you're not a product engineer,
[17:32] if you don't have product sense or design sense,
[17:35] that's gonna be really easy to replace you
[17:38] by the agents, by continuing to get competent.
[17:42] I don't wanna be like alarmist or anything,
[17:45] you know, whatever, but it does seem like
[17:47] if all you're doing is listening to somebody
[17:49] telling you what to do, and then turning that
[17:51] into a code implementation, that part seems like
[17:54] it's pretty replaceable.
[17:55] If you don't understand the products,
[17:57] then the system you build will not solve
[18:00] the user's problem at all.
[18:02] Okay, I think we will come back to these questions
[18:05] as they're voted up a little bit more later.
[18:07] So after quite a while into the workshop,
[18:12] we're gonna finally talk about what the workshop
[18:14] is gonna be talking about.
[18:15] So what I want you to leave with is frameworks
[18:21] for early idea validation.
[18:23] How many of you have heard of MomTest?
[18:25] Okay, sweet, so we'll be talking about that a little bit.
[18:27] Framing user request prosperity, anybody?
[18:30] Okay, sweet.
[18:31] And prioritizing software changes, the Kano model.
[18:34] Okay, yeah, so I, one of you raised your hand
[18:37] three times. So I invite you to come up and we can talk about this. Okay, so here we go. This is the dangerous thing. What is the idea that we're going to be framing things around? And this is a risk. I've never given this talk before. So this might go really, really poorly. Hopefully not. But let's look at what we got. The top voted with fire is an app that gets people into confidence.
[19:03] Yeah, okay. I'm literally going to do that.
[19:11] What should we call it?
[19:12] What's our short, how about Lightning Lane Workshop?
[19:17] You know, all back to Disneyland, right?
[19:20] Lightning Lane, yeah.
[19:21] Lightning Lane.
[19:24] Oh, there, that's so good.
[19:25] Just get in.
[19:27] Oh, I love that.
[19:30] Just get in.
[19:31] I don't know.
[19:31] Are some of you thinking weird things?
[19:38] And six people.
[19:42] I just heard everybody laughing.
[19:43] I'm like, why are they laughing?
[19:44] Oh, okay.
[19:46] Okay, so let's talk about early idea validation for the Just Get In the Workshop app.
[19:53] How do we validate this?
[19:54] All right, throw out some questions.
[19:56] You're at a conference.
[19:57] This is the perfect place to talk about the Just Get In the Workshop app.
[20:01] So you've got all these people, you're standing in line, and you're like,
[20:04] gosh, this is so awful.
[20:06] What are the questions that you're asking people to validate that your idea is a good idea?
[20:10] Just throw them out.
[20:11] Raise your hand if you want to.
[20:12] Yeah?
[20:13] Why do we need an app for that?
[20:16] Okay, so ask them, is it a problem?
[20:19] Is this a problem?
[20:20] That's a yeah.
[20:22] How long have you been waiting?
[20:23] Yeah, okay.
[20:24] That's getting really close to a really good question.
[20:26] Other questions?
[20:28] Sorry, what?
[20:29] Why are you waiting?
[20:32] Okay, yeah, that's a good question.
[20:36] Oh, could there be a pre-registration?
[20:38] Yeah, wouldn't it be better if this was a pre-registration thing?
[20:41] Yeah.
[20:44] Oh, you've read the mom test.
[20:46] All right, all right.
[20:47] You said, when was the last time you were stuck?
[20:49] Yeah, that's okay.
[20:50] Okay, what else do we have?
[20:55] Sorry, say that again.
[20:58] Oh, what's the next time?
[20:59] We're expected to wait.
[21:00] Yeah, OK.
[21:01] Are there any open seats?
[21:02] Are there any open seats?
[21:03] Yeah, OK.
[21:04] OK, so these are some questions that you might think, OK, if they, what you're looking for,
[21:10] or what we naturally are looking for is somebody to say, oh yeah, this is a huge problem for
[21:15] me.
[21:16] I definitely want to, I would spend just untold sums of money to be able to get in the workshop
[21:22] really quickly.
[21:23] I think you had another question.
[21:25] question. Oh yeah, how's your experience been while waiting? So you're trying to get a sense for that overarching experience. Yeah, and that can be a good input into this issue. Is this a solved problem? Oh yeah, like have you heard of an app that could really expand this process up? I saw somebody holding up some nonsense, but you literally have an unbelievable
[21:55] I also carry my mom test book with me everywhere.
[21:59] Yeah, so this is the mom test.
[22:02] You don't want to ask users to evaluate your idea or diagnose the problem for you.
[22:06] This actually, this is so common and it's so hard because when you think of an idea,
[22:12] you start thinking, okay, so we will make it a mobile app, obviously, that I have to install on the phone.
[22:18] Oh, wait, no.
[22:19] Maybe, like, it's a one-time use thing.
[22:21] So we'll also make a website and then we're going to integrate with all of the different
[22:27] providers and all these different things.
[22:29] And so then you start talking with people and you say, would it be easier if it was
[22:34] already integrated with the app or maybe the conference had a link to it or maybe it was
[22:38] integrated.
[22:39] And so you're talking about the solution to your specific solution with this potential
[22:45] possible user before they even agreed that this is a problem worth solving.
[22:51] Okay, so here are a couple of the weak questions that may sound a little
[22:56] generic. Would you use this? Is this a problem in the first place? What is the
[23:01] problem? Help me to find the problem. Some better questions are, tell me about the
[23:05] last time this happened, and what did you do instead, and what did it cost me to do that?
[23:11] Now for ours, none of us, I think, would actually, I don't know,
[23:15] I'd be all paid to come here to the conference.
[23:17] So there is some amount of like, I'm waiting, I'm missing the first 20 minutes of this talk,
[23:22] but I actually paid to attend.
[23:24] Don't get mad at [pessoa].
[23:25] These things happen.
[23:27] [pessoa]'s a friend of mine.
[23:28] But yeah, like the questions of what did you do instead,
[23:34] what is your workaround, and how much did it cost you
[23:37] because a solution like this doesn't exist,
[23:39] You do not talk about the solution at this stage.
[23:42] It's so hard not to, but you don't.
[23:44] Instead, you start with, what did you do before?
[23:48] What is the past?
[23:49] You do not want to ask them future questions.
[23:51] Nobody can tell the future.
[23:53] You don't want to say, would you pay?
[23:54] How much would you pay?
[23:56] Whatever.
[23:57] Often what that turns into is somebody's like, I kind of want to get out of this conversation,
[24:02] and I'm just going to say yes to everything that they say.
[24:05] In the book, they call this complimenting.
[24:07] So you're just, you're asking, you're fishing for compliments.
[24:11] So Don Norman said, don't ask somebody what's the problem, because they'll tell you the
[24:14] symptoms.
[24:15] And often they won't actually tell you solutions as well.
[24:18] And their solutions will be just as ill-formed as your own, and maybe even more so.
[24:23] So you don't want to just ask generally, what is the problem?
[24:26] You want to ask about specific behaviors.
[24:28] So tell me about the last time this happened.
[24:31] What happened?
[24:32] Give me specifics.
[24:33] Who was involved?
[24:35] What made it annoying enough to remember?
[24:36] Now, our example is kind of funny because if you're in line, you're literally experiencing the problem right now, so it's a little visceral.
[24:44] But most of the time, you're not, like, your idea to solve somebody's problem, they're not actively experiencing that problem right at that very moment.
[24:53] So it's not necessarily going to be so much, well, tell me the last time it happened.
[24:56] Well, it's happening right now.
[24:57] Like, maybe it is, and that's a pretty good signal.
[25:00] Then you're going to be able to get some really direct answers to that.
[25:03] But often you're going to have to let them think back about like, oh, yeah, what was this so bad?
[25:09] Who was involved?
[25:09] What made it annoying enough that I can even remember?
[25:12] If they can't remember, that's a signal.
[25:14] And it's not the one that you want to be, but you want that signal.
[25:18] That's the truth.
[25:20] So you want to know what they did and do instead.
[25:22] So where do they work around?
[25:23] Oops, back up.
[25:25] How much does it cost?
[25:26] How often is this happening to them?
[25:28] How much effort are they putting into solving this problem already?
[25:33] And that is gold. That is a really strong evidence that this is a problem we're solving.
[25:41] If they're already putting a bunch of effort and paying a bunch of money to solve this problem with some workaround,
[25:46] that's a really good opportunity.
[25:48] If they are like, yeah, I don't remember the last time, I know what happened,
[25:52] I don't really remember.
[25:54] And I just kind of gave up.
[25:56] That was a pretty good signal too.
[25:58] That's a signal that they're probably not going to pay and change their workflows or whatever to get a solution.
[26:04] Now, the point here is that the software engineers, we've gotten kind of used to just sitting in our corner.
[26:13] Well, some of us.
[26:14] I'm kind of an extrovert, so I like to talk to people.
[26:17] But some of us are just like, yeah, I got into software engineering because I never asked anybody about their business.
[26:21] I'm sorry, that's not the way that software engineering ever was.
[26:29] The best software engineers were not that way.
[26:32] I mean, you could share out some pretty amazing code, don't get me wrong,
[26:35] but the software engineer who really talks to people and understands their problems
[26:38] is the one who's going to build a system that can solve those problems better.
[26:43] And one thing that Michael did, actually, in our conversation,
[26:46] He was talking to so many people,
[26:48] validating his idea before he built WorkOS.
[26:52] And he would ask them, what are they losing out by not having
[26:55] a solution to this?
[26:56] What's the cost of not doing that?
[26:58] And that worked out for him So the output is actual evidence rather than somebody just saying oh yeah that a good idea This is why it called the mom test because your mom of course she loves you
[27:09] She's going to be like, yeah, of course, this is wonderful.
[27:11] I would absolutely use it.
[27:13] And so now you have two users, yourself and your mom or dad or whatever, and that's wonderful.
[27:20] Good for you.
[27:22] So here's a fun story from Wayne.
[27:25] He was down in Australia and worked for a real estate company down there.
[27:30] And they were building a project that was kind of an experiment in this bigger organization.
[27:35] He was on the team that was building this project.
[27:38] And in the process of that, they ended up building a really high-scale thing.
[27:43] They, in fact, decided, what if every single person in Australia logged in at the exact same time?
[27:49] We need to make sure that we handle that.
[27:51] And they spent a year working on this.
[27:53] on this. It was like microservices, the whole thing. And after it was 1.2 million Australian
[28:02] dollars, which is like almost 900,000 US dollars, they ended up like no one used it. Not a single
[28:11] person. So like not only did they not have to handle every person in Australia, they
[28:15] didn't even have to handle one person in Australia. Nobody ended up using this thing. And so he
[28:21] told me that something came up for that.
[28:23] We probably could have done something in two weeks, not
[28:26] a year, and done an integration manually.
[28:28] Integration is also the most simple part of it.
[28:31] And we could have tested the market,
[28:33] but a lot of things very quickly did not
[28:34] get to the whole team's work.
[28:37] So project validation is really important.
[28:39] And again, not just for a key-up job.
[28:42] It's your job to really understand, OK, so this,
[28:46] and we're not going to talk about startups here either.
[28:48] this is a product feature that you've been asked to do.
[28:52] And if that feature request doesn't come
[28:55] with some sort of validation of why this exists,
[28:58] then you as a product engineer need to go back to the PM
[29:01] and say, I need to understand a little bit more
[29:03] about why this exists.
[29:05] For not only to validate that this is going to be worth
[29:08] engineering time, but also for some of the other questions
[29:12] that we're going to talk about here in a second.
[29:14] But part of that is understanding where this request is coming from will help you shape the system that you use to build it.
[29:23] Is this just like a one-off experiment, or is this something that's going to be core to our business?
[29:28] I'm going to make different technical tradeoffs based on that.
[29:31] Like, how much investment do I need to spend?
[29:33] And should I spend a year working on this?
[29:35] Is this like the business will go out of business if we don't have this?
[29:38] Okay, well, I'm going to spend a little bit more time and attention to detail.
[29:42] while still balancing the MVP style,
[29:47] like let's just get some validation.
[29:50] Okay.
[29:52] I'm really glad I grabbed that water.
[29:55] Yeah, this is something Michael did as well.
[29:58] Very easy.
[29:59] Yeah, gosh, this is so relatable.
[30:01] It's very easy to convince yourself
[30:02] that something is a good idea
[30:03] just sitting in your room by yourself
[30:05] hacking on it for weeks and weeks and weeks.
[30:07] So you need to show it to people.
[30:09] How many people relate to that?
[30:11] just like, yeah.
[30:13] It's fun, right?
[30:15] Like, why you gotta raid my parade?
[30:16] I'm having fun doing this thing.
[30:18] And then you go show it to somebody
[30:19] and they don't get it,
[30:20] so you don't wanna talk about it.
[30:21] You just wanna work on it yourself.
[30:23] That was a signal right there.
[30:26] If they don't get why you're so excited about it,
[30:28] then that, yeah,
[30:29] you wanna pay attention to that feeling.
[30:32] And then we need to close the loop
[30:34] with user feedback.
[30:35] This is part of shrinking things down.
[30:38] So the validation of the idea
[30:39] and the mom test questions we talked about earlier,
[30:42] that is like telling you whether it's worth
[30:45] solving the problem in the first place.
[30:49] And now we're getting into
[30:50] how do you know whether your solution
[30:51] is doing that effectively.
[30:53] And Ruben says that user feedback is how you do that.
[30:57] And also what Michael is doing and Wayne as well.
[31:00] So you try to get something,
[31:02] some prototype to those early users.
[31:05] Early adopters are like totally fine,
[31:06] especially if the
[31:09] solution that you build has a ton of
[31:11] gaping holes, then yeah, they're
[31:13] going to be like pretty
[31:14] their reaction
[31:17] to that is going to tell you
[31:19] a lot. If there are a lot of gaping holes
[31:21] but it gets them
[31:22] almost there or just gets them over
[31:25] to what they're trying to do and they're
[31:27] still excited about it, that is
[31:28] very significant. If it
[31:31] doesn't quite get them there and they kind of give up
[31:33] early or something and they're like, ah, I don't know
[31:35] I had a couple of these paper cut issues and so I stopped.
[31:39] Okay, that's a really good signal too.
[31:42] The problems that are really worth solving are the ones where people will just run through the glass cutting themselves and they're like, I made it.
[31:50] That's what you're trying to go for.
[31:52] And getting early user feedback through prototypes helps a lot with that.
[31:56] So why product engineers need the mock test?
[31:58] because that helps you translate what the PM is saying
[32:01] into the shape of the system that you build
[32:04] and select the appropriate architecture.
[32:07] Especially understanding what do users do now
[32:10] or what do our potential customers do now to solve this problem
[32:13] can help you determine the architectural shape.
[32:16] Okay, so there's a lot of opportunity here
[32:19] and there's going to be a lot of downtime
[32:21] so we need to pay attention to how we do migrations or whatever.
[32:25] Okay, and yeah.
[32:27] it's very easy to end up building the wrong abstraction without that context.
[32:31] So I'm going to pause really quick.
[32:33] We'll see what questions you all have.
[32:36] So far, the most upvoted ones are the ones I'm going to focus on.
[32:41] And back here, here we go.
[32:43] So three main things that distinguish a product engineer from a product manager.
[32:50] Do we need both?
[32:51] Ooh, three main things.
[32:54] So, yeah, I kind of talked about this a little bit,
[32:56] But I would say that the product engineer is the one that's, I'm not sure if I'm going to get up to three, but I'll just say a bunch of things.
[33:02] Product engineer is the one that is actually in the code.
[33:04] You may not necessarily be looking at the code anymore, but you are thinking about the system.
[33:09] And you're thinking about the data types that are available, the primitives that you have available.
[33:14] Oh, we do have like a cron job system, but there are some problems with that.
[33:18] And you understand what those constraints are and what the limitations of your current infrastructure are.
[33:24] you understand what the available primitives are.
[33:27] And so when a request comes in
[33:29] and you understand what's trying to be solved here,
[33:31] you can categorize that into
[33:33] whether it fits in the existing architecture
[33:34] or if you need to expand beyond that.
[33:37] And understanding that the ultimate user goal
[33:42] or the job to be done, foreshadowing,
[33:44] that is going to help you decide
[33:47] whether we should actually expand the system
[33:49] with a couple more primitives
[33:50] or if you can reuse existing ones.
[33:52] that's probably the number one thing
[33:55] that distinguishes a product engineer
[33:56] from the product manager
[33:58] is just that technical expertise
[34:00] and understanding of the system
[34:01] which a product manager
[34:03] could probably just talk to an AI
[34:05] about over and over and over again
[34:07] to like kind of ramp themselves up
[34:09] but they should actually be doing other stuff
[34:11] and so yeah
[34:13] I would say
[34:13] to answer the question
[34:16] do we need both
[34:16] this is actually interesting
[34:18] so I am
[34:19] oh sorry
[34:20] I am self-employed
[34:21] So I do not have a product manager or a product engineer or a CFO or what like I just work myself
[34:27] I am all the things and you start a start-up often
[34:30] It's just like three of you sometimes if you all three of you are technical or maybe one of you is the business
[34:35] Person whatever and as the company grows you eventually start to being out those responsibilities and you have multiple jobs
[34:41] So yeah, do we need both it highly depends on where you're at in the process of your scaling of your business
[34:48] And whether you ever want to get there
[34:50] So I think that now you can actually build a much bigger business without splitting out into a much bigger organization than you used to.
[35:01] Great question.
[35:03] Okay, how small do you think teams...
[35:04] Oh, literally just said that.
[35:06] Pretty small.
[35:08] I don't know how I can give you a more specific answer to that.
[35:12] Okay, how do people get promoted from junior to senior in the age of AI?
[35:15] Well, I'm not sure how to answer this question.
[35:22] I think juniors and seniors are both,
[35:26] we're all ultimately trying to do the same thing.
[35:31] Even all the way back before AI,
[35:33] the junior was just trying to emulate the senior
[35:37] as much as they could,
[35:38] and so they suddenly over time become a senior engineer.
[35:42] I think that nothing about that has changed,
[35:45] As far as actually getting promoted,
[35:47] that's just going to be a conversation with your person.
[35:50] I should actually stop really quick
[35:52] because I'm just noticing people walking out
[35:54] and my timer went to zero.
[35:55] This session is a two-hour session.
[35:57] It's just back-to-back,
[35:58] and I'm planning on just going straight through.
[36:01] But if there are other sessions you wanted to see,
[36:02] you're welcome to stand up and leave.
[36:05] I will just take a mental image of you
[36:06] and frown at you in the hallway later.
[36:09] Just kidding. I won't do that.
[36:10] You're welcome to take off
[36:12] if there was another session you wanted to go to.
[36:13] because there are so many good ones.
[36:18] Okay, so as some of you are heading out,
[36:23] actually, let's make this less awkward.
[36:26] I don't want anybody to feel awkward.
[36:27] Let's move again.
[36:28] Everybody stand up really quick.
[36:30] I know you're all like,
[36:31] oh, Ken, we just did this like 20 minutes ago.
[36:34] Yeah, you still got to move.
[36:36] We're not going to do the whole air squat thing,
[36:40] but you can just stretch a little bit.
[36:41] Make it less awkward for the people who want to leave.
[36:43] It's okay. We don't want to feel bad.
[36:46] Okay, yep, you can sketch things, whatever you want to do.
[36:48] Just don't hurt yourself.
[36:50] And then go ahead and sit.
[36:56] Okay.
[36:58] So we've got, I think I've got 50 minutes, 5-0.
[37:03] So that's what your end-for-election decided to say.
[37:07] So now we've got the just-get-in-the-workshop implemented,
[37:10] and we're rapidly adding features based on user requests.
[37:13] So we've moved our business life cycle.
[37:16] We're in this phase now.
[37:18] And a request comes in, example request, which we'll fill in.
[37:22] Yeah?
[37:24] Hold on.
[37:25] Hold on.
[37:26] We've got a queue.
[37:28] Oh, so like a way to know how long the queue is.
[37:32] OK, yeah.
[37:33] Can you scan the queue?
[37:37] Oh, OK.
[37:38] A little bit like the Disney Fast Pass thing then.
[37:40] Yeah, like a remote waitress.
[37:42] Yeah, OK.
[37:43] Oh, yeah.
[37:46] To know how much CO2 you're going to be breathing when you get in there.
[37:50] Yeah, that's right.
[37:54] Oh, okay.
[37:57] So that would really speed up the process of getting in the workshop.
[38:00] Okay, facial recognition.
[38:02] I think everybody good with that one?
[38:04] Okay.
[38:06] Facial recognition.
[38:09] I think we all get that.
[38:11] All right.
[38:11] So let's first start with what Jack Ryan says here to dig past the requested button or whatever it is that they're requesting.
[38:22] So ultimately, this is just you keep asking why.
[38:26] What does it matter?
[38:27] Why does it matter?
[38:27] So why do we care that there's facial recognition?
[38:30] Well, what does that mean in the context of our app?
[38:35] It's slow.
[38:36] It's slow.
[38:37] So the problem that we're thinking about is it's slow.
[38:42] Okay, what else?
[38:44] Is that the main thing, or is there anything else?
[38:46] Maybe there are other side features to this, too.
[38:50] It will take your picture and post it to social media.
[38:53] I don't know.
[38:53] That could be awful.
[38:55] Yeah?
[38:56] What's the problem with the line, but how the structure of the schedule?
[39:02] Oh, the schedule could be the problem.
[39:03] The fact that Tejas was speaking across the hall from me, that really bugs me.
[39:08] Because I like Tejas a lot.
[39:11] Any other, like, yeah?
[39:13] The problem is trying to get into the room, right?
[39:15] Like trying to register?
[39:17] Yeah.
[39:17] The problem is identifying the user.
[39:19] We don't necessarily need their face.
[39:20] It could be your communication on their phone.
[39:22] It could be any other number of things.
[39:24] We just need to identify that user.
[39:26] And then ask them to go to the door and give them a hint.
[39:28] Yeah, yep, that's true.
[39:30] The core is just getting people into the room and knowing who came in, right?
[39:36] Yeah.
[39:38] And why is that important?
[39:40] Let's go one level deeper.
[39:43] Yeah.
[39:48] Oh, good question.
[39:49] So the question is, in this role-playing that we're doing here, who are we?
[39:52] We are the product engineer.
[39:54] And so we're talking with the user who's making the request.
[39:58] or maybe the PM is doing this
[40:00] and now we're talking to the PM
[40:01] and asking them these questions.
[40:03] But yeah, so you have a follow-up?
[40:09] Oh, yeah.
[40:11] Yeah, so the question is,
[40:12] what's the motivation?
[40:13] Like, why do I care
[40:14] that we're solving these problems?
[40:16] The reason that you care
[40:17] is because the app that you're building
[40:19] is what pays your paycheck.
[40:20] Like, if we're talking about capitalistic reasons,
[40:24] but maybe you have some sort of
[40:26] innate thing inside of you
[40:27] that you just hate the idea of somebody missing the first 20 minutes of a workshop And so that is motivating Why do you have to that I advise not to have a virtual queue
[40:40] or like, you know, another response in that room.
[40:44] Yeah, yeah.
[40:44] Why is there not a, that kind of goes back to this idea too.
[40:47] Why is there a virtual queue in the first place?
[40:49] That actually, that's one of the things
[40:52] that we as software engineers need
[40:54] to ask ourselves frequently.
[40:55] It's like, OK, I'm going to go in here
[40:57] and I'm going to optimize the heck out of this thing.
[40:59] It's going to be amazing.
[41:00] When we really should step back and think, why does this exist in the first place?
[41:04] Oh, it's solving this problem.
[41:06] Well, why does that problem?
[41:07] Oh, okay, so that's why this matters.
[41:10] If we had known at the time that we created this solution that it would cost this much because this other offshooting problem,
[41:17] then we never would have gone this direction anyway.
[41:19] We would have gone a different direction.
[41:20] I call that the problem tree.
[41:21] You've got a problem, and then you solve that with this, and then that has a bunch of problems off of those.
[41:26] and each one of those span out and you go until the problems aren't big enough anymore.
[41:31] And sometimes you can back up.
[41:33] When you get all the way down here, you're like, oh, that's a really hard problem to solve.
[41:39] If I'd known that all the way back here, then I would have gone this way instead.
[41:42] And we often don't do that.
[41:44] So you do need to ask yourself, okay, why does this exist in the first place?
[41:47] Okay, so we go down why a bunch of times.
[41:49] This is how you get down to what ultimately is called the job to be done.
[41:54] So Jobs to be Done Theory is from Clay Christensen,
[41:57] amazing person who wrote Competing Against Luck,
[42:02] among many other books.
[42:03] How many people have listened or read
[42:05] to at least three of his books?
[42:07] You have not listened or read to enough of his books.
[42:10] He has a bunch, and they're all fabulous.
[42:13] Competing Against Luck is very good.
[42:15] The idea of Jobs to be Done Theory, or Jobs Theory,
[42:18] is people hire products to help them make progress
[42:21] in a specific situation.
[42:22] and I have a video on my YouTube channel.
[42:26] By the way, I just started getting serious about YouTube
[42:28] and caring about thumbnails and stuff,
[42:30] like all the stuff you're supposed to do.
[42:32] So go subscribe on YouTube.
[42:34] I'm like weekly, more than weekly videos
[42:37] and they're all really, really great.
[42:38] Or if they're not great, go watch it and tell me why
[42:41] and I'll make it better.
[42:42] But yeah, so I go deep into Jobs Theory on that.
[42:47] Deeper, yeah, it's great.
[42:50] You should go look.
[42:50] Okay.
[42:50] Okay, so first, facial recognition.
[42:53] That is the request.
[42:56] That's not the job.
[42:57] These are two different things.
[42:59] So Rita said, people will say you guys should build this feature,
[43:02] and then you ask them, what are you trying to solve?
[43:04] That is your first question back to them.
[43:07] And if you do say yes to every one of these features,
[43:09] you end up with a huge level of complexity.
[43:12] So you do not just turn feature requests into implementation.
[43:16] I know some of you here in San Francisco are building an app right now that takes the user's request and sends it into an agent and just automatically implements it.
[43:27] Stop.
[43:29] Okay, I actually don't know if anybody's actually doing that, but that would be a bad idea.
[43:32] You would end up with a really terrible product with no vision whatsoever, no taste.
[43:37] All judgment out the window would be awful.
[43:40] So each feature request requires your product judgment.
[43:45] So we don't take the feature request and nail it onto the thing we've already got.
[43:48] It wouldn't be a good product.
[43:49] There's lots of judgment that happens here.
[43:51] And some of that judgment is going to be on the product manager, of course.
[43:55] They're often going to be the one who gets the request first.
[43:58] Not necessarily.
[43:59] We'll talk about that too.
[44:00] But often that is going to be kind of where things are coming from.
[44:04] And they should do a good job of applying the vision of the product to the request as they come in.
[44:11] and so hopefully they are kind of slowing things
[44:16] or at least giving them a better shape for you
[44:18] but even still, you still don't want to just take everything that they give to you
[44:23] because it is going to have an impact on the system that you design
[44:26] and now you have to maintain that long term
[44:28] and it's going to slow you down on other things that might be more important
[44:31] and so you have to put everything through the lens of the job to be done
[44:35] make sure you understand the problem
[44:36] and realize that it's actually a valuable problem to be solved
[44:41] So here are the questions that you asked to reveal what the job is.
[44:46] And we're going to come down to a job statement here for our facial recognition thing.
[44:51] So who is this for?
[44:52] Who's the facial recognition for?
[44:54] If we're the conference and we're building an app to get people in, who is the app for?
[45:02] Attendees.
[45:03] It's actually partially for the attendees.
[45:05] It's also for whoever's manning the door, right?
[45:08] But yes, the attendees ultimately are the ones being served.
[45:11] And then when does this problem happen?
[45:16] Right here.
[45:18] When people are getting into a workshop, okay?
[45:21] And then what progress do they want?
[45:24] What is the progress the user is trying to do?
[45:27] Get in.
[45:28] That's why we named our product this.
[45:30] Just get in to the workshop.
[45:33] Okay, and then finally, what do they do currently?
[45:36] Well, it's a QR code scan, yeah.
[45:39] A blocking request.
[45:40] A blocking request, that's right.
[45:43] We could do parallelization.
[45:44] That could also solve this problem, right?
[45:46] And so that, hang on to that.
[45:48] Put a pin in that.
[45:49] Run MCP guy, I like that.
[45:51] That shirt is cool.
[45:52] You know [participante]...
[45:54] Yeah, okay.
[45:55] So let's try and write the job statement.
[45:59] When situation help me make progress
[46:01] so I can get desired outcome.
[46:02] And often you'll add without some other thing.
[46:05] So when there's a workshop going on at 10110, help me get into the workshop quickly so that I can learn about product engineering without missing the first 20 minutes.
[46:19] Okay?
[46:19] There you go.
[46:20] That's the job statement.
[46:21] That has nothing to do with facial recognition.
[46:24] Right?
[46:25] And so now that we understand what the job statement is, it will inform the decision that we take to go forward with this.
[46:34] And again, some of you are thinking, well, that's the product manager's job is to give you the job statement.
[46:39] Yeah, okay.
[46:40] I'm not going to say that's wrong.
[46:42] But if you get a request that doesn't have a job statement attached or you've never heard, you don't know which job statement this request is coming from, then that's going to be you are not understanding the problem well enough.
[46:54] or maybe the PM just skipped that part,
[46:57] and you're going to spend three months building something
[46:59] that doesn't actually hit users
[47:02] because it's not solving a real problem for them.
[47:05] Or maybe you're solving a problem
[47:07] that seems like a good idea to one person
[47:09] but wasn't generally applicable to everybody else.
[47:12] So getting down to the why, why, why,
[47:14] and then turning that into a job statement
[47:15] helps a lot with making sure you're building the right thing.
[47:19] So another thing that we do is to break that job,
[47:21] once we have that, into three dimensions,
[47:23] functional, social, and emotional.
[47:26] And yeah, okay.
[47:28] So functional is like, does it actually do the thing?
[47:32] Social is, who is involved
[47:33] when the user is using this product to do the thing?
[47:37] And then how do they feel when they're using it?
[47:39] Are they embarrassed?
[47:40] Or are they shy?
[47:43] Or are they excited?
[47:45] And these things actually will map to technical decisions
[47:49] that you as a product engineer will make.
[47:51] And so you actually need answers to these questions.
[47:53] We'll talk about that here in just a second.
[47:55] Oh, and I also mapped this to how React won, by the way.
[48:01] How many of you hate it when I say React won?
[48:04] I'm just kidding.
[48:05] Some of you probably don't like React.
[48:07] I like React, and React won.
[48:09] It's over.
[48:09] The game is actually over.
[48:11] There will be something that comes after React, of course.
[48:14] It's not like it's going to last forever.
[48:17] But will we need to learn that thing?
[48:19] No, the answer is no.
[48:20] We will not be learning whatever it is that comes after React.
[48:22] it has changed into
[48:25] what is the toy that you give your pet
[48:28] agent to be happy
[48:29] that's all that really matters
[48:32] at this point as far as that's concerned
[48:34] and so React 1
[48:35] here's the reason, this is what my video is about
[48:38] React 1, because
[48:39] it started with functional
[48:41] that was the thing, at the time everybody was either
[48:43] Backbone, maybe Ember
[48:45] any other JS, that's what I was using
[48:47] and React was just faster
[48:49] considerably faster
[48:52] despite all the re-renders and everything we talk about now,
[48:55] but it was way faster.
[48:57] And it gave a much simpler mental model for state management,
[49:01] and composition was just fabulous, and it still is.
[49:05] React really solves composition.
[49:07] Being able to create a thing,
[49:08] have it be like a total mess on the inside of that,
[49:11] but have a very solid interface
[49:12] so that that mess inside doesn't really affect anything else.
[49:16] That level of encapsulation and composition was really good.
[49:18] So then, eventually React totally dominated.
[49:22] 2015, 2016, now React is like the top.
[49:26] And everybody's using it.
[49:28] That's when React moved from winning because of functional reasons into social reasons.
[49:33] Well, everybody else is using it.
[49:35] My boss wants me to use it on my team.
[49:38] If I want to get a job in this industry, I've got to learn React.
[49:41] And so everybody is learning React.
[49:43] Now, of course, there are still others out there.
[49:45] Angular 2 came out, and people are using those.
[49:47] But React was just so dominant, the ecosystem was so big,
[49:52] yeah, I'm gonna use that.
[49:52] And how do I feel when I'm using it?
[49:54] Well, maybe now you feel like,
[49:55] oh, I hate this thing or whatever.
[49:57] But at the time, it was, everybody else is using this.
[50:01] I feel pretty good.
[50:02] And it's kinda cool,
[50:03] because there are all these conferences I can go to
[50:04] and feel really excited with everybody else.
[50:07] That's why React totally won.
[50:09] And that's why when React started stumbling a little bit
[50:11] on the functional aspects of things,
[50:14] okay, well now we got solid JS.
[50:16] We don't have rendering problems anymore.
[50:18] Or we got Vue, and it's easier to learn.
[50:20] That's arguable.
[50:21] But whatever it is, all these functional differences,
[50:27] it didn't matter anymore because it already had just nailed itself
[50:30] with the network externalities.
[50:32] So anyway, jobs theory applied to something that you might not think.
[50:38] But open source libraries have hundreds of thousands of users
[50:41] or millions of users.
[50:42] I worked at PayPal.
[50:43] I would shift something and instantly it was out to millions of users. That was pretty exciting and cool thing
[50:48] but getting feedback from those users is really really difficult and
[50:53] making sure that you're actually building the right things and at the time it was fine that I didn't really spend too much time doing
[50:58] that because the you know, it's a big company and we're gonna be successful no matter what I do, I guess
[51:04] but
[51:06] What you can do in those situations or even others is to have a slight channel it
[51:10] you can have a specific one with individuals that you really respect their decisions and
[51:16] they're like high value customers of yours or you can have one that's just like takes reddit threads
[51:21] and x and like all the social media brings it into one place and you just like you don't have
[51:26] to necessarily answer everything or whatever that's not necessarily your job but seeing all
[51:31] of this you get a sense for where the rough edges the paper cuts and all the problems are
[51:36] in your product, and that can kind of help inform,
[51:39] okay, we're not actually solving the job
[51:42] that we were hired to do in this product,
[51:45] and give you a sense for, okay,
[51:47] so I understand why they're complaining about that.
[51:50] I don't believe in user error,
[51:52] because Don Norman said it doesn't exist,
[51:54] and so how can I change the system
[51:56] so it can support what they think it should be doing?
[51:59] And sometimes it's going to be,
[52:00] oh, well, we just need to put a button right here
[52:02] instead of just having it right there,
[52:04] and now it'll be a lot easier.
[52:06] Other times it's going to be, oh, yeah, there's no way we can do that right now.
[52:09] And now I'm doing my systems thinking of how can we make that so that those two systems can talk to each other or something.
[52:16] So, yeah, just let that context wash over you.
[52:20] Michael says there's something very important in thinking about the storytelling of the thing you're building and how it situates in somebody's life.
[52:27] How does somebody feel when they're using your product?
[52:30] and not just how do they feel when they're using your product,
[52:34] but how do they feel when they know other people know that they're using your product.
[52:39] So if you're making some really embarrassing things that people need to use,
[52:42] like, I don't know, it depends or something, that example,
[52:46] but then you need to take that into account in the way that you package your implementation.
[52:54] Okay, so let's talk specifically about our idea.
[52:59] Did I?
[52:59] No, I didn't.
[53:00] So our idea was official recognition thing.
[53:03] That was the original request.
[53:05] And then we brought that into just getting people
[53:08] into the room faster.
[53:10] So what are the functional aspects of that?
[53:13] I need you to throw out these things.
[53:15] So what is the state, workflow, integration sorts of things
[53:19] that we need to think about if we're building this app?
[53:22] [participante] in the workshop.
[53:24] You could start on time.
[53:25] Start on time.
[53:27] So like the speaker always starts on time?
[53:29] Or, okay, so I messed that up, is what you're saying.
[53:34] Well, in my defense, people weren't gone until two minutes after I should have started.
[53:40] You're right.
[53:41] The solution's not there.
[53:42] Yeah.
[53:43] So actually, that's a really good metric that we can track as well.
[53:47] It's like, how much are we starting on time?
[53:49] That will tell us whether the solution is actually solving the ultimate problem.
[53:53] Great.
[53:53] Thank you.
[53:54] What are the other functional?
[53:55] but let's talk more systems things.
[53:57] Like what is this actual database table
[54:01] that you would need to speed up this?
[54:04] Let's say that we do decide to
