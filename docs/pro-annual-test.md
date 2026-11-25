# 双 Ultra 入口、Pro 12个月优惠测试与 SKU 扫描

**v7.7.0 提供 G1 ACQ Ultra 一折与 G1 ACQ Ultra 试用两个 CDN 主入口，只开启一个改写入口。** 一折入口默认三个月 90p，备用同档三个月 75p；试用入口默认 1个月免费试用，备用同档三个月 90p。两者均先采集 `one.google.com/` 原始文字响应中的 SKU，再仅在 `/ai?` 响应执行三档改写，并提供最近 10 次响应、本次新增、重复诊断与本机 JSON 导出。响应运行版本分别为 `g1-acq-v7.7-discount` 与 `g1-acq-v7.7-trial`，报告版本为 `v7.7.0`。

两个入口的 2TB 目标均为 `g1.2tb.ai.12months_ip_90p`，源商品仍为 `g1.ios.2tb.` 前缀的原始 iOS 2TB 完整 SKU，目标没有 `.acq` 后缀，也没有备用档。20TB / 30TB 的完整源 ID、默认与备用见第 4 节。试用模式延续 [GitHub PR #3](https://github.com/crhywun/g1-acq/pull/3) 的映射；贡献者 [@cehomecambodia-lang](https://github.com/cehomecambodia-lang) 提供了这两档 Ultra 1个月免费试用 SKU 与三个月 90p 备用方案。

采集器只读取手机实际收到的匹配响应，**不会主动查询全量 SKU**。旧 ID 再次出现会增加次数，清单没有新增本身不足以判断采集失效。两模式共用累计清单、最近 10 次响应和最近执行记录；报告入口已切换，也应按实际记录版本、模式和时间核对新响应是否已写入。

**2TB 12个月优惠候选为 `g1.2tb.ai.12months_ip_90p`，没有 `.acq` 后缀。** 用户截图首项提供该候选与价格标签 `$1.99 × 12 months = $23.88/year`，图示表达连续 12 个月的月度优惠；`90p` 表示 **90% off，约一折**，不是实付 90% 的九折。`$23.88/year` 是截图中的 12 个月合计标签，不是一次年付扣款的证据。

截图标题为 **Pro 5TB**，本轮源商品仍是原始 iOS 2TB，没有新增 5TB 源前缀。截图是候选与价格标签的来源，不是已验证的 iOS 商店商品资料，也不证明实际 iOS 价格、扣款周期或 5TB 权益。候选名称、周期、初次与续费金额按 App Store 实际返回商品核对，权益以 Google One 账户显示为准。离线测试验证字符串匹配与报告行为。

## 1. 安装、升级或切换主模块

**G1 ACQ Ultra 一折 — 默认三个月 90p（一折），同档三个月 75p 备用**

```text
https://cdn.jsdelivr.net/gh/crhywun/g1-acq@v7.7.0/g1-acq-ultra-discount.sgmodule
```

**G1 ACQ Ultra 试用 — 默认 1个月免费试用，同档三个月 90p 备用**

```text
https://cdn.jsdelivr.net/gh/crhywun/g1-acq@v7.7.0/g1-acq-ultra-trial.sgmodule
```

| 对比项 | G1 ACQ Ultra 一折 | G1 ACQ Ultra 试用 |
|---|---|---|
| 模式 | `discount` | `trial` |
| Ultra 默认 / 备用 | 三个月 90p / 三个月 75p | 1个月试用 / 三个月 90p |
| 响应脚本 | [g1-acq-discount.js](../g1-acq-discount.js) | [g1-acq.js](../g1-acq.js) |
| 响应运行版本 | `g1-acq-v7.7-discount` | `g1-acq-v7.7-trial` |
| 报告脚本 | [g1-sku-report-discount.js](../g1-sku-report-discount.js) | [g1-sku-report.js](../g1-sku-report.js) |
| 当前报告入口 | `configuredMode=discount` | `configuredMode=trial` |
| 共用能力 | 2TB 固定候选、原始 SKU 采集、最近 10 响应、JSON 导出 | 2TB 固定候选、原始 SKU 采集、最近 10 响应、JSON 导出 |
| 存储 | 两键共享，`schemaVersion=1` | 两键共享，`schemaVersion=1` |

1. 首次安装时，在小火箭模块管理中添加所需主入口并启用一个；模块已包含对应响应和报告脚本，无需单独添加脚本。
2. 从旧版升级时，**替换或关闭旧 G1 ACQ，再开启一个新主入口**；曾安装 **G1 SKU Scan**、**G1 Pro Annual Test** 或其它改写副本时，也停用这些旧副本。
3. 两个新入口可以保存在同一模块列表中，**切换时先关闭当前入口，再开启另一入口，只保留一个改写入口开启**。
4. 安装、升级或切换后，重新连接小火箭，再重新打开 Google App 的方案页。
5. 打开本机报告，核对当前 `configuredMode`，再分别核对 `scan.version` / `scan.mode` / `scan.updatedAt` 与 `test.version` / `test.mode` / `test.updatedAt`。当前报告入口改变，不代表已保存记录也已更新。

安装入口与全部内部脚本均固定引用 `@v7.7.0`。发布新版本需同时更新脚本内容与固定版本 pin；合并 PR 不会改变旧固定 CDN 地址对应的版本。历史 `v7.0.0` / `v7.1.0` / `v7.2.0` / `v7.3.0` / `v7.4.0` / `v7.5.0` / `v7.6.0`、`pro-annual-test-v1` / `pro-annual-test-v2` 标签保持不动。

升级和模式切换保留累计 SKU、次数与最近 10 次响应；最近执行记录保留到新记录成功写入。两入口共用 `g1.sku.scan.v1` 和 `g1.pro.annual.test.v1`，不另开模式专属存储，也不要求先清空记录。`scan.mode`、`test.mode` 来自实际保存记录，缺失时保留空值，不根据当前入口或历史目标重标。

旧 [g1-acq-v7.sgmodule](../g1-acq-v7.sgmodule) 保留名称 **G1 ACQ**，作为试用优先兼容入口，响应与报告都引用 trial 脚本。旧 [g1-pro-annual-test.sgmodule](../g1-pro-annual-test.sgmodule) 仍仅匹配 `/ai?`，也引用 trial 脚本与报告。独立 [g1-sku-scan.sgmodule](../g1-sku-scan.sgmodule) 只更新下载 pin，[g1-sku-scan.js](../g1-sku-scan.js) 的运行版本仍为 `pro-annual-test-v2`，不增加模式或响应活动字段；新版报告显示实际旧版本、缺失模式与缺失历史，不补造活动。启用新主入口时，这些兼容入口保持关闭。

两个新主模块沿用旧主模块的本地报告 URL、`[Rule]` 和 `[MITM]`：仅追加 hostname `one.google.com`，全局拦截 UDP 443；后者也会影响其它 App 的 HTTP/3、速度或连通性。

## 2. 配置 HTTPS 解密

模块要处理 HTTPS 响应，需在当前使用的配置中启用解密并信任证书。

1. 只启用第 1 节的一个 `v7.7.0` 新主入口，旧版用户替换或关闭旧入口，保持小火箭 VPN 连接。
2. 进入 **配置页 → 当前使用配置右侧的 (i) 图标 → HTTPS 解密**，打开解密开关。
3. 已有可用且已受信任的 Shadowrocket 证书时直接沿用；尚未配置证书时，在该页生成并安装证书，再前往 iOS **设置 → 通用 → VPN 与设备管理** 完成描述文件安装。
4. 首次配置证书时，前往 iOS **设置 → 通用 → 关于本机 → 证书信任设置**，开启对应 Shadowrocket 根证书的信任。
5. 在当前配置的 **HTTPS 解密 hostname 列表**中核对 `one.google.com`。模块使用 `%APPEND%` 追加该域名；此处是 HTTPS 解密列表，不是 DNS Hosts。
6. 更改模块开关、切换入口或更改解密配置后重新连接小火箭，再重新进入 Google App 的方案页面。

[配置入口截图](../docs-config-entry-example.png)与 [README 安装步骤](../README.md#安装shadowrocket--小火箭)展示当前配置右侧的 `(i)` 入口；[Ultra 方案截图](../docs-ultra-plans-example.png)展示 20TB 入口示例。两图保留脱敏后的文件名与内容。MITM hostname 覆盖 `one.google.com` 整个域名，脚本读取与改写范围由下文的 URL 匹配限定。

## 3. 浏览方案，被动采集原始 SKU

保持选定的一个主入口开启即可。每次处理 `one.google.com/` 的文字响应时，主脚本先采集原始正文，再检查该响应是否需要三档改写；记录的候选编号保持改写前原值，匹配的非文本响应只计入非文本诊断。

1. 保持小火箭连接，在同一手机 Safari 地址栏粘贴完整[本地报告地址](https://one.google.com/g1-sku-report)，核对 **本机脚本已接管**、报告版本 **v7.7.0** 和当前入口模式；先记录实际 `scan.version`、`scan.mode`、`scannedResponses`、`matchedResponses`、`nonTextResponses` 与最新响应时间。
2. 打开 **Google App（彩色 G 图标）→ Google One 管理**，重新进入实际提供的 **2TB / Pro** 方案；核对 Ultra 一折或试用映射时，再浏览实际提供的 **20TB / 30TB** 方案。
3. 页面提供月付、年付切换时，逐个浏览并等待加载完成。只有新收到的匹配响应才产生采集活动，无需完成购买；账号、地区、App 版本决定实际显示的方案与控件，页面缓存也会影响是否发出新请求。
4. 返回 Safari 刷新报告，对比模式、计数和最新响应。计数增长且 `known-skus` 表示重复数据；清单没有新增不等于采集停止。计数与最新响应时间均未变，只能确认本轮未保存新的采集记录；存储写入失败也会保留旧计数，按第 7 节核对日志、缓存、匹配范围与模块配置。
5. 查看“浏览页面时采集到的候选 SKU”，记录完整编号、次数、最近发现时间。寻找实际出现的 `g1.ios.2tb.` 前缀完整编号；20TB / 30TB 对照第 4 节的两个完整源 ID，不自行补全后缀。
6. 点报告操作区的 **导出 JSON** 按钮保存结果，也可直接打开 [JSON 导出地址](https://one.google.com/g1-sku-report?format=json)。

被动采集覆盖 `https://one.google.com/` 下的文字响应，跳过 `/g1-sku-report`、末尾带 `/` 的同一路径及其 query。它识别 `g1.*` 与 `com.google.one.*` 字符串，按 ID 去重累计出现次数；同一 ID 在一个响应中重复出现，或在后续响应中再次出现，都会增加次数，次数不是购买次数。

最多保留 **300 个不同 ID**。达到上限后继续更新已保存 ID 的次数和时间；超出上限的新 ID 不再加入列表，`omittedCount` 记录本次因容量丢弃的不同 ID 数。`addedCount>0` 时优先标为 `new-skus`，即使同时存在容量丢弃；只有 `addedCount=0` 且 `omittedCount>0` 时才标为 `limit-reached`。切换模式后仍保留并使用同一份累计清单。

采集会在用于识别的文本副本中还原 `\u002e`、`\x2e` 与 HTML 点号实体；这个还原步骤不修改响应。采集完成后，仅匹配 `/ai?` 的响应进入三档改写，其它响应原样返回。脚本不读取请求头或请求体，不保存完整响应正文，不查询 App Store，不向外发送采集数据。

## 4. 核对 2TB 12个月优惠与双 Ultra 映射

采集与改写由当前主入口自动先后执行，核对收银台时继续保持这一个入口开启。

1. 确认所需的 **G1 ACQ Ultra 一折** 或 **G1 ACQ Ultra 试用** 单独开启，小火箭保持连接。
2. 核对当前配置右侧 **(i) → HTTPS 解密** 中的开关、`one.google.com` hostname 和 iOS 证书信任；更改配置或切换入口后重新连接。
3. 退出当前方案页，再从 **Google App（彩色 G）→ Google One 管理** 重新进入 **2TB / Pro** 方案。核对 Ultra 映射时分别打开实际提供的 20TB / 30TB 方案。
4. 从页面实际提供的方案进入订阅流程，核对 App Store 收银台中的 **商品名称、订阅周期、币种、初次金额、续费金额**。若未拉起收银台，记录屏幕上的实际提示；2TB、20TB、30TB 的结果分别记录。
5. 在 Safari 打开 [本地报告](https://one.google.com/g1-sku-report)，查看当前入口、实际执行模式、版本、执行时间与状态；“总替换次数”是三档总数，“其中 2TB”是 2TB / Pro 优惠改写数，下方逐行显示完整源编号、实际目标与备用状态。
6. 导出 JSON，保留 `reportVersion`、`configuredMode`、`configuredTarget`、`scan.version`、`scan.mode`、`test.version`、`test.mode`、`test.matchedFrom`、`test.target`、`test.targetOrigin`、`test.hitCount`、`test.annualHitCount`、`test.status` 与时间字段，将它们和本次 App Store 显示结果一起记录。

主入口的响应匹配为 `^https://one\.google\.com/`；脚本先采集原始文字响应，再仅对匹配 `^https://one\.google\.com/ai\?` 的响应识别完整明文编号并应用以下映射：

| 入口模式 | 正文中的完整源 SKU | 默认目标 | 备用目标 |
|---|---|---|---|
| 两种模式共用 | `g1.ios.2tb.` 前缀的完整 SKU | `g1.2tb.ai.12months_ip_90p`（用户指定候选） | 无 |
| `discount` 一折 | `g1.ios.20tb.m.v2` | `g1.20tb.3months_ip_90p.acq` | `g1.20tb.3months_ip_75p.acq` |
| `discount` 一折 | `g1.ios.30tb.ai.pro.m` | `g1.ai.ultra.3months_ip_90p.acq` | `g1.ai.ultra.3months_ip_75p.acq` |
| `trial` 试用 | `g1.ios.20tb.m.v2` | `g1.20tb.1month_eft.acq` | `g1.20tb.3months_ip_90p.acq` |
| `trial` 试用 | `g1.ios.30tb.ai.pro.m` | `g1.ai.ultra.1month_eft.acq` | `g1.ai.ultra.3months_ip_90p.acq` |

2TB 匹配到的完整源 ID 固定替换为 `g1.2tb.ai.12months_ip_90p`，没有备用目标，也不要求目标预先出现在正文中。20TB / 30TB 必须命中表中的完整源 ID，各档独立按**本次原始响应正文**选择：

- 默认目标已出现：使用默认目标，`fallback=false`；自己的备用同时出现也仍优先默认。
- 默认目标缺失、自己的备用出现：使用该档备用，`fallback=true`。
- 默认与自己的备用都缺失：仍使用默认目标，`fallback=false`。

20TB 的判断只看 20TB 的两项目标，30TB 的判断只看 30TB 的两项目标；累计清单、另一档 SKU 和改写后的正文不参与选择。`discount` 的默认是三个月 90p，备用是三个月 75p；`trial` 的默认是 1个月试用，备用是三个月 90p。其它编号保持原样，三档都未命中时原样返回响应。这是正文目标字符串判断，不是向 App Store 查询商品目录。

| 报告字段 | 含义 |
|---|---|
| `reportVersion` | 当前报告脚本版本 `v7.7.0`，与保存的采集、执行版本分别显示 |
| `configuredMode` | 当前报告入口模式 `discount` / `trial`，表示当前入口配置 |
| `configuredTarget` | 当前配置的 2TB 候选 `g1.2tb.ai.12months_ip_90p` |
| `test.version` | 生成该执行记录的脚本版本；本版分别为 `g1-acq-v7.7-discount` / `g1-acq-v7.7-trial`，旧记录保留原版本 |
| `test.mode` | 实际执行记录保存的模式 `discount` / `trial`；缺失时为空，不从当前入口或版本推断 |
| `test.matchedFrom` | 每行 `{id, to, count, fallback}`；`to` 是本次实际目标，`count` 是改写次数，`fallback=true` 表示该次执行使用备用；结合模式、版本与实际 `to` 核对 |
| `test.target` | 最近一次执行时保存的 2TB 目标；20TB / 30TB 的实际目标看各行 `to` |
| `test.targetOrigin` | 新记录为 `user-specified`；旧来源按历史表保留，无执行记录时为空 |
| `test.hitCount` | 本次响应三档总改写数；日志 `hits=N` 对应此值 |
| `test.annualHitCount` | 沿用兼容字段名，仅统计 2TB / Pro 优惠改写数；日志 `annualHits=N` 对应此值，报告显示“其中 2TB”；字段名不证明年付扣款 |
| `test.updatedAt` | 最近一次执行时间，UTC |
| `test.status = rewritten` | 三档中至少一档已执行字符串替换；只有 20TB / 30TB 命中时也为此状态 |
| `test.status = no-match` | 本次文本响应三档完整源 ID 都未命中，响应原样返回 |
| `test.status = non-text` | 本次响应没有可处理的文本正文，响应原样返回 |

当前日志前缀为 `[g1-acq]`，两入口汇总分别为 `g1-acq-v7.7-discount hits=N annualHits=N` 与 `g1-acq-v7.7-trial hits=N annualHits=N`，逐行输出 `源 SKU → 实际目标 xN`。选用备用时附 `fallback=实际完整目标编号`：

| 入口模式 | 20TB 备用日志 | 30TB 备用日志 |
|---|---|---|
| `discount` | `fallback=g1.20tb.3months_ip_75p.acq` | `fallback=g1.ai.ultra.3months_ip_75p.acq` |
| `trial` | `fallback=g1.20tb.3months_ip_90p.acq` | `fallback=g1.ai.ultra.3months_ip_90p.acq` |

采集日志同样带实际运行版本，后接 `status=<状态> addedCount=N candidates=N omittedCount=N occurrences=N saved=yes/no`；`saved=yes` 表示该次采集记录成功写入。旧日志 `g1-acq-v7.6` 保留历史试用优先含义，旧版本 `fallback=75p` 是更早的历史日志格式。

这里保存的是**最近一次进入 `/ai?` 三档改写检查的执行记录**，不是累计执行历史；后续零命中或非文本响应也会更新记录。升级与切换本身不重写这份记录，新记录成功写入前仍显示旧版本、旧目标、旧来源和原模式。历史记录按下表保留：

| 历史版本 | 保留的 2TB 目标 | 目标来源 | Ultra 与模式记录 |
|---|---|---|---|
| `g1-acq-v7.6` | `g1.2tb.ai.12months_ip_90p` | `user-specified` | 保留 1个月试用默认与 90p 备用的实际行；缺失 `mode` 保持空值 |
| `g1-acq-v7.5` | `g1.2tb.ai.12months_ip_90p` | `user-specified` | 保留当时实际行与备用状态；缺失模式保持空值 |
| v7.3 / v7.4 | `g1.2tb.ai.annual_ip_90p.acq` | `user-specified` | 保留当时实际行；缺失模式保持空值 |
| v7.2 | `g1.2tb.ai.annual.3months_ip_90p.acq` | `pattern-derived` | 保留当时实际行；缺失模式保持空值 |
| v1 / v7.1 | `g1.2tb.ai.annual` | `legacy` | 保留普通年付记录；缺失模式保持空值 |

目标相同也要核对版本、模式与执行时间：v7.5、v7.6 和两个 v7.7 入口的 2TB 目标相同；v7.6 与本版 trial 的 Ultra 目标也相同。已保存的 `mode` 保留实际值，缺失模式不按当前配置补写。命中次数证明文本替换，App Store 接受目标商品与实际订阅结果另按收银台记录。

`hitCount=0` 与 `status=no-match` 表示本次文本响应三档都未命中，不等于账号没有 2TB 商品，也不等于目标商品不存在。若 `annualHitCount=0`、`hitCount>0`，说明只命中了 20TB / 30TB，状态仍为 `rewritten`；判断 2TB 12个月优惠测试须看 `annualHitCount`，再对照各行 `id` 与 `to`。

采集覆盖整个 `one.google.com/`，并可识别转义点号；三档改写仅处理 `/ai?` 原文中的完整明文编号。报告中出现候选 ID，不保证另一条 `/ai?` 响应能命中。目标档未命中时继续浏览实际提供的方案，按第 3 节查看原始完整编号。

## 5. 本地结果页、导出与清理

保持小火箭连接与所选的一个主入口开启，在 Safari 地址栏粘贴完整[本地报告地址](https://one.google.com/g1-sku-report)。页面上方应显示 **本机脚本已接管** 和 **v7.7.0** 标识，展示当前报告入口、实际采集模式与实际执行模式，操作区有 **导出 JSON** 按钮。

| 地址 | 动作 |
|---|---|
| [本地报告](https://one.google.com/g1-sku-report) | 显示当前入口、累计采集结果与最近一次三档执行记录 |
| [导出 JSON](https://one.google.com/g1-sku-report?format=json) | 返回 `g1-sku-report.json` 下载响应 |
| [清空本工具记录](https://one.google.com/g1-sku-report?clear=1) | 清空两入口共用的采集记录与最近执行记录 |

**地址使用 Google 域名，报告页面由手机本机脚本提供。** Shadowrocket 的 `http-request` 脚本接管 `https://one.google.com/g1-sku-report`，也支持末尾 `/` 和 query，在本机生成 HTML 或 JSON 并直接返回，不把这次请求交给 Google。HTML 不加载外部资源，报告与导出脚本没有网络上报调用。

若看到 Google 普通页面或 404，核对所选主入口开启、小火箭连接、**当前配置 (i) → HTTPS 解密**、`one.google.com` hostname 和 iOS 中已受信任的证书，再把完整报告 URL 粘贴到 Safari 地址栏打开。

数据保存在手机 `$persistentStore` 中，时间使用 UTC；两入口共用下列两个键，`schemaVersion: 1` 保持不变：

| 键 | 内容 |
|---|---|
| `g1.sku.scan.v1` | 累计候选 ID、次数、最近发现时间、实际采集版本与模式、文字/命中/非文本响应计数、上限状态与最多 10 条脱敏响应事件 |
| `g1.pro.annual.test.v1` | 最近执行版本与模式、2TB 源前缀、三档命中行的实际目标和备用状态、2TB 目标与来源、总改写数、2TB 改写数、时间和状态 |

报告的 `configuredMode` 表示当前报告入口，`scan.mode` 与 `test.mode` 表示实际保存的记录模式。旧记录缺失模式时，JSON 保持空字符串，HTML 显示未记录；读取报告不会把旧记录重标。切换到一折入口后，`configuredMode=discount`、`scan.mode=trial` 或 `test.mode=trial` 可以同时出现；反向切换同理。两个本版运行版本都按实际保存值显示，分别对照版本、模式和时间判断新记录是否已写入。

采集与执行分属两键且范围不同：新的 `one.google.com/` 响应可以更新采集记录，只有 `/ai?` 改写检查才更新执行记录；写入失败时原记录继续保留。因此 `scan.mode` 与 `test.mode` 不必同步变化。累计 SKU 和最近 10 条响应在切换时继续保留；最近响应数组可包含切换前后的事件，事件本身没有模式字段，不把当前 `scan.mode` 套用到每条历史事件。

HTML 按命中行显示完整源 ID、实际目标、次数与备用状态。`fallback=true` 时按实际 `to` 显示 75p、90p 或“是”；`fallback=false` 时显示“否”。本版一折默认 90p、备用 75p，试用默认 `1month_eft`、备用 90p，因此 75p 行既可来自本版一折，也可来自历史记录；90p 行既可是一折默认，也可为试用备用，须结合版本、模式与 `fallback` 核对。

旧 v1 仅 2TB 记录缺少 `to` 时补为原普通年付目标 `g1.2tb.ai.annual`，缺少 `annualHitCount` 时从旧 2TB 行次数计算；旧行按未使用备用展示。旧 v7.2、v7.3 / v7.4、v7.5 / v7.6 的目标、来源、版本与实际命中行均按第 4 节历史表保留，缺失模式保持空值，保留历史无需先清空两键。

JSON 的核心采集字段为 `scan.skus`，每项含 `id`、`count`、`lastSeen`。`reportVersion=v7.7.0` 与 `scan.version` 分别显示：前者是报告版本，后者是实际保存的采集版本。历史 v7.6 保留 `g1-acq-v7.6` 与已保存响应历史；更早记录没有活动历史时不补造。旧脚本显示“旧采集记录”，版本未知或无记录时显示“尚未保存本版采集响应记录”。仅更新报告脚本不代表新版采集器已经收到响应。

| 采集字段 | 含义 |
|---|---|
| `scan.version` | 实际采集记录的脚本版本；本版为 `g1-acq-v7.7-discount` / `g1-acq-v7.7-trial`，旧记录保留原值 |
| `scan.mode` | 实际保存的 `discount` / `trial`；缺失时为空，不按当前入口推断 |
| `scan.updatedAt` | 最近一次成功写入采集记录的 UTC 时间 |
| `scan.scannedResponses` | 累计文字响应数；非文本不计入，原有含义不变 |
| `scan.matchedResponses` | 至少识别出一个候选 ID 的累计文字响应数，重复 ID 也算命中 |
| `scan.nonTextResponses` | 累计非文本响应数，与文字响应分开 |
| `scan.recentResponses` | 最多 10 条事件；JSON 旧 → 新保存，超过 10 条移出最旧事件；HTML 新 → 旧展示 |

每条响应事件包含以下字段：

| 事件字段 | 含义 |
|---|---|
| `at` | 本次响应处理时间，UTC |
| `path` | 固定类别路径，仅取 `/`、`/ai`、`/plans`、`/_/…/data/batchexecute` 或 `[其他 one.google.com 路径]` |
| `bodyType` | 响应体类型，不包含正文内容 |
| `status` | 本次响应的采集诊断状态，见下表 |
| `candidateCount` | 本响应内识别出的不同候选 ID 数；同一 ID 多次出现只计 1 个候选 |
| `addedCount` | 本次新加入并实际保留的不同 ID 数 |
| `omittedCount` | 本次因 300 个 ID 容量限制而丢弃的不同 ID 数；同一未保留 ID 多次出现只计 1 次丢弃 |

| `status` | 含义 |
|---|---|
| `new-skus` | `addedCount>0`，本次保留新增 ID；即使 `omittedCount>0` 仍优先使用此状态 |
| `known-skus` | 本次识别出的 ID 均已保存，只更新累计次数与发现时间 |
| `no-skus` | 本次文字响应未识别到候选 ID |
| `limit-reached` | 仅在 `addedCount=0` 且 `omittedCount>0` 时使用：没有新保留 ID，存在容量丢弃 |
| `non-text` | 本次响应不是可采集文字，增加 `nonTextResponses` |

`candidateCount`、`addedCount`、`omittedCount` 按每个响应中的不同 ID 计数；`scan.skus[].count` 累计字符串出现次数，两者含义不同。已有记录缺少 `recentResponses` 时，不根据旧时间或累计计数补造历史；实际处理的新响应才产生事件。最近 10 次响应不代表全部历史。

响应路径固定脱敏：`/_/…/data/batchexecute` 中的 `…` 是固定展示文本，其它路径归入 `[其他 one.google.com 路径]`。事件与导出不保存 query、完整 URL、请求头、响应头、请求体或响应正文。用最后一次响应时间与最近历史对照本次打开方案页的时间。

`?clear=1` 是手动操作，只清空上述两个共用键，不执行小火箭“清空所有数据”；读取和刷新普通报告地址不清理记录。只有确实要重置历史时，先导出再清理；日常切换保持记录即可。清空后返回不带 `clear=1` 的[本地报告地址](https://one.google.com/g1-sku-report)，避免刷新清理地址时再次清除新记录。

## 6. 在 iOS 小火箭中采集与验证隐藏 SKU

当前项目运行在 **iPhone + Shadowrocket + Google App** 中。采集读取整份匹配的原始文字响应：即使某个编号所在的方案没有显示在页面上，只要编号已出现在响应里，也会被提取。页面只显示几个方案，不等于响应里只有几个编号。

1. 保持选定的一个主入口开启，在 Google App 内依次打开实际提供的 2TB / Pro、月付、年付和优惠入口；每次等页面加载完成，让模块收集不同入口下发的原始响应。
2. 在 Safari 打开[本地报告](https://one.google.com/g1-sku-report)，查看“浏览页面时采集到的候选 SKU”；这里保存改写前取得的完整编号，最多 300 个。
3. 对候选 `g1.2tb.ai.12months_ip_90p`，重新进入原始 2TB / Pro 方案，在报告中核对实际 `test.version`、`test.mode`、`test.updatedAt`、`test.target` 与对应行 `to`。本版运行版本为 `g1-acq-v7.7-discount` / `g1-acq-v7.7-trial`，两模式的 2TB 目标相同。
4. 核对 Ultra 时，分别进入 20TB / 30TB 方案，按第 4 节当前模式的完整默认、备用目标核对 `to` 与 `fallback`。
5. 从该方案进入原生订阅流程，查看 App Store 实际显示的商品、周期、初次与续费金额；保存实际结果，再导出 JSON 对照执行记录。

原始采集清单和配置的替换候选分别保存。模块写入的新目标不会自动成为“采集到的隐藏 SKU”；服务器没有下发的编号也不在这次采集结果中。当前小火箭脚本处理网络响应，没有直接调用 Google App 内 StoreKit 的接口，报告中的“替换成功”描述文本改写。

原生 iOS 商品查询使用 StoreKit `Product.products(for:)` 或 `SKProductsRequest`，由对应 App 上下文提交已知 ID；这类查询返回商品详情，并非列出全部商品的目录接口。本项目的手机流程是采集原始编号、替换指定候选、查看原生订阅返回，再保存报告。

## 7. 常见结果的判断

| 观察结果 | 下一步 |
|---|---|
| 报告页显示“暂无记录”或“尚未保存本版采集响应记录” | 记录实际版本、模式与计数，重新进入实际方案后刷新；无记录不直接等于手机故障 |
| 报告为 `v7.7.0`，采集版本仍为 `g1-acq-v7.6` 或更早 | 报告已升级，采集记录仍来自旧脚本；保留旧模式空值、计数与实际历史，重开方案后核对时间 |
| `configuredMode=discount`，实际记录仍为 `g1-acq-v7.7-trial` / `trial` | 当前报告是一折入口，实际保存的是本版试用入口记录；只开一折入口，重新连接、打开方案，再按版本 / 模式 / 时间核对；反向切换同理 |
| `scan.mode` 已切换而 `test.mode` 尚未切换 | 分别检查两键时间；采集覆盖整个域名，执行只处理 `/ai?`，新采集记录不证明新的改写记录已保存 |
| 旧记录缺失 `scan.mode` / `test.mode` | JSON 保持空字符串，HTML 显示未记录；不从目标、版本或当前入口推断模式 |
| 旧记录没有 `recentResponses` | 保留原候选与累计计数，实际新响应才填入历史 |
| Safari 显示 Google 普通页面或 404 | 按第 5 节核对主入口、连接、当前配置 HTTPS 解密、hostname 与证书，将完整报告 URL 粘贴到地址栏 |
| 页面没有本机标识、`v7.7.0` 或导出按钮 | 按第 1 节更新所选主入口，再重开本机报告；JSON 地址见第 5 节 |
| 报告页显示本地存储接口暂未就绪 | 页面未取得 `$persistentStore` 读取接口，记录实际显示结果与小火箭版本 |
| 清单仍是旧 ID，但文字响应计数增加且状态为 `known-skus` | 本次收到重复数据，累计次数与发现时间更新；比较各响应的候选数与新增数 |
| 三个响应计数与最新时间均未变 | 本轮未保存新采集记录；先看 `saved=no` / `SKU collection unavailable`，再核对缓存、匹配范围、唯一开启入口、VPN、HTTPS 解密、证书信任和 hostname |
| 最近状态为 `no-skus` | 本次正文未出现匹配字符串；核对其它实际方案页，不凭空生成 ID |
| 仅 `nonTextResponses` 增加，状态为 `non-text` | 已收到非文本响应；记录类型与脱敏路径，再核对其它实际方案页 |
| 最近状态为 `new-skus` | `addedCount>0`，实际保留新 ID；即使有容量丢弃仍显示此状态；候选 `count` 为累计出现次数 |
| 已采集到 2TB ID，但 `annualHitCount=0` | 对照执行版本、模式、时间、完整源 ID、`g1.ios.2tb.` 前缀与 `/ai?` 范围，再重新采集 |
| `status=rewritten`、`hitCount>0`、`annualHitCount=0` | 本次只改写 20TB / 30TB；查看各行 `id`、`to` 与 `fallback` |
| `status=no-match`、`hitCount=0` | 本次文本响应三档都未命中；核对第 4 节完整源 ID 与 URL 范围 |
| 本版 `discount` 的 `fallback=false` | `to` 为该档三个月 90p 默认；默认出现，或默认与备用均缺失时都选默认 |
| 本版 `discount` 的 `fallback=true` | 默认 90p 缺失、自己的 75p 出现；`to` 为 `g1.20tb.3months_ip_75p.acq` 或 `g1.ai.ultra.3months_ip_75p.acq` |
| 本版 `trial` 的 `fallback=false` | `to` 为该档 `1month_eft` 默认；默认出现，或默认与备用均缺失时都选默认 |
| 本版 `trial` 的 `fallback=true` | 默认试用缺失、自己的 90p 出现；`to` 为 `g1.20tb.3months_ip_90p.acq` 或 `g1.ai.ultra.3months_ip_90p.acq` |
| 20TB / 30TB 行显示 75p 备用 | 本版一折与旧版本均可有此实际目标；按保存版本、模式、时间与 `to` 核对，保留原值 |
| 2TB 目标相同，但 `test.version` 为 `g1-acq-v7.5` / `g1-acq-v7.6` | 仍是历史执行记录，相同目标不代表本版某个入口已经运行；缺失模式保持空值 |
| `hitCount>0`，收银台报错或未出现 | 记录实际提示与 `to`；文本替换与商店返回分别记录 |
| App Store 商品、周期或金额与预期不同 | 记录本次实际商品与金额；先区分 `to` 是默认、备用还是 2TB 目标，SKU 字段与截图标签不替代实际结果 |
| `addedCount=0`、`omittedCount>0`、状态为 `limit-reached` | 本次有容量丢弃、无新保留 ID，已保存 ID 仍更新；确实要释放容量时先导出再手动清理两键 |

按第 3 节执行“先记录 → 重开实际方案 → 刷新比较”保留前后证据；新编号由实际响应决定，重复安装或反复清空不会促使服务器下发新 SKU。

## 8. 实机记录模板

```text
采集 / 测试时间（含时区）：[填写]
iOS / Google App / Shadowrocket 版本：[填写]
唯一开启的主模块名称：[G1 ACQ Ultra 一折 / G1 ACQ Ultra 试用，填写实际入口]
一折安装地址：https://cdn.jsdelivr.net/gh/crhywun/g1-acq@v7.7.0/g1-acq-ultra-discount.sgmodule
试用安装地址：https://cdn.jsdelivr.net/gh/crhywun/g1-acq@v7.7.0/g1-acq-ultra-trial.sgmodule
实际使用的主模块地址：[填写上方对应地址]
主模块发布版本：v7.7.0
预期响应版本：[discount 为 g1-acq-v7.7-discount；trial 为 g1-acq-v7.7-trial]
旧入口与另一新入口已关闭：[填写实际状态]
切换后重新连接与重开方案的时间：[填写；未切换则记无]
运行方式：一个入口先采集原始 SKU 与最近10次响应，再执行三档改写
报告顶部本机标识与版本：[填写实际显示]
报告版本 reportVersion：[填写实际显示；当前 v7.7.0]
当前报告入口 configuredMode：[填写 discount / trial]
实际采集版本 scan.version：[填写实际保存值；保留历史版本]
实际采集模式 scan.mode：[填写实际保存值；缺失为空，不按入口补写]
采集版本提示：[填写实际显示]
采集记录时间 scan.updatedAt（UTC）：[填写]
打开方案前 / 后文字计数 scan.scannedResponses：[填写]
打开方案前 / 后命中计数 scan.matchedResponses：[填写]
打开方案前 / 后非文本计数 scan.nonTextResponses：[填写；旧记录缺少则记未记录]
打开方案前 / 后最近响应时间：[填写；缺少历史则记未记录]
最近响应 scan.recentResponses：[按 JSON 旧→新填写最多10条；HTML 新→旧；不为事件补写模式]
最新响应 at / path / bodyType：[填写实际保存值；at 为 UTC，路径只填脱敏类别]
最新响应 status：[填写 new-skus / known-skus / no-skus / limit-reached / non-text]
最新响应 candidateCount / addedCount / omittedCount：[填写不同候选数 / 新保留数 / 容量丢弃数]
当前 2TB 目标 configuredTarget：g1.2tb.ai.12months_ip_90p
候选来源：用户截图指定（user-specified），无 .acq 后缀
截图价格标签：$1.99 × 12 months = $23.88/year；连续12个月的月度优惠标签
截图折扣含义：90p = 90% off，约一折，非实付90%的九折
截图标题：Pro 5TB；本轮源商品仍为原始 iOS 2TB，截图不证明5TB权益
2TB 候选验证状态：[按本次 App Store 商品名称、周期、初次与续费金额填写]
20TB 源 SKU：g1.ios.20tb.m.v2
30TB 源 SKU：g1.ios.30tb.ai.pro.m
discount 20TB 默认 / 备用：g1.20tb.3months_ip_90p.acq / g1.20tb.3months_ip_75p.acq
discount 30TB 默认 / 备用：g1.ai.ultra.3months_ip_90p.acq / g1.ai.ultra.3months_ip_75p.acq
trial 20TB 默认 / 备用：g1.20tb.1month_eft.acq / g1.20tb.3months_ip_90p.acq
trial 30TB 默认 / 备用：g1.ai.ultra.1month_eft.acq / g1.ai.ultra.3months_ip_90p.acq
独立选择规则：本次原始响应中默认出现优先默认；默认缺失且自己备用出现才回退；两者均缺失仍默认
20TB 本次原始正文默认 / 自己备用是否出现：[按当前模式填写证据；未核对则记未核对]
30TB 本次原始正文默认 / 自己备用是否出现：[按当前模式填写证据；未核对则记未核对]
是否看到并点按导出 JSON 按钮：[填写]
Google App 实际打开的方案名称：[填写 2TB / Pro、20TB 或 30TB 的实际名称]
采集到的原始 iOS 2TB 完整 SKU：[填写原文；未出现则记未采集到]
采集到的原始 iOS 20TB / 30TB 完整 SKU：[填写原文；未出现则记未采集到]
实际执行版本 test.version：[填写实际保存值；本版分别为 g1-acq-v7.7-discount / g1-acq-v7.7-trial]
实际执行模式 test.mode：[填写实际保存值；缺失为空，不按当前入口补写]
最近执行时间 test.updatedAt（UTC）：[填写]
入口与记录核对：[分别比较 configuredMode、scan.version/mode/updatedAt、test.version/mode/updatedAt]
逐行源 ID、实际目标、次数、备用状态 test.matchedFrom：[填写 {id, to, count, fallback}]
20TB 实际目标 to / fallback：[填写实际保存值，对照执行记录模式]
30TB 实际目标 to / fallback：[填写实际保存值，对照执行记录模式]
保留的历史记录：[填写原版本、原模式或空值、原时间、实际 to 与 fallback；v7.6 不重标 trial]
日志 fallback：[填写本次完整目标编号；未使用备用则记无]
最近执行的 2TB 目标 test.target：[填写原值；v7.5 / v7.6 与本版目标相同仍须核对版本和时间]
最近执行的来源 test.targetOrigin：[填写 user-specified / pattern-derived / legacy / 空值；保留旧来源]
三档总改写数 test.hitCount：[填写]
仅 2TB / Pro 改写数 test.annualHitCount：[填写；兼容字段名，不证明年付扣款]
执行状态 test.status：[填写]
是否拉起 App Store 收银台：[填写]
App Store 商品名称：[填写实际显示]
订阅周期：[填写实际显示]
币种 / 初次金额 / 续费金额：[填写实际显示]
实际错误提示：[填写原文；未出现则记无]
是否实际完成购买：[填写]
购买后 Google One 账户显示的权益：[仅在实际购买后填写]
本轮 JSON 导出文件：[填写]
```

## 9. 离线验证与生成副本

使用 Node.js 18 或更新版本，在仓库根目录执行：

```sh
node tools/build-variants.cjs --check
node --test tests/sku-tools.test.cjs
```

[g1-acq.js](../g1-acq.js) 和 [g1-sku-report.js](../g1-sku-report.js) 是 trial 源；[tools/build-variants.cjs](../tools/build-variants.cjs) 生成 [g1-acq-discount.js](../g1-acq-discount.js) 与 [g1-sku-report-discount.js](../g1-sku-report-discount.js)。修改源后执行 `node tools/build-variants.cjs` 更新两个副本，随后执行同步检查与测试。

验证覆盖两入口默认与同档回退、默认和备用均缺失时仍用默认、2TB 固定目标、原始 SKU 采集、共享记录保留、当前报告入口与实际模式、缺失模式空值、历史 v7.6 与更早记录、导出和模块 pin。以命令实际输出核对结果；离线样本验证字符串与报告行为，实机结果按第 8 节分别填写。
