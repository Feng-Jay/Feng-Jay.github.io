## Reviewer#1
1. The experimental comparison is not fully objective because the evaluated tools use **different underlying LLM backbones** (e.g., Claude 3.5 Sonnet, o3-mini, GPT-4), so the study is effectively comparing “workflow + model” rather than isolating the contribution of the workflow itself. This is a major confound, especially since backbone choice is known to strongly affect vulnerability-detection performance.  
   +统一backbone模型的实验
2. The real-world evaluation in RQ2 is statistically weak because it **samples at most 10 warnings per tool/project**, even when some tools generate thousands of alerts. Such a small sample can only support a preliminary observation, not strong claims about practical usability or false discovery behavior at project scale.  
   +增加RQ2的samples数量，可以使用半自动化的方式来判断
3. The **tool configuration is asymmetric in a way** that affects fairness. For example, RepoAudit uses manually specified source-sink pairs on the in-house benchmark but default configuration on real-world projects, while the paper later identifies source/sink mismatch as a primary root cause. This conclusion should be supported by a direct ablation, such as default vs. inferred vs. oracle source/sink settings.  
   +source-sink统一配置
4. The so-called “in-house dataset” is not really an in-house benchmark, but rather a curated subset of ReposVul, CWE-Bench-Java, and JLeaks. More importantly, the selection rationale is not convincing enough, **especially for C/C++, where the paper keeps only post-2019 Linux kernel cases from ReposVul.** This introduces a strong domain bias and makes the C/C++ findings much closer to Linux-kernel-like code than to general project-scale C/C++ vulnerability detection.  
   +in-house数据集的C/C++部分增加一些除linux kernel之外的数据
5. The real-world C/C++ dataset has a serious independence problem because several “projects” are actually different subsystems of the same Linux repository at the same commit, **such as linux/sound, linux/mm, linux/net, and linux/drivers/net.** These should not be treated as independent projects without stronger justification, and doing so inflates the project count and weakens external validity.  
   +感觉这个没什么道理，可以先不改，写作部分说明一下FOLLOW已有工作设置
6. The research questions are generally meaningful, especially the focus on effectiveness, false positives, and overhead, but they are not sufficient to support the paper’s strongest claims. In particular, **claims about source/sink mismatch and shallow interprocedural reasoning are mechanistic conclusions, yet the paper does not include controlled experiments that directly test these factors.**  
   +source/sink 部分可以加实验，然后深度部分可以分析数据集
7. **The analysis of partial RQ is uneven in depth.** RQ1 is useful but still largely descriptive and lacks key ablations; RQ2 is too weak to support strong practical claims; **RQ4 is relevant but incomplete without actual monetary cost, and cost-effectiveness analysis.**  
   +RQ4需要补充$开销，然后分析一下性价比
8. The conclusions are currently stronger than the evidence. For example, the claim that source/sink mismatch is a primary cause requires a dedicated ablation; the claim that shallow interprocedural reasoning is a major bottleneck requires controlled experiments on call depth or context depth; and the claim that practical usefulness is severely limited requires either full validation on a smaller subset or a statistically sounder sampling strategy with confidence intervals and top-k precision.  
   +结论部分有点强，需要分析数据佐证
9. The discussion and threats to validity are not yet sufficient for a TSE empirical paper. Important threats are under-discussed, including backbone-model confounding, the Linux-dominated C/C++ dataset, the fact that several “projects” are really Linux subsystems, and possible pretraining contamination. **Using the latest project version does not eliminate LLM data leakage.**  
   +数据泄露问题
10. The baseline selection is too narrow for the breadth of the paper’s claims. The paper studies five specialized tools plus CodeQL and Semgrep, but omits several important families of LLM-based vulnerability detection methods. In particular, there are no baselines from context-enhanced prompting or in-context learning, such as Prompt-enhanced Software Vulnerability Detection using ChatGPT, **Software Vulnerability Detection with GPT and In-Context Learning, or GRACE, even though these methods are directly relevant to the paper’s own argument that context limitations are a core bottleneck.**  
     +LLM-context aware的检测方法
11. The paper also omits representative RAG-based methods, such as Vul-RAG and DLAP, which are important because they specifically aim to improve vulnerability detection through retrieval and external knowledge grounding. If the authors intentionally exclude these methods because they are not directly comparable to the project-scale workflows studied here, the paper should explicitly clarify this scope boundary and avoid overgeneralizing its conclusions beyond the evaluated class of methods.  
  +这些方法需要exclude掉，并不是study相关内容，然后结论部分需要cite一下
