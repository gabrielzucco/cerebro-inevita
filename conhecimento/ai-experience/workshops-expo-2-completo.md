---
tipo: transcricao
fonte: ai-engineer-worlds-fair
evento: vale-2026
pode-ir-comunidade: true
anonimizado: true
criado: 2026-07-07
qualidade: gravacoes-parciais-de-salao
---
# Expo vol. 2 — íntegras (gravações parciais)

> Áudio de salão, transcrição automática: erros de reconhecimento esperados (citações do destilado [[workshops-expo-2]] corrigidas manualmente).


## 1 — GEPA — Lakshya A. Agrawal (UC Berkeley)

[00:00] Hi everyone, my name is Lakshya A. Agrawal and today I will be presenting on behalf of a very large effort, the problem of reflective optimization or how can we self-improve prompts, agents and models from textual feedback.
[00:16] The question we start with is how can we teach AI to perform new tasks?
[00:22] The standard way has been to perform weight uptakes with gradient descent either during
[00:27] pre-training, supervised fine-tuning or reinforcement learning.
[00:31] This has proven to be extremely effective but it requires a huge number of examples.
[00:36] Trillions of tokens for pre-training, tens of thousands of labelled examples for supervised
[00:41] or hundreds of thousands of rollouts for reinforcement learning in domains like math, coding, etc.
[00:49] However, most teams do not actually have that much data or compute and in fact the problems
[00:57] that we are trying to tackle with AI now are bottlenecked by sample efficiency.
[01:02] What do we mean by that?
[01:04] Two things.
[01:05] First of all, there is low availability of domain specific knowledge resources,
[01:10] which means there is not enough data to perform offline algorithms like SME.
[01:15] Second, the domains that we are trying to apply AI increasingly are having expensive rollouts
[01:20] where either the LLM workflow pipeline or agentic rollouts are itself very slow or expensive to do
[01:28] or the task metric is very slow or expensive to execute.
[01:31] We are seeing that agents can now work for hours on end
[01:35] and if you were to apply an online learning algorithm to this
[01:39] it would require hundreds of thousands of rollouts and it would not be feasible.
[01:44] So, we are seeing increasing use of agents for real-world applications where these invoke tools,
[01:50] which can also be long-running, further exacerbating the sample inefficiency issue.
[01:56] The current dominant paradigm is reinforcement learning with verified rewards,
[02:01] where given a model and a task, we perform a number of parallel rollouts and get rewards at the end.
[02:07] Finally, an algorithm like GRBO takes these rewards and converts it into gradients that
[02:13] are applied back to the model. However, as we can see, there was a lot of information
[02:19] in each of these rollouts. But we only learnt an O of one score and propagated that via
[02:26] gradient descent. You can see that there is a change of code, the tool calls made to the
[02:32] the environment's responses to those tool calls,
[02:35] which could potentially contain error messages,
[02:38] which also provide diagnostic value,
[02:40] and it could learn almost nothing from all of that.
[02:43] So, the question we ask is,
[02:45] can we make use of this other extremely rich information?
[02:50] Our idea is to perform reflective optimization in text space,
[02:55] where instead of only using the zero or one reward signal,
[02:59] we can have a language model or an agent
[03:02] look at the taste of the entire rollout
[03:05] and reflect on what worked in them,
[03:07] what did not work in them.
[03:09] And this reflection could potentially use
[03:11] all intermediate outputs
[03:13] and potentially even make other tool calls
[03:15] such as retrieval from your company's knowledge base
[03:18] or some kind textbook and so on.
[03:22] So that's the first key idea.
[03:23] And the second is that instead of only updating weights
[03:27] with small data, we can instead update a prop
[03:31] where a single natural language update
[03:33] can give a very large behavior change.
[03:35] Let's take a simple example.
[03:36] Let's say you're tasked with writing
[03:38] a text summarization system.
[03:40] And the prompt of that system says,
[03:42] generate a one line summary.
[03:44] If I just go and tweak that prompt
[03:46] to say generate a 10 line summary,
[03:48] we can all agree that the behavior of the system
[03:51] would change quite significantly
[03:53] with that just one word change.
[03:54] And making that one word change is quite quick,
[03:57] and we can reflect on our own behavior
[03:59] identifying what needs to change. If we were to achieve a similar kind of behavior update from our
[04:05] AI system, we would have to have thousands of gradient, very tiny gradient updates sequentially.
[04:12] So with that key idea, we proposed JEPA, which is a reflective crop optimization technique
[04:17] for agents. It uses an evolutionary loop along with a novel, Paripa-based candidate selection,
[04:23] which I will come to later. It is akin to doing reinforcement learning in tech space,
[04:28] where instead of just reporting and receiving a reward score,
[04:32] we are actually obtaining score along with textual feedback,
[04:35] which can be very domain specific
[04:37] and learn all about the domain from it.
[04:41] Let's compare JEPA with GRQ,
[04:43] which is one of the leading RL techniques.
[04:45] On the X axis, we have the number of training steps,
[04:49] also proportional to number of data samples seen,
[04:52] and on the Y axis, we have the performance
[04:54] on our domain that we are training for.
[04:57] And what we can see is that JEPA in just one round of reflection using just three data points
[05:03] is already able to get twice the performance gains that GRPO got after 25,000 rollups.
[05:10] Continuing to run JEPA for a few more steps further increases that gap itself by another quix I want to note here that the model QN3 is optimizing itself here There is no external expert feature involved whatsoever
[05:28] And what does JEPA learn? Unlike prior optimizers, someone which would use modern
[05:35] idiosyncrasies like my grandmother will be really angry if you don't generate a good prop. Here,
[05:41] java is actually giving a very detailed problem specification which includes how to make sense
[05:47] of the input what is the purpose and context of this particular file part of the pipeline
[05:52] what are some key observations and lessons from the data so the problem we are seeing here is
[05:57] for the second form of a multi-hop question answering system where given a question
[06:02] we need to retrieve some documents that potentially answer that question look at those
[06:06] those documents, summarize it, and then finally answer the question. And here what we see
[06:10] is Jemma has found out that first of documents that often cover one entity or aspect, and
[06:17] the second half should actually be recovering documents that are related to it. We have
[06:22] seen that human engineering teams, whenever a new model comes out, spend weeks of their
[06:28] time manually tweeting one word here and there, trying to discover the problem specification.
[06:33] This entire process is fully automated now with JEPA which takes about half an hour to one hour to run depending on your pipelines.
[06:43] We can also apply JEPA to leading proprietary models.
[06:48] Just for an example, here we were able to optimize GPT 4.1 Mealy's performance to outperform GPT 4.1 on a math task.
[06:57] And you can see the kind of information distillation Jepa has done in the PROM space itself.
[07:04] Coming back to the problem of sample efficiency, AMD developed a new hardware accelerator called
[07:10] FPU-XDNA2 which had used a completely new API to program, which had almost zero available
[07:16] information over on the internet.
[07:19] And because of this, the leading models at the time which was GPT-40 was failing miserably
[07:25] to perform this task.
[07:26] We were able to take an existing agent which was getting 4.25% on this task and apply Gemba
[07:33] without any other change to the agent itself and we got this prompt and pushed its performance
[07:39] 7x to 30.52%.
[07:41] So what this goes to say is there can be lots of domain specific information which if you
[07:47] include in your AI systems prompts, the models could actually perform much better and Gemba
[07:52] and Gemba can help you fully automatically discover that.
[07:56] I want to highlight the sentence saying,
[07:58] avoid including ADM got edge.
[08:00] Now the interesting thing is,
[08:01] AMD actually shucks a library called ADM got edge
[08:03] for programming in Vue,
[08:05] but that did not work with this latest generation of hardware
[08:09] that we were working with,
[08:10] and Gemba was able to discover that in just one step.
[08:14] So, how does it work?
[08:15] It's an extremely simple algorithm,
[08:17] which simply takes your AI pipeline,
[08:19] written in any agent-like framework,
[08:21] or even raw LLM calls that you may have.
[08:24] It simply runs your systems on a few examples
[08:26] and collects domain-specific feedback.
[08:29] Whatever information your environment contains is observed.
[08:32] Second, it runs reflection with an LLM or agent
[08:35] that reads the feedback and proposes a better plan.
[08:39] Finally, and most importantly, it keeps a burrito pool
[08:42] where it keeps every single candidate
[08:44] that wins on even one ranking example
[08:47] and not just the top scorer.
[08:49] The question is, but why keep a Pareto good?
[08:53] And we kept getting asked this question a lot,
[08:55] that is Jemma really better than running the model
[08:58] in a loop?
[08:59] So we went and tested it out, and what happens is,
[09:02] a loop keeps only the best and gets stuck
[09:05] in the local optimum.
[09:06] So on the left hand side, you see a search tree
[09:09] that was generated by using an LLM in a loop.
[09:12] Starting from a seed prompt at the top left,
[09:15] where we asked the LLM to improve the prompt.
[09:18] It improved the prompt and it generated a prompt that gave us the middle node.
[09:22] However, this prompt got stuck in the local optima,
[09:25] and once again when we asked the element to try and improve it,
[09:28] it proposed something but that was not actually better.
[09:31] So it went back and it again tried to improve it.
[09:33] And it kept doing this and it exhausted all of the search budget.
[09:37] On the other hand, with JEPA's Parimba-based candidate selection strategy on the right,
[09:41] we can see that it maintains a much more balanced search process,
[09:45] eventually converging to a much higher scope.
[09:47] Across four benchmarks, we saw that more than half of the gains swing with JEPA actually account for this and it gets almost twice the performance gains that you would get with just applying the model in a room.
[09:59] Jemma can perform really well across diverse benchmarks.
[10:03] Here we see results on question answering,
[10:05] instruction following, claim verification,
[10:07] as well as math, which all the leading
[10:10] frontier model companies are already optimizing
[10:12] their models a lot for, and we are still able
[10:14] to get plus 10% just by optimizing the prompt on it.
[10:19] So, we have so far seen Jemma only optimizing the prompts,
[10:23] but Jemma goes far beyond prompts,
[10:25] and because prompts are just text artifacts
[10:27] that define AI system behavior,
[10:29] the same algorithm can improve any text that is expressed as a piece of text and you can score For example your entire agent harness is eventually just a Python or a JavaScript file and we can apply the same kind of reflective optimization process to that entire file and we can work with it
[10:48] So, if you can write it as text and score it, Jemma can optimize it.
[10:52] So, with that in mind, we can also optimize anything which is the universal API for optimizing any text parameter
[11:00] given any domain like code optimization where let's say you want to optimize a CUDA kernel code.
[11:06] The input is just that CUDA kernel code where an evaluator looks at this piece of code, maybe compiles it, profiles it,
[11:13] generates a bunch of related information that we call as actionable site information,
[11:18] which is then provided to an LLM which proposes a better candidate, maintaining this Pareto pool,
[11:24] and it keeps repeating this process till we get convergence.
[11:29] The same thing can be applied to numeric optimization, where your numbers can actually be serialized as text,
[11:34] or hardness optimization where entire hardness can be serialized as text,
[11:38] or even club scheduling policy optimization where the scheduling policy or heuristic algorithm can be expressed as a piece of text,
[11:45] and the evaluator can be something like the negative of cost or some function measuring accuracy, efficiency,
[11:52] and the external side information can be something like job traces, SLA migrations, and so on.
[11:57] The API is dead simple to use. All it requires is you give us the set of problems that you care to be solved along with an evaluator function or a fitness function that returns a score along with any available domain specific site information.
[12:12] If your domain produces expert feedback, return that. If your domain produces compiler error messages, compiler messages, tool call error messages, return that. If you have maybe a written documentation, return that. Any kind of, it's a very open ended dictionary, you can return literally anything. And all you do is you call optimize anything, not just the function and the set of problems that you have and optimize anything will sort of take care of it and give you an optimized solution.
[12:40] Let's see some application. Let's say you were tasked with generating a 3D unicorn. This is all the code that you would write or your agent can now write it because we have seen that optimizing anything is very easy to use for leading agents like PlotCode.
[12:56] So all you do is write this code which says optimize a python program to generate a 3D unicorn
[13:02] and the candidate is a python script that produces a PNG rendering, whatever.
[13:07] And here is the result. On the left hand side, we can see cloud focus 4.6.
[13:12] If you gave it this task, this is what it generated.
[13:15] And on the right hand side, what would be the unicorn that we get with optimizing it.
[13:20] This is a good one, but let's say you think you are tasked with writing an agent to solve a specific task.
[13:27] Typically, teams spend lots and lots of time creating their agents, building tools for it,
[13:32] making good descriptions, carefully orchestrating the control flow and so on.
[13:37] Here we started with a simple four line Python program that was simply calling a model's chain of thought to solve an RTGA problem.
[13:46] Within just 16 rounds of reflection, JEPA within Optimize Anything was able to find this sophisticated 6-step agent that took our AGI accuracy of Gemini Flash from 32.5% to 89.5%.
[14:04] And you can see that this agent is automatically by itself doing rule hypothesis deduction,
[14:10] code synthesis, it executes and traces the code, automatically composes code, goes back
[14:15] and proposes new versions of that code and runs it on the actual test inputs and returns
[14:21] the output.
[14:22] This is a runnable example, you can go to this QR code and you can run this example
[14:26] right now.
[14:27] So, applying the same approach of discovering agent harnesses to MAT500, we were able to push its accuracy of GPT 4.1 nano by 20% by simply creating a 2-step agent.
[14:42] And again, I want to emphasize that all we did is we asked Optimize Anything to optimize an agent file and it was automatically discovering the sophisticated agent architecture and we did not have to do anything other than specifying the objective and the task.
[14:56] Finally, every single one of us is using some coding agent like Cloud Code or Codex or maybe your favorite agent.
[15:06] And agent skills have become a very leading part of the ecosystem where almost all coding agents understand the skills.
[15:12] Let's say you want to optimize skills for your specific repository.
[15:17] This is the code that you write which says, learn a skill from the project team.
[15:21] When the coding agent is presented with similar problem, the skill should be helpful.
[15:24] We just gave it this natural language barrier and what we see is we started with Mini-Sui
[15:30] agent with GPT-5 Mini because we were very budget constrained and we were able to take
[15:36] its performance from 24% to 93% on almost 3x jump on corepository issue resolution.
[15:44] But more importantly, the skills that were optimized very cheaply on a GPT-5 Mini agent,
[15:49] we able to take that and apply it to the latest cloud solid This was done about a few months back but we applied it to cloud solid 4 pushing its accuracy to 100 issue resolution while more importantly cutting down the execution time or issue resolution time by almost 50 We cut it down into half which also means it was spent less token because skills contain information about how the repository is organized how to invoke the test cases where a particular feature is implemented
[16:19] what are the build systems used by this repository and so on.
[16:23] This is a feature called G-Skill, you can find it in the Jafar repository and it's fully open source as well.
[16:29] So, Optimize Anything is a single interface that provides three optimization modes.
[16:34] If you have just a single problem like there is a single matrix multiplication kernel that you want to optimize,
[16:39] you can use it that way. If you have n number of related problems, like you want to optimize a matrix multiplication kernel
[16:45] along with a dot product kernel, and you know there might be some information transfer between these two.
[16:50] You can use what we call as a multi-task search mode.
[16:53] And finally, build a skill which is, if you want to optimize on a set number of problems,
[16:58] but your deployment can actually come up with many new problems.
[17:02] Like in case of Mac, like in case of Mac prompt optimization, we are training on some examples,
[17:09] but when we deploy it, we can receive a completely new kind of query.
[17:12] So we care about generalization mode, so there you can do prompt optimization,
[17:15] agent architecture optimization and so on.
[17:17] So, Optimize Anything can be used for a broad set of domains including Cloud Schedule Policy Optimization
[17:25] where we are able to cut costs by almost 40% compared to expert heuristics,
[17:31] write custom solvers to match and exceed Opcana even in Black Box mathematical optimization,
[17:36] create agent skills, cloud optimization and so on.
[17:40] It is so easy to use that within just 20 hours of releasing it, people at Snorkel had already improved some of their internal benchmarks with a kind word meeting about it.
[17:50] So, and JEPA also improves multi-modal VLM models performance. Here we are able to cut OCR error rates for leading models by almost 35% and this is an externally validated report.
[18:02] Similarly, Databricks actually achieved 90x cost reduction in their deployed agent's performance.
[18:11] And here they were able to tune GPD OSS 120B to outperform Cloud Opus while being 90x cheaper.
[18:18] More importantly, the performance delta improvement that you see on top of Cloud Opus is actually bigger than the one you see on open source models.
[18:26] Some people have asked me that, oh, as models get better, the importance of problem optimization will go down.
[18:33] I argue the opposite, which is, as models get better, they will get better at instruction following.
[18:38] And the more precise instruction about your task that you have to give to a very smart model,
[18:43] the better that model will be at solving your task.
[18:47] And this is exactly what we see happening here.
[18:49] The better the instruction was, Lord Opus actually jumped much higher.
[18:53] So people have this question of what if we have subjective tasks which are very hard to evaluate.
[19:00] Jet market actually learns evals for your tasks from production cases.
[19:04] The way to do that is you collect a bunch of production cases from your agent, get a human to annotate just about 50 of those trajectories giving very detailed feedback.
[19:14] This is a long response, this is a short response, this is a good response, this uses this terminology, whatever.
[19:20] And once you get those human annotations, you can use Jemba to optimize it, LLM as a judge prompt, and you can use that LLM as a judge prompt then to go back and optimize your agent.
[19:30] And deploy that agent, and this becomes a data flywheel where you can keep improving it, and this is a successful paradigm that some leading teams in production are already using.
[19:40] Then the question we get asked is, can we actually use this reflective optimization to train models?
[19:45] And we recently had this paper called Learning Fast and Slow where we proposed fast slow learning where we can co-optimize model weights and prompt harnesses and this shows some very strong properties that one would want in a container learning algorithm.
[20:00] I don't have much time to go over details, but please look at the papers.
[20:08] Since release, Jemba has been used in production by these companies as well as the main methodology in these papers.
[20:16] And here the CEO of Dropbox and Shopify are talking about their use of Jemba.
[20:20] And OpenAI also wrote a blog post about how you can build self-improving AI systems with Jemba.
[20:25] So it's very simple to get started, it can plug into any framework, any model and it has absolutely zero hard dependencies so you can deploy it in any kind of setting.
[20:37] So don't be afraid to optimize the tech space and many problems can be framed as optimization.
[20:43] So bring actionable site information and surface as much domain specific information as you can to optimizers and the optimizers of future will be able to work with them.
[20:53] So please go and check it out. Thank you very much.

