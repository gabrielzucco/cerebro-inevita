---
tipo: transcricao
fonte: aula-externa
tema: produto
evento: ai-experience
autor: "Paul Bakaus"
organizacao: "Renaissance Geek, Inc. (Founder)"
sessao: "The Dark Arts of Skill Engineering"
track: "Track 2 / Room 2006"
tags-evento: "Coding Agents, Design Engineering"
pode-ir-comunidade: true
anonimizado: true
criado: 2026-06-30
modelo: whisper-large-v3
idioma: English
duracao-seg: 856
origem-audio: "WhatsApp Audio 2026-06-30 at 01.05.10.mp4"
status: bruto-revisar
---
# AI Experience — The Dark Arts of Skill Engineering (Paul Bakaus)

> whisper-large-v3. Idioma: English. Anonimizado para distribuição (só indivíduos privados removidos; palestrante, figuras públicas e tecnologias preservados).

[00:00] .
[00:08] And so the way you solve this is by actually having
[00:10] a block every single result, every gate,
[00:13] and say that one, great success.
[00:19] And the most important lesson is this.
[00:21] If the gate can misuse, it will.
[00:23] I mentioned before, if the model can
[00:25] So, we just built our hardest extension. We went from crouncing all the way to building a monster.
[00:47] But I think it turned out to be pretty powerful in my case, and I wanted to share what I've
[00:54] learned along the way.
[00:56] I don't expect you to use all those techniques.
[00:59] I think some of them are pretty exotic and maybe not applicable to every use case, but
[01:04] I hope that you find value in them.
[01:08] So we've done a whole lot of things today, 9 things we've talked about too.
[01:12] We made it much more deterministic.
[01:15] and it makes more than better for our users.
[01:19] If you'd like to try it out yourself, again, you can clone the repository for the SOC,
[01:27] you can clone the Impeccable Minus SOC, but of course, it also is useful to just take a look at the actual skills
[01:35] and see how it's built, and the code that is configured for the source, licensed under IP2,
[01:41] You can still all the people
[01:43] and get some technical skills involved
[01:45] and check out the source code from U-Dub.
[01:49] With that, I'm at the end of it.
[01:53] Thank you.
[02:00] I think we have about ten minutes
[02:02] for any questions we have.
[02:05] Does anybody have a question?
[02:07] Yes?
[02:09] Can you remind us where did we get the professor?
[02:13] Sorry, what was that?
[02:14] Was there a link?
[02:15] Was it the cross slide?
[02:16] I think it was the cross slide.
[02:17] Yeah.
[02:19] So he did this .
[02:22] Maybe .
[02:27] This is the .
[02:37] Sorry.
[02:38] Thank you.
[03:08] .
[03:38] Thanks [pessoa] That both LN driven as well as internet playwrights
[05:04] So that's one.
[05:06] And that's useful for things like testing the write-most
[05:09] But then beyond that, how do I test that it actually works?
[05:14] But I do the evos harness.
[05:16] That one is not open to us yet.
[05:18] But I do the evos harness that closely replicates, for me,
[05:22] every model harness that I care about now,
[05:24] specifically right now,
[05:26] called Codex Gemini, and I'm trying to find more.
[05:31] And it also recreates tools like
[05:33] browser screenshot tools for some of the other plans.
[05:38] And then it also recreates the,
[05:43] because some part of the impactable content
[05:45] in the initialization of impactable,
[05:48] often times the user gets asked,
[05:49] so what would you like your page not to feel like?
[05:53] And so you get the exact back and forth.
[05:56] And so I've built this LM that acts as the user
[05:59] against the other one.
[06:01] And so it's also getting that back and forth.
[06:05] So I've built that house, and then I've
[06:07] built a mixture of expert design judge that runs on top of it.
[06:11] So it's giving eyes to the value of each result.
[06:16] And then I can run across 20 different names,
[06:20] like for example, Italian restaurant.
[06:23] I run across all models that I care about,
[06:25] GPP-5-5, focus on it, and do like five to 10 tests
[06:31] for each of those, for each of those securities
[06:34] to see how it changed.
[06:36] I also run against competitors,
[06:38] but since I run against design skills,
[06:41] he doesn't make it worse.
[06:44] And how does he make it worse or better?
[06:47] And then, beyond that, I'm doing population testing.
[06:50] That's harder and more expensive, I would say.
[06:54] So I don't know if I won, but this de-ablation testing.
[06:57] So every, you'll see this in the school's government.
[07:00] I suppose every rule has an XML tag that says like you know you need an end product of that particular line And that will be used by the scholars to then do a test where you can see like you know a unique element of a particular line And that will be used by the shamaness to then do a test where it removes that line
[07:15] runs the evos against all models, and then has the line back in,
[07:20] and then uses the spectrum engine of the vector for the deterministic one to see, did it actually change?
[07:26] So there's a line that says, hey, don't do gray on colorful backgrounds for contrast purposes.
[07:35] There is an application test and a digital mystic check for feedback.
[07:43] In short, quite involved.
[07:46] But I really started, you know, high-spaced, and now it's really truly, you know, protested.
[07:55] Yes, .
[07:56] What's for ?
[08:00] Sorry?
[08:01] You said .
[08:03] Yes.
[08:04] And I'm really .
[08:06] Yes.
[08:08] I do have
[08:12] taste, but I don't think they work particularly well.
[08:15] I just talked to about this.
[08:19] I don't think, I mean, I know some of my colleagues
[08:24] quality physically but I don't think taste can be solved.
[08:28] I think it's a fundamental human thing because taste is scarce and unique and once everybody
[08:36] uses the same taste it becomes ubiquitous and then we don't think it's tasteful anymore.
[08:42] So I think it's tough.
[08:46] And I also think that models are particularly bad at evaluating taste.
[08:51] So for example, there are certain things that the models can evaluate well, like, hey, is this the correct thing in the first viewport?
[08:59] So functional stuff, that works. But what doesn't work, and here's one example, again, this mixture of judgements,
[09:06] one judge raised whether the first viewport looks great and is effective.
[09:12] And one of the tells is that Gemini, for example, the more stuff it is in the first
[09:22] new port, the higher it raises. This is just a general rule. If you just frame the new port full, it gives a higher rate.
[09:31] And so this is an interesting example, like the models are from Maximo's, they're like,
[09:36] But what is the point?
[09:39] And so oftentimes, I build judges
[09:41] that actually didn't work with the response I want,
[09:44] which is really strange, but it works.
[09:48] So just something very high like, OK,
[09:50] that definitely might be the time.
[09:53] So anyway, I don't think it's solved,
[09:56] and I don't think it's solvable.
[09:58] But I do have, I would say, a tool
[10:02] that gives you this design that works
[10:04] And that's good enough for me for the first pass, and then I use my own human eyes to
[10:11] get results.
[10:12] What do you say is the future for skills in general?
[10:19] The future for skills?
[10:20] There's no common way to test the skills here.
[10:21] And that would be really important to me.
[10:22] I guess I could.
[10:23] I do have the tool for that, that's true.
[10:24] I could do something with it, yeah.
[10:25] Right, so I'm going to do that.
[10:26] So, I'm going to do that.
[10:27] I guess I could.
[10:29] I do have the ..
[10:32] I do think right now it's
[10:35] for my own purposes.
[10:37] But yeah the same is true for the impeccable install and compile I don think most people know that it exists that it can compile to very high and that
[10:47] has the substitution techniques and so on.
[10:49] I could probably at least answer the question.
[10:54] Yeah, go ahead.
[10:55] What if I put bugs on ?
[10:57] If you have a network that needs to ?
[11:02] MCP against built-on server.
[11:04] How would that work?
[11:06] Oh, I see.
[11:10] Yeah.
[11:13] To be honest, I haven't tried it out yet.
[11:16] Why haven't we read too much into it?
[11:19] I think MCP in general, you know, I worry greatly about context inclusion.
[11:26] And I do have those skills, too.
[11:28] And I think I'm not using MCP for a lot of reasons.
[11:33] Because it moves my context many times.
[11:36] How do those skills work in M2D?
[11:40] .
[11:44] .
[11:48] Oh, you can download those good ones in Feast.
[11:52] .
[11:56] .
[12:00] .
[12:04] Yeah.
[12:05] Yeah, yeah.
[12:06] What is the best practice for?
[12:07] So it wants to become a way of packaging them and just putting them, yeah, that's a good
[12:16] topic.
[12:17] So of course the harnesses and the frontier lugs have their own ways, I mean, Koleks has
[12:24] a marketplace that you can use for distribution, pocket marketplace.
[12:27] Colorcode has a marketplace where they started with a marketplace.
[12:33] Those masterpieces don't work particularly well.
[12:36] I mean, the log code one for sure doesn't work particularly well.
[12:38] I know this for a fact because the object mechanism often doesn't work,
[12:43] and people are like, well, my skill doesn't update.
[12:46] And oftentimes there's a cache location, so it didn't.
[12:49] My experience has been hit on this with the native methods of this ruling,
[12:54] and then of course it only for that particular provider.
[12:56] That's why projects like skills.sh exist.
[13:00] But again, the problem with NPEX is right now,
[13:05] it doesn't allow for more advanced skill newsgames.
[13:08] It's like, you know, from high to very different times.
[13:10] I have a full request in the repository,
[13:15] and I've argued with him a couple times about it.
[13:18] But he still has to get it merged.
[13:22] So I agree with you on that, I guess.
[13:25] I think that was a little disgusting.
[13:28] But yeah, MPA skills I think is a great project in general. I think it'd be great if we could sort of standardize around it.
[13:36] There's also one on Microsoft that's trying to do this. A project on Microsoft, I forgot the name of it.
[13:42] But there's definitely no industry standard for distribution here.
[13:46] Yeah, I'm not... I don't love having to maintain my own C-line, so I would rather not.
[13:53] It's annoying, but it does make it so it plays
[13:57] the all-hands system.
[13:58] The books are the right part of the system, et cetera.
[14:01] So it's, yeah.
[14:06] OK, I think I'm way out of time.
[14:09] But come back and speak to me in the lab.
[14:12] I would say, OK, .
