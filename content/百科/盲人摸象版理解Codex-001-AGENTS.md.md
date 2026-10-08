刚打开Codex的工作目录就被`AGENTS.md`文件吸引了，简单扫了一下感觉活人感很强，应该是开发人员写的vibe coding准则，似乎可以通过其中内容大致了解项目架构。

开始阅读！

## ./codex-rs
该目录包含了Codex的所有rust代码，所有的crates的命名格式均为`codex-xxx`, e.g., `codex-core`

### Coding Style
- format!()如果需要使用变量，总是使用`{}`的格式将变量inline进去:
	```rust
	format!("{:?}", var);
	↓
	format!("{var:?}");
	```
- 嵌套的if语句需要collapse:
	```rust
	if x { if y {  } }	
	↓
	if x && y {}
	```
	
- 使用已有method的reference而不要创建重复的Closure闭包:
	```rust
	Some('a').map(|s| s.to_uppercase());
	↓
	Some('a').map(chat.to_uppercase);
	```
- 避免在函数声明中使用bool或者`Option`类型的参数，这样会导致caller对应的代码难以阅读, 例如`foo(false)` or `bar(None)`, 推荐使用enum, 自定义类型，或者将选择含义融入函数名:
	```rust
	client.connect(false);
	↓
	client.connect_with_retry();
	client.connect_without_retry();
	```
- 如果无法避免这种情况，使用以下方式增强代码的可读性:
	- 在传递`true/false`, `None`, `1`之类的参数前，使用`\*param_name*\`注释标明参数名
	- 如果该参数名和其函数名称一致，例如很多set函数 `fn enabled(&self, enabled: bool)`的`.enable(false)` 调用，则可以忽略该规则
	- 对于传递的String或者Char类型的字面值，除非增加注释会增加可读性，否则可以忽略该规则
	- 注释中的参数名一定要和函数定义中的参数名一致
- 如果可以，`match`语句应该枚举所有可能的分支，尽量不使用 `_`匹配
- 新添加的trait应该包含doc注释，解释他们的功能与使用他们的示例代码
- 对于涉及`asnyc`的trait定义，避免使用 `#[async_trait]` 和 `#[allow(async_fn_in_trait)]`
	推荐在trait定义的使用使用RPITIT形式，在`impl`时则可以简写:
	```rust
	// in trait def, encounaged:
	fn foo(&self, ...) -> impl std::future::Future<Output = T> + Send;
	// in impl, still can use:
	async fn foo(&self, ...) -> T
	```
- 在写测试时，直接比较整个struct，而不要去逐field地去比较。不要对硬编码的值进行测试，不要对已经删除的feature进行测试。
- 更推荐写private的modules, 然后显式地export公用的crate API
- 不要创建仅使用一次的tiny helper函数
- 在`async`函数使用`tracing`时，在每个函数定义上使用`#[tracing::instrument(...)]` 而不要在每次调用后都增加`.instrument(...)`，在添加该macros之前，首先check一下对应的函数是否已经instrumented.
- 避免过大的module:
	- 推荐添加新的module，而非在已有的module下增加代码
	- 推荐每个module的生产代码（排除测试后）的代码行数 ≤ 500行
	- 如果一个文件超过800行代码，那么不要继续在该文件中增加代码，推荐去创建一个新的module，除非有非常强的doc说明继续添加的理由。尤其是对那些频繁被修改的文件，例如`codex-rs/tui/src/app.rs`, `codex-rs/tui/src/bottom_pane/chat_composer.rs`,
    `codex-rs/tui/src/bottom_pane/footer.rs`, `codex-rs/tui/src/chatwidget.rs`,
    `codex-rs/tui/src/bottom_pane/mod.rs`...
	- 当从一个大module提取代码时，将相关的测试、类型、文档也迁移到新的module
	- 不要在`codex-rs/tui/src/chatwidget.rs`中添加单独的函数，除非修改很简单，推荐添加新的module, 并将`chatwidget.rs`文件专注于调节用户与Agent的交互