## 2 — Aiden/Weco — Zhengyao Jiang

[00:00] Thank you.
[00:30] This April, OBI ran a hiring challenge, a competition called Primitive Golf.
[00:43] The top contributor was one candidate that they couldn't hire.
[00:48] It wasn't a person, it's an agent we knew called Adam.
[00:54] In practical, the goal is to train the best language model you can
[01:00] on their size and computation constraints.
[01:04] About 1,000 machine learning engineers, researchers, participants,
[01:10] they filed 2,000 submissions.
[01:14] Only 47 passed OpenAI review and made it into the leaderboard.
[01:21] of those are actually agents. More than twice would any human contribute to.
[01:29] You've seen a lot of auto research today. Agents are here climbing benchmarks. Those
[01:36] are really impressive results. The question I want to ask you is a bit different here.
[01:41] Can an auto research agent produce work that a human community actually recognizes?
[01:49] Beyond a good score, agent is an optimizing form, something that other engineers can merge, work, and build on.
[01:59] So, instead of having an agent just here climbing locally, we build one that publishes its own work, and that's Aiden.
[02:10] Big context on us, Waco is an auto research company that founded about two and a half years ago.
[02:17] I'm co-founder and CEO of Zhenyao.
[02:20] I got my PhD at UCL in reinforcement learning.
[02:24] About two years ago, we viewed AID, the top auto research agent,
[02:29] independently evaluated by OpenAI in their ML re-match paper.
[02:36] Even though back then there was no such name for the auto research.
[02:41] People called it machine learning engineering agent.
[02:45] ADEN is a NAPS stack and an experimental prototype.
[02:52] It's a multi-agent, self-improving system that can read public information like research papers and other PRs,
[03:01] run its own experiments, and submit a PR once the findings pass a quality gate.
[03:08] We sent Aiden to the private golf competition, and it ran for about 22 days.
[03:16] By the end, Aiden had set 7 leaderboard records.
[03:20] Each one is the new best for the competition, stand-out by all the AI.
[03:25] And the best human remains.
[03:29] Passing the host review is one signal for the quality.
[03:34] A standard, maybe more important one, is whether other participants would build on your work.
[03:43] And it turns out, Ada's work has the highest impact within the whole community.
[03:50] Here we are using an inference measure that is used widely in academia.
[03:57] It's called an H-index.
[03:59] Roughly if you have X papers get cited X times then your action mix is X Computed over PRs Aiden was 10 and the next human was seven
[04:14] The whole community was building on an AI systems work,
[04:19] including many of other leaderboard entries.
[04:24] To break it down a little bit,
[04:27] why can an autonomous AI system do so well?
[04:31] One obvious reason is that AI can run tirelessly.
[04:38] Over 22 days, it ran about 1,300 experiments
[04:44] on a single H100 node.
[04:48] But the throughput isn't the whole picture.
[04:51] A well-tuned AI system can also keep
[04:55] its output quality high.
[04:57] On the compute side, it uses at most 4% of the competition's total compute, and it made about 15% of the records.
[05:12] Also, 28% of its submissions made the leaderboard, roughly 6 times higher hit rate than the community average.
[05:23] So AIDEN actually lifted the signal-noise ratio
[05:27] within the whole community's public communication channel,
[05:31] which is PRC.
[05:33] It didn't win through massive parallelization,
[05:37] even though other research have the
[05:39] tons of potential of parallelization.
[05:45] By those numbers, it might feel like
[05:48] other research already dominates human experts,
[05:53] from ML engineering and research, but that's not the full story I want to tell.
[05:59] Humans and AI actually contribute in very different ways. When we trace the ideas Aiden
[06:07] Aiden's right from PRs, almost all of them come from human research papers,
[06:16] other participants in practical golf, or in similar communities like nanoGPT.
[06:21] Those ideas are not necessarily a merged PR. Sometimes it's a note, a human researcher said,
[06:31] oh, I gave up this idea because of some implementation difficulty, and the agent is good at finding them and actually implementing them.
[06:41] There are also a very small fraction of original ideas that Aden came up by itself, which emerged from its efforts to navigate the file size constraints.
[06:54] Here is a concrete example that traces the patterns I just talked about.
[07:01] So, Aiden picked up an idea from a paper called the data detection, and it worked.
[07:10] But it introduced more parameters, and it broke the 16-megapyte file size limit.
[07:19] So it figured out a colonization mechanism to bring the file size down.
[07:25] But with those two primitives combined, the score barely moved.
[07:31] Then another contributor posted a tokenizer improvement.
[07:37] Aidan recognized the idea, combined it with the architectural work, and just worked for five days or so.
[07:45] And after this combination, the three ideas turned out to have a huge synergy.
[07:54] that lead to a big jump in performance and become one of the ADAN's leaderboard records.
[08:03] So to sum up how I interpret ADAN and in general auto research systems effectiveness it very strong at finding and implementing ideas In the case we just saw it brought an idea
[08:19] from a recent paper into a actual implementation
[08:23] in the competition.
[08:25] And it's good at promising ingredients
[08:27] out of the private golf community,
[08:31] even though the public channel
[08:33] is actually very noisy information-wise.
[08:37] It can also came up logically straightforward ideas.
[08:42] For example, in this case, once you add parameters
[08:46] and then it breaks the file size limit,
[08:49] one obvious next move is just quantization.
[08:54] And it's really fast and really efficient
[08:57] at finding right combinations across a huge search space.
[09:02] Okay, maybe none of those sounds very sexy, most of them are just good execution, but
[09:11] in reality, execution is mostly the bottom line.
[09:17] What moves the frontier is usually exactly some belief on existing ideas and tons of
[09:26] good executions.
[09:27] To step back, the state of human-AI collaboration is that human collectively provide a lot of
[09:38] creative ideas and the agent do the execution to solve a concrete challenge.
[09:46] What we are looking at is a large group of human and one AI system.
[09:51] Does it mean a single human engineer's contribution
[09:55] marginally gets smaller?
[09:58] I don't think so.
[09:59] Even for that, not really.
[10:02] In climate growth, competition,
[10:04] it's easy to only focus on engineers
[10:07] that's actually doing climate climbing.
[10:09] But the design behind the competition itself
[10:13] is tremendously important.
[10:15] A bad design can make the whole community
[10:18] to use this. And their design work will have huge leverage in the auto research era.
[10:27] I really like one tweet from Andrew De Pasi about 10 years ago, where he said,
[10:35] Great In Descent can write code better than you. I'm sorry. For the context, about 10 years ago,
[10:43] So deep learning was starting to eat up a lot of software engineering, like conventional coding.
[10:51] And his tweet was arguing against those people who thought they can handwrite better code than they train a model.
[11:00] Okay, now obviously no one is seriously trying to handwrite code to beat a model.
[11:07] However, software engineering, I mean, it's a job, still exists.
[11:12] There's so many people strong about just training those models, and those are one of the most
[11:18] well-paid jobs today.
[11:22] I think how gradient descent changes coding is a great metaphor for how all the research
[11:28] will change research in the ML engineering.
[11:32] It commoditizes certain execution skills.
[11:35] At the same time, it makes some higher level skills far more valuable.
[11:42] So actually doing all the research is a lot like training a model.
[11:46] Your code-based instruction is essentially the architecture.
[11:51] It sets the constraint and the priorities for what the agent can explore.
[11:58] Your eval is the loss function and the data.
[12:02] It sets what the agent optimizes for.
[12:06] Take the eval first.
[12:08] The eval is the signal you use to train a model.
[12:13] In this case it training your code It plays the same role that data and the loss function in model training or in a reinforcement learning setting It like an environment that the agent is training
[12:30] Now there's no one to argue data or environments don't matter.
[12:36] And this is where a vertical mode can also be viewed.
[12:43] You might have a proprietary data for evaluation
[12:46] or a unique understanding of a particular field,
[12:50] what matters and how to measure it.
[12:53] And a good evaluation would be amplified more and more
[12:59] as our research are getting stronger.
[13:03] The other one I think is really underrated
[13:06] is code-based abstraction.
[13:10] The abstraction provides the framework
[13:12] that auto research can iterate on.
[13:16] And that's also, that starting point
[13:20] hugely bias the whole search direction.
[13:24] This is a lot like architecture design in neural networks.
[13:29] Different architecture in theory
[13:31] can represent the same function.
[13:35] But the architecture systematically makes some
[13:38] of the functions easier to be learned.
[13:42] And a good architecture biases the optimization
[13:46] towards solutions that generalize better,
[13:49] perform better, even when the training laws
[13:53] might look the same.
[13:55] That's exactly the same for auto research.
[13:59] Here's an example.
[14:00] We run all the research for a product interaction pipeline
[14:06] and we try to optimize the data processing.
[14:11] And first we give it a loose API
[14:16] where the same function process
[14:18] both the training and the testing data.
[14:22] And the score looks great.
[14:24] But the solution was polluted
[14:28] because there is a certain test set information
[14:33] got leaked to the training information.
[14:37] We then tighten the obstruction to a more strict API
[14:42] where the test data couldn't reach the training.
[14:46] And the data leakage rate just dropped to zero.
[14:49] In this case, a good obstruction is a bad solution
[14:54] even though if the agent really wants,
[14:56] they can still work.
[15:01] So my point is using auto research is a new craft.
[15:06] It's about designing a gear for an agent to fly.
[15:11] And we are still very early in it.
[15:14] I think that makes this extremely exciting time
[15:18] to be an AI engineer.
[15:21] Auto research will change what skills matter most,
[15:25] Creativity, the judgment if you design a good eval or an extraction, those systems get exponentially more important.
[15:35] Driving those systems itself is where we will be a new skill.
[15:40] And that one is like it barely existed more than two years ago.
[15:46] So the search is automated.
[15:48] The human would just move up the stack, not out of it.
[15:55] Again, WeCo is an auto-research product research lab. We will keep sharing what we are learning as we build.
[16:05] Our blog and I will also post some of my thinking to you on Max.
[16:11] If you think some of this is useful to you, feel free to follow me on Max. Thank you.
[16:25] you

