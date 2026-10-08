1. d1_lib.c#741 CWE-120: Potential Buffer Overflow via memcpy (unchecked length).
	Conclusion: SE成功触发，但是FP
	Explanation: Harness生成了真实程序中不可能存在的逻辑
	Evidence: 
	> Ori Code: ![[SAILOR-Cases1.png]]
	>HarnessCode: ![[SAILOR-Cases1h.png]]

2. ssl_sess.c#1191: Memory may have been previously freed by call to CRYPTO_free
	Conclusion: SE成功触发，但是FP，目前项目中没有直接的调用
	Explanation: 目标漏洞仅在test代码中被调用，且为private函数
	Evidence:
	> Ori Code: ![[SAILOR-Cases-2o.png]]
	> Harness Driver: ![[SAILOR-Cases2h.png]] 
	
	可以看到，LLM生成的SE driver并没有生成真正的去触发warning所描述的漏洞，而是一个新的漏洞

3. extensions_clnt.c#1663: Memory may have been previously freed by call to CRYPTO_free
	Conclusion: SE成功触发，但是FP，SE构造的driver违反项目的约束
	Explanation: SE简化了依赖函数的建模，实际上cpy长度和allocated数组长度是有约束的
	Evidence:
	> Ori Code:![[SAILOR-Cases3o.png]]
	> Harness Stub: ![[SAILOR-Cases3h.png]]
	同样的，LLM生成的SE driver并没有生成真正的去触发warning所描述的漏洞，而是新的因为数组长度导致的crash

4. t1_lib.c#3835: CWE-120: Potential Buffer Overflow via memcpy (unchecked length).
	Conclusion: SE成功触发，但是FP，SE构造的driver与项目实际不同
	Explanation: driver中构造的数组长度为1，但项目中为固定的TLS_MAX_SIGALGCNT
	Evidence: 
	> Ori code:![[SAILOR-Cases4o.png]]
	> Harness code:![[SAILOR-Cases4h.png]]
	

5. ssl_lib.c#6988: CWE-120: Potential Buffer Overflow via memcpy (unchecked length).
	Conclusion: SE成功触发，但是FP，SE构造的driver与项目实际不同
	Explanation: driver中构造的malloc长度为0, 但OpenSSL_malloc(0)返回NULL，无法执行到对应的sink点
	Evidence:
	> Ori code: ![[SAILOR-Cases5o.png]]
	> Harness code: ![[SAILOR-Cases5h.png]]
	
6. rsa_saos.c#85: CWE-125: Potential OOB Read via memcmp (unchecked length).
	Conclusion: SE成功触发，但是FP，SE构造的依赖与项目逻辑实际不同
	Explanation: LLM构造的依赖函数逻辑是malloc的数据长度和length可以不一致，但实际项目中不会存在该情况
	Evidence:
	> Ori code: ![[SAILOR-Cases6o.png]]
	> Harness code: ![[SAILOR-Cases6h-1.png]]

尝试直接拿KLEE在binutils中的readelf上进行测试：

| Language | files | blank | comment | code |
|----------|-------|-------|---------|------|
| C        | 1     | 3077  | 1085    | 21463 |
发现基本上如果不手动提供stub等依赖信息建模根本跑不起来，所以目前很多方法都是在几个函数的层面做类似的事情：
![[SAILOR-Cases-example-proj.png]]
coverage基本没有
![[SAILOR-Cases-example-stat.png]]
