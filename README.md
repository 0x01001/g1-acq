# g1-acq

[![Telegram](https://img.shields.io/badge/Telegram-AI羊毛交流群-26A5E4?logo=telegram&logoColor=white)](https://t.me/muihbb)

> 💬 **AI羊毛交流群**:https://t.me/muihbb —— 交流 AI 优惠、订阅羊毛

Google One（iOS）订阅入口的商品 ID 改写与采集工具，适用于 **Shadowrocket / 小火箭**。

**新增独立入口：原始 iOS 2TB → `g1.2tb.ai.annual` 年付测试，以及网页 SKU 被动采集。** 完整安装、采集、实机核对步骤见 [Pro 年付测试与 SKU 扫描](docs/pro-annual-test.md)。旧 G1 ACQ 的 20TB / 30TB 映射保留在下方。

> 响应中出现商品 ID，只能证明页面携带该字符串，不等于 App Store 商品目录校验。改写命中也不等于商品可购买；商品名称、周期、初次与续费金额须在 App Store 收银台核对，权益以 Google One 账户实际状态为准。

## 新独立测试入口

以下是新模块的固定版本地址，模块与内部脚本统一引用标签 `pro-annual-test-v1`。

**G1 Pro Annual Test：原始 iOS 2TB → Pro 年付测试**

```text
https://cdn.jsdelivr.net/gh/crhywun/g1-acq@pro-annual-test-v1/g1-pro-annual-test.sgmodule
```

仅对 `one.google.com/ai?` 响应中实际出现、前缀为 `g1.ios.2tb.` 的完整 SKU 进行替换，目标固定为 `g1.2tb.ai.annual`。20TB / 30TB 保持原样，没有备用档；零命中原样返回。源商品是 **原始 iOS 2TB**。

**G1 SKU Scan：网页 SKU 被动采集**

```text
https://cdn.jsdelivr.net/gh/crhywun/g1-acq@pro-annual-test-v1/g1-sku-scan.sgmodule
```

读取 `one.google.com/` 响应中出现的 `g1.*` 与 `com.google.one.*` 字符串，按 ID 去重累计次数，最多保留 300 个 ID；通过 `$done({})` 原样返回响应。采集器跳过自带结果页，在手机保存候选 ID、次数、时间与扫描状态，不查询 App Store，不发网络上报。

两个新模块均附本地结果页。在小火箭连接与对应模块开启时，用 Safari 打开：

- [查看本地结果](https://one.google.com/g1-sku-report)
- [导出 JSON](https://one.google.com/g1-sku-report?format=json)

该精确路径及其 query 由 Shadowrocket 的 `http-request` 脚本在本机返回页面，不交给 Google 处理。采集时只启用 **G1 SKU Scan**；测试时停采集、启用 **G1 Pro Annual Test**。两阶段均停用旧 **G1 ACQ** 和其它改写同一订阅页 SKU 的模块。

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
| G1 Pro Annual Test | `^https://one\.google\.com/ai\?` 的响应 | 改写实际出现的 `g1.ios.2tb.` 前缀完整 SKU |
| G1 SKU Scan | `^https://one\.google\.com/` 的响应，跳过自带结果页 | 采集候选 ID，原样返回响应 |
| 新模块的本地结果页 | `https://one.google.com/g1-sku-report` 精确路径及其 query 的请求 | 本机显示采集结果、最近改写记录或导出 JSON |

模块的 MITM hostname 均只有 `one.google.com`。该 hostname 使整个域名进入 HTTPS 解密范围，具体读取、改写与本地页面响应由各脚本的 URL 匹配进一步限定。模块还包含全局 UDP 443 拦截规则，用于促使支持回退的 QUIC 请求改走 TCP；这条规则并不限于 `one.google.com`。

## 旧 G1 ACQ 使用流程（手机端）

1. 打开 **Google App（彩色 G 图标）→ Google One 管理**，进入订阅方案页面；旧模块匹配该流程中实际发出的 `/ai?` 响应。
2. 在页面提供的 20TB 或 30TB 方案上进入订阅流程，核对 App Store 收银台显示的商品名称、周期、初次与续费金额。

![Google One Ultra 方案选择面板：旧模块的 20TB 方案入口示例](docs-ultra-plans.png)

截图用于展示旧模块的 20TB 入口；新年付测试应打开 **2TB / Pro** 方案。账号、地区和版本会影响页面展示，以手机实际提供的方案为准。原生 StoreKit 界面自身不属于网页响应改写范围。

## 验证与排错

新工具直接使用[本地结果页](https://one.google.com/g1-sku-report)，完整排查步骤见 [Pro 年付测试与 SKU 扫描](docs/pro-annual-test.md)。年付测试零命中表示本次响应没有匹配到 `g1.ios.2tb.` 前缀的完整 SKU，保留响应原样；根据采集结果核对源 ID，不推测新的 iOS SKU。

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
- **版本与存储**：旧模块引用 `@main`，后续下载会跟随该分支；新模块引用 `@pro-annual-test-v1`，维护者仍可移动标签，按 commit hash 引用可固定到具体提交。新工具仅使用 `g1.sku.scan.v1`、`g1.pro.annual.test.v1` 两个本地键，结果页的 `?clear=1` 只清除这两个键。

## 文件

| 文件 | 用途 |
|---|---|
| [g1-acq.sgmodule](g1-acq.sgmodule) | 旧 Shadowrocket 模块，保留原 20TB / 30TB 映射入口 |
| [g1-acq.js](g1-acq.js) | 旧 v6 响应改写脚本 |
| [g1-pro-annual-test.sgmodule](g1-pro-annual-test.sgmodule) | 独立原始 iOS 2TB 年付测试模块，附本地结果页 |
| [g1-pro-annual-test.js](g1-pro-annual-test.js) | 2TB 前缀完整 SKU 改写与本地命中记录 |
| [g1-sku-scan.sgmodule](g1-sku-scan.sgmodule) | 网页 SKU 被动采集模块，附本地结果页 |
| [g1-sku-scan.js](g1-sku-scan.js) | 候选 ID 去重、计数与时间记录 |
| [g1-sku-report.js](g1-sku-report.js) | 本机 HTML 结果页、JSON 导出和两键清理 |
| [docs/pro-annual-test.md](docs/pro-annual-test.md) | 新模块安装、采集、年付实机核对与扫描边界 |

## 旧模块自定义

旧 v6 的映射集中在 [g1-acq.js](g1-acq.js) 的 `SKU_MAP` 与 `FALLBACK`。该脚本只改商品 ID，不改价格字段；页面文字价格也不替代 App Store 收银台金额。新年付测试的目标固定为 `g1.2tb.ai.annual`，没有备用目标。

## 离线验证

使用 Node.js 18 或更新版本，在仓库根目录执行：

```sh
node --test tests/sku-tools.test.cjs
```

检查覆盖 2TB 完整编号匹配、20TB / 30TB 保持原样、URL 范围、零命中、存储异常、采集去重与上限、本地报告、导出字段和模块脚本版本。测试中的源编号是合成样本，不构成商店上架或实机购买证据。
