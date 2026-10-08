最近一直在做Agent相关的科研，就想着研究一下业界的Agent框架。其实具有代表性且有源码的也就是Codex和之前泄露的Claude Code。
由于Codex是正常开源且用Rust写的主逻辑，和我目前的工作流一致，所以选择Codex。

```bash
cloc .
    6512 text files.
    5659 unique files.                                          
     863 files ignored.
1 error:
Line count, exceeded timeout:  ./codex-rs/shell-command/src/parse_command.rs

github.com/AlDanial/cloc v 1.98  T=7.02 s (805.7 files/s, 248825.0 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
Rust                          3304         115643          42508        1308712
...
```
不看不知道，整个Codex框架有**6500+**个文件，其中Rust代码就占据了一半，**130多万行**。完全阅读并理解该框架非常困难，而且我相信其中有很多vibe coding的产物。所以本文选择从一些感兴趣的角度出发，从各个小模块设计理解Codex框架，类似盲人摸象（同样也代表着作者就想盲目地摸着房间里的大象🐘）

主播也在用Codex帮忙阅读Codex代码，某种意义上也在测试Agent的Rice定理？？？

Day-001: [[盲人摸象版理解Codex-001-AGENTS.md]]