### The `codex-core` crate

随着开发进度，`codex-core` crate已经十分臃肿，因此，开发者往往倾向于直接向 `codex-core` 添加新功能，而不是费力重构出所需的库代码——毕竟后者虽然能避免新代码依赖 `codex-core` 或增加其体积，却更为繁琐。
所以：**不要向codex-core中添加新的代码！**
尤其是引入新的concept/feature/API时，在向`codex-core`添加代码前，首先考虑：
1. 这里是否有除了`codex-core`之外的其他crate更适合添加你的新代码
2. 是时候在代码库中实现一个新的crate来实现对应的新功能，仅重构必需的代码来实现该过程

同样，在进行代码审查时，如果遇到会向 `codex-core` 引入不必要代码的 PR，请务必提出异议。

## Code Review Rules
### Crate API Surface

尽可能保持crate API数量和复杂度最小，避免生成大量仅在测试代码使用的helper函数

### Model Context

Codex 会维护一个在推理请求中发送给模型的上下文（消息历史）。
1. 不要重写历史记录——上下文必须以增量方式逐步构建。
2. 避免频繁改动上下文，以免造成缓存未命中。
3. 不允许无界项目——注入模型上下文的每一项都必须有明确的大小上限和硬性限制。
4. 不允许任何超过 10K tokens的单个item。
5. 将可能超过 1K tokens 的新增单个item标记为 P0；这些项目需要额外的人工审查。
6. 所有注入的片段必须在 `core/context` 中定义为 struct，并实现 `ContextualUserFragment` trait。
### Breaking Changes

检查外部集成表面上的破坏性变更：
- app-server API
- 原始响应项目事件（`rawResponseItem/*`），即使其仍处于实验阶段
- CLI 参数
- 配置加载
- 从已有 rollout 恢复会话


### Test authoring guidance

对于 agent 变更，优先使用集成测试而非单元测试。集成测试位于 `core/suite`，并使用 `test_codex` 配置测试实例。

改变 agent 逻辑的功能**必须**添加集成测试：

- 提供需要测试的主要逻辑变更和面向用户行为的清单。

若确实需要单元测试，请将其放在专用测试文件中（`*_tests.rs`）。
避免在主实现代码中添加仅供测试使用的函数。

检查是否已有可让测试更简洁、可读的helper实现

### Change size guidance (800 lines)

除机械性变更外，改动的总行数不应超过 800 行。
对于复杂逻辑变更，规模应控制在 500 行以下。

若变更更大，探索能否将其拆分为可审查的阶段，并确定最小、连贯且可首先合入的阶段。

阶段划分建议应基于实际 diff、依赖关系和受影响的调用点。

## TUI style conventions

参见 `codex-rs/tui/styles.md`。

## TUI code conventions

- 使用 ratatui 的 `Stylize` trait 提供的简洁样式辅助方法。
  - 基础 span：使用 `"text".into()`。
  - 带样式的 span：使用 `"text".red()`、`"text".green()`、`"text".magenta()`、`"text".dim()` 等。
  - 相比直接构造 `Span::styled` 和 `Style`，优先使用这些方法。
  - 示例：补丁摘要文件行
    - 期望：`vec!["  └ ".into(), "M".red(), " ".dim(), "tui/src/app.rs".dim()]`

### TUI Styling (ratatui)