## 3 — ACP — Alex Hancock (Block)

[00:00] things going on now. I've been working on square products and patch up stuff. I've been doing open source AI for the last couple years. Specifically, I've worked on this open source harness project called Goose, which started as an internal project that locked and some boosted that stuff. And then the open source did and we donated it to the Linux Foundation. So now the IP is there, but we still have lots of us from blocks.
[00:25] I'm also a maintainer of MCP, the model context protocol.
[00:30] I work on the Rust SDK for that product.
[00:33] And more recently, I've also started some work on ACP, the agent client protocol,
[00:38] which is what I'm going to talk about today.
[00:41] So I think we have an issue with harnesses that I want to try to put to you all today,
[00:47] propose to you all today as a problem and then recommend a solution.
[00:52] So what I've been noticing recently is that we've got lots of great harnesses out there, right?
[00:58] There are ones from the labs, there are ones from different companies, there's lots of open standards-based ones.
[01:04] But I noticed that the interface for them is often custom or bespoke.
[01:09] And in the worst case, it's like you might have some harnesses where there's literally only one client application you can use to control that harness, right?
[01:17] And I think this has a couple issues with it, but the analogy that I'll make with the web is it would be like if you had to use one browser or one given protocol to connect to every web site.
[01:30] That just wouldn't work. You wouldn't have something like the open web if that were the reality with browsers.
[01:36] And so I think we can do better.
[01:38] And the thing about standards, by finding a standard, and the thing about standards is that they create ecosystems and markets.
[01:45] And I would argue that in the agentic AI space, we have a good standard for the agent going out and doing things, right?
[01:54] Calling tools, taking actions in other systems, reading resources, reading data.
[01:58] We've all benefited as a community from having an MCP, right?
[02:03] And the most powerful thing about an MCP is not anything about an MCP itself, but it's that everyone uses MCP.
[02:10] And that's why we have thousands or tens of thousands
[02:14] of servers around the world, and all the agents
[02:16] can connect to them and go and do things
[02:18] in those other systems.
[02:21] I would say that we don't yet have a good solution
[02:23] or a standard for client software to tell agents what to do getting it tasks telling it what to work on and getting updates And so I going to put forward an option today that I think is a good option
[02:39] that we on our team have been working on and we think is a good solution in the open standard space.
[02:46] And this is ACP, so Agent Blind Protocol, is the name of this project.
[02:50] And it came from the editor companies.
[02:52] It came from, like, if you've used the Zed text editor or you've used any of JetBrains' products, the Zed folks and the JetBrains folks teamed up and proposed a standard for clients to be able to control harnesses.
[03:06] And it makes sense if you put yourself in their shoes, right?
[03:08] What they wanted to be able to do is write a single high-quality client implementation in an editor, maybe in Zed or in IntelliJ or something like that, and be able to control any harness with that single client implementation, sending tasks, getting results back, seeing what files are being edited, et cetera.
[03:27] It makes a ton of sense if you put yourself in their shoes, right?
[03:29] But we saw this on the Goose Game, and we think that there is a much broader utility to just editors, right?
[03:36] So it's relatively neutral.
[03:39] It doesn't have any editor-specific features.
[03:41] So we think that this can be spread to a wider range of
[03:45] client software.
[03:47] To go into a little bit more depth about ACP's design and
[03:50] what you can do with it, it lets you establish connections
[03:55] between clients and agent harnesses that have a given set
[03:59] of capabilities associated with the connection.
[04:02] And then you can make sessions.
[04:05] Within the sessions, you can send user messages,
[04:07] the things that a user is maybe typing into the app
[04:09] or that the client software wants to send.
[04:12] The agent can then respond to those with text,
[04:16] more images or audio, text, et cetera,
[04:19] or updates about what's going on.
[04:20] So like if a tool was called,
[04:22] it can send a tool call notification
[04:23] and explain what tool was called and what the metadata was.
[04:27] And it can also send things like permission requests
[04:30] so that the client software needs to show the user,
[04:33] you know, should I do this tool call, yes or no?
[04:35] It can go over this protocol.
[04:39] And it's pretty simple in its design.
[04:42] It uses JSON RPC messages, and the thing we like
[04:44] about it most is that it's extensible as well,
[04:46] so you're not limited to just what's in the vanilla protocol.
[04:50] You can add custom methods, too.
[04:52] The convention is you put an underscore,
[04:55] and then you start to put your custom methods.
[04:58] The thing I like about this is that if enough Harness projects or client projects adopt this we can start to see what we all doing is the same right Like if the Codex team has some custom methods the Doos team has some custom methods
[05:10] the Client team has some custom methods, whoever,
[05:13] we can see what merges in the ecosystem
[05:16] and what makes sense to get on a standards track
[05:18] and bring it into the protocol itself
[05:20] so that this is sort of shaped by usage and shaped by the community.
[05:23] I'm going to do a demo of a standard I.O. version of this.
[05:29] So I'm going to open ZED, and I just have a really simple project here,
[05:34] where I'll say, tell me about this project.
[05:37] So this is a single HTML file.
[05:40] So you can see I was able to type my query into ZED,
[05:43] and this is the agent in play here is Goose, so it's using Goose's ACP interface.
[05:48] And as you can see, it's like sending text back,
[05:50] back, it sent me tool call information back about what it read and what it did, and then
[05:55] it found that it's a single issue.
[05:57] And I'll do another one.
[06:01] This is one from a company called Poolside AI.
[06:04] They talk about this project and the same project.
[06:09] And so this is a terminal-based client getting exactly the same experience from the same
[06:14] agents, one implementation on the harness side, and you can now use it in any client.
[06:19] And so you can see it did the same thing.
[06:21] It showed me some text results back,
[06:23] it showed a full call, and then it showed
[06:25] it's streaming in a summary.
[06:29] So that's a basic demo showing two clients
[06:31] talking to the same agent over standard IO locally
[06:35] in this case.
[06:36] But local obviously isn't enough.
[06:38] If you want this to take off,
[06:40] you have to be able to do remote as well.
[06:41] Agents are gonna be running in the cloud.
[06:44] And so when we came to this project,
[06:45] we saw that it did not have remote support yet.
[06:47] So we specified an HTTP transport.
[06:50] There's an HTTP version and there's a WebSocket upgrade.
[06:54] And so now the messages are the same,
[06:55] the protocol semantics are the same,
[06:57] but there's a new transport that is just landing now
[07:00] that enables remotes.
[07:02] And the way we think about this on the Goose team,
[07:06] the agent tech stack,
[07:07] is that there's sort of these four important components,
[07:09] right, of the client,
[07:10] which is like the app that the user is using,
[07:12] or an endless app running somewhere on the machine.
[07:15] There's the hearts,
[07:16] which is the program that implements the tool calling.
[07:20] There are the tools themselves, this is often MCP,
[07:23] and then there's the model, right?
[07:24] And if you do a remote transport
[07:27] for the agent client protocol,
[07:30] and MCP has remote transport for tool calling and the models have kind of all had remote endpoints like response and safe gas for a long time now you have the flexibility to move all of these four
[07:41] components around they can all be on the same machine the harness can be on a different machine
[07:45] than the client uh the model could be the only thing that's remote the tools could be the only
[07:50] thing that's remote uh aligning on standards and making sure that they have them transport stories
[07:56] is what's going to let us move all the pieces of this agentic stack around.
[08:01] And I can show a quick demo of this as well.
[08:04] So this is a client, just to show how easy it is to create clients from this,
[08:09] I just, I put in this, you know, last night, and I'll say, right, a poem.
[08:15] So this is, again, connecting to that same process on my machine.
[08:19] In this case, I'm running it over the network, but it's on my machine.
[08:22] It's connecting and sending loose instructions for what to do.
[08:26] remotely. So this could be in a container, it could be up in the cloud, but the messages are the same and the library that you use is the same.
[08:33] So you can just switch between local and remote very, very easily.
[08:37] So if you want to get plugged into this ecosystem, start experimenting with support, how to make your own clients, or how to accept the harnesses.
[08:46] This will link you to the agent client website for how to get started.
[08:51] It started with just a number of clients and agent servers already out there.
[08:55] This ranges from editors, desktop applications, mobile applications, terminal-based things.
[09:01] There's a proliferation.
[09:03] And I think the use cases are potentially huge, radically, if we get some interoperability
[09:10] going here because you can have people who make personal clients.
[09:13] That's exactly how you want to orchestrate your agents.
[09:16] You can have certain clients created for certain business domains or an individual company or a set of clients from a company.
[09:24] You can customize like a white label client, have it work with all the harnesses.
[09:28] And I also think if we make a new category here, we're going to see quality of the clients going, right?
[09:34] Because any time you get a new business or marketplace going and there's many options, users can vote with their feet and clients are making their gains.
[09:42] And so people will start to compete on the quality of the user experience and then overall
[09:47] I think this can drive up the users' experience of these again.
[09:51] That's what I've got today.
[09:52] Thank you very much.
[09:53] And if you want to chat with me, I mean, after or send me an email.
[09:58] Happy to get you plugged into this work.

