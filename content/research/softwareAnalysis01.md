---
title: NJU-Software Analysis-Introduction
draft: false
tags:
  - Software Analysis
description: NJU Software Analysis-Introduction
date: 2025-03-26
---

最近在探索一些新的科研方向，对软件分析感兴趣但具体知识有点忘了，再看一遍。

## What is Static Analysis

静态分析就是在不执行程序的情况下来判断程序一些行为的方法。

Rice's Theorem已经证明，不存在一个算法能在不执行程序的情况下判断程序的非常规属性。(至少在递归可枚举语言中)

一个perfect static analysis应该是既sound又complete的，但实际上往往很难做到，开发者往往会选择Overapproximate(soud, 包含全部的truth)或者Underapproximate(complete, 全部都是truth)。

绝大部分分析都是妥协completeness，追求soundness，即允许误报出现，但尽量不漏报。

一个case说明static analysis的Bird's Eye View:

```java
if (input)
    x = 1;
else
    x = 0;
-> x = ?
```
1. when input is true -> x = 1; when input is false -> x = 0; (sound, precise, expensive)
2. x = 1 or x = 0 (sound, imprecise, cheap)
3. x = 1 or x = 0 or x = 555
三者都sound，都"正确"。使用静态思维来看问题，而非动态。

**在确保soundness的前提下，做precision与分析speed的tradeoff**

## Abstraction & Over-approximation

Abstraction: Concrete Domain -> Abstract Domain

Over-approximation: Transfer Function, evaluate on abstract values.

Over-approximation: Control Flow, 汇聚点需要merge