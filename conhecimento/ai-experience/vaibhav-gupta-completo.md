---
tipo: transcricao
fonte: aula-externa
tema: produto
evento: ai-experience
autor: "Vaibhav Gupta"
organizacao: "Boundary (CEO)"
sessao: "Fighting slop with slop"
evento-nome: "AI Engineer World's Fair"
pode-ir-comunidade: true
anonimizado: true
criado: 2026-07-01
modelo: whisper-large-v3
idioma: English
duracao-seg: 1220
status: bruto-revisar
autorizado-usar: false
---
# Fighting slop with slop — Vaibhav Gupta (Boundary (CEO)) [bruto]

[00:00] You have to be correct.
[00:01] For the last three years, we've been in an onslaught of war against slots.
[00:06] And when I first met this enemy, I went to my great mentor, Slop Sue, and he taught me something.
[00:14] To defeat the slot, you must become the slot.
[00:18] So we began, and we prepared, and then we started winning.
[00:22] So when we think about it, what is slot?
[00:25] Slot is just any code you don't read.
[00:26] And whether any of you admit it or not, this is the least amount of slop that your codebase
[00:33] will ever have.
[00:34] Cherish it.
[00:35] So we started fighting back against the slop.
[00:38] We started fighting back with slop.
[00:41] So how do we go ship a stable programming language with these engineering practices?
[00:46] Well, the first skirmish we ever had was the skirmish of standards.
[00:50] The hard part about hiring great engineers is you sadly can't tell them what to do.
[00:54] Some of them want to use Clause, some of them want to use Codex, some of them want to use the latest thing that they just found on Agly.
[00:59] So instead of trying to hold standards in our code base, we did something that isn't in there.
[01:05] We built an architecture.md file.
[01:08] Instead of using hotmd, we just picked something that every model can just understand.
[01:12] This file has to be incredibly small, and it can only have things that will not change for months or for years.
[01:19] In our case, it's a layer of the compiler.
[01:21] You go deeper into the compiler, tell the agents to talk to at least one other person
[01:26] that slows it down a little.
[01:28] So now we have standards so anyone can use whatever they want.
[01:31] But the real foe we faced was actually the battle of design.
[01:35] Everyone here knows that you have to write perfect design docs.
[01:38] And we have a very simple rule in our team.
[01:41] Code can be swapped, writing cannot.
[01:43] And of course if I tell every engineer this, they write beautiful writing, and they handwrite
[01:46] everything they don't use AI.
[01:48] Well, sadly not.
[01:49] So we built a design tool, a design doc tool.
[01:51] What this design doc tool does is a replacement
[01:53] for both Notion and GitHub, effectively for design docs.
[01:56] It allows versioning, commenting, all the stuff you want.
[01:59] And obviously we do this, people use this.
[02:00] Well, sadly not.
[02:02] We built another tool on top of that.
[02:04] And this tool was a Slack integration for that tool.
[02:06] Every time a design doc had to fit in,
[02:08] this channel got notification.
[02:10] What ended up happening is this channel
[02:11] became the most popular channel in our company really fast.
[02:13] At 2 a.m. someone shipped a new design doc,
[02:15] three people started reading it right away.
[02:17] It was just interesting.
[02:18] most interesting stuff, design docs that are not the same.
[02:22] But this wasn't enough.
[02:23] All of this is actually backed by markdown files
[02:26] and simple CLI scripts that make it treat like GitHub
[02:28] without being GitHub itself.
[02:30] So now agents can go do this.
[02:32] But the real problem with all of this is I built this,
[02:35] and I hit a little bit of the ice.
[02:36] I started shipping 10 design docs a day,
[02:39] and soon the team was fighting my style.
[02:43] So we didn't go into that last rule.
[02:45] This last rule was, if you're going to ship a design doc,
[02:47] to require people to actually go read it.
[02:49] And with this last standard, we suddenly had design docs
[02:52] that were incredibly high quality.
[02:55] But what about the battle of architecture?
[02:57] How do you have your codebase converted?
[02:59] We built another tool.
[03:00] This tool basically visualizes our dependency graph
[03:02] internally with some external fences as well.
[03:04] And also blocks the codebase change.
[03:07] It has semantic boundaries and individual packages.
[03:09] But what's more interesting is we can go build a CLI tool
[03:12] that guarantees that certain invariants can't be broken.
[03:16] What this does is when pod builds a new package
[03:18] or has a fancy and it's leaky,
[03:20] we now have CI-CD changing or a simple gate commit history
[03:24] that tells us exactly where the link is.
[03:26] And by this, we're actually able to make
[03:28] our architecture change.
[03:28] We haven't changed our architecture
[03:30] in the last three or four months.
[03:33] But as much as we might do design docs,
[03:36] as much as we might have stable code,
[03:38] would you genuinely ship code without leaving it?
[03:40] Would you trust your team to go do that?
[03:42] And think about programming language.
[03:44] Programming language has so many invariants.
[03:47] You have generics, you have closures,
[03:48] you have memory allocation, you have FFI boundaries.
[03:52] Did you trust that system?
[03:54] I found out about it 25 years later.
[03:57] Well, here's where we did something slightly different.
[04:00] What we did was we built a system
[04:03] that actually has agents constantly running
[04:05] and creating demo programs.
[04:07] We take these demo programs,
[04:09] And we have agents trying to spin something up from scratch.
[04:15] We then look at the entire plot transcript, see what tools they use, see what happened.
[04:18] Obviously there's humans in the spectrum, but more importantly, we can have agents go
[04:23] in the spectrum.
[04:24] And agents find what was good, what was bad.
[04:27] And not just what was bad, what was incorrect in the language, but what the reason was when
[04:31] it should have only taken one.
[04:34] And then we can go ahead and find issues.
[04:35] We can have humans collaborate with these issues to figure out which ones are real,
[04:38] which ones are real, which ones are hallucinations, which ones don't have taste as much as I hate to use them.
[04:43] And then we can have agents go ahead and create fixes to these problems and go address them.
[04:49] And most importantly, instead of trying to just detect these issues, we can go one step further.
[04:55] What if you could find language features? Instead of guessing what was good, guessing what still was good.
[05:00] You could go and A test it You could figure out which ones took less tool calls which one made less error which one produced the best outcome Deterministically know what going on
[05:12] The point is, you can start building data-driven systems
[05:15] without ever writing a single line of code.
[05:17] And the thing that really I care about the most over here
[05:21] is not that any one of these tools
[05:23] is specifically what you should go build.
[05:25] But the fact of the matter is,
[05:27] in order to build a programming language,
[05:28] it wouldn't have taken eight people.
[05:30] It wouldn't have taken less than two years.
[05:32] It wouldn't have taken hundreds and thousands
[05:35] and tens of thousands of man hours,
[05:36] and then you would still have a broken system.
[05:39] And today, we can just spend billions of tokens
[05:40] to make it work, and we can make it safe.
[05:43] You too can go home and build these internal tools
[05:45] and these sloppy tools to make sure
[05:48] that your core bases can shift without really having
[05:51] to beat necessarily every single line of code.
[05:53] But your engineers aren't going to.
[05:57] I think we can start winning this battle against logic.
[05:59] And as we win this battle, there's a lot we can do.
[06:02] But sadly, I have a sad thing to say.
[06:05] I think we're still gonna lose the board.
[06:08] I think the reason that we're gonna lose this board
[06:11] is because some of the foundational stuff
[06:14] that we try and go to use, it's self-destructing.
[06:17] How many of you have used TypeScript?
[06:20] Probably most of you, hopefully, at this point,
[06:22] or at least for the evening time,
[06:23] so something around there.
[06:26] Did you know that TypeScript's main design goal
[06:29] It's a stripe of value in correctness and productivity.
[06:32] And there's an asterisk here.
[06:33] What they really mean is human productivity.
[06:36] And if you think about it, there are things you would never
[06:38] do in a programming language.
[06:40] At the very core layer, you are designing a world where
[06:43] humans never wrote a single line of code.
[06:46] Let me show you what that really means.
[06:51] I'm going to write something and try and guess what this
[06:53] code does.
[06:56] Pretty safe.
[06:59] What about this one?
[07:03] Or even more so, this one.
[07:05] Why do we trim things to strings when we sort them?
[07:09] This is just, slot, baked into the language, whether you like it or not.
[07:14] What about this? I love this part of the time stream.
[07:18] And you know what my agent loves? This part of the time stream.
[07:25] This is slot, baked into the language.
[07:28] And whether you like it or not, the system will have swap
[07:33] if you build it using these tools.
[07:35] I'm sorry, wrong talk.
[07:37] But if you think about what JavaScript does,
[07:42] JavaScript exists.
[07:44] And then after JavaScript existed,
[07:47] we started building systems.
[07:48] So there it on.
[07:49] We built CoffeeStrip, Ben Ty-strip.
[07:51] Now we're trying to build a Fence.
[07:53] The thing is, the thing underneath is already broken.
[07:56] And more so, the way we write code is also different now.
[08:01] So why are we gonna patch something like this?
[08:03] Why don't we just try and do something a little different?
[08:06] And I think what we might need if we try and go do that
[08:09] is basically gonna be a made up language.
[08:11] So let me show you what BAML really can do.
[08:14] And when you start thinking from first principles,
[08:16] how you can find that slot
[08:19] from the very foundational layer itself.
[08:21] I keep talking about not reading code.
[08:24] Does it even matter?
[08:25] Well, let me show you a new way to think about code.
[08:28] And this isn't saying we all have to go do this right away.
[08:31] But what if every single time I looked at code, what I really saw was not the code itself,
[08:47] but a quick little thing that could actually visualize all the code for me.
[08:52] As I clicked around, it took me to exactly the code that I was going to.
[08:56] If I wanted to have a slightly broader view, I could zoom in and click around and have it expand.
[09:01] I could navigate my codebase with more instant.
[09:04] I'm going to let this run really quickly.
[09:06] But while it runs, I'll shoot a different pipeline.
[09:09] Without any of you ever reading the code, you know I'm setting up some kind of an agent loop.
[09:12] Because the semantic boundaries in there.
[09:14] I can expand this, I can keep expanding this, and I can say, nope, that's too much slot, let's let that be some.
[09:19] And walk away.
[09:21] So instead of having to understand all the code,
[09:23] I can opt into what parts of the code I want to read
[09:25] and understand, go to the exact lines
[09:27] when I really care about them.
[09:29] But if we go back to the previous pipeline that was running,
[09:31] what if, while it's running,
[09:33] I can actually get a full execution trace?
[09:35] In a world where we don't read all the code,
[09:37] the only way to understand the code
[09:39] is actually by the execution trace.
[09:41] Actually by seeing exactly how much time
[09:43] was spent on what parts of my program
[09:45] at any given time.
[09:47] If you wanted to go and actually track your program through,
[09:49] think about how slow your program would be.
[09:52] It gets to trace everything in Python or TypeScript.
[09:54] It's untenable.
[09:56] And the best part here is, if you start from first principles,
[09:59] you can make this actually zero-component stops.
[10:03] Not only can you make it great for humans,
[10:04] because it all still for agents anyway you can go ahead and make it so that every single file has a tracing system that quad can navigate So quad can find what were bugs what were errors and what were innovations and start
[10:16] optimizing the code that you have included yourself with.
[10:19] And I think if we go and start thinking about it from this way, it's not so much about reading
[10:24] all the code, but it's more so about us human understanding the system that you're working
[10:28] with, and the tools that you can build can give you information about the system that
[10:32] you're working with.
[10:33] But, I think there's another layer to it.
[10:38] We spent decades building IDE tooling.
[10:40] And that, think about how long it took before someone like me, who does not know how to
[10:45] escape VIMS, I'm going to say, can finally start using VS Code.
[10:49] It was a beautiful day when I became a real programmer.
[10:52] Well, according to some people, I'm still not, because I can't write VIM code.
[10:56] But, what does agent-first tooling look like?
[11:02] I think we're all familiar with grep,
[11:04] so I'm not gonna go and talk about it.
[11:07] But I will talk about ripgrep,
[11:08] because grep should not be used anywhere.
[11:11] If I wanted to rep through my code base
[11:13] and understand what it was,
[11:14] I would ripgrep say something like calculates,
[11:17] and give me a bunch of code where everything was being used,
[11:21] and maybe it would be somewhat useful.
[11:23] But what if you could instead start describing code,
[11:26] and say, he described, I played with it.
[11:30] What if it came with all the doctrines?
[11:32] What if it came with the actual source code?
[11:34] And what if it also told you everywhere
[11:36] that you've been in the code?
[11:38] We can make something that used to be multiple tool calls
[11:40] a single tool call all of a sudden.
[11:44] What if the way you want to learn about libraries
[11:46] that you're using, you don't have to do a web search,
[11:49] you just say, you can just ask
[11:53] for any external library as well.
[11:55] And it would just give it to you.
[11:56] Because when I first started learning how to code,
[11:58] one valuable lesson I had was,
[12:00] The code is always a source of truth.
[12:02] Don't read anything but the code itself.
[12:04] The docs may lie, the actual description
[12:08] or architecture file or reading file,
[12:10] that may lie, but the code cannot lie.
[12:13] Except that you're working on some new architectures.
[12:16] And then when you go down this road,
[12:18] you go from not reading the code
[12:19] to understand the architecture,
[12:21] you go from not searching the code
[12:22] to understanding exactly what you're getting
[12:24] in every one of the proof calls.
[12:25] But what's the next thing you do?
[12:27] Well, the last thing I do to truly understand code
[12:30] So what if every single thing you ran, every single function you ever wrote was immediately
[12:37] available as a simple CLI command?
[12:47] If I run add, add becomes a CLI command that has a B brand or a dispatcher.
[12:52] I can just run it really quickly and see what happens.
[12:55] What if every single CLI tool I had could be packed into a CLI that's completely standalone,
[13:07] that I can just run without ever having to actually execute any of the code,
[13:13] and it's not a total CLI binary that has functions bundled in.
[13:17] Suddenly you can build really quick tooling where agents don't have to go right through what's happening.
[13:21] Everything is typesafe, everything is deterministic,
[13:24] and everything is actually guessable.
[13:27] And the best part is,
[13:28] imagine you could build up any system,
[13:30] and your agents don't have to worry about deployments,
[13:32] possibly those back-end links,
[13:34] and you can just target anywhere you want,
[13:37] and it builds for any outside group, including blockchain.
[13:40] All of a sudden, as an engineer, you're super-charged.
[13:43] You're no longer bottom-line-cut
[13:44] with what you can do in the system,
[13:45] underneath your fencing, you just move very fast.
[13:48] You can move at agency.
[13:51] But a lot of the stuff that I've been talking about since state has been about tool-links.
[13:55] What if we tried to state some of the real sins of JavaScript?
[13:58] Some of the stuff that is deep in the language.
[14:02] Not the source stuff, but I mean more important stuff, like errors.
[14:07] Have you seen an error handling be beautiful ever? Other than Rusty.
[14:11] What I see agents do over here is they do try-catch, and then they keep nesting try-catch after try-catch after try-catch,
[14:18] eventually they give up and they consul on,
[14:21] some error happens and you deal with it.
[14:23] What if we do error handling
[14:24] from theory's first principles?
[14:26] What happens in that program?
[14:29] Well, I showed you add, multiply, subtract.
[14:32] I didn't show you divide.
[14:34] Divide is dangerous, it's spooky.
[14:37] So let's go look at divide.
[14:39] You can see over here, divide throws a division by zero.
[14:44] But what else happens?
[14:46] The function actually knows that it throws division by zero error.
[14:50] Without you having the right to make any code.
[14:52] If I go to the calculate function, which at some point calls divide,
[14:57] this function also knows it throws division by zero error.
[15:01] So error types now get inferred without you ever having to do any guesswork.
[15:05] That means if you catch or handle errors, we can do exhaustive guarantees.
[15:09] And the compiler can prove that you have handled the error or not handled the error It no more guessing There no unknowns It guaranteed to be proven So if you want to ship an API
[15:22] where it guarantees that it never throws,
[15:23] well, this system is broken.
[15:26] It doesn't meet the constraints.
[15:27] It has two errors that you're not throwing.
[15:30] If you want to go catch that,
[15:32] well, I can probably go over that in a second.
[15:36] But you can start catching certain errors
[15:40] I'm just going to return a sentinel value for now.
[15:48] And now this parsing with previously through a division by zero error is now guaranteed
[15:53] to no longer throw the division by zero error, because if I catch any exceptions in here,
[15:57] I return a zero value every single time.
[16:01] The compiler and the tooling can do a lot of work for us.
[16:03] We're already used to this in our code bases.
[16:06] We many of us probably don't know how compilers work under the hood.
[16:08] We trust them.
[16:09] Code is a matter of trust.
[16:11] The reason that we don't use L1 code blindly is because we don't trust it yet.
[16:16] Because the systems underneath them don't have enough rigidity.
[16:23] But before I tell you all to go write a bunch of demo code,
[16:27] because I've been there and I can tell you what someone told me if I said,
[16:31] hey, use this new programming language, it's going to solve all your problems.
[16:34] It's just going to come with a whole slew of new problems.
[16:38] So we said, I think we'll lose the war on Slack
[16:42] if we try to ask everyone to rewrite all their code
[16:44] in the world into this new system.
[16:46] So what does a solution like that look like,
[16:48] where you don't have to rewrite all your code?
[16:51] Well, what we started to do was,
[16:53] we started thinking about that about two years ago.
[16:57] And we said, what if you could use DEMO,
[17:00] not just standalone like I showed today,
[17:02] but from within any existing language of your choice,
[17:05] from Python to Typekit to Rust to Go to Ruby
[17:08] to Java, to anything new that comes up even afterwards.
[17:12] What if every function in BAML is immediately accessible
[17:16] in the language of your choice?
[17:17] In this case, I'm calling the BAML
[17:18] calculate function directly from Python
[17:21] and simply types it.
[17:23] Now I'm going to get calculate,
[17:24] we get calculate async in case
[17:26] someone else wants to write async code.
[17:27] So BAML, while it has no function coloring,
[17:30] does give you the benefit of having to do
[17:31] whatever you want in function code.
[17:34] So what if you went a little bit sillier?
[17:39] What if you started passing around lambdas
[17:42] across language boundaries?
[17:44] I have a function here called waitTimeout.
[17:46] This function times out after a certain number
[17:48] of milliseconds and if this work doesn't complete.
[17:51] And it's guaranteed to no matter how long it takes.
[17:55] Well in that world, you can even pass Python language
[17:58] across the bridge.
[17:58] You can pass generics across the bridge.
[18:00] You can pass closure.
[18:02] It should just work so engineers don't have to go fuss with it.
[18:05] More importantly, when the agent does something,
[18:07] the type system never lies.
[18:09] The type system becomes the absolute center of truth
[18:13] that prevents invariants from entering your code base.
[18:17] And what I really wanted to talk about today
[18:19] was not any one specific thing, but it's this general concept.
[18:23] You can build incredibly complex systems
[18:26] without traditional systems like code reviews.
[18:28] You can work with things in parallel.
[18:30] you can use AI however you want without the findings
[18:33] or the standardization.
[18:34] But the most important part is you have to be
[18:36] thoroughly thoughtful about how your engineering team
[18:39] actually uses the system under the hood.
[18:42] When we started building DynamoNet,
[18:43] I didn't think it would be possible to build
[18:45] some of the software we did.
[18:46] And just yesterday, one of our engineers built
[18:49] a partial C compiler purely in DynamoNet.
[18:53] So when I start pushing the boundaries of these systems
[18:56] and you stop reading the code, in some ways, in my mind,
[18:59] release of the floodgates, your engineering team can actually cover the gaps of what existed in your old process.
[19:05] If you ever worked at a company that had no CI-CD, they said adding CI-CD would slow this down.
[19:10] They do slow down pretty much all they have, but after that they move a lot faster.
[19:15] Our processes have to evolve before we're going to ship an agency.
[19:19] Remember, this is the least amount of slots your load base will ever have to the Z.
[19:25] So just embrace it and start fighting it back.
[19:28] I fell in love with software about 15 years ago, and it was the first thing that truly changed the way I perceived it.
[19:35] And I really, genuinely don't want software.
[19:38] And I think we can all build a world of beautiful software.
[19:41] And I think what it takes is, I want each of you to go home today and build these copy tools.
[19:46] Make your systems more robust, make your processing more robust.
[19:49] And for the bravest of you, I want you to go back and think about these core foundation layer systems.
[19:55] Think about how they're broken and see if you can imagine a way to fix them.
[19:59] I think we do need a new Git.
[20:01] I think we do need a new database.
[20:03] And yes, I think we need a new programming language.
[20:05] I'm Bhai Bhav, and I work on BAML. Thank you.
