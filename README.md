# g1-acq

[![Telegram](https://img.shields.io/badge/Telegram-AI羊毛交流群-26A5E4?logo=telegram&logoColor=white)](https://t.me/muihbb)

> 💬 **AI羊毛交流群**:https://t.me/muihbb —— 交流 AI 优惠、订阅羊毛

Google One（iOS）订阅入口的商品 ID 改写与采集工具，适用于 **Shadowrocket / 小火箭**。

**新增合并测试入口：原始 iOS 2TB → `g1.2tb.ai.annual` 年付测试，同时沿用旧 v6 的 20TB / 30TB 映射；另附网页 SKU 被动采集。** 完整安装、采集、实机核对步骤见 [Pro 年付测试与 SKU 扫描](docs/pro-annual-test.md)。新版 **G1 Pro Annual Test** 一个模块覆盖三档，测试时无需并开旧 **G1 ACQ**。旧模块的地址与映射说明保留在下方。

> 响应中出现商品 ID，只能证明页面携带该字符串，不等于 App Store 商品目录校验。改写命中也不等于商品可购买；商品名称、周期、初次与续费金额须在 App Store 收银台核对，权益以 Google One 账户实际状态为准。

## 新合并测试入口

以下两个新模块与内部 `script-path` 统一引用固定标签 `pro-annual-test-v2`。

**G1 Pro Annual Test：原始 iOS 2TB → Pro 年付测试，保留 20TB / 30TB 优惠映射**

```text
https://cdn.jsdelivr.net/gh/crhywun/g1-acq@pro-annual-test-v2/g1-pro-annual-test.sgmodule
```

模块文件名 `g1-pro-annual-test.sgmodule` 与开关名称 **G1 Pro Annual Test** 不变。旧 `pro-annual-test-v1` 标签继续保留；手机已安装 v1 时，需添加上面的 **v2 地址**并停用 v1，旧固定地址不会自动升级。

脚本匹配 `one.google.com/ai?` 响应，按完整源 SKU 执行以下三档映射：

| 正文中的完整源 SKU | 默认目标 | 备用目标 |
|---|---|---|
| `g1.ios.2tb.` 前缀的完整 SKU | `g1.2tb.ai.annual` | 无 |
| `g1.ios.20tb.m.v2` | `g1.20tb.3months_ip_90p.acq` | `g1.20tb.3months_ip_75p.acq` |
| `g1.ios.30tb.ai.pro.m` | `g1.ai.ultra.3months_ip_90p.acq` | `g1.ai.ultra.3months_ip_75p.acq` |

2TB 年付测试的源商品是 **原始 iOS 2TB**，目标固定且没有备用档。20TB / 30TB 各自沿用旧 v6 的回退逻辑：只有该档默认 90p 目标未出现在原始响应正文、对应 75p 备用目标出现时才用 75p；90p 出现时优先用 90p，两个目标都未出现时仍用默认 90p。这是正文字符串判断，不是商店商品查询。三档都未命中时原样返回响应。

**G1 SKU Scan：网页 SKU 被动采集**

```text
https://cdn.jsdelivr.net/gh/crhywun/g1-acq@pro-annual-test-v2/g1-sku-scan.sgmodule
```

读取 `one.google.com/` 响应中出现的 `g1.*` 与 `com.google.one.*` 字符串，按 ID 去重累计次数，最多保留 300 个 ID；通过 `$done({})` 原样返回响应。采集器跳过自带结果页，在手机保存候选 ID、次数、时间与扫描状态，不查询 App Store，不发网络上报。

两个新模块均附本地结果页。在小火箭连接与对应模块开启时，用 Safari 打开：

- [查看本地结果](https://one.google.com/g1-sku-report)
- [导出 JSON](https://one.google.com/g1-sku-report?format=json)

该精确路径及其 query 由 Shadowrocket 的 `http-request` 脚本在本机返回页面，不交给 Google 处理。采集时只启用 **G1 SKU Scan**，停用全部 SKU 改写模块；测试时停采集，只启用 **v2 G1 Pro Annual Test** 合并模块。旧 **G1 ACQ**、v1 年付测试和其它同页 SKU 改写模块均保持停用，避免重复处理；20TB / 30TB 已由新版合并模块覆盖。

**验证状态：目前只证实匹配逻辑和脚本离线测试，iOS 实机下单尚待验证。** `g1.2tb.ai.annual` 在 Google Play 公开记录中对应 Pro、`P1Y`（一年）、`US$199.99`，不是已确认的 iOS 一折商品。

## 旧 G1 ACQ 模块地址

旧模块继续使用原地址：

```text
https://cdn.jsdelivr.net/gh/crhywun/g1-acq@main/g1-acq.sgmodule
```

脚本地址（模块内已引用，无需单独添加）：

```text
https://cdn.jsdelivr.net/gh/crhywun/g1-acq@main/g1-acq.js
```

## 旧 G1 ACQ 映射表

| 原始 iOS 内购 ID | 默认替换为 | 说明 |
|---|---|---|
| `g1.ios.20tb.m.v2` | `g1.20tb.3months_ip_90p.acq` | 20TB 月付 → 目标优惠档 |
| `g1.ios.30tb.ai.pro.m` | `g1.ai.ultra.3months_ip_90p.acq` | 30TB iOS 月付 → 目标 AI Ultra 优惠档 |

v6 只要命中源 ID 就执行替换，**即使默认目标未出现在响应正文中，也会使用默认目标**。只有默认目标未出现在正文、对应备用档 75p 出现在正文时，才切换到备用档：

| 默认目标（90p） | 备用目标（75p） |
|---|---|
| `g1.20tb.3months_ip_90p.acq` | `g1.20tb.3months_ip_75p.acq` |
| `g1.ai.ultra.3months_ip_90p.acq` | `g1.ai.ultra.3months_ip_75p.acq` |

脚本中的“目录优惠档”日志来自响应文本的字符串匹配，不是向 App Store 或 Google Play 查询商品目录；日志中出现某个 ID，仍需实机核对其对应商品与价格。

## 安装（Shadowrocket / 小火箭）

进入 **配置页 → 当前使用配置右侧的 (i) 图标 → HTTPS 解密**。

![配置页入口：点击 shadowrocket.conf 右侧的 (i) 图标进入配置编辑，才能看到 HTTPS 解密](docs-config-entry.png)

1. 在小火箭的模块管理中添加所需模块地址并启用，首页保持 VPN 连接。
2. 从上述当前配置的 **(i)** 入口进入 **HTTPS 解密**，打开解密开关。已有可用且已受信任的 Shadowrocket 证书时直接沿用；尚未配置证书时，在该页生成并安装证书，再完成下两步。
3. 首次配置证书时，在 iOS **设置 → 通用 → VPN 与设备管理** 中完成 Shadowrocket 描述文件安装。
4. 首次配置证书时，在 iOS **设置 → 通用 → 关于本机 → 证书信任设置** 中开启对应 Shadowrocket 根证书的信任。
5. 在当前配置的 **HTTPS 解密 hostname 列表**中核对 `one.google.com`；模块通过 `%APPEND%` 追加该域名。这里是 HTTPS 解密列表，不是 DNS Hosts。
6. 更改模块开关或解密配置后，重新连接小火箭，再重新进入 Google App 的订阅页面。

## 工作范围

| 工具 | 脚本匹配范围 | 行为 |
|---|---|---|
| 旧 G1 ACQ | `^https://one\.google\.com/ai\?` 的响应 | 改写表中两个 20TB / 30TB 源 ID |
| G1 Pro Annual Test v2 | `^https://one\.google\.com/ai\?` 的响应 | 改写实际出现的 2TB 前缀完整 SKU，并沿用上表 20TB / 30TB 映射与独立回退 |
| G1 SKU Scan | `^https://one\.google\.com/` 的响应，跳过自带结果页 | 采集候选 ID，原样返回响应 |
| 新模块的本地结果页 | `https://one.google.com/g1-sku-report` 精确路径及其 query 的请求 | 本机显示采集结果、最近改写记录或导出 JSON |

模块的 MITM hostname 均只有 `one.google.com`。该 hostname 使整个域名进入 HTTPS 解密范围，具体读取、改写与本地页面响应由各脚本的 URL 匹配进一步限定。模块还包含全局 UDP 443 拦截规则，用于促使支持回退的 QUIC 请求改走 TCP；这条规则并不限于 `one.google.com`。

## 旧 G1 ACQ 使用流程（手机端）

1. 打开 **Google App（彩色 G 图标）→ Google One 管理**，进入订阅方案页面；旧模块匹配该流程中实际发出的 `/ai?` 响应。
2. 在页面提供的 20TB 或 30TB 方案上进入订阅流程，核对 App Store 收银台显示的商品名称、周期、初次与续费金额。

![Google One Ultra 方案选择面板：旧模块的 20TB 方案入口示例](docs-ultra-plans.png)

截图用于展示旧模块的 20TB 入口；新年付测试应打开 **2TB / Pro** 方案。账号、地区和版本会影响页面展示，以手机实际提供的方案为准。原生 StoreKit 界面自身不属于网页响应改写范围。

## 验证与排错

新工具直接使用[本地结果页](https://one.google.com/g1-sku-report)，完整排查步骤见 [Pro 年付测试与 SKU 扫描](docs/pro-annual-test.md)。`test.hitCount` 是三档总改写数，`test.annualHitCount` 仅统计 2TB 年付改写；`test.target` 仍专指 `g1.2tb.ai.annual`，`test.version` 输出脚本版本。`test.matchedFrom` 每行含 `{id, to, count, fallback}`：`to` 是该源本次实际目标，`fallback=true` 表示 20TB / 30TB 使用了对应 75p 备用档。HTML 按行显示实际目标和备用状态。

`status=no-match` 仅表示三档都没命中，此时保留响应原样；若 2TB 没命中但 20TB / 30TB 命中，状态仍为 `rewritten`，须看 `annualHitCount` 判断年付测试。根据采集结果核对完整源 ID，不推测新的 iOS SKU。新版报告兼容旧 v1 的仅 2TB 记录：旧行缺少 `to` 时补为 2TB 目标，缺少的 `annualHitCount` 从旧行次数计算。

旧 G1 ACQ 的脚本输出包含以下标记；获取到脚本输出后按标记判断，不依赖某个版本的小火箭日志菜单路径：

| 输出标记 | 含义 |
|---|---|
| `[g1-acq] v6 loaded` | 脚本已加载，版本为 v6 |
| `目录优惠档:` | 当前响应中匹配到的 `acq` 结尾字符串 |
| `主档不在目录,降级` | 默认目标未见于正文，已使用正文中出现的备用档 |
| `共改写 N 处` | 已完成 N 处字符串替换，不代表商店已确认商品 |
| `未命中` | 当前响应未包含映射表中的源 ID |

若没有改写记录，先核对 VPN 连接、模块开关、当前配置的 HTTPS 解密、证书安装与信任、`one.google.com` hostname，再从 Google App 重新打开方案。旧 `@main` 地址随仓库变更，新工具使用固定标签；更新时核对模块和内部脚本的版本地址后重新进入页面，缓存处理不包含“清空所有数据”。

## 权限与安全边界

- **脚本处理范围**：旧模块与年付测试读取匹配页面的响应体；采集器读取 `one.google.com/` 下匹配响应的正文，保存候选 ID、次数、时间与扫描状态。采集器不读取请求头或请求体，不保存完整响应正文。
- **实际外发行为**：当前脚本没有网络上报调用；旧模块写脚本日志，新工具使用手机本地 `$persistentStore`。Shadowrocket 脚本宿主提供网络与存储 API，当前代码未调用网络上报不等于宿主缺少外发能力。模块与脚本下载仍使用 GitHub / jsDelivr 地址。
- **MITM 范围**：模块只追加 `one.google.com`，其全站流量进入解密范围；页面改写受脚本路径限制。证书在设备生成、安装与信任，HTTPS 解密设置属于当前配置。
- **系统权限**：脚本没有申请定位、相册、通知的调用；使用过程包含小火箭 VPN 连接和 iOS 描述文件、根证书信任配置。
- **全局规则影响**：模块的 `[Rule]` 拦截全局 UDP 443，会影响其它 App 的 HTTP/3 使用、速度或连通性。
- **版本与存储**：旧模块引用 `@main`，后续下载会跟随该分支；新模块引用 `@pro-annual-test-v2`，旧 v1 标签保留，维护者仍可移动标签，按 commit hash 引用可固定到具体提交。新工具仍使用 `g1.sku.scan.v1`、`g1.pro.annual.test.v1` 两个本地键，`schemaVersion` 保持 `1`；结果页的 `?clear=1` 只清除这两个键。

## 文件

| 文件 | 用途 |
|---|---|
| [g1-acq.sgmodule](g1-acq.sgmodule) | 旧 Shadowrocket 模块，保留原 20TB / 30TB 映射入口 |
| [g1-acq.js](g1-acq.js) | 旧 v6 响应改写脚本 |
| [g1-pro-annual-test.sgmodule](g1-pro-annual-test.sgmodule) | 2TB 年付测试与旧 20TB / 30TB 映射合并模块，附本地结果页 |
| [g1-pro-annual-test.js](g1-pro-annual-test.js) | 三档完整 SKU 改写、20TB / 30TB 独立回退与本地命中记录 |
| [g1-sku-scan.sgmodule](g1-sku-scan.sgmodule) | 网页 SKU 被动采集模块，附本地结果页 |
| [g1-sku-scan.js](g1-sku-scan.js) | 候选 ID 去重、计数与时间记录 |
| [g1-sku-report.js](g1-sku-report.js) | 本机 HTML 结果页、JSON 导出和两键清理 |
| [docs/pro-annual-test.md](docs/pro-annual-test.md) | 新模块安装、采集、年付实机核对与扫描边界 |

## 旧模块自定义

旧 v6 的映射集中在 [g1-acq.js](g1-acq.js) 的 `SKU_MAP` 与 `FALLBACK`。该脚本只改商品 ID，不改价格字段；页面文字价格也不替代 App Store 收银台金额。新版合并模块中的 2TB 年付目标固定为 `g1.2tb.ai.annual`，2TB 没有备用目标；20TB / 30TB 继续使用上表的默认 90p 与备用 75p。原始 [g1-acq.js](g1-acq.js) 和 [g1-acq.sgmodule](g1-acq.sgmodule) 保持原版本，三档合并行为由新模块提供。

## 离线验证

使用 Node.js 18 或更新版本，在仓库根目录执行：

```sh
node --test tests/sku-tools.test.cjs
```

离线检查覆盖三档完整编号匹配、2TB 固定年付目标、20TB / 30TB 的 90p 优先和 75p 独立回退、目标与备用均缺失时使用默认 90p、只有 20TB / 30TB 的页面、URL 范围、三档零命中、总改写数与 2TB 改写数、逐行报告目标与备用状态、旧 v1 报告兼容、存储异常、采集去重与上限、本地报告、导出字段和模块脚本版本。以实际执行输出核对结果；测试中的源编号是合成样本，不构成商店上架或实机购买证据。
