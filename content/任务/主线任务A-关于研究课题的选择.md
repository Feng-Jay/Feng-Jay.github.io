---
tags:
  - research
---
## 2026.03.23

1. 在1月中旬投稿完论文后，我度过了寒假、完成了硕士毕业论文并准备在今天提交。终于抽出身来思考现在的课题选择。经过之前论文的调研，目前对新课题的大致想法是做一个针对特定类型缺陷的FP过滤工具。为了进一步确定该课题的可行性，我需要去调研当前已有研究的进度与当前vuls检测工具的现状。
2. 上午再次总结了[[LLM4PFA]]论文的方法以及可能存在的漏洞点
## 2026.03.25
1. 上午回顾了一下BugLens的论文和对应实现。发现其方法设计虽然思路很像，但最终的实现似乎并不能很好地解决复杂场景的问题？如果存在复杂的控制流怎么办？
## 2026.03.30
1. 上午回顾了一下rust语法，然后check了一下BugLens所用的实验数据集，发现十分简单，全部仅涉及单个文件内的数据流传播
## 2026.03.31
1. 今天check了一下BugLens的实现，发现有很多粗糙之处，且其codequery的部分无法支持linux-kernel的查询，无法成功构建数据库，需要重新写一版。
## 2026.04.01
1. Happy Fool' Day! 尝试调一下Agent方法，通过配置一些工具让LLM进行vulnerabilities检测。
2. 突发奇想，直接拿claude code来跑一下，看看能不能测出对应vuls，如果效果可以的话，就配一下skills？
	在linux/mm 中探索是否存在CWE-401, Claude Code + Claude-Sonnet-4.6:
	 Cost:￥30 1h20m
	 ![[claudecode-try0.png|657]]
	![[claudecode-try.png]]
   然后在CVE-2022-47941一个具体例子上试了一下，发现并未检到对应vul
   Cost: ￥3  3mins
   ![[claudecode-try2.png]]
   ![[claudecode-try3.png]]
	Codex + gpt-5.4 
	![[codex-gpt-5.4-try0.png]]
	依旧没有注意到相关的Source/Sink，没测出来

3. 把BugLens调通了，跑了一个case，目前看结果似乎并不理想，该方法无法对不合理的warning报警（即不理解项目与文件意图）
	![[buglens-try.png]]
## 2026.04.02
1. 跑了一下Codex的例子，发现效果也不是很好，基本确定用Codex和Claude Code作为新的baseline
2. 找了一下数据，寻找一个增加in-house数据的合理解释，目前的解释就是由于C/C++的build比较复杂，所以就每个CWE中找vuls数量最多的top-3 projects作为实验对象，其中人工过滤掉了一些重复的例子。
## 2026.04.03
1. 上午整理一下数据，然后开始标注的工作。分别增加21/29/49个新的vul candidate
    > ![[dataset-info.png|300]]
    
## 2026.04.07/08/09
1. 4.5.6三天假期休息，然后开工后的三天把新选的这些vuls进行了一遍筛选，排除掉了一些fuzz出的vuls, 需要运行时生成的代码/lib，out of scope, 而且排除了一些重复的cases。然后标了一遍source/sink的定义。
2. 目前C/C++部分新增的vuls包括11个CWE-401/15个CWE-416/21个CWE-476
   单纯使用Claude Code:
   before: 40. 10. 14 -> 51, 25, 35 -> 500块! Java那边还有150个，750块
   Codex基本上0成本
3. 是否需要添加Source/Sink的标注呢？？？感觉有些方法根本就不好加，比如knighter
   感觉可以sample一些做实验，比如一类Source/Sink mismatch最严重的vuls? 全加成本似乎太大了
   那就RQ1: 所有工具默认跑-> 分析发现一些工具原因是Source/Sink不匹配 -> sample 一些跑oracle的source/sink。
   一些原因是跨越层级太多，再设置工具增加层级参数。针对子问题挑部分数据Ablation就行感觉。

   加的新模型就用gpt-5.4? 在leaderboard上SOTA且Claude的rate limit 比较严重。
   
## 2026.04.10-12
1. 配置了Codex和Claude Code作为新基线，并已经开始配置实验，Codex已经跑完一大半
2. Repoaudit目前正在跑没有提供Source/Sink API结果的数据
3. 今天分析一下Codex的检测结果，然后配置Knighter使用新模型和在新数据上跑
 Codex Results (SOTA):
  CWE-401: 23/40; CWE-416: 4/10; CWE-476: 7/14
![[论文中的结果.png|300]]