- 优先使用 `Stylize` 辅助方法：尽可能使用 `"text".dim()`、`.bold()`、`.cyan()`、`.italic()`、`.underlined()`，而不要手动创建 `Style`。
- 优先使用简单转换：span 使用 `"text".into()`；行使用 `vec![…].into()`。当类型推断存在歧义（例如 `Paragraph::new`／`Cell::from`）时，使用 `Line::from(spans)` 或 `Span::from(text)`。
- 计算得出的样式：若 `Style` 在运行时计算，使用 `Span::styled` 是可以的（也可以使用 `Span::from(text).set_style(style)`）。
- 避免硬编码白色：不要使用 `.white()`；应优先使用默认前景色（不指定颜色）。
- 链式调用：为保证可读性，组合辅助方法时使用链式调用，例如 `url.cyan().underlined()`。
- 单个项目：优先使用 `"text".into()`；仅当目标类型不明显，或使用 `.into()` 需要额外类型注解时，才使用 `Line::from(text)` 或 `Span::from(text)`。
- 构造行：在目标类型明显且无需额外类型注解时，用 `vec![…].into()` 构造 `Line`；否则使用 `Line::from(vec![…])`。
- 避免无意义的改动：没有明确的可读性或功能收益时，不要在等价形式之间重构（`Span::styled` ↔ `set_style`、`Line::from` ↔ `.into()`）；遵循文件内的既有风格，也不要仅为满足 `.into()` 而引入类型注解。
- 紧凑性：优先选择经 rustfmt 后能保持单行的形式。若 `Line::from(vec![…])` 和 `vec![…].into()` 中只有一种不换行，选择它；若两者都会换行，选择换行行数更少的。

### Text wrapping

- 始终使用 `textwrap::wrap` 换行普通字符串。
- 若要对 ratatui 的 `Line` 换行，使用 `tui/src/wrapping.rs` 中的辅助方法，例如 `word_wrap_lines`／`word_wrap_line`。
- 如需给换行后的文本缩进，若可行，使用 `RtOptions` 的 `initial_indent`／`subsequent_indent` 选项，而非自行编写逻辑。
- 若有一个行列表且需要为所有行添加前缀（第一行和后续行的前缀可不同），使用 `line_utils` 中的 `prefix_lines` 辅助方法。


## Tests

### Test module organization

- 新增test module时，将其内容定义在同级的独立文件中，而非内联在实现文件内。
- 使用显式的 `#[path = "..._tests.rs"]` 属性，使测试文件名具有描述性且易于定位：

```rust
#[cfg(test)]
#[path = "parser_tests.rs"]
mod tests;
```

- 此规则仅适用于引入新测试模块时。不要仅为遵循该约定而移动或重写现有内联的 `#[cfg(test)] mod tests { ... }` 模块。
### Snapshot tests

本仓库使用快照测试（通过 `insta`），特别是在 `codex-rs/tui` 中，用于验证渲染输出。

**要求：**任何影响用户可见 UI 的变更（包括新增 UI）都必须包含相应的 `insta` 快照覆盖（若尚无测试则新增快照测试，若已有则更新现有快照）。应在 PR 中审查并接受快照更新，使 UI 影响易于审查，并让未来的 diff 保持可视化。

当有意变更 UI 或文本输出时，按如下方式更新快照：
- 运行测试，生成更新后的快照：
  - `just test -p codex-tui`
- 检查哪些快照处于待处理状态：
  - `cargo insta pending-snapshots -p codex-tui`
- 通过直接读取仓库中生成的 `*.snap.new` 文件审查变更，或预览某个特定文件：
  - `cargo insta show -p codex-tui path/to/file.snap.new`
- 仅当你打算接受此 crate 中所有新快照时，运行：
  - `cargo insta accept -p codex-tui`

若尚未安装该工具：
- `cargo install --locked cargo-insta`

### Benchmarks

可使用 `just bench` 运行 cargo 基准测试，并使用 divan crate 编写新的基准测试。

使用 `just bench-smoke` 对基准测试进行单次迭代的试运行，以确保其正常工作。

### Test assertions

- 测试应使用 `pretty_assertions::assert_eq`，以获得更清晰的 diff。若尚未导入，请在测试模块顶部导入。
- 尽可能优先进行深度相等的比较。对完整对象使用 `assert_eq!()`，而不要单独断言字段。
- 避免在测试中修改进程环境；优先从上层传入源自环境的标志或依赖项
### Spawning workspace binaries in tests (Cargo vs Bazel)

