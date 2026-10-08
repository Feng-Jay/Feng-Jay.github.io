---
tags:
  - paper
  - fp-filter
---
## Target
This paper also aims to improve SAT's precision by a post-processing manner.
## Method
![[BugLens.png]]
Given a vul report, BugLens will first with the hypothesis that it may be harmful and to explore whether it can reach real sensitive program points. 
Then for these left reports, it will travel backward  and collect constraints. It will utilize LLM to check each program points. 
For each interested pp, It will collect its precondition and postcondition. And finally let LLM solve this by reasoning.

The whole process is purely rely on prompts.

## Pros
* Solve the feasibility issue in some extend.
* Exec free.
* Good Performance
## Cons
* Experiment is limited, do not know whether it can fit complex scenario
* Solve limited: all procedures are appoint to LLMs.