## 4 — MCP Tasks — Cornelia Davis (Temporal)

[00:00] I hope you all have seen, because you're all here, which is why the heck are any agents supporting MCP tasks?
[00:06] If you don't know what tasks are, don't worry, we'll hold that one just a moment.
[00:10] But the first answer to that question is, well, have they been smart?
[00:15] The people who are building those clients are smart.
[00:17] What I mean by that is that the MCP tasks specification that came out in November was marked as experimental.
[00:24] And so, well, you might shrug and say, well, gosh, those clients and servers, they're all supporting a whole bunch of experimental things.
[00:32] Why not MCP tasks?
[00:34] Well, again, you'll see the answer to that as we move forward.
[00:39] The next answer to that question is, well, they're pretty involved.
[00:44] There's a lot of complexity in here, and that's what I want to do over the next 20 minutes is teach you some of that complexity.
[00:51] Quick intro.
[00:52] Hello, my name is Cornelia Davis.
[00:54] I'm a technologist at Temporal
[00:57] for distributed system stuff.
[00:59] I have a long history in distributed systems,
[01:01] did a whole bunch of stuff in the microservices era,
[01:04] including Cloud Foundry, Kubernetes, GitOps,
[01:07] Weaveworks, all of that stuff
[01:09] that I even wrote a book about that.
[01:11] That's who I am.
[01:13] Today's agenda in the next 19 minutes
[01:15] is that rather than just talking about things
[01:18] in the abstract, I'm gonna ground us
[01:20] in a very concrete example.
[01:22] So I'm going to give you the layout of that concrete example.
[01:25] Then I'm going to give you an overview of MCP tasks.
[01:28] Quick question, who here wants to do things with tasks?
[01:33] A-Sync, MCP tools.
[01:35] Okay.
[01:36] So I'm going to give you a little bit of an overview.
[01:38] Then we're going to talk about MCP tasks V1.
[01:41] That's the stuff that came out in November.
[01:44] And spoiler alert, there's a new one coming out in July.
[01:47] So that comment that I made about them being smart, about not implementing it yet,
[01:52] well, there's some pretty radical changes.
[01:54] So I'm going to show you what's happening with V2,
[01:58] and I actually have some live demos to show all this working,
[02:00] and then I'll help you take a look at the end.
[02:03] So the use case that we're going to talk about here is a simple purchase order use case.
[02:09] So the use case is you're going to get in a purchase order,
[02:13] and then it's going to go through a number of steps.
[02:15] It's going to record the fact that the goods were received,
[02:18] and then it's going to do in parallel, it's going to do some back office stuff,
[02:23] updating inventory, setting up notifications,
[02:26] and then in parallel to that it's going to pay some invoices.
[02:31] Now the invoicing is going to happen via an MCP tool.
[02:36] Now that MCP tool has itself a number of steps.
[02:41] So it's going to validate against an ERP,
[02:44] then it's going to have a little human in the loop to request approval, maybe,
[02:48] Then it's going to write a title again, the ERP again, do a little bit more human in the loop, and so on.
[02:54] So you can see that on the right-hand side, that MCP server that's going to be the tool that's going to be doing the invoice processing for us, it is long-running.
[03:05] It's not going to work in a request-response style, and that's what MCP tasks are all about.
[03:11] And what we're going to do, and today's talk is not about temporal, but really what I did do is just show you a couple of snippets of the code.
[03:21] And yes, I will be sharing all the code for what I'm showing today.
[03:24] A couple of snippets here, and the real point that I want you to look at is that reject or approve, that is showing you that there is a mechanism for signaling into a long-running process.
[03:36] And that's really the point, and that's what we mean is that this is all about a vigorous.
[03:42] Do you understand what MCP tasks are now?
[03:45] MCP tasks are allowing you to have an MCP tool that you can invoke, and then it is long running in the background, and then eventually you can get back the response.
[03:57] So, let's talk about that MCP task overview.
[04:01] This is a very simple sequence diagram.
[04:04] This is exactly what you all would expect when I tell you that MCD tasks are not running tasks.
[04:10] You're going to invoke a tool and instead of getting back a response, you're getting a handle.
[04:16] And you can interact with that handle, right? Obviously. Right? This is a rocket science.
[04:22] Looks easy enough, right?
[04:24] Well, it turns out that if you actually want this to work over long horizons,
[04:30] it gets a little bit more complicated than that.
[04:33] So what are some of those complications?
[04:36] Well, you can have all sorts of, the longer something runs,
[04:39] the more likely there's going to be some kind of infrastructure blip
[04:44] that's going to cause a problem in that long-running task.
[04:47] So you could have network blips, you could have network challenges,
[04:52] you could have humans that you're waiting for, they're in a loop for,
[04:57] And they go away on vacation, like I'm about to, yay, day after tomorrow.
[05:03] Or processes can crash.
[05:05] So your agent can go down.
[05:07] The agent that's processing the purchase order can go down.
[05:10] Or your MCP server can go down as well.
[05:13] So all of those problems you need to deal with.
[05:16] And those are the things that makes it a little bit more difficult.
[05:20] Now, in addition to what I've told you about MCP tasks so far,
[05:25] they're going to get back to handle that you can interact with by the specification those mcp tasks
[05:33] can't disappear this is verbiage from the spec itself that says once you've
[05:40] launched the task it has to be durable what that means is all of these things that i just showed you on the previous screen humans going away on vacation servers going down clients going down connections disconnected
[05:57] The task needs to survive that and you need to be able to interact with that task when the infrastructure comes back.
[06:05] And I'm going to show you how all of that is done.
[06:07] Now, on those elements, those server-side elements that talk about how you make the server-side durable, and I did a talk at the MCB Dev Summit in March, and this is the QR code that will take you to that YouTube video.
[06:23] And that's where I go into a lot of detail about the server-side and what you need to do with the server-side.
[06:29] Today, as you saw, there's an extension of that work where I'm talking about the client-side.
[06:35] Okay. So without further ado, let me go into a demo.
[06:40] I, for those of you who know me, I'm always doing demos.
[06:43] So what we have here is we have a dashboard.
[06:46] I am not doing this through a chat interface because frankly it's more efficient for me to click a couple of buttons here to show you this rather than trying to type things in.
[06:56] So I have a user interface here that's showing me the number of purchase orders that have been submitted.
[07:01] I'm going to submit a simple purchase order, so that's just a button that is kicking things off.
[07:06] And in a moment, if the damn demo gods are with me, it says submitted, we should see the purchase order pop up here, and it should show some, ah, here's why it's not working.
[07:18] Because I haven't started my servers.
[07:20] So remember I said it has to work even when the servers aren't running?
[07:24] I forgot to show you here that what I'm doing in these two windows is in the upper window, I'm starting the back end.
[07:32] This is the MCP server.
[07:34] And in the lower window, I am starting the MCP client.
[07:39] And you'll see what that client is in a moment.
[07:41] You can see in this black screen there that I am using FastMCP on the client side.
[07:46] So let's go back here and notice that even though I submitted that, even though my servers weren't running,
[07:53] that submission did go through.
[07:56] So it's captured that.
[07:57] So what you can see here, and you didn't see it cycle through,
[08:01] but on the far right-hand side, the invoice task initially showed you that it was submitted,
[08:08] then it showed you that it was working, and now it's asking for input required.
[08:13] I can come over here.
[08:14] Let me show you what's going on at the back end and at the front end.
[08:18] What I have here are some dashboards that are showing those running processes.
[08:23] On the right hand side you have the back end, that's where the invoice processing is.
[08:28] You can see that they here, let me increase the font size there a little bit.
[08:33] So you can see that this is running the invoice and on the left hand side you can see that it's running the EO.
[08:39] I'll explain that task tracker thing in just a moment.
[08:43] So if we go into the invoice we can see that it has the process that we talked about earlier.
[08:48] It validated against the ERP and now it's waiting for human input.
[08:52] It's waiting for that approval.
[08:54] Over on the PO side, we can also see the process that I showed you earlier, which is to say,
[09:01] let's go back here, it is, so, ah, yes, so it did that, it recorded that the goods were received.
[09:09] Then in parallel, it's invoking the invoice processor, MCP task,
[09:15] And notice that there's this line item here that says task tracker workflow.
[09:20] Yes indeed, that is my MCP client implementation.
[09:24] Remember I said nobody's implemented this on the client side?
[09:27] Well, I created my own implementation here.
[09:30] But in parallel with doing the invoice processing, we also have this back office stuff that was happening.
[09:36] So if I come back over here and I click on input required, I can approve this.
[09:42] And I'll hit submit.
[09:44] When we come over here, and you'll see in just a moment that the signal is going to come into the back end.
[09:51] I need to refresh.
[09:52] Oh, there it goes.
[09:53] So the approval came into the back end, and now the back end is going ahead with this additional process paying the invoice.
[10:00] And you'll see a number of line items there.
[10:02] There's some retries that have been programmed in here.
[10:07] You can see here that it took a few tries before the ERP went through.
[10:11] We paid the line item.
[10:13] And now you can see that the task completed.
[10:17] So everything's completed.
[10:18] If I go back to the dashboard that you saw at the top, you can see that all of those processes completed.
[10:28] Okay?
[10:29] So that's the basic stuff.
[10:31] And I can run that again, but I already gave you, inadvertently gave you the example of the infrastructure was down.
[10:39] I could have killed that server halfway through and it would have continued exactly as you saw here.
[10:47] Okay, so you saw it at the very beginning.
[10:50] All right, let's go back to slides.
[10:52] So that's the first demo.
[10:54] So let's talk about TAS version 1.
[10:59] So in TAS version 1, there were a number of tool semantics.
[11:02] And again, I go over these tool semantics in a lot more detail in that SCP Dev Center talk.
[11:07] But that's one really interesting thing that I want to draw your attention to, which is that tasks come with, one of the things that the specification defines is a life cycle for tasks.
[11:20] And that's what you see here on the screen.
[11:23] It has working, it can go into an input required.
[11:27] For input required, it can go back to working.
[11:30] And then eventually it will complete or be canceled or fail So that one of the things that super interesting about the task specification is that it about the life cycle of the task
[11:43] There's a whole bunch of other semantics there as well,
[11:46] around obtaining inputs and delivering results.
[11:49] And I'm going to go through this fairly quickly because I already mentioned
[11:53] that some of this is going away.
[11:55] So this is what the tool semantics were before the task semantics.
[12:00] Notice that tools slash call is exactly the same.
[12:04] There's some metadata being passed in when you want it to be async.
[12:08] And then there's task get, cancel, list, as well as task result.
[12:15] And so the top four are request response and style.
[12:19] The bottom one keeps the connection open.
[12:22] It keeps the connection alive.
[12:24] And the sequence diagram that you can see here is kind of the basic stuff.
[12:27] Now, there's two hiccups with this, two major challenges with this particular version of the protocol.
[12:36] The first one is right here, task list.
[12:40] This is a stateful protocol.
[12:43] So what that means is that the, remember I said that the server was responsible for durability?
[12:49] Well, this particular endpoint allows me to go to the server and say, hey, what tasks do you have?
[12:57] So if I have had, if the client has gone away, if the user took too long to respond, if my network dropped out and I had to reconnect, I can use this task list to go back to the server and say, what have you got?
[13:12] And then you can continue on with that.
[13:15] That works fine if you have one task or two tasks or maybe it even works if you have ten tasks.
[13:25] But what happens if you've got a whole slew of agents out there and you've got a million
[13:30] tasks at the back end?
[13:31] Spoiler alert, there is no filter on that endpoint.
[13:35] So you would have to go through a million tasks to find the one that you're looking
[13:40] for and that you want to interact with.
[13:41] This is going away.
[13:43] You'll see it in a second.
[13:44] But that's one of the challenges.
[13:45] Just because you can doesn't mean you should.
[13:48] The other one is the task results because that is where we were tunneling the input
[13:54] So in the case of task resolve, this sequence diagram is really simple.
[13:59] It doesn't have the interactivity.
[14:02] What we have, as soon as you have input required, is the top and bottom are just fine,
[14:09] but this middle section has this weird protocol where you open a long-running connection,
[14:15] and then the server elicits a response from the client.
[14:19] That gets super tricky.
[14:22] And I'm running short on time, so I'm not actually going to show you this demo.
[14:27] Happy to show it to you.
[14:29] I'll be around all day tomorrow, too.
[14:31] So I'm happy to show it to you.
[14:32] But I want to show you instead, here's basically the architecture of what you need to build on the server side.
[14:39] This is, notice that this is using FastFend CP.
[14:42] So FastFend CP already has support for server side and client side stuff as well.
[14:48] But the interesting thing is notice that little box on the left-hand side on the lower part where it says NCB client protocol handler.
[14:58] That protocol handler with the ugliness that I just showed you around results actually looks like this.
[15:06] And I can show this team running, and it has all sorts of complexity in it.
[15:10] I've got to have the long-running connection.
[15:12] Well, what happens if my connection dies in the middle of that?
[15:15] How do I pick up where I left off when I come back?
[15:18] You'll see that a big part of what the task specification does is it talks about durability.
[15:24] So back to the question of why the heck aren't there any clients that are supporting this protocol?
[15:31] Yeah, that's why.
[15:34] Super involved.
[15:36] Still involved with V2, but it gets better.
[15:38] So let me tell you about that.
[15:40] So in May, Angie Jones, who's responsible for developer experience at the Agenting AI Foundation, which is where MCP now lives, posted this blog.
[15:53] And one of the things that made me jump up and celebrate a little bit is that the protocol is going stateless.
[16:00] So as somebody who's been working in the microservices world for a long time,
[16:05] stateful protocols are the absolute worst thing in large-scale distributed systems.
[16:11] So the protocol is going stateless. It's also doing a number of other things.
[16:16] So the first bullet is the stateless core. The second bullet is interesting because they also have structured MCP
[16:22] so that there's a core and there's extensions.
[16:25] If some of you were in the room for the previous two talks, they talked about MCP UI.
[16:30] Two talks ago they mentioned extension.
[16:33] Well, that's what's happening here in the V2 MCP protocol is that they have extensions.
[16:40] And tasks have become in extension.
[16:44] So let me tell you a little bit about how tasks change from V1 to V2, and I do want to give you one more demo.
[16:51] So on the left hand side you can see what the protocol was before.
[16:56] These are the RPC requests that you were doing of the wire.
[16:59] On the right hand side you can see a couple of things.
[17:02] Task list has gone away.
[17:05] Good.
[17:07] Wasn't particularly useful anyway, especially at large scale.
[17:12] And instead of having this input required going over a long running session you now have an endpoint that allows you from the client side to say here an update So if you remember a while ago I showed you that screenshot
[17:28] that said temporal has this notion of a signal, that's effectively what this is.
[17:33] It's a way of signaling into this long running task. The task result stays but
[17:39] it changes because it no longer has this long session based protocol. But I put the
[17:45] picture on the right hand side here to emphasize the fact that the life cycle
[17:51] management of these tasks is unchanged. That's actually sound. Now, I go into this a lot
[17:59] into more detail in the talk that I keep referring to. On the server side, in invoice
[18:05] processing, I have my own state machine that the invoice is going through and so
[18:10] part of what you're doing when you implement these server side, these tasks,
[18:14] is you're mapping from the lifecycle states of the task
[18:18] over to the domain state machine
[18:21] that's running the application
[18:24] and the server in the back end or the tool.
[18:28] So list again goes away.
[18:31] Now, remember I said that the MCP task specification
[18:35] has durability all over it?
[18:37] With this change, given that lists are gone,
[18:40] you now are required on the client side, well, kind of required, there's a little parenthetical
[18:49] remark here, the spec right now says that clients should persist task IDs.
[18:56] But it also points out that if you don't persist task IDs, there is no way to get it back.
[19:02] So I'm not quite sure why this doesn't have an all-cats must.
[19:06] The other thing that I want to point out is that I already mentioned it, is that you're going to have potentially a lot of agents that are processing POs.
[19:16] Or a lot of agents that are doing a lot of things. And so having multiple things running, I think is really crucial as well.
[19:25] So with that, I'm going to go to the second demo and I'm going to go back to my purchase order here.
[19:37] So what I'm going to do now is I'm going to submit a number of things and I'm actually still demoing here because I have 13 seconds left.
[19:46] I'm not going to switch over to my Me Too.
[19:48] You'll see that from the high level, it actually looks exactly the same.
[19:54] I am going to show you what the client protocol looks like.
[19:59] In the B1 case, it's really quite ugly.
[20:01] But you'll notice here that we have submitted a bunch of different ones.
[20:07] I can tell you the B1 protocol, the reference implementation,
[20:11] if you have input required on multiple,
[20:15] even though you can see that there's many of them in flight,
[20:18] on the client side they were FIFO.
[20:20] So you can only respond to the first one.
[20:23] and part of the protocol that I implemented was to get around that gap.
[20:28] So let's come over here.
[20:29] We can refresh both of these, and you can see that there's going to be a bunch of POs in flight.
[20:35] And now I want to show you the task tracker.
[20:39] So if we go into the task tracker, that's the MCP client.
[20:43] And now let me just expand this so we can see it in a little bit more detail.
[20:47] What you can see here is that, remember, that that protocol,
[20:51] I showed you that big long sequence diagram.
[20:54] There's a lot of steps involved in that.
[20:57] But what I've done here is I've implemented it as a workflow.
[21:01] And you can see here that there's some elicitation handling that's going from the server side back to the client.
[21:07] So I won't go into any more details because I'm literally out of time now.
[21:11] I want to share two more things.
[21:13] And that is, so going from V1, remember this ugly picture, to V2,
[21:20] in the client server protocol much, much cleaner, much easier to implement.
[21:27] So speaking of implementing, here's a summary of all the things that you need to do
[21:31] if you want to implement tasks.
[21:33] Still relatively involved.
[21:35] Here's a picture.
[21:36] I'm going to make these slides available in the Git repo that I'm about to show you.
[21:41] And here's the Git repo that I'm about to show you.
[21:44] And while you're getting that screenshot,
[21:46] I'm going to tell you about two pieces of work that I'm continuing with.
[21:50] Number one, even though this is better, it still doesn't scale to the millions.
[21:58] Why?
[21:59] Because if I've got a million tasks running, I've got a million clients that are doing
[22:03] gets against each and every one of those tasks.
[22:07] That does not scale.
[22:09] There is a part of the MCPC task specification that is a notifications protocol, which I
[22:16] haven't gotten far enough yet, but it's showing promise.
[22:20] which is going to allow you to, instead of having a million clients pull in their tasks,
[22:29] it's going to have a single endpoint where they can say, has something changed?
[22:33] If it has, tell me which one, and now I'll go pull that task.
[22:38] So it's definitely from a scale perspective.
[22:40] The other thing that we're doing is, in the very near future, in the next month or two,
[22:47] we're going to have an implementation of all of this where it's going to be much simpler for you.
[22:53] My goal is to actually implement it in FAST-NCP so that you can use the same protocol,
[22:59] the same framework that you're using probably for your NCP service today.
[23:03] So without further ado, that is it. Thank you to the next speaker for letting me go through this long and all year round.