- 当测试需要启动第一方二进制文件时，优先使用 `codex_utils_cargo_bin::cargo_bin("...")`，而不是 `assert_cmd::Command::cargo_bin(...)` 或 `escargot`。
-  在 Bazel 下，二进制文件和资源可能位于 runfiles 中；使用 `codex_utils_cargo_bin::cargo_bin` 可解析出在 `chdir` 后仍稳定的绝对路径。
- 在 Bazel 下定位 fixture 文件或测试资源时，避免使用 `env!("CARGO_MANIFEST_DIR")`。优先使用 `codex_utils_cargo_bin::find_resource!`，这样路径在 Cargo 和 Bazel runfiles 下都能正确解析。

### Integration tests

#### codex_core integration testing

- 编写端到端 Codex 测试时，优先使用 `core_test_support::responses` 中的工具。
- 默认使用 `TestCodexBuilder::build_with_auto_env()`，以确保新测试可在不同的 app／exec OS 上工作。详见 `$remote-tests`。
- 所有 `mount_sse*` 辅助函数都会返回 `ResponseMock`；请保留它，以便断言发出的 `/responses` POST 请求体。
- 当测试应只发出一个 POST 时，使用 `ResponseMock::single_request()`；使用 `ResponseMock::requests()` 检查每个捕获的 `ResponsesRequest`。
- `ResponsesRequest` 提供辅助方法（`body_json`、`input`、`function_call_output`、`custom_tool_call_output`、`call_output`、`header`、`path`、`query_param`），因此断言应针对结构化的payloads，而不是手动找出JSON。
- 使用提供的 `ev_*` 构造函数和 `sse(...)` 构建 SSE(Server-Sent Events) payload。
- 优先使用 `wait_for_event`，而非 `wait_for_event_with_timeout`。
- 优先使用 `mount_sse_once`，而非 `mount_sse_once_match` 或 `mount_sse_sequence`。

- 典型模式：
```rust
  let mock = responses::mount_sse_once(&server, responses::sse(vec![
      responses::ev_response_created("resp-1"),
      responses::ev_function_call(call_id, "shell", &serde_json::to_string(&args)?),
      responses::ev_completed("resp-1"),
  ])).await;

  codex.submit(Op::UserTurn { ... }).await?;

  // Assert request body if needed.
  let request = mock.single_request();
  // assert using request.function_call_output(call_id) or request.json_body() or other helpers.
```
#### app-server integration testing

- 测试应覆盖 app-server 的公开 JSON-RPC API。
- 使用与上文类似的服务器 mock 方式。
- 默认使用 `TestAppServer::builder().build()` 和 `TestAppServer::send_thread_start_request_with_auto_env()`，以确保新测试可在不同的 app／exec OS 上工作。详见 `$remote-tests`。

## App-server API Development Best Practices

这些指南适用于 `codex-rs` 中 app-server 协议相关工作，尤其是：

- `app-server-protocol/src/protocol/common.rs`
- `app-server-protocol/src/protocol/v2.rs`
- `app-server/README.md`

### Core Rules

- 所有活跃的 API 开发都应在 app-server v2 中进行。不要向 v1 添加新的 API 表面积。
- 一致遵循payload命名：请求负载使用 `*Params`，响应使用 `*Response`，通知使用 `*Notification`。
- 将 RPC 方法暴露为 `<resource>/<method>`，并保持 `<resource>` 为单数（例如 `thread/read`、`app/list`）。
- 除非带标签的union或明确的兼容性需求要求进行针对性重命名，否则始终以 `#[serde(rename_all = "camelCase")]` 将字段在传输协议中暴露为 camelCase。
- 除非明确的兼容性需求要求针对性重命名，否则始终在传输协议中以 camelCase 暴露字符串枚举值，并使用相匹配的 serde 和 TS `rename_all = "camelCase"` 标注。
- 例外：配置 RPC payload应使用 snake_case，以镜像 `config.toml` 键名（参见 `app-server-protocol/src/protocol/v2.rs` 中的配置读取／写入／列出 API）。
- 始终在 v2 请求／响应／通知类型上设置 `#[ts(export_to = "v2/")]`，使生成的 TypeScript 落入正确命名空间。
- 绝不要为 v2 API 负载字段使用 `#[serde(skip_serializing_if = "Option::is_none")]`。
  例外：有意不含 params 的客户端→服务器请求可使用：
  `params: #[ts(type = "undefined")] #[serde(skip_serializing_if = "Option::is_none")] Option<()>`。