12. It is also unclear whether **LLMxCPG** was considered for comparison, since the paper itself cites it as a representative project-scale LLM-assisted approach. Given that the paper attributes many failures to shallow reasoning and insufficient structural context, it would be helpful to explain why such a context-aware method was not included or was deemed not comparable.  
  +LLMxCPG需要finetune model，感觉可以根据这个把他排除掉
13. On the traditional side, using only CodeQL and Semgrep is not sufficient to represent static analysis. At least some stronger or more targeted baselines, such as SpotBugs, Infer, or Clang Static Analyzer, should be included, especially because KNighter is built on CSA-related workflows and Java results would benefit from comparison with a mature Java analyzer such as SpotBugs.  
  +传统方法加两个，Spotbugs & CSA
14. There are also several consistency issues that reduce confidence in the presentation, such as the mismatch between the number of CWE-079 cases in different tables, the inconsistent Java average recall reported in different places, and the apparent confusion between CWE-772 and CWE-722. These should be carefully checked and corrected.
  +文章数据check，typo修改

## Reviewer#2
1. The paper evaluates five LLM-based vulnerability detection approaches; however, the **criteria used to select these methods are not clearly described.** In addition, the study lacks **direct LLM prompting baselines** and evaluates only older models. Recent LLMs such as **Claude-4.6-Sonnet demonstrate significantly improved code understanding and vulnerability detection capabilities.** The authors are suggested to include recent models and simple prompting baselines to provide a fairer comparison and better reflect the current state of LLM-based vulnerability detection.  
-同样，方法选择部分需要更逻辑一点，另外，需要加LLM-prompting的方法。
  
2. The study relies on a relatively **small dataset of vulnerabilities and projects**, which may limit the reliability and generalizability of the results. Although the dataset contains real-world vulnerabilities, the overall scale may not be sufficient to capture the diversity of software systems, programming patterns, and vulnerability types encountered in practice.  
  +数据集部分可以根据R1的内容增加一些，然后可以把论文的Scope缩一下，改成taint-style的小问题
3. The evaluation focuses on **a small subset of CWE categories, covering only 8 vulnerability types.** They represent only a small fraction of the vulnerability landscape. Many other important categories are not considered. Since different vulnerability types require different reasoning capabilities (e.g., control flow reasoning vs. semantic understanding), the limited CWE coverage restricts the comprehensiveness of the evaluation. Consequently, it is difficult to determine whether the observed performance trends would hold across a broader range of vulnerability classes.  
  +threats, future work, 改论文的Scope
4. The paper mainly evaluated vulnerability detection effectiveness using recall for the In-house dataset. Recall can not provide a complete picture of detection performance. In vulnerability detection, precision and false positive rates are equally important, as tools with high recall, but extremely low precision, may produce large numbers of false alarms that reduce their practical usefulness. **The authors might also want to include Precision for this experiment.**  
  +Recall + Partial precision.
5. The paper did not explicitly address the possibility that parts of the evaluation dataset may have been included in the training data of the underlying LLMs. Since many large language models are trained on large-scale code repositories and publicly available datasets, some of the evaluated projects or vulnerability examples may have been seen during training. If this occurs, the model may partially memorize known vulnerabilities rather than reasoning about them during inference. This issue could potentially bias the evaluation results and make it difficult to determine the true generalization ability of the models.  
  +数据泄露问题, 可以通过分析模型的中间输出与后面真实项目上检出问题并未标CVE？
6. The key findings reported in the paper, such as high false positive rates, scalability challenges, and limitations in interprocedural reasoning, have already been widely reported in prior studies on LLM-based vulnerability detection and static analysis tools. While the empirical confirmation of these issues at the project scale is useful, the insights themselves are somewhat expected and do not significantly advance the understanding of LLM-based security analysis. **As a result, the novelty and impact of the findings may be limited, particularly for readers already familiar with the existing literature on LLM-based code analysis and vulnerability detection.**  
+findings没什么深度，可以增加实验后作对比，多分析一些数据？
LLMs in Software Security: A Survey of Vulnerability Detection Techniques and Insights (ACM Computing Survey 2025)  
  
7. The LLMs used in the five evaluated tools include models such as GPT-4, Claude 3.5 Sonnet, and O3-mini. Although these models are strong, they may not represent the most recent or most capable generation of large language models available today. Recent advances in reasoning-oriented models, larger-context models, and specialized code models could potentially yield different results in vulnerability detection tasks. Therefore, the conclusions drawn from the experiments may not fully reflect the capabilities of the latest LLM technologies. Evaluating newer models or conducting an updated comparison is needed.

## Reviewer#3
1. Lacking in-depth discussion of the manual analysis methodology and process  
  