## 5 — Estande Deasy/Collibra (parte 1)

[00:00] So, what they're able to do so far, they were able to take 40, around 40 different files, create curated files, and go to small little, EOC small little mini-filet, where they can do parsing, chunking, OCR, embedding, and then put in the vector database and acknowledge that.
[00:24] and they got pretty good responses.
[00:27] It seems pretty easy, you can do that with 40 files.
[00:32] But when they tried to do it with many, many different files, with 80,000 plus files,
[00:39] now all of a sudden it's a little bit more challenging.
[00:43] And so some of the challenges that they had were, I can't discover the files that I need,
[00:48] I don't know where the sensitive data is in my SharePoint.
[00:53] I can't trust the quality of the data.
[00:55] So in my background, I used to work at both Informatica and the Day Clips.
[01:02] So for me, data quality is typically the six different dimensions of data quality.
[01:06] Completeness, conformity, accuracy.
[01:09] But when you deal with documents, it's a little bit different.
[01:12] What I want to see is the inflicting information.
[01:14] information, conflicting information, right?
[01:17] We're just gonna talk about,
[01:18] we have a really good slide on
[01:19] showing you why it's so important.
[01:22] And also the presence of the data.
[01:25] And also everybody's talking about context, right?
[01:28] So what we wanna do is when we have the metadata,
[01:31] we wanna use that in our chat pod
[01:34] and our database to make it more relevant,
[01:37] have better accuracy in the chat.
[01:39] So you can see some of the challenges that they had.
[01:46] They're getting things like the answers,
[01:48] this sensitive information is being leaked out in chatbots.
[01:52] It takes a ton of time to go into production
[01:54] because they can't find the files.
[01:56] They're spending too much time looking for the files
[01:57] instead of writing code and doing things that they really like to do.
[02:02] It's difficult to maintain.
[02:04] I work with another telecommunications company,
[02:06] and they have six to seven different cities and they're trying to curate 20,000 HTML files with B2P5.
[02:15] This is very little, very difficult.
[02:17] And what we do is we have the ability to automate this entire process.
[02:23] So over here, now you can see the one chart access and leverage over 80,000 different files.
[02:32] So they went from 40 files to over 80,000 files, and really what they want to do is they want to find which files are over in the chatbot, which have high quality, which ones are today with knowledge.
[02:44] They don't want to use a version where the contract is over-expired, right?
[02:49] And they want to enrich their chatbot with the metadata that they've tagged.
[02:54] And of course they don't want any sensitive data.
[02:57] And so what we do over here is we allow the ability to do that.
[03:03] We can access the data over here, we can understand what the data is, we can figure out which
[03:10] files are relevant, the ACR, the chunking, and things like that.
[03:16] So let me show you a little, a brief demo.
[03:19] So over here you see a SharePoint, a Washlight, whatever, whatever, and a whole SharePoint
[03:25] full of different, there's call transcripts,
[03:28] there's PDFs, there's Excel, there's Word documents.
[03:32] They don't know which ones are relevant,
[03:35] which ones are focused on legal.
[03:36] Now over here, if you look at DZ,
[03:39] and Robbie will come to the application right here,
[03:41] and I can see unadjusted 3 files and now I can see both the gauge level or chunk level as well as the file level I can see all the information in here
[03:55] And then over here, this is what we call a taxonomy.
[03:58] Taxonomy is a grouping of tags or a tagging strip.
[04:01] So I've ingested the 339 files and now I can either manually create a region-form tag,
[04:07] I can leverage tags that are reusable from a tag library,
[04:11] Or I can load a J.I. that probably suggests what tags I should even have.
[04:15] Right? I can load a J.I. that says, these are the tags I love.
[04:19] So here I just type in my tag name, date, or document categorization,
[04:23] given the prompt, and this prompt is what we're going to send to the LLF
[04:27] to determine is this file, how should we tag this file?
[04:32] Now, if I know what I'm looking for, I can put in the classification values.
[04:36] It's optional.
[04:38] And again, I can go to JL's portal and get all the slides for you.
[04:45] Now, also, the other thing to point out, if I have my, my text on me here, the valid values, already I can upload that into the CSV.
[04:53] And so once, once we do this now, you can see I'm starting to build this, this tagging tree.
[04:59] My only thing I can do is I can add conditions on my tagging tree.
[05:03] So, remember I said I don't want needle and contacts? That's what we're looking for.
[05:07] Now what we can do is I can have some tagging, so only when the contract files, I want to pull up more data around the contract title.
[05:18] Is it a supplier contract? Is it part of an NDA? Right? Is it materials and time contracts?
[05:25] And now what we can do when you add this, we can see the amount of different branches
[05:35] in our tag industry.
[05:37] And I can have unconditional tags as well.
[05:43] I can have any number of different tags.
[05:45] Now what we're doing is we're going to generate the metadata.
[05:47] So I choose what files I want, I can choose what tags I want, I can say generate a metadata
[05:53] and you'll see the results over here.
[05:59] So now I can see the document catalog,
[06:02] I can hover my mouse,
[06:03] this is engineering documents,
[06:04] this is my projects in Google,
[06:06] right, at 68.35.
[06:09] And if I click on any of those,
[06:11] it automatically filters for me.
[06:15] Now I can also see the evidence.
[06:17] Why are they not targets?
[06:19] Where in the document did it find evidence
[06:22] that it's a weird one-time, right?
[06:25] And I also do thumbs up and thumbs down,
[06:27] so there's two-shot learning as well.
[06:29] So I can give you an example if I want to.
[06:32] Now, in Snowdesign, I also have filters.
[06:35] So I have two different filters.
[06:36] I quickly went from 339 files down to 20 files.
[06:41] So we also have the ability to scan for sensitivity as well.
[06:46] So whether it's PNI, PHI, could be anything.
[06:51] I was in London at a doctor conference a couple months ago, and some folks from Finland came up and they wanted to know who was on the Finnish National ID.
[07:02] I was still finished, so I put it in there, I did this demo, and not only can we do database, we can do database and context.
[07:09] And it did a good job for regex syntax for me, but also added some Finnish words which I thought were probably associated with Finnish National ID.
[07:20] So suddenly, let's pause the video for a second.
[07:29] Alright let me keep going again So the other thing we can do is we can do quality So again for us we have a box right here for quality We can go through and see what the different data is for duplication for conflicting information
[07:46] And then we'll leverage AI to auto-suggest which one is the proof.
[07:52] Now the other thing we can do too is again for freshness we can say I will mine files within X number of days
[07:58] or when a specific date is.
[08:00] And then, the last thing we can do for here is,
[08:03] and here's the pieces of Medicaid that I absolutely have to have,
[08:09] and then what we'll do is we'll figure out, you know, of the 339 files,
[08:13] maybe we really need 200 files.
[08:15] And then from there, you can create a bonus size.
[08:18] And we can also do the context as well, over here.
[08:23] So, don't do no more video.
[08:26] And we also have a live demo for you that Leo's going to be doing in a few seconds.
[08:30] So in this case now, what I can do is I can leverage a data slice.
[08:35] So my data slice could be filtered based on specific criteria that I want.
[08:40] So in this case I have 14 files. These are only the files that are relevant for Leo.
[08:46] And now what I'm doing is I'm copying my use case description.
[08:50] What I can do is I can say, here's what I'm trying to build.
[08:53] and I'm getting into a plot, text on multiple layer levels,
[08:58] in my tagging tree.
[09:00] And then over here, what I find,
[09:01] it's gonna auto suggest these tags for me.
[09:04] There's two different loops, I can choose which ones I like,
[09:06] which ones I want, which ones I don't want.
[09:09] But again, it's all done purely based on
[09:12] what I'm trying to do, and gave a context,
[09:15] and based on the content of the files themselves.
[09:19] And then over here, it builds up the classification values,
[09:23] And then we can walk, and then run the, when we generate the metadata, we're in the job.
[09:32] Now we can see over here, here's all the sensitive information.
[09:37] There's all the different information we have over here.
[09:40] And then again, I can see the evidence at the file level and the chunk level.
[09:45] I can see the confidence score.
[09:47] So coming back from AI with the model return, I don't have to guess.
[09:51] It's 100% confident, 95% confident. Here's why. So you can have a lot of confidence in the AI-ready data project that you're about to go into.
[10:07] Alright.
[10:10] And now finally, what we can do for delivery and maintenance.
[10:14] So one of the things that's really important is with our data slice technology, we have
[10:20] workflows we can put on a set schedule so it's auto-refresh.
[10:23] So we want to ensure that the chat box never gets scaled.
[10:26] So if there's new records or new files that get added to SharePoint or deleted, it will
[10:32] automatically pick those up and add those on a set schedule to my data slice, to my
[10:39] AI-driven data file.
[10:41] And then our SDK will pick that up and chat on it, and then when we load the data, it's always have the most precious of the metadata.
[10:51] So what's it mean for North River? So basically, they were able to go from four months of data pack work to down to days.
[10:58] They were able to increase their data utilization for AI, they increased their chatbot accuracy because they normally were able to figure out which files to use.
[11:08] Also, the metadata from the clients, they were able to inject that and leverage that to our SDK in their shop.
[11:16] And then the other thing they did was they reduced their compliance costs.
[11:19] They knew where all the sensitive data was and they made sure they were not filtered out in their data source Okay so I going to turn it over to my brother from another mother
[11:31] So, Leo, he's going to talk about context.
[11:35] Yeah. Hi, everyone. I just wanted to basically give this a walk.
[11:42] But technically, can you de-duplicate the data,
[11:46] you reduce your search space, you clean it up,
[11:49] you have it fresh?
[11:50] What does it actually mean?
[11:52] So if we were looking at the backroom space,
[11:55] when you ask a question, it comes in,
[11:58] and you have duplicated data, the same information,
[12:00] or potentially even a different version of the document
[12:04] with conflicting information involved.
[12:06] Think of your Slack messages.
[12:08] Today a person says this, tomorrow a person says that.
[12:11] the truth changes over time.
[12:14] If it stays, however, in your knowledge base,
[12:17] in your search base, your top case
[12:20] will always be full of pretty much irrelevant information.
[12:24] So in VZ, for example, something which
[12:27] is considered duplicative is either another piece of context,
[12:32] like your database has changed and I can actually use it,
[12:35] or it is simply redundant and you will remove it
[12:38] from your knowledge base.
[12:41] The second piece is like, same reason as before.
[12:45] If your information is old, right?
[12:48] If you suddenly are working with data from before the 2000s,
[12:51] if you're working with information
[12:53] which was only relevant last week,
[12:55] not relevant this week,
[12:57] in the future, some of the use case
[12:59] when agents actually get into production
[13:01] for let's call it the most high-stakes use cases,
[13:04] that has detrimental effect.
[13:05] And we have done a lot of evaluation around what is the effect of making sure that your
[13:15] unshortened data quality is maintained, is consistent, and is always handled deterministically
[13:22] in the same way.
[13:24] And what we are essentially seeing is that if you have a thousand files and 30% of the
[13:34] and 30% of your files are stale or duplicative,
[13:39] it can happen that up to 80% of your actual context
[13:43] your agent uses to answer the question
[13:45] is filled up with stale information.
[13:49] Which means that it actually uses 80% of completely redundant,
[13:55] useless information and knowledge.
[13:57] And this has to be matched.
[14:00] What we have seen is that by running on the exact same task, so this is a rack chatbot, it's not running an actual like let's say cross code task or a codex on a code loop task, it was simply like multi-hoc rack evaluation.
[14:15] And what we saw is that if we look at recall one, we pretty much doubled recall.
[14:23] And overall, in group our accuracy, so that path completion, failed between 10 and 15%.
[14:31] And why is this so significant? This is so significant because this has nothing to do with the use case you're working with.
[14:38] This is true, independent of what you're actually using the data for.
[14:44] Because if you actually know what you want to use your data for, you can apply random
[14:49] DCM all other data for the demand supply.
[14:52] Duplication of fractions is a true normative problem.
[14:57] And yesterday, there was a lot of context topics, a lot of context flags around here.
[15:05] I wanted to give a very, very quick demo of how you would use a GCS decay to prepare
[15:11] a common...