- 保持 Rust 和 TS 的传输协议重命名一致。若字段或变体使用 `#[serde(rename = "...")]`，添加匹配的 `#[ts(rename = "...")]`。
- 对于判别联合类型，在两个序列化器中都使用显式标签：`#[serde(tag = "type", ...)]` 和 `#[ts(tag = "type", ...)]`。
- 在 API 边界优先使用纯 `String` ID（若需要，可在内部进行 UUID 解析／转换）。
- 时间戳应为整数 Unix 秒（`i64`），并命名为 `*_at`（例如 `created_at`、`updated_at`、`resets_at`）。
- 对于实验性 API 表面积：使用 `#[experimental("method/or/field")]`；字段级 gating 需要时派生 `ExperimentalApi`；只有方法的部分字段为实验性时，在 `common.rs` 中使用 `inspect_params: true`。
### Client->server request payloads (`*Params`)

- 每个可选字段都必须标注 `#[ts(optional = nullable)]`。不要在客户端→服务器请求负载（`*Params`）之外使用 `#[ts(optional = nullable)]`。
- 可选集合字段（例如 `Vec`、`HashMap`）必须使用 `Option<...>` + `#[ts(optional = nullable)]`。不要使用 `#[serde(default)]` 对可选集合建模，也不要在 v2 负载字段上使用 `skip_serializing_if`。
- 当希望省略布尔字段代表 `false` 时，使用 `#[serde(default, skip_serializing_if = "std::ops::Not::not")] pub field: bool`，而不是 `Option<bool>`。
```rust
#[serde(
    default,
    skip_serializing_if = "std::ops::Not::not"
)]
pub enabled: bool,
//`#[serde(default)]`：收到请求时，如果字段缺失，自动取 `bool` 默认值 `false`。
//`skip_serializing_if = "std::ops::Not::not"`：输出 JSON 时，若值为 `false`，`!false` 为 `true`，于是 Serde 跳过该字段；只有 `true` 才会发送。

// Options则有三种状态：None, Some(true), Some(false)使系统复杂
```
- 对新的列表方法，默认实现 cursor 分页：请求字段为 `pub cursor: Option<String>` 和 `pub limit: Option<u32>`；响应字段为 `pub data: Vec<...>` 和 `pub next_cursor: Option<String>`。
### Development Workflow

- API 行为变更时，更新 app-server 文档／示例（至少更新 `app-server/README.md`）。
- API 形状变更时，重新生成 schema fixture：
  `just write-app-server-schema`
  （若影响实验性 API fixture，同时运行 `just write-app-server-schema --experimental`）。
- 使用 `just test -p codex-app-server-protocol` 进行验证。
- 避免在 `common.rs` 中添加仅对单个请求字段的实验性字段标记进行断言的样板测试；应依赖 schema 生成／测试和行为覆盖。

## Python Development Best Practices

### Ignore Python 2 compatibility

本项目使用 Python 3+。不应使用 `__future__` 模块。

若需要关注不同 3.xx 小版本之间的功能兼容性，请检查最近的 `pyproject.toml` 中的 `requires-python` 字段，以确定支持的最低运行时版本。
## Platform Support

除非功能明确为操作系统特定，否则测试和功能必须支持 Linux、macOS 和 Windows。

Codex 支持在不同操作系统上运行已连接的 app-server 和 exec-server。关于这些配置的集成测试，参见 `$remote-tests` skill。
