# CSS Token 映射表 V1 快照（离线缓存）

> 真值源：飞书《CSS Token 映射表 V1》
> https://kcnq8ppkkxh2.feishu.cn/wiki/N8CUw90lViYpmPkbuVrc8675nsf
>
> 本文件为离线快照，V2 发布时同步更新。组件契约文档中的 Token 表三列（figma 变量名 / tailwind 工具类 / 对应的 css 值）须与本表一致。
>
> ✅ 2026-09-22 同步：`color/status/info` 在飞书文档与本项目 `src/global.css` 已统一为 **#999999**（oklch(0.682 0 0)），与 `color/text/subtle` 同值。旧的 #00B2F8（信息蓝）已作废，历史契约文档里若出现 #00B2F8 视为过期值。

## 一、基础表面与文字

| figma 变量名       | tailwind 工具类         | 对应的 css 值 (oklch)      | hex     |
| ------------------ | ----------------------- | -------------------------- | ------- |
| color/bg/default   | bg-background           | oklch(0.967 0.006 264.532) | #F2F4F8 |
| color/text/default | text-foreground         | oklch(0.321 0 0)           | #333333 |
| color/bg/card      | bg-card                 | oklch(0.97 0 0)            | #F5F5F5 |
| color/text/card    | text-card-foreground    | oklch(0.321 0 0)           | #333333 |
| color/bg/popover   | bg-popover              | oklch(0.97 0 0)            | #F5F5F5 |
| color/text/popover | text-popover-foreground | oklch(0.321 0 0)           | #333333 |

## 二、品牌与交互

| figma 变量名                   | tailwind 工具类                                 | 对应的 css 值 (oklch)      | hex     |
| ------------------------------ | ----------------------------------------------- | -------------------------- | ------- |
| color/brand/primary            | bg-primary / text-primary / border-primary      | oklch(0.639 0.149 247.984) | #3091E1 |
| color/brand/primary-foreground | text-primary-foreground / bg-primary-foreground | oklch(0.985 0 0)           | #FCFCFC |
| color/bg/secondary             | bg-secondary                                    | oklch(0.955 0 0)           | #F0F0F0 |
| color/text/secondary           | text-secondary-foreground                       | oklch(0.321 0 0)           | #333333 |
| color/bg/muted                 | bg-muted                                        | oklch(0.955 0 0)           | #F0F0F0 |
| color/text/muted               | text-muted-foreground                           | oklch(0.51 0 0)            | #666666 |
| color/bg/accent                | bg-accent                                       | oklch(0.955 0 0)           | #F0F0F0 |
| color/text/accent              | text-accent-foreground                          | oklch(0.321 0 0)           | #333333 |
| color/text/subtle              | text-subtle-foreground                          | oklch(0.682 0 0)           | #999999 |

## 三、状态与反馈

| figma 变量名                        | tailwind 工具类                   | 对应的 css 值 (oklch)         | hex     |
| ----------------------------------- | --------------------------------- | ----------------------------- | ------- |
| color/status/destructive            | bg-destructive / text-destructive | oklch(0.636 0.244 24.335)     | #FD2237 |
| color/status/destructive-foreground | text-destructive-foreground       | oklch(0.985 0 0)              | #FCFCFC |
| color/status/success                | bg-success / text-success         | oklch(0.7735 0.2095 146.6446) | #3AD75C |
| color/status/warning                | bg-warning / text-warning         | oklch(0.6945 0.2026 43.1038)  | #FE660A |
| color/status/info                   | bg-info / text-info               | oklch(0.682 0 0)              | #999999 |
| color/status/disabled               | bg-disabled / text-disabled       | oklch(0.885 0 0)              | #D9D9D9 |
| color/ink                           | bg-ink / text-ink                 | oklch(0.29 0.033 257.673)     | #212C3C |

## 四、描边与聚焦

| figma 变量名         | tailwind 工具类 | 对应的 css 值 (oklch)      | hex     |
| -------------------- | --------------- | -------------------------- | ------- |
| color/border/default | border-border   | oklch(0.885 0 0)           | #D9D9D9 |
| color/border/input   | border-input    | oklch(0.885 0 0)           | #D9D9D9 |
| color/border/ring    | ring-ring       | oklch(0.639 0.149 247.984) | #3091E1 |

## 七、圆角（radius）

| figma 变量名 | tailwind 工具类 | 对应的 css 值（计算）    | 像素  |
| ------------ | --------------- | ------------------------ | ----- |
| radius       | rounded         | 0.625rem                 | ≈10px |
| radius/sm    | rounded-sm      | calc(var(--radius)/5*2)  | 4px   |
| radius/md    | rounded-md      | calc(var(--radius)/5*3)  | 6px   |
| radius/lg    | rounded-lg      | calc(var(--radius)/5*4)  | 8px   |
| radius/xl    | rounded-xl      | calc(var(--radius)/5*6)  | 12px  |
| radius/2xl   | rounded-2xl     | calc(var(--radius)/5*8)  | 16px  |
| radius/3xl   | rounded-3xl     | calc(var(--radius)/5*12) | 24px  |
| radius/4xl   | rounded-4xl     | calc(var(--radius)/5*16) | 32px  |

## 八、字体与行高（text）

| figma 变量名     | tailwind 工具类  | 对应的 css 值 | 行高 |
| ---------------- | ---------------- | ------------- | ---- |
| text/title-lg    | text-title-lg    | 18px          | 1.5  |
| text/title-md    | text-title-md    | 16px          | 1.5  |
| text/body-strong | text-body-strong | 16px          | 1.5  |
| text/body        | text-body        | 14px          | 1.5  |
| text/caption     | text-caption     | 12px          | 1.5  |

> 注：V1 中 body 字号 css 变量名为 `--text-body`，body-strong 为 `--text-body-storng`（原文拼写，沿用即可）。

## 九、间距（spacing）

基准 `--spacing` 默认 0.25rem（1 单位 = 4px）。

| figma 变量名 | css 变量 / 计算         | tailwind（m / p / gap） | 像素 |
| ------------ | ----------------------- | ----------------------- | ---- |
| spacing/xs   | calc(var(--spacing)/2)  | m-0.5 / p-0.5 / gap-0.5 | 2px  |
| spacing/sm   | var(--spacing)          | m-1 / p-1 / gap-1       | 4px  |
| spacing/md   | calc(var(--spacing)*2)  | m-2 / p-2 / gap-2       | 8px  |
| spacing/lg   | calc(var(--spacing)*3)  | m-3 / p-3 / gap-3       | 12px |
| spacing/xl   | calc(var(--spacing)*4)  | m-4 / p-4 / gap-4       | 16px |
| spacing/2xl  | calc(var(--spacing)*6)  | m-6 / p-6 / gap-6       | 24px |
| spacing/3xl  | calc(var(--spacing)*8)  | m-8 / p-8 / gap-8       | 32px |
| spacing/4xl  | calc(var(--spacing)*12) | m-12 / p-12 / gap-12    | 48px |
| spacing/5xl  | calc(var(--spacing)*16) | m-16 / p-16 / gap-16    | 64px |

> **关键查检点**：间距档位为 2/4/8/12/16/24/32/48/64px，**无 6px 档**。若组件内边距写出 6px（如 `py-1.5`=6px）属非标，须对齐标准档（md=8px 或 sm=4px），或在 figma 列显式标注「非标 6px」。