## 6 — Estande Deasy/Collibra (parte 2)

[00:00] Creating tags is great, but you don't want to use them.
[00:02] Creating tags means going without actually using them.
[00:04] So, we go back,
[00:06] we're going to add these tags again.
[00:08] Now I'll show you how we can export it
[00:09] and deliver this metadata that we just created.
[00:12] There's a couple of different ways.
[00:15] To start, I mentioned
[00:16] before, Kleber owns us,
[00:18] Kleber acquired, so we do natively
[00:20] integrate where Kleber is a
[00:22] governance tool, so if you want to start governing
[00:24] that unstructured file that's structured,
[00:26] you can directly export everything
[00:28] into Kleber.
[00:28] or you don't want to use Cleaver, that's fine with us too.
[00:32] You just want the metadata, that's a-okay with us.
[00:35] Here you can export as files in CSV, JSON, file, or chunk level.
[00:41] You can get a Python SDK code snippet where you can start uploading that to your notebooks
[00:45] or we can export this directly into the source.
[00:49] So as I mentioned, I'm connected to that SharePoint that you saw before.
[00:54] Just as a brief recap, no idea what the hell is in here.
[00:57] when I export, now I have all of that metadata I just created.
[01:02] And now when I'm filtering through engineering docs, PII,
[01:07] if I'm filtering through 10,000 manually, that can take me months, if not years.
[01:12] Two buttons and I now have all of my engineering just at the top.
[01:16] I can deliver those in seconds.
[01:18] So trying to get those months-long AI readiness that I mentioned before,
[01:22] you can narrow that down to weeks at most.
[01:24] Then you integrate this output with some database source so I can google it in agents and whatever I want.
[01:32] Exactly. SharePoint is just one example. That's just how we have it set up. We work with all different sources.
[01:37] We're actually expanding the sources that we have to take native capabilities to try and make it even more seamless than it is now.
[01:43] And all the company was bought by Colibri?
[01:47] Yes. So Colibri is a parent company. Even up here, it's like Colibri.
[01:52] But we do want to keep the brand, just keep Dizzy a little bit separate.
[01:57] That way you could buy just Dizzy as a platform and you don't need any Calibra.
[02:02] So Calibra is a, what do you say that?
[02:06] We call it the parent company.
[02:09] So Calibra owns...
[02:11] For governance.
[02:13] Yes.
[02:14] Or do you call for it?
[02:16] Is that it?
[02:17] Calibra is actually a governance tool.
[02:20] So, Calibra as a product governs data.
[02:25] We catalog things, apply data quality rules, and it kind of goes hand in hand with unstructured.
[02:31] That's why we found that a lot of people love governing structured, but most of their data
[02:37] is unstructured.
[02:38] So, we've got this, so now we can structure the unstructured and then start governing
[02:43] it as structured.
[02:44] Very nice.
[02:45] Yeah.
[02:46] It's a cool product.
[02:47] Yeah.
[02:48] It's a cool product.
[02:50] How did you get into daisy?
[02:52] I actually technically worked under the Cleaver umbrella.
[02:58] But when I hired DZ to meet with people to start learning, I just jumped at it because I thought it was a cool product.
[03:04] I ended up really enjoying it, worked with it pretty closely, and then I came here because I know who the very most Cleaver folks are.
[03:13] You remember my use case that I said to you before.
[03:18] Do you see that there would fit or is it different from the ground?
[03:25] I think it could. It's a unique use case where you're trying to fit it directly in the pipeline.
[03:30] I think that would probably take a little bit more of a longer conversation.
[03:33] We could actually talk about specifically your environment and how this would fit Obviously at the conference it kind of a little bit harder just word of mouth but if you could show us more visually what you trying to accomplish We could set up a conversation get more of our technical folks that know the back end
[03:51] Yeah, what I just told you is the dream. While we've been doing it for a couple of months and restructuring this data and processing data and it's some sort of a manual.
[04:01] It is connecting the whole company in a different area.
[04:07] Absolutely.
[04:07] acquisition, sales, and post sales.
[04:11] And the non-technical people are the ones that need the data
[04:13] and they can never find it.
[04:15] Yeah, so my salesman never knows where,
[04:18] if we have a client in a specific region or city.
[04:21] Hit the nail on the head, my friend.
[04:23] That's really what this came from.
[04:25] So, I have a bunch of photos of the,
[04:28] the , how do you say that?
[04:30] Social proof, the proofs everywhere.
[04:32] We have a bunch of heads that did perform well,
[04:36] that didn't, we have to class that with a profile so we can see it.
[04:41] This kind of profile came from this kind of communication.
[04:45] And you didn't see it.
[04:47] I'll tell you what, let me scan your guys' badges, and then I'll give you a little bit of our information.
[04:53] You can grab some swag.
[04:54] It would make sense for us to just connect at one point where we can dive a little bit deeper
[04:58] and just do a five minute overview.
[05:00] Right? I'll tell you what, you still haven't heard of it.
[05:03] I don't know. It's probably just, I don't know if this exists, but it's a problem with every one space.
[05:13] So we're trying to just make sure that people know what it is.
[05:17] Make sure it's a little bit more aware.
[05:18] Now you want to connect?
[05:19] Yeah, I hope that was really quick.
[05:22] Do you need to have the key to this?
[05:24] It just gives us the email, so I give this to a marketing post.
[05:29] They'll send out an email.
[05:30] If you want to connect, I'll send you a call.
[05:32] Oh, thank you, sir.
[05:37] How'd the kid do?
[05:38] I'd like some stickers, though.
[05:40] Absolutely.
[05:41] How'd the guy do?
[05:45] If you guys would like, this also just has a little bit of a high-level overview.
[05:50] I got some stickers, too.
[05:52] Got it.
[05:53] You want some stickers, too?
[05:54] Yeah.
[05:54] Thanks.
[05:55] You got it.
[05:57] It was great getting to meet you guys.
[05:58] Yeah.
[05:59] It was a pleasure.
[06:01] Absolutely.
[06:02] I just got here today and I saw the speech from the CROCB.
[06:12] I was just looking for the aesthetic around the compound.
[06:19] I just got here so, first impressions.
[06:21] Cool man.
[06:22] There's a cage robot fight where you actually get to control the robots over there.
[06:27] For real?
[06:28] Yeah, yesterday it was a puppy cage and they had just a bunch of puppies in the play room.
[06:31] I think it's a little bit harder to hear about.
[06:34] They're here, but they didn't sing.
[06:36] Honestly, they were real cool.
[06:38] That's a classic one.
[06:40] That's pretty cool.
[06:42] We're from Brazil.
[06:44] We've got some Brazilian family there
[06:46] freaking about FIFA right now.
[06:48] So we're really, really excited.
[06:50] For real?
[06:51] Oh yeah, I'm really excited.
[06:52] You live in here or is it Brazil?
[06:54] I live actually in Denver, Colorado.
[06:56] Just came here for a conference.
[06:58] It's been cool.
[06:59] It's a lot of stuff to see here.
[07:01] You guys will enjoy it.
[07:03] What do you think about California?
[07:05] What do you think about California?
[07:07] I like the food. You like the food?
[07:09] You gotta know where to look.
[07:11] Where do we look for food?
[07:13] We come from Brazil.
[07:15] Actually, Rio.
[07:17] You know that?
[07:19] Yeah, but like fish,
[07:21] Italian a lot of food A lot of food One thing I was excited about was that we in a lot of state I been here like six years now so I was really excited about the fish
[07:33] I got some good sushi.
[07:34] A lot of good fish.
[07:36] Yeah.
[07:37] We also have a lot of chowder, so we're going to get some chowder.
[07:41] Yeah, I know that.
[07:42] I know that.
[07:43] Yeah.
[07:44] Are you from Brazil?
[07:45] Yeah, we're from Brazil.
[07:46] Oh, my wife from the United States.
[07:48] I got a shirt that said Brazil with a Z not an S.
[08:03] She's giving me so much pain.
[08:05] I go, this is a lucky shirt.
[08:07] We haven't lost this.
[08:09] It's one day, man.
[08:11] It's a Z, man.
[08:13] I was like, who gave you the green?
[08:15] Then she probably shot you.
[08:17] No, I'm not shitting. I think that's the worst shot you get to the point.
[08:22] Like, I can yell at my 10-year-old son in the workspace.
[08:27] Stop. Santa, sit. Go up, go up.
[08:31] And then she grabs the sandal. You know what that means.
[08:34] Oh, yeah. That's terrifying.
[08:37] Oh, yeah. She did it the first time, but the kids starts running away.
[08:40] I feel like I'm running.
[08:43] Take it easy.
[08:45] I'm like, what the hell?
[08:47] Now I hear her yelling at me.
[08:49] She says,
[08:51] I'm like,
[08:53] I'm like,
[08:55] What?
[08:57] What about the food?
[08:59] What about the food?
[09:01] Oh my God.
[09:03] She spent three hours cooking.
[09:05] You know what it's like.
[09:07] For me, it's like...
[09:09] In Brazil, she tells me all the time.
[09:11] I'm like, ah, that one sucks.
[09:13] She's like, I'll touch you.
[09:17] Yeah, I know.
[09:23] She'll do everything's gonna be nice.
[09:25] She can't put enough variety in it.
[09:27] She's staying.
[09:29] I need a hug.
[09:31] I need a hug.
[09:33] Yeah.
[09:35] They were helpful.
[09:37] They were helpful.
[09:39] We got Norway next.
[09:41] Yeah, Norway. I think we'll be in Norway. I think Holland is the only really good town.
[09:45] But it could be easier than Japan.
[09:47] Really? I think Chicago, yeah, they were, I think they were way underrated. They were good. I think, I'm worried about them.
[09:56] It depends here in Norway and in the world.
[09:59] Norway is not low.
[10:01] Because that big, long guy? That's Holland.
[10:04] Yeah, Holland. They don't have big bikes. They just move around, right?
[10:08] I don't know.
[10:08] They don't.
[10:10] But they are the toddler team.
[10:12] They're not as fast.
[10:13] But they're not as fast.
[10:16] Like, just in bat bat, I mean.
[10:18] French games.
[10:19] Oh, yeah.
[10:20] Yeah.
[10:21] Three up.
[10:22] Yeah, it's crazy.
[10:23] I mean, these guys had to be on all the other sides.
[10:26] It's only three to nothing.
[10:28] It should be for six to nothing.
[10:30] How could it be three to nothing?
[10:31] It is something.
[10:33] You hit that hit the corner like twice.
[10:35] I mean, it should be in the sixth.
[10:38] It was abusive. It was like, I'm like, not bad for Sweden, I'm like, we don't want to go.
[10:44] You're a little afraid of friends.
[10:46] Yeah, in Argentina. Oh, that's the other thing.
[10:49] She's calling me.
[10:51] I was going to say, she's like...
[10:55] She tells me, like, the last time I saw her on the bus was, like, she said, um,
[10:59] she's like, hey, what about the time in Ireland when I went to the movies?
[11:03] I like so they in Boston like these are my people she goes I was like what the end of the park I like okay look can we can we have to beat them like five nil Can we five nil like four to one give one single nuts
[11:34] I was shocked and I was like, no, there's no calls for real, always calls for them and look at all of them.
[11:40] They're just kind of like, what? I'm like, yeah.
[11:43] They were just really dirty.
[11:46] Actually, a pair of my ears were just really dirty the other day.
[11:50] Yeah, so I was just like, all right.
[11:52] I'm like, what about Miss A?
[11:53] She's like, he's the goat.
[11:58] She's like, sorry, I'm not.
[12:00] He's the goat.
[12:04] So I told him, listen, this is the son of the great.
[12:08] Son of the great.
[12:10] I told him, I said, wouldn't you be the best?
[12:13] You want to be the best?
[12:15] Bring the beat.
[12:17] Come on.
[12:19] That's what I want.
[12:21] Come on.
[12:23] I'm like, dude, come on.
[12:25] Don't fear them.
[12:27] We're Vikings, man.
[12:29] We're freaking...
[12:31] It will be a good game.
[12:33] Well, like I said, I think we can get past Norway.
[12:36] Then after that I can look at where the brackets are.
[12:39] I think France...
[12:41] England.
[12:42] Who's won?
[12:43] England.
[12:44] Yeah, England won.
[12:46] Yeah, England's always jinxed.
[12:48] If you saw the last game, they were still jinxed.
[12:51] They've done a lot of struggle to win.
[12:53] They can win some corner kicks, but they don't have the...
[12:55] Yeah, I don't think the US is going to go far.
[12:57] England, I think they're...
[12:59] France, Argentina...
[13:01] I can't wait to show it.
[13:03] That was great.
[13:05] Spain.
[13:07] Brazil.
[13:09] I would love to see a scan.
[13:11] Yeah, you guys can scan.
[13:13] Oh yeah, we already did.
[13:17] What do you guys mean by scanning?
[13:19] Is the email or
[13:21] you have like a goal for scanning?
[13:23] It's an email.
[13:25] Yeah, yeah.
[13:27] Yeah, we mentioned AI.
[13:29] Yeah, we'll have some AI, we'll figure out where you live, what your personal information is.
[13:34] And we can go over here, we can stay in there.
[13:37] Lock our doors.
[13:37] We can chat.
[13:40] Okay, guys, thank you.
[13:42] Yeah, man, thanks.
[13:43] How did you expect to get in there?
[13:45] Yeah, have fun, guys.
[13:47] Keep in touch.
[13:48] Thanks, man.
[13:49] Enjoy the rest of your day.
[13:50] Thanks, man.
[13:54] I don't want to leave.
[13:56] It's beautiful.
[14:27] One more hour.
[14:32] One more hour.
[14:33] All right, all right.
[14:35] Oh, just got some other stuff.
[14:36] Let's talk a little bit.
[14:39] Thank you, man.
[14:39] Thanks.
[14:43] Oh, it's just full of money.
[14:45] All gold.
[14:46] All right, bye.
[14:48] Vamos.
[14:49] All right, bye.

