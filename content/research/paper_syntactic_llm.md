---
title: Syntactic Capabilities of LLM
draft: false
tags:
  - LLM
  - PL
  - SE
description: To what extent can LLMs be used to understand programming languages?
date: 2025-04-01
---

Recently, I'm trying to explore potential applications of LLMs in SE tasks, such as Automated Program Repair and Static Analysis. And the capabilities of LLMs on these tasks are build on their syntactic understanding of programming languages. What's more, I'm also insterested in what extent can LLMs be used to understand and programming languages.

So I read this paper, [ICSE-NIER'24: Which Syntactic Capabilities Are Statistically Learned by Masked Language Models for Code?](https://dl.acm.org/doi/10.1145/3639476.3639768).

In this paper the authors find that LLMs under study fail to predict some syntactic capabilities.

## Methodology

In this paper, the authors proposed a evaluation method named [SyntaxEval](https://github.com/WM-SEMERU/SyntaxEval).

Its evaluation process mainly consisted of two steps:

- Evaluating syntactic capabilities: 
  1. It first find one AST node type to be analyzed and then replace all AST node of this type in the AST with label `<mask>`. 
  2. Employ the tested MLM to infer the masked tokens, and then travel the AST using in-order traversal algorithm. 
  3. Compute 3 similarity metrics (i.e., Jaccard, Levenshtein and Sorensen-Dice) of the list of predicted nodes and the ground truth nodes.

- Evaluating Causal Interpretabiltiy: 
  1. To analyze the performance of MLMs on the masked source code, SyntaxEval design a treatment **T$_0$** which randomly masked same amount of tokens in the source code.
  2. It calculate Average Treatment Effect ($\tau$) = E [Y$_1$ - Y$_0$] to see the effect of each treatment.

## Results

In their experiment:

- **T$_0$** (treatment 0): mask source code randomly.

- **T$_1$** (treatment 1): mask source code by AST node type.

- **Dataset**: 50k python snippets from github span from 2022.01.01 to 2022.12.31, and sampled 8k for experiment.


They apply SyntaxEval on two MLMs:

| Id   | MLM                    | Size  | Layers | Vocab. |
|------|------------------------|-------|--------|--------|
| M₁   | CodeBERTa-small-v1 | 84M   | 6      | 52,000 |
| M₂   | codebert-base-mlm  | 125M  | 12     | 50,265 |

The results found:

1. The performance of $T_0$ and $T_1$ are similar, no siginificant difference. Even the performance of $T_1$ is lower than $T_0$, indicating the MLMs can not learn syntactic capabilities.

2. Furthermore, the results in Figure2 also shown that the MLM struggle to predict AST node type `comparison_operator` and `string`, etc, only perform better on `identifier`.

<!-- ![Table2](https://raw.githubusercontent.com/feng-jay/pichost/master/img/20250525153149.png){ width=40% } -->

<div style="text-align: center;">
  <img src="https://raw.githubusercontent.com/feng-jay/pichost/master/img/20250525153149.png" alt="Table2" style="width:80%;" />
  <img src="https://raw.githubusercontent.com/feng-jay/pichost/master/img/20250525153525.png" alt="Figure2" style="width:80%;" />
</div>

3. Considering the Causal Interpretability, the authors found the **T$_1$** have negaitive effect on the performance of MLMs as shown in Table2. This suggests that although transformers are predicting AST node types with confidence (performance in Table2 is relativly high), these syntactic features are not particularly relevant compared to predicting any other set of unstructured tokens in the snippet.

## Conclusion

This paper proposed an interesting 2-step evaluation method to evaluate the syntactic capabilities of MLMs. And find the MLMs are not understanding syntax rules of PLs. Recently, there are many SE works apply LLM/MLMs on code generation / program repair / etc tasks, and many of them have shown the limitation of the LLM's reasoning capabilities. This paper provides a new perspective to understand the syntactic capabilities of LLMs, and it is worth further exploration of how to combine LLM/MLMs with more SE domain knowledge to enhance their capabilities in practice.