# CSS Token 映射表 V1 快照（离线缓存）

> 真值源：飞书《CSS Token 映射表（shadcn + Tailwind CSS v4）》
> https://kcnq8ppkkxh2.feishu.cn/wiki/N8CUw90lViYpmPkbuVrc8675nsf
>
> 本文件为离线快照，与飞书文档 V1 保持一致。组件契约文档中的 Token 表三列（figma 变量名 / tailwind 工具类 / 对应的 css 值）须与本表一致。
>
> ✅ 2026-09-22 同步（info）：`color/status/info` 在飞书文档与本项目 `src/global.css` 已统一为 **#999999**（oklch(0.682 0 0)），与 `color/text/subtle` 同值。旧的 #00B2F8（信息蓝）已作废，历史契约文档里若出现 #00B2F8 视为过期值。
>
> ✅ 2026-09-22 同步（结构）：新增「九、字体字重」；补「五、图表色」「六、侧边栏」（含亮/暗 OKLCH）；原「九、间距」顺延为「十、间距」。

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

## 五、图表色（chart）

| figma 变量名  | css 变量  | tailwind 工具类           | 亮色 OKLCH                    | 亮色参考 HEX | 暗色 OKLCH                 | 用途   |
| ------------- | --------- | ------------------------- | ----------------------------- | ------------ | -------------------------- | ------ |
| color/chart/1 | --chart-1 | bg-chart-1 / text-chart-1 | oklch(0.639 0.149 247.984)    | #3091E1      | oklch(0.488 0.243 264.376) | 图表蓝 |
| color/chart/2 | --chart-2 | bg-chart-2                | oklch(0.722 0.155 235.785)    | #00B2F8      | oklch(0.696 0.17 162.48)   | 图表青 |
| color/chart/3 | --chart-3 | bg-chart-3                | oklch(0.7735 0.2095 146.6446) | #3AD75C      | oklch(0.769 0.188 70.08)   | 图表绿 |
| color/chart/4 | --chart-4 | bg-chart-4                | oklch(0.6945 0.2026 43.1038)  | #FE660A      | oklch(0.627 0.265 303.9)   | 图表橙 |
| color/chart/5 | --chart-5 | bg-chart-5                | oklch(0.636 0.244 24.335)     | #FD2237      | oklch(0.645 0.246 16.439)  | 图表红 |

## 六、侧边栏（sidebar）

| figma 变量名                     | css 变量                     | tailwind 工具类                 | 亮色 OKLCH                 | 亮色参考 HEX | 暗色 OKLCH                 | 用途           |
| -------------------------------- | ---------------------------- | ------------------------------- | -------------------------- | ------------ | -------------------------- | -------------- |
| color/sidebar/bg                 | --sidebar                    | bg-sidebar                      | oklch(0.97 0 0)            | #F5F5F5      | oklch(0.205 0 0)           | 侧边栏背景     |
| color/sidebar/text               | --sidebar-foreground         | text-sidebar-foreground         | oklch(0.321 0 0)           | #333333      | oklch(0.985 0 0)           | 侧边栏文字     |
| color/sidebar/primary            | --sidebar-primary            | bg-sidebar-primary              | oklch(0.639 0.149 247.984) | #3091E1      | oklch(0.488 0.243 264.376) | 侧边栏主色     |
| color/sidebar/primary-foreground | --sidebar-primary-foreground | text-sidebar-primary-foreground | oklch(0.985 0 0)           | #FCFCFC      | oklch(0.985 0 0)           | 侧边栏主色文字 |
| color/sidebar/accent             | --sidebar-accent             | bg-sidebar-accent               | oklch(0.955 0 0)           | #F0F0F0      | oklch(0.269 0 0)           | 侧边栏强调底   |
| color/sidebar/accent-foreground  | --sidebar-accent-foreground  | text-sidebar-accent-foreground  | oklch(0.321 0 0)           | #333333      | oklch(0.985 0 0)           | 侧边栏强调文字 |
| color/sidebar/border             | --sidebar-border             | border-sidebar-border           | oklch(0.885 0 0)           | #D9D9D9      | oklch(1 0 0 / 10%)         | 侧边栏描边     |
| color/sidebar/ring               | --sidebar-ring               | ring-sidebar-ring               | oklch(0.639 0.149 247.984) | #3091E1      | oklch(0.556 0 0)           | 侧边栏聚焦环   |

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

## 八、字体行高（text）

| figma 变量名     | tailwind 工具类  | 对应的 css 值 | 行高 |
| ---------------- | ---------------- | ------------- | ---- |
| text/title-lg    | text-title-lg    | 18px          | 1.5  |
| text/title-md    | text-title-md    | 16px          | 1.5  |
| text/body-strong | text-body-strong | 16px          | 1.5  |
| text/body        | text-body        | 14px          | 1.5  |
| text/caption     | text-caption     | 12px          | 1.5  |

> 注：V1 中 body 字号 css 变量名为 `--text-body`，body-strong 为 `--text-body-storng`（原文拼写，沿用即可）。

## 九、字体字重（Font Weight）

| figma 变量名         | tailwind 工具类 | css 值 | 用途                            |
| -------------------- | --------------- | ------ | ------------------------------- |
| text-weight-Normal   | font-normal     | 400    | 正文、基础文本、说明文字        |
| text-weight-Medium   | font-medium     | 500    | 按钮/控件文字、列表项、次要强调 |
| text-weight-Semibold | font-semibold   | 600    | 小标题、标签、卡片标题、导航项  |
| text-weight-Bold     | font-bold       | 700    | 主标题、重点数据、核心强调      |

## 十、间距（spacing）

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