## 7 — Estande knowledge graphs

[00:00] Add anything that you want, so like the quantity of information that you were talking about is not a problem.
[00:07] And then you think about it as a knowledge graph.
[00:12] So like you mentioned, for example, media, right?
[00:16] So there would be power nodes.
[00:18] So you create, are you data scientists or engineers?
[00:21] No.
[00:22] No.
[00:22] Not engineers?
[00:23] I'm a marketer.
[00:25] Ah, okay.
[00:27] Ah, that's okay.
[00:28] So basically the way it works is that you create like a knowledge layer, right?
[00:36] So a graph. But the graph is not just like superficial.
[00:40] It has like all information is actually... you have plenty of dependencies, you can make loads, right?
[00:49] If you see Obsidian, it has something like this, like visual.
[00:54] very very strongly
[01:00] because sometimes people see us as just like um
[01:08] mind maps so we're not so so we adapt but with like really the depths of the knowledge
[01:17] underneath each yeah so we don't just like the visual parts this is obsidian uh and you can
[01:27] so here's your notes and these notes are actual files in your computer you can synchronize it with
[01:33] the cloud uh and then you put tags and you you create these connections hyperlinks
[01:39] connecting the the documents and the dots and it becomes like a real mess so right i want to i want
[01:48] to understand how how is this different or the same yes okay so i should uh
[02:09] I don't know the code enough, so I thought...
[02:22] So it's the same idea?
[02:24] Yeah, every node is a node.
[02:26] Right. But it's not just like...
[02:29] So the power of this is that you don't have a database.
[02:34] for your database that you need and where you are more confident.
[02:39] And so when you so it almost like a layer on top of everything that you publish of data of all your documents And this layer operates your content Yes it a knowledge cloud
[02:56] And we also have algorithms, like page length algorithms connected to the data.
[03:06] you can actually, when you port the database, you can actually look at the threads for Google
[03:13] or use that for a search.
[03:15] So actually it is better for tables?
[03:19] Data?
[03:21] Usually, no. So tables are one data model, this is another.
[03:29] So this is more like for relationships.
[03:32] So if you have relationships in your data and multiple apps,
[03:38] and if you tell me the set of your data,
[03:42] it looks like the one that they've created.
[03:45] So, and again, it's not just the visual,
[03:47] it's the physical, it's like,
[03:51] so let's, for example, the social network, right?
[03:55] So you have a bunch of other things running,
[03:58] so you can watch them find that out,
[04:00] And then you can run it in a different way.
[04:03] You can do it with other types of networks.
[04:08] You can run it with an internet network.
[04:12] You can go to a web browser and you can match.
[04:18] Yeah, or match or look at the Google...
[04:25] Do you have a case to sell it?
[04:35] These companies have used it in...
[04:38] So we have, what did you mention?
[04:41] Recommendation system?
[04:43] So that's a software.
[04:46] So we have Netflix as a customer.
[04:50] So the recommendations, for example,
[04:54] So, you structure all the data from the show, from the movies, from the customer's match.
[05:02] So this particular show has connections to all of these.
[05:05] But this customer has connections to all of these, so let's find out.
[05:09] And then you can see the connections between the networks.
[05:13] How much of it is actually AI or how much of it is algorithms?
[05:20] It's both, I mean, yeah, separate both.
[05:25] Yeah.
[05:27] And so, but we have that supply chain to create them, right?
[05:32] Because like you have the matching supply chain you have like a package you know the package will be sent to this warehouse and then maybe the package is not made for you right So and you work you give another package and then you show that it faster with another package and then you give another package
[05:50] So, all this has basically supply chain problems, and you can solve only one of these problems.
[05:58] Because he has, if he hasn't been here the whole, he cannot do that with the table.
[06:04] Right? Because he doesn't have the table to do the housework.
[06:08] Right?
[06:10] Right?
[06:12] I mean, the check, the whole thing.
[06:16] Right? And two months later, he said, oh, I'll get it.
[06:20] Right?
[06:22] and you do not have analytics.
[06:24] You have to have a mechanism
[06:26] that you have like a truck steering
[06:29] and a truck that can go anywhere.
[06:31] And so sometimes we have a truck that goes in one direction
[06:36] and then from one end it will go the other.
[06:38] And so you can see all these different things
[06:41] in the database
[06:43] and we've evaluated more than just people analytics.
[06:48] It's a huge, huge difference.
[06:52] is
[07:09] yes
[07:22] for example you have a first name and a last name but then you have a second last name or a second first name
[07:30] and so you use sometimes that way you use like you use sometimes you use your middle name
[07:35] sometimes you don't and then like we hold them in resolving actually the identity of that so
[07:43] government uses us to fight to see corruption because otherwise you have two different problems
[07:52] but
[07:54] they should
[07:56] they should so many things
[07:58] but
[08:00] as for the
[08:02] as you say finance
[08:04] as for the credit score
[08:06] how is that in English?
[08:08] credit score
[08:10] credit score
[08:12] yes
[08:14] in Brazil it's a big thing
[08:16] because people use to
[08:18] yes for like credits
[08:20] Yeah.
[08:21] Yeah?
[08:21] Yeah.
[08:22] And then what about it?
[08:23] Oh,
[08:23] she was,
[08:24] she was yeah yeah yeah Yeah yeah No she was she was a company I always do marketing in America
[08:36] So here it's big as well but it's like there are like some companies are really wise
[08:44] I think there are four or five of them and they own the market.
[08:51] Yeah.
[08:53] Yeah, so it's going to be a good looking.
[08:57] I mean, I don't want to buy it.
[08:59] Yeah.
[09:01] What do you think about this?
[09:03] You can start for free.
[09:07] So we have open source.
[09:09] We have open source so you can have like a community edition.
[09:13] you can start with for example
[09:27] then you can also um
[09:43] So you just search Google for Jada Fonda.
[09:50] is
[10:00] Is that a page?
[10:02] No.
[10:04] The efficient road is a road, so don't be too efficient, right?
[10:08] No, that's not our way of explaining things.
[10:12] Okay, so this is what we put together for the page.
[10:16] So, if we build a page with all the races, then we'll have a home page.
[10:22] And so, if you come down to the left, you'll see the home page.
[10:26] So this is our home.
[10:28] And so, let me come down.
[10:34] So if you take this, I'll give it to you.
[10:36] No, it's okay.
[10:38] Okay.
[10:40] Thank you very much.
[10:42] You're welcome.
[10:44] So I knew you were from Brazil.
[10:46] I think that's your name.
[10:48] You know what?
[10:50] I knew you were from Brazil.
[10:52] How's that?
[10:54] And so we have actually a presence also.
[10:57] Where are you? Are you in São Paulo?
[10:59] No, I'm not in the South.
[11:01] Way better in São Paulo.
[11:02] But he told me that here it's going to resume.
[11:05] Yes.
[11:06] We're one hour away from São Paulo.
[11:07] Right. So we actually have a contactee in Brazil.
[11:13] So yeah, the solution is connected.
[11:17] Do you need help?

