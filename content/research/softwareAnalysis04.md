---
title: NJU-Software Analysis-DataFlow Analysis Foundations
draft: false
tags:
  - Software Analysis
  - DataFlow
description: NJU Software Analysis-DataFlow Analysis Foundations
date: 2025-03-30
---

## Iterative Algorithm, Another View

将每个节点的OUT视作一个集合，那么整个程序的空间可以表示为 (OUT[n1], OUT[n2], ..., OUT[nk]), 可以视作空间$V^k$, 也就是每次迭代相当于一个函数F: $V^k$ -> $V^k$, 将程序从一个状态点映射到另一个状态点。

算法的停止条件就可以表示为找到一个**不动点**，也就是F($V^k_i$) = $V^k_i$。

Questions:

1. 算法一定能停 or 一定能到达不动点吗?
2. 假设到达不动点，只有一个不动点吗？有多个的话，哪个是最好的 (most precise)?
3. 算法复杂度、最坏要迭代多少次？

## Partial Order
对any $x \in P$:

a. 自反性: $x \leq x$

b. 反对称: $x \leq y, y \leq x$, 则 $x = y$

c. 传递性: $x \leq y, y \leq z$, 则 $x \leq z$

偏序关系中，集合任意两个元素不用必须可比，即可以不满足偏序关系。

## Upper and Lower Bounds

S is a subset of P:

上界: $u \in P$ is an upper bound of S, if $\forall x \in S, x \leq u$

下界: $l \in P$ is a lower bound of S, if $\forall x \in S, l \leq x$

最小上界(lub or join 上确界): $\sqcup S$, for every upper bound of S, say u, $\sqcup S \leq u$.

最大下界(glb or meet 下确界): $\sqcap S$, for every lower bound of S, say l, $l \leq \sqcap S$.

$\sqcup S$ <==> $a \sqcup b$ (a join b)

$\sqcap S$ <==> $a \sqcap b$ (a meet b)

上/下界不一定有一个。最小上下界不一定存在，若存在则唯一。

## Lattice, Semilattice, Complete and Product Lattice

Lattice: 给定偏序集($P, \leq$)，对$\forall a,b \in P$, if $a \sqcup b$ and $a \sqcap b$ 都存在，则($P, \leq$)是一个lattice。任意两个元素都有最小上界和最大下界。

Semilattice: 如果只有$$a \sqcup b$$存在，则称为join Semilattice; 只有$$a \sqcap b$$存在，则称为meet Semilattice。

Complete Lattice: 给点一个Lattice, 对任意一个子集S, 其最小上界和最大下界都存在，则这个Lattice称为Complete Lattice。

对于Complete Lattice, lub和glb都是最值: 有最大值 T(top) = $\sqcup P$, 最小值 $\perp $(bottom) = $\sqcap P$。

其实只要lattice有穷，那么就一定是complete lattice

但Complete Lattice不一定有穷

程序中一般是complete and finite lattice.

Product Lattice: 对n个lattice， 若都有lub和glb，则它们的笛卡尔积也是一个lattice。

![Product Lattice](https://raw.githubusercontent.com/feng-jay/pichost/master/img/20250330123505.png)

## DataFlow Analysis Framework via lattice

![](https://raw.githubusercontent.com/feng-jay/pichost/master/img/20250330124156.png)


## Review The Questions

1. 算法一定能停 or 一定能到达不动点吗? 

2. 假设到达不动点，只有一个不动点吗？有多个的话，哪个是最好的 (most precise)?

About Lattice上函数的单调性 & 不动点定理


f:L -> L (L is a lattice) is monotonic if $\forall x,y \in L$, $x\leq y$ -> $f(x) \leq f(y)$

不动点定理: 若函数f单调，而且L是有限的，

1. 那么最小不动点可以通过迭代f($\perp$), f(f($\perp$)), ..., $f^k(\perp)$ 得到。

2. 那么最大不动点可以通过迭代f(T), f(f(T)), ..., $f^k(T)$ 得到。


Prove:不动点存在且是最小的那个

![](https://raw.githubusercontent.com/feng-jay/pichost/master/img/20250330125836.png)

最小的证明就是数学归纳法就可以了:

1. f($\perp$) $\leq$ f(x)

2. 假设 $f^i(\perp) \leq f^i(x)$, 且f单调，那么 $f^{i+1}(\perp) \leq f^{i+1}(x)$

3. 归纳到最后，$f^k(\perp) \leq f^k(x)$

4. 因此$f^{Fix}$ = $f^k(\perp) \leq x$ 

所以不动点是最小的, 而且求出的不动点也是唯一的

需要将数据流上的迭代算法映射到lattice上的函数，来将这二者建立联系。