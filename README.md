# g1-acq

[![Telegram](https://img.shields.io/badge/Telegram-AI羊毛交流群-26A5E4?logo=telegram&logoColor=white)](https://t.me/muihbb)

> 💬 **AI羊毛交流群**:https://t.me/muihbb —— 交流 AI 优惠、订阅羊毛

Google One（iOS）订阅入口的商品 ID 改写与采集工具，适用于 **Shadowrocket / 小火箭**。

**只需一个 G1 ACQ：自动采集原始 SKU、执行三档改写，并提供本机报告与 JSON 导出。** 原始 iOS 2TB → `g1.2tb.ai.annual.3months_ip_90p.acq` 一折年付候选测试，20TB / 30TB 保留原有优惠映射与独立回退。删除手机旧 **G1 ACQ**，用下方 `v7.2.0` 新地址替换一次即可；响应脚本版本为 `g1-acq-v7.2`，无需另装扫描器或反复切换模块。完整安装与实机核对步骤见 [Pro 年付测试与 SKU 扫描](docs/pro-annual-test.md)。

> 响应中出现商品 ID，只能证明页面携带该字符串，不等于 App Store 商品目录校验。改写命中也不等于商品可购买；商品名称、周期、初次与续费金额须在 App Store 收银台核对，权益以 Google One 账户实际状态为准。

## 主模块安装地址

**G1 ACQ：自动采集、三档改写与本机报告**

```text
https://cdn.jsdelivr.net/gh/crhywun/g1-acq@v7.2.0/g1-acq-v7.sgmodule
```

在小火箭模块管理中删除手机上的旧 **G1 ACQ**，再添加上面的新地址并启用；首次安装也使用该地址。模块安装入口与内部响应、报告脚本均固定引用 `@v7.2.0`，无需单独添加脚本；安装后重新连接，再重新进入 Google App 的订阅页。

只开启这一个 **G1 ACQ** 即可。若手机曾安装独立 **G1 SKU Scan**、**G1 Pro Annual Test** 或其它改写副本，停用这些旧副本，避免重复计数或改写；只装了一个主模块时没有额外关闭步骤。历史 `v7.0.0` / `v7.1.0`、`pro-annual-test-v1` / `pro-annual-test-v2` 标签保持不动。

## 三档映射

脚本先从 `one.google.com/` 的原始文字响应中采集 SKU，再仅对匹配 `one.google.com/ai?` 的响应按完整源 SKU 执行以下映射：

| 正文中的完整源 SKU | 默认目标 | 备用目标 |
|---|---|---|
| `g1.ios.2tb.` 前缀的完整 SKU | `g1.2tb.ai.annual.3months_ip_90p.acq`（按规则推导的候选） | 无 |
| `g1.ios.20tb.m.v2` | `g1.20tb.3months_ip_90p.acq` | `g1.20tb.3months_ip_75p.acq` |
| `g1.ios.30tb.ai.pro.m` | `g1.ai.ultra.3months_ip_90p.acq` | `g1.ai.ultra.3months_ip_75p.acq` |

2TB 年付测试的源商品是 **原始 iOS 2TB**，目标固定且没有备用档。20TB / 30TB 各自保留原有回退逻辑：只有该档默认 90p 目标未出现在原始响应正文、对应 75p 备用目标出现时才用 75p；90p 出现时优先用 90p，两个目标都未出现时仍用默认 90p。这是正文字符串判断，不是商店商品查询。三档都未命中时原样返回响应。

**2TB 目标是机械推导的候选：** 原始年付商品 `g1.2tb.ai.annual` + 现有一折命名后缀 `.3months_ip_90p.acq`。候选的商店识别、年付周期与一折价格均未验证；后缀里的 `3months` 也不构成候选实际周期的证据。原始商品 [Google Play 记录](https://github.com/catteadogcar/google-one-tools/blob/91dc6315257ee4c83b8a097c4a2fcece3defe9db/scan_result_us.json#L673)中的 `P1Y`、`US$199.99` 只属于原始商品，不是候选详情。离线测试验证字符串匹配与报告行为，商品名称、周期与金额仍按 App Store 收银台记录。

## 安装（Shadowrocket / 小火箭）

进入 **配置页 → 当前使用配置右侧的 (i) 图标 → HTTPS 解密**。

![配置页入口：点击 shadowrocket.conf 右侧的 (i) 图标进入配置编辑，才能看到 HTTPS 解密](docs-config-entry.png)

1. 在小火箭模块管理中删除手机上的旧 **G1 ACQ**，添加上面的 `v7.2.0` 新主安装地址并启用，首页保持 VPN 连接。
2. 从上述当前配置的 **(i)** 入口进入 **HTTPS 解密**，打开解密开关。已有可用且已受信任的 Shadowrocket 证书时直接沿用；尚未配置证书时，在该页生成并安装证书，再完成下两步。
3. 首次配置证书时，在 iOS **设置 → 通用 → VPN 与设备管理** 中完成 Shadowrocket 描述文件安装。
4. 首次配置证书时，在 iOS **设置 → 通用 → 关于本机 → 证书信任设置** 中开启对应 Shadowrocket 根证书的信任。
5. 在当前配置的 **HTTPS 解密 hostname 列表**中核对 `one.google.com`；模块通过 `%APPEND%` 追加该域名。这里是 HTTPS 解密列表，不是 DNS Hosts。
6. 安装模块、更改模块开关或解密配置后，重新连接小火箭，再重新进入 Google App 的订阅页面。

## 手机端使用流程

1. 保持新版 **G1 ACQ** 开启与小火箭连接，采集和改写会自动依次执行。
2. 打开 **Google App（彩色 G 图标）→ Google One 管理**，进入 **2TB / Pro** 方案进行年付测试；核对保留映射时，再分别打开实际提供的 **20TB / 30TB** 方案。
3. 进入订阅流程后，核对 App Store 收银台显示的商品名称、周期、初次与续费金额；在 Safari 地址栏粘贴完整[本地报告地址](https://one.google.com/g1-sku-report)，查看原始候选 SKU 与改写记录，再点操作区的 **导出 JSON** 按钮。

![Google One Ultra 方案选择面板：旧模块的 20TB 方案入口示例](docs-ultra-plans.png)

截图展示 20TB 入口；2TB 年付测试应打开 **2TB / Pro** 方案。账号、地区和版本会影响页面展示，以手机实际提供的方案为准。原生 StoreKit 界面自身不属于网页响应改写范围。

浏览方案时，主模块会先读取原始正文中的 `g1.*` 与 `com.google.one.*`，按 ID 去重累计次数，最多保留 **300 个 ID**，然后才执行符合 `/ai?` 范围的三档改写。采集保存的是改写前的原始编号，跳过本地报告页；无需另装扫描器。手机只保存候选 ID、次数、时间与扫描状态，不保存完整响应正文，不查询 App Store，不发网络上报。

## 本地报告与排错

保持 **G1 ACQ** 开启与小火箭连接，在 Safari 地址栏粘贴完整[本地报告地址](https://one.google.com/g1-sku-report)。页面上方应显示 **本机脚本已接管** 和 **v7.2.0** 标识，操作区有 **导出 JSON** 按钮；也可直接打开[JSON 导出地址](https://one.google.com/g1-sku-report?format=json)。

地址使用 `one.google.com`，页面由 Shadowrocket 的 `http-request` 脚本在手机本机生成，**不是 Google 提供的报告页面**。拦截范围为 `/g1-sku-report`、末尾带 `/` 的同一路径及其 query；本机接管后直接返回 HTML 或 JSON，不把这次请求交给 Google。

若看到 Google 普通页面、404，或没有上述本机标识与导出按钮，当前展示的就不是这版本机报告。核对新版模块开启、小火箭连接、**当前配置 (i) → HTTPS 解密**、`one.google.com` hostname 与受信任证书，再把完整 URL 粘贴到 Safari 地址栏打开。

`reportVersion=v7.2.0` 与顶层 `configuredTarget=g1.2tb.ai.annual.3months_ip_90p.acq` 表示当前报告版本与配置；`test.version`、`test.target` 则来自最近一次保存的执行记录，升级后仍会保留旧版本与旧目标，直到产生新记录。当前响应脚本为 `g1-acq-v7.2`；新候选记录的 `test.targetOrigin=pattern-derived`，旧普通年付记录为 `legacy`，无记录时为空。`test.target` 仅表示该次执行配置的 2TB 目标；20TB / 30TB 的实际目标看各行 `to`。

`test.hitCount` 是三档总改写数，`test.annualHitCount` 仅统计 2TB 年付改写。`test.matchedFrom` 每行含 `{id, to, count, fallback}`：`to` 是该源本次实际目标，`fallback=true` 表示 20TB / 30TB 使用对应 75p 备用档。HTML 按行显示实际目标和备用状态。

`status=no-match` 仅表示三档都没命中，此时保留响应原样；若 2TB 没命中但 20TB / 30TB 命中，状态仍为 `rewritten`，须看 `annualHitCount` 判断年付测试。报告保留最近一次执行记录，按时间核对；根据采集结果确认完整源 ID，不推测新的 iOS SKU。报告兼容旧 v1 的仅 2TB 记录：旧行缺少 `to` 时补为原普通年付目标 `g1.2tb.ai.annual`，缺少的 `annualHitCount` 从旧行次数计算。旧 v1 / v7.1 执行记录继续显示原目标，不会被当前候选替换。

当前脚本日志前缀为 `[g1-acq]`，按以下字段核对执行结果：

| 输出标记 | 含义 |
|---|---|
| `g1-acq-v7.2 hits=N annualHits=N` | 当前脚本版本、三档总改写数与其中 2TB 年付改写数 |
| `源 SKU → 实际目标 xN` | 逐行记录完整源 ID、本次实际目标与该源改写次数 |
| `fallback=75p` | 该行 20TB / 30TB 使用了正文中出现的对应 75p 备用档 |

若没有新记录，先核对 VPN 连接、模块开关、当前配置的 HTTPS 解密、证书安装与信任、`one.google.com` hostname，再从 Google App 重新打开方案，以新记录的 `test.version` 或日志核对 `g1-acq-v7.2`。完整字段、采集与实机记录模板见 [Pro 年付测试与 SKU 扫描](docs/pro-annual-test.md)。

## 工作范围与本地存储

| 工具 | 脚本匹配范围 | 行为 |
|---|---|---|
| G1 ACQ 自动采集 | `^https://one\.google\.com/` 的文字响应，跳过本地报告页 | 先从原始正文采集候选 ID |
| G1 ACQ 三档改写 | `^https://one\.google\.com/ai\?` 的响应 | 采集后执行完整 SKU 改写、独立回退并保存最近执行记录 |
| 本地结果页 | `/g1-sku-report`、末尾带 `/` 的同一路径及其 query | 本机显示采集结果、最近改写记录或导出 JSON |

- **脚本处理范围**：G1 ACQ 读取匹配页面的响应体，先保存候选 ID、次数、时间与扫描状态，再检查改写范围；不读取请求头或请求体，不保存完整响应正文。改写只修改商品 ID，不改价格字段，页面文字价格不替代 App Store 收银台金额。
- **实际外发行为**：当前脚本没有网络上报调用；G1 ACQ 写脚本日志，采集、改写和报告共用手机本地 `$persistentStore`。Shadowrocket 脚本宿主提供网络与存储 API，当前代码未调用网络上报不等于宿主缺少外发能力。模块与脚本下载仍使用 GitHub / jsDelivr 地址。
- **MITM 范围**：模块只追加 `one.google.com`，其全站流量进入解密范围；页面改写受脚本路径限制。证书在设备生成、安装与信任，HTTPS 解密设置属于当前配置。
- **系统权限**：脚本没有申请定位、相册、通知的调用；使用过程包含小火箭 VPN 连接和 iOS 描述文件、根证书信任配置。
- **全局规则影响**：模块的 `[Rule]` 拦截全局 UDP 443，促使支持回退的 QUIC 请求改走 TCP，也会影响其它 App 的 HTTP/3 使用、速度或连通性。
- **版本与存储**：本次模块安装入口与全部内部脚本统一固定引用 `@v7.2.0`；历史 v1 / v2 标签保留且不移动。本地键仍为 `g1.sku.scan.v1`、`g1.pro.annual.test.v1`，`schemaVersion` 保持 `1`；结果页的 `?clear=1` 只清除这两个键。

## 文件

| 文件 | 用途 |
|---|---|
| [g1-acq-v7.sgmodule](g1-acq-v7.sgmodule) | 唯一主模块：自动采集、三档改写与本机报告 |
| [g1-acq.js](g1-acq.js) | `g1-acq-v7.2` 响应脚本，先采集原始 SKU 再改写并保存记录 |
| [g1-pro-annual-test.sgmodule](g1-pro-annual-test.sgmodule) | 旧版兼容文件，主流程无需安装或启用 |
| [g1-sku-scan.sgmodule](g1-sku-scan.sgmodule) | 旧版独立扫描兼容文件，主流程无需安装或启用 |
| [g1-sku-scan.js](g1-sku-scan.js) | 旧版独立扫描脚本，保留候选 ID 去重、计数与时间记录 |
| [g1-sku-report.js](g1-sku-report.js) | 本机 HTML 报告、导出 JSON 按钮和两键清理 |
| [docs/pro-annual-test.md](docs/pro-annual-test.md) | 单模块使用、自动采集、年付实机核对与报告说明 |

## 离线验证

使用 Node.js 18 或更新版本，在仓库根目录执行：

```sh
node --test tests/sku-tools.test.cjs
```

离线检查以主脚本 [g1-acq.js](g1-acq.js) 为核心，覆盖三档完整编号匹配、2TB 固定年付候选、20TB / 30TB 的 90p 优先和 75p 独立回退、目标与备用均缺失时使用默认 90p、只有 20TB / 30TB 的页面、URL 范围、三档零命中、总改写数与 2TB 改写数、逐行报告目标与备用状态、当前配置与最近执行目标区分、旧 v1 / v7.1 报告兼容、存储异常、采集去重与上限、本地报告、导出字段和模块脚本版本。以实际执行输出核对结果；测试中的源编号是合成样本，不构成商店上架或实机购买证据。