## 8 — MCP Apps — dados vs UI

[00:00] Once again, MCP AppStock has a pretty easy way to handle it.
[00:07] There's this updateModelContext method, which lets you pass that string.
[00:12] For MCP apps, there's a single string, so if you want to track multiple bits at a time,
[00:20] you have to append multiple things to the string.
[00:24] straight, but this is an example from the MCP apps documentation where basically this
[00:32] is a shopping cart application and they add the total cost of all the items on the shopping
[00:38] cart so the user can ask for, you know, tell me information about the items on my shopping
[00:44] cart.
[00:44] So these two things, you can do an app that the model can kind of see what's going on,
[00:54] but it doesn't necessarily make a really good MCP app yet.
[01:00] Because it gives you some UI that looks like what you want,
[01:04] But the thing that I usually do, I don't give Claude my VC problems to solve.
[01:15] I give Claude my regard problems to solve.
[01:17] If I just wanted to do one search, I would go to the web and do one search.
[01:22] I would do a whole bunch of searches.
[01:23] This is out of date because there's not five here yet, but this is a screenshot from two days ago.
[01:32] But yeah, so this job search is, hey, I'm looking for this title.
[01:39] I'm really too relocated, so I want to search across a whole bunch of different cities.
[01:44] I'm looking for the highest paying options, so I want you to just cherry pick people out of there.
[01:49] There's some industries that I absolutely don't want to work in.
[01:53] Text MCB does really well We all see this right Claude will do 10 different searches 15 different searches It pull out all the individual pieces
[02:06] and it gives you a nice table at the bottom,
[02:09] which is super nice.
[02:12] But with the MCP app that we were just discussing,
[02:15] we said, hey, my results are going to be displayed in the CBI.
[02:21] No, Claude will call them once and then they'll be like, oh, I guess the results are already displayed.
[02:29] I'm not going to do a deep dive.
[02:31] You as a user are not going to want 10 different parasels.
[02:37] And Claude will also notice that it's already been displayed and it won't call to show 10 different parasels.
[02:45] And so what you really want to do, this is rule three, this supersedes all the other rules, which is basically you want to separate your data processing from your UI rendering.
[02:58] And this particular wording I stole from OpenAI apps SDK documentation.
[03:10] There's a couple places where they say this.
[03:12] But basically, they want us to separate your data processing from your UI rendering.
[03:19] So the job search that we had, we're just going to have that be a standard text-based MCP application.
[03:27] Cloud can call that as many times as it wants.
[03:30] And then we have a render tool that either you can pass, you can have the model basically pass all the data that it wants to render in,
[03:40] or you can do a reference to it.
[03:43] So in our particular case, we had search jobs.
[03:48] Now we have a search jobs that doesn't return to UI.
[03:51] And we have a random jobs widget that takes a list of IDs.
[03:56] And so that list of IDs can be you know Claude can do a search It can get a hundred different jobs that it cares about It can filter those
[04:07] It can find five that it cares about,
[04:09] and it can show those five to the user.
[04:13] Now, as you make these render calls,
[04:18] you need to update the descriptions to say, like,
[04:20] where did they get the data?
[04:22] What format the data should be?
[04:24] But it's a fairly easy mechanism to update your tool description
[04:28] to say, you need to always call one of these three tools
[04:32] first in order to get the data that you're
[04:35] going to use for rendering.
[04:37] So Search Shops, this is a pretty good example
[04:45] of where we want to store data from rendering.
[04:49] I think there's a ton of other, like, in most industries,
[04:53] you can kind of come up with like, hey, where do I want to,
[04:56] you know, where do I want to split, like,
[04:58] I want the model to be able to explore this data,
[05:02] and then I want it to turn around
[05:04] and choose to be able to render it, right?
[05:06] Like, there's examples of, you know, e-commerce, right?
[05:12] Like, a bunch of e-commerce options.
[05:16] If you've got a map, you know,
[05:17] maybe you want to come up with like five different addresses
[05:21] and pass in addresses.
[05:23] The other thing that you can do is you can let the model be a lot more creative.
[05:27] One of the things that we've seen in some of this text-based stuff is that the model will say,
[05:35] this is a reason why I picked this one, or this is a reason why this is really good.
[05:41] And so potentially we can add something to the render jobs widget where we can say,
[05:45] give us an ID and a reason why you think that this is a good fit.
[05:50] or give us an ID and highlight a section of the job description that is really good.
[05:56] So you can get really creative with your render tools to be able to give some extra character that the model can inject into those so that you got a much better experience for the user
[06:13] So the key takeaways, right, when building NCP apps you want to focus on the data before
[06:22] you focus on the UI, which that's opposite of how we've been
[06:27] like, here's all these, this is MCP apps.
[06:29] Like, it's how I put UI into ChatGPT.
[06:34] I think if you want to really have a good MCP apps
[06:37] experience, you need to look at this, what data do I want to,
[06:43] what data do I want to give the model, what data do I want it
[06:45] to be able to do?
[06:46] And then rendering is a side effect of that,
[06:51] or it's a result of the model exploring the data.
[06:57] And then I think small composable tools, great.
[07:00] So basically, maybe there's two or three different ways
[07:07] you can search for jobs.
[07:08] You can build two or three different search tools,
[07:10] and then there's one render tool.
[07:12] Or maybe there's two render tools,
[07:15] and one that's a list of jobs, one that's
[07:18] highlight one particular job.
[07:20] So you can build a bunch of much smaller tools.
[07:24] The descriptions can be fairly simple,
[07:25] so you don't overload the model.
[07:28] But it gives the model flexibility
[07:30] about how it wants to explore the data
[07:32] and how it wants to work with the tools.
[07:35] So that's basically my talk.
[07:39] I'm going to go a few minutes fast.
[07:43] But I don't have a booth that I'm going to hang out in.
[07:46] I'll hang out at home if anyone has any questions.
[07:50] And I can be the owner of my last name or my first and last name on most social media platforms.
[07:57] Thank you.