In Section V, the paper manually analyzes the recall of project-level vulnerability detection methods and the causes of false positives, and then categorizes them. However, the paper only briefly mentions how the manual classification is carried out. It does not discuss in detail how the categories are defined. This makes me confused about many of the reported results.  

For example, Section V-C lists a series of failure causes that seem unique to LLM-based methods, including A2 and D1. In my understanding, these categories should only apply to methods that use LLMs. However, in the results reported in Figure 5, some methods that do not use LLMs are also assigned to these two categories. What exactly are the criteria for these categories? The paper needs to answer this question by explaining how the classification codebook is constructed.  
I am also curious about what information the authors use to determine the vulnerability categories. Different methods may produce outputs at very different levels of granularity. What information from these tools is collected and used as the basis for classification?
  
Even based on the current category definitions and descriptions in the paper, some ambiguity still seems to remain. For example, in the sample shown in Figure 6, the paper classifies the case as B1, Incorrect Source/Sink Selection. However, based on the LLM response shown in the figure, it does not seem possible to conclude that the model selects incorrect sources or sinks. Instead, the issue seems more like Missed Key Program Points. Similarly, in my view, the cause described as A1, Shallow Interprocedural Reasoning, may also be an underlying reason for category D, Code Semantics Misinterpretation. Therefore, it is unclear how the paper distinguish between these categories.
+分类时的依据以及这些分类的合理性，and case解释  
  
2. Insufficient analysis of recall  
  
For vulnerability detection tools, recall is just as important as false positives. However, the paper provides only a relatively shallow analysis of recall in Section V-A, and it does not include corresponding examples. This weakness becomes even more obvious when compared with the much more detailed analysis of false positives in Section V-C. Similar to the analysis of false positives, the analysis of recall should also provide the classification methodology, the full set of categories for both C and java together, and representative examples. This would help the community better understand the recall performance of these tools and the reasons behind it.  
At the same time, the paper discusses only recall on the in-house dataset, but not the false positive rate or SFDR, which makes the analysis appear incomplete.  
  +recall和precision都需要分析一下
2. The paper identifies limitations, but it does not provide concrete directions for future research  
  
According to the results reported in the paper, none of the current project-level vulnerability detection tools appears ready for practical use. Even the lowest Sampled False Discovery Rate reaches 60%, and most results fall between 80% and 100%. However, the paper does not provide clear guidance on how to address this challenge. For example, what components of these tools cause the high false positive rates and low recall? Are the problems mainly caused by the limited capability of the LLM backbone, or by the weakness of the harness? Although the paper provides many categories, it does not seem to analyze the actual workflow of current tools in enough detail. In other words, among these failure categories, which part of the tool is the real bottleneck? In addition, the LLM backbones used in the paper already lag behind the current state of the art, such as GPT-4 and o3. It would be better to adopt newer LLMs such as GPT-5 for evaluation.  
  +把问题的原因更深归因，究竟是LLM本身的问题，还是harness的不够好，另外就是加新模型
2. Potential data leakage issues in the in-house dataset  
  
Although the paper claims to avoid the data leakage issue in the real-world dataset, the in-house dataset may still contain potential data leakage. This may introduce bias into the recall analysis, which mainly relies on the in-house dataset, especially for the comparison between LLM-based methods and traditional methods. This concern is particularly relevant to the claim that “LLM-based methods often cover a substantial portion of the vulnerabilities reported by traditional static tools and can additionally uncover vulnerabilities beyond their coverage.” In that case, based on the ground truth established through manual analysis on the real-world dataset, how do these tools perform in terms of recall?
+inhouse部分有数据泄露问题，我们可以加人工check模型中间输出，因为并不是end-to-end的方法。
+real-world的recall感觉算不出来，可以算一个fake recall? 把所有工具的结果报出来，看看每个工具占比多少？


## Summary
benchmark部分：in-house的c/c++部分需要添加非linux-kernel的数据，另外需要解决一下数据泄露问题（感觉可以从分析模型中间输出着手）

实验对象部分：
- 所选LLM-workflow，需要加统一且最新的backbone LLM设置+统一source-sink设置 
- 所选traditional methods，需要加一些更Specific的检测工具 spotbugs and CSA
- 另外需要加LLM-prompting的baseline来佐证本文的claim

数据分析部分：
- RQ1需要分析Partial Precision
- RQ2需要分析Partial Recall，增加sample数量，可以使用半自动化的方式进行
- RQ3需要解释如何判断每一个FP的所属分类，以及分类之间的合理性
- RQ4需要增加$开销，以及一个vul需要多少\$的性价比分析

![[gpt-4-turbo-pricing.png|300]]
![[gpt-5.4-pricing.png|300]]![[claude-sonnet-4.6-pricing.png|300]]
