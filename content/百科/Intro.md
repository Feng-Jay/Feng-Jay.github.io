## Our project

**GOALS:**	 给定Vul相关信息，找到vul specific的程序流，挖掘显式约束（if/while/for/assert conditions） 与隐式约束（例如数组长度len和数组alloc长度相等），将从entry->sink的程序约减为一些约束，然后使用KLEE执行进行验证。

Current Implementation: https://github.com/Feng-Jay/Reduction-SE, this project is build with Rust(https://github.com/rust-lang/rust). 

It is private for now, provide your github-id and I will invite you as a contributor.
## Papers

*Read these papers for methodology and ideas, not as full-reproduction assignments.*
[Guiding Symbolic Execution with Static Analysis and LLMs for Vulnerability Discovery ](https://arxiv.org/abs/2604.06506)
SAILOR combines:
1. Static analysis to identify likely vulnerable locations and produce specifications.
2. LLM-guided iterative synthesis of symbolic-execution harnesses, stubs, and assertions.
3. Symbolic execution and concrete replay to validate reported failures.

[Program Analysis Guided LLM Agent for Proof-of-Concept Generation](https://arxiv.org/pdf/2604.07624)
PAGENT combines static-analysis guidance with sanitizer and coverage feedback to help an LLM generate a PoC for a suspected vulnerability location.

## Tools

You can try following tools when you are available:

[KLEE](https://klee-se.org/): KLEE is a famous Symbolic Execution Engine for C/C++ code.
[CodeQL](https://codeql.github.com/docs/): CodeQL is a query-based Static Analysis Tool for multi programming languages
[LLVM tools: `clang`, `opt`, `llvm-dis`, `llvm-extract`](https://github.com/llvm/llvm-project): LLVM is a compiler like gcc, but with more modern designations, and support more programming languages(with LLVM-IR 中间语言).
[SVF: call graph, ICFG, and pointer analysis](https://github.com/svf-tools/svf): SVF is a precise Static Analysis Tool for LLVM-IR
## Examples

Considering the complexity of these tools(build upon more than 1 million lines of code),the best way to learn about these tools is **get your hand dirty.**

You can try above tools by following the official docs/tutorials..., and I will provide some toy example vulnerabilities to let you have a direct impression:
### 1. Off-by-one array access

```
int read_byte(const char *buf, size_t len, size_t idx) {
    if (idx <= len) {
        return buf[idx];
    }
    return -1;
}
```

Vul explanation:
- Identify the sink: `buf[idx]`.
- Extract the explicit constraint: `idx <= len`.
- Infer the implicit memory-safety constraint: `idx < len`.
- Derive the violating condition: `idx == len`.
- Write a small KLEE harness with symbolic `idx`.

Expected output:

```
Explicit: idx <= len
Implicit: valid_index(idx, len) ⇒ idx < len
Violation: idx == len
```

### 2. Allocation-size and copy-length mismatch

```
void copy_payload(const char *input, size_t len) {
    char *buf = malloc(16);

    if (len < 128) {
        memcpy(buf, input, len);
    }

    free(buf);
}
```

Vul explanation:
- Identify the sink: `memcpy`.
- Extract the explicit constraint: `len < 128`.
- Infer the implicit relation: `destination_capacity = 16`.
- Derive the suspicious condition: `len > 16`.
- Combine them: `16 < len < 128`.
- Validate with a KLEE harness and bounded symbolic input.

Expected output:
```
Explicit: len < 128
Implicit: copied_bytes <= destination_capacity
Capacity: destination_capacity = 16
Potential violation: 16 < len < 128
```

And the challenges of our topic lies in the real-world project's complexity: 
for example, in [openssl](https://github.com/openssl/openssl) each warning will involves tens of functions, and some functions are defined via C's Macros(like #define) or passes via function pointers (https://www.geeksforgeeks.org/cpp/function-pointer-in-cpp/), these increase the complexity of our task.

## Suggested Working Style

- Start with small functions and small input bounds.
- Try to understand the workflow from a big picture.
- Record commands, tool setups, inputs, outputs, and interpretations.
- Ask for help after being blocked even after you asked the LLMs/Agents.
- Try to understand LLM's actions, you can learn a lot from it and maybe you can point out its errors.