## 2026-04.13-16
1. 所有baseline方法均使用gpt-5.4运行
2. Repoaudit差新增数据部分，IRIS已经跑完，LLMDFA正在跑，Knighter的checker-gen已经跑完
## 2026-04-17
1. KNighter的checker-refine部分也跑完了
2. Repoaudit新增数据部分也正在跑，RQ1要补充的实验基本就剩下两个传统的SAST

## 2026-04.20-04.25
1. 尝试将CWE-772 (Jleaks)中的Java projects成功compile，目前对所有的maven项目 (29个)都手工编译成功；Gradle项目中的6个自动编译成功
2. Why some projects failed to compile:
 > * 一些项目在特定commit上并不能build成功(build doc需要)
 > * 一些特定依赖现在已经不可用 javax.annotation.concurrent missing (IoTDB) edu.umd.cs.findbugs.annotations missing, 这些依赖有些是JDK的问题，有些依赖并非发布在central maven上，需要指定第三方的repository link，而这些link已经不可用。
 > * 需要本地配置一些环境：例如需要本地安装一些libav的版本
 > * 一些涉及多模块之间依赖的项目需要特定的build 命令与顺序
 > * 一些项目在build期间需要下载其他的bin文件，而有些link和版本已不可用
 > * 一些项目在build过程中加入了check-style之类的检查，但其实源代码并不符合要求
3. 目前已经成功在上述的35个Java projects上利用Spotbugs进行检查；剩余的CWE-22/78/79/94对应的Java projects也都完成了检查
4. Spotbugs setup:
>  采用Spotbugs的默认rules和 https://find-sec-bugs.github.io/bugs.htm 安全rules插件进行检测。检查强度为default
5. ClaudeCode结果分析
> 看了ClaudeCode在Linux-Kernel上的检测结果
> Claude Code Results(SOTA):  CWE-401: 30/40;  CWE-416: 6/10; CWE-476: 9/14
> Codex Results: CWE-401: 23/40; CWE-416: 4/10; CWE-476: 7/14
> 即使是当前最SOTA的LLM+Agent也无法测出所有的vul，且上述检测结果是在提供了一定的定位信息的情况下：
> You are a security auditor. \n        Your task is to analyze current project and determine whether it contains **{CWE-476 NULL Pointer Dereference}** vulnerabilities.For this project, potential vulnerabilities are localized in files under **{fs/btrfs/}**. the source of the vulnerability is located at **{fs/btrfs/ioctl.c}**, and the sink is located at **{fs/btrfs/volumes.c}**. And the dataflows/sources/sinks are connected through this whole project, the propogators may involve other files. Please provide a detialed analysis of this project and find corresponding vulnerabilities if they exist. 
> Typical Examples:
> CWE-401: https://github.com/torvalds/linux/commit/1399c59fa92984836db90538cf92397fe7caaa57
> CWE-401: https://github.com/torvalds/linux/commit/8572cea1461a006bce1d06c0c4b0575869125fa4
> CWE-401: https://github.com/torvalds/linux/commit/a2cdd07488e666aa93a49a3fc9c9b1299e27ef3c
> CWE-416: https://github.com/torvalds/linux/commit/a53046291020ec41e09181396c1e829287b48d47   [Claude's Analysis](file:///Users/ffengjay/Postgraduate/Prepare4Phd/LLM4Security/results/claudecode_in_house_without_localization/linux-a53046291020ec41e09181396c1e829287b48d47-CWE-476/report.txt)
> CWE-401: https://github.com/torvalds/linux/commit/aa7253c2393f6dcd6a1468b0792f6da76edad917  [Claude's Analysis](file:////Users/ffengjay/Postgraduate/Prepare4Phd/LLM4Security/results/claudecode_in_house_without_localization/linux-aa7253c2393f6dcd6a1468b0792f6da76edad917-CWE-401/report.txt) 
> 另外在分析结果的过程中发现绝大多数的vuls, Claude Code在进行分析的时候都生成了对应的修复Patch，且大概率是正确的。可能是由于pattern本身比较简单，以CWE-401为例，大部分修复均为在sink点插入free/goto到已有的free代码段。





## 2026-08-14 
目前把研究方向focus到拿LLM+KLEE去做PoV生成的任务
正在复现baseline: SAILOR, 发现一些cases:
[[SAILOR-Cases]]
## 2026-08-24
上周尝试分析了一下openssl项目的call graph，发现还是有比较多的坑的：

把课题的流程更具体化了一些：
	给定Vul相关信息，找到vul specific的程序流，挖掘显式约束（if/while/for/assert conditions） 与隐式约束（例如数组长度len和数组alloc长度相等），将从entry->sink的程序约减为一些约束，然后使用KLEE执行进行验证。
