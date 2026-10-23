/* ============================================================
   FIN 4060 — Collapsible mind map
   只保留核心理论与公式主干；推导、假设细节与背景知识放在
   二级分支（默认折叠），点 ➕ 即可展开。
   ============================================================ */
(function () {
  "use strict";

  /* 每条 kid = 一个关键结论/公式；其 kids = 可展开的补充说明 */
  var MAPS = {
    index: {
      root: "FIN 4060 · 中国与世界的金融市场",
      note: "课程主线：市场与机构 → 利率决定 → 证券估值 → 货币政策 → 货币市场。带 ➕ 的分支可点开看被略过的背景。",
      kids: [
        { t: "两条主线", kids: [
          { t: "价格线：利率如何决定，证券如何定价" },
          { t: "制度线：市场如何组织，央行如何调控" }
        ]},
        { t: "Part 1 市场与机构", kids: [
          { t: "一级市场（发行人拿钱）vs 二级市场（提供流动性）" },
          { t: "货币市场（≤1年）vs 资本市场（>1年）" },
          { t: "金融机构的五大功能与十大风险" }
        ]},
        { t: "Part 2 中国市场", kids: [
          { t: "A/B 股、QFII/QDII、沪港通/深港通" },
          { t: "2014–2016 杠杆牛与股灾：配资、HOMS、熔断" },
          { t: "银行间债市 vs 交易所债市" }
        ]},
        { t: "Part 3 利率决定", kids: [
          { t: "可贷资金理论：供给与需求决定均衡利率" },
          { t: "费雪效应：名义利率 ≈ 实际利率 + 预期通胀" },
          { t: "名义利率 = 实际利率 + IP + DRP + LRP + MRP" }
        ]},
        { t: "Part 4 期限结构", kids: [
          { t: "三大理论：UET / 流动性溢价 / 市场分割" },
          { t: "远期利率由即期利率隐含解出" },
          { t: "牛陡、牛平、熊陡、熊平四类曲线移动" }
        ]},
        { t: "Part 5–6 债券", kids: [
          { t: "估值：PV = Σ CFt/(1+y)^t" },
          { t: "YTM、溢价/折价/平价、拉动至面值" },
          { t: "Malkiel 五定理、麦考利久期、修正久期、凸性" }
        ]},
        { t: "Part 7 股票", kids: [
          { t: "相对估值：trailing / forward P/E" },
          { t: "DDM：零增长、固定增长、非常规增长、优先股" },
          { t: "CAPM 与 Fama-French 三因子（SMB / HML / MOM）" }
        ]},
        { t: "Part 8–9 货币政策", kids: [
          { t: "美联储：OMO、贴现窗、法定准备金、货币乘数" },
          { t: "FOMC 公告：双重使命、PCE 2%、点阵图、FedWatch" },
          { t: "央行：RRR、MLF、SLF、PSL、7 天逆回购、利率走廊" }
        ]},
        { t: "Part 10 货币市场", kids: [
          { t: "四种报价：折现收益率、单利收益率、BEY、EAR" },
          { t: "国库券单一价格拍卖、联邦基金、回购" },
          { t: "商票、大额可转让 CD、银行承兑汇票、欧洲美元" }
        ]}
      ]
    },

    part1: {
      root: "Part 1 · 金融市场与金融机构",
      note: "先分清「谁拿钱」，再看「谁在中间做转换」。细节折叠在二级分支。",
      kids: [
        { t: "一级市场 Primary：发行人获得资金", kids: [
          { t: "IPO / SEO / 增发" },
          { t: "投资银行承销（underwriting）" }
        ]},
        { t: "二级市场 Secondary：提供流动性", kids: [
          { t: "交易所（auction）vs 场外（dealer / OTC）" },
          { t: "不创造新资金，但决定一级市场的定价环境" }
        ]},
        { t: "货币市场 vs 资本市场", kids: [
          { t: "货币市场：期限 ≤ 1 年，高流动性、低风险" },
          { t: "资本市场：股票、长期债券、中长期贷款" },
          { t: "股票没有到期日，仍归资本市场" }
        ]},
        { t: "直接融资 vs 间接融资", kids: [
          { t: "直接：资金盈余方直接持有借款人的证券" },
          { t: "间接：经金融中介做资产转换（asset transformation）" }
        ]},
        { t: "市场四类交易类型", kids: [
          { t: "现货 spot / 远期 forward / 期货 futures / 期权 option" },
          { t: "远期锁定未来汇率，把风险转移给对手方" }
        ]},
        { t: "金融机构四大类", kids: [
          { t: "存款类 Depository：商业银行、信用社、储蓄机构" },
          { t: "契约储蓄 Contractual savings：寿险、财险、养老金" },
          { t: "投资集合 Investment pools：共同基金、ETF、对冲基金" },
          { t: "市场中介 Intermediaries：投行、经纪商、做市商、交易所" }
        ]},
        { t: "中介五大功能", kids: [
          { t: "降低监控成本（delegated monitoring）" },
          { t: "提高流动性、降低价格风险" },
          { t: "降低交易成本（规模经济）" },
          { t: "期限转换（maturity intermediation）→ 流动性风险来源" },
          { t: "面额转换（denomination intermediation）" }
        ]},
        { t: "十大风险", kids: [
          { t: "信用风险、利率风险、市场风险、流动性风险" },
          { t: "汇率风险、国家/主权风险、表外风险" },
          { t: "技术风险、操作风险、资不抵债风险" },
          { t: "Volcker Rule：受保机构不得自营交易" }
        ]}
      ]
    },

    part2: {
      root: "Part 2 · 中国金融市场",
      note: "重点是「通道」与「杠杆」两条线：谁能买、用什么钱买。",
      kids: [
        { t: "A 股 / B 股", kids: [
          { t: "A 股以人民币计价；B 股上海美元、深圳港币" },
          { t: "A 股不等于只能境内投资者持有（QFII / 互联互通）" }
        ]},
        { t: "跨境通道", kids: [
          { t: "QFII：合格境外机构投资者投境内" },
          { t: "QDII：合格境内机构投资者投境外" },
          { t: "沪港通 / 深港通：额度与标的双向打通" }
        ]},
        { t: "交易所格局", kids: [
          { t: "上交所 SSE：主板 + 科创板 STAR" },
          { t: "深交所 SZSE：主板 + 创业板 ChiNext" },
          { t: "北交所 BSE：服务创新型中小企业" }
        ]},
        { t: "杠杆与 2015 股灾", kids: [
          { t: "融资融券、场外配资、伞形信托、HOMS 分仓" },
          { t: "杠杆放大：收益按自有资金算被倍数放大" },
          { t: "保证金追缴 margin call → 强平 → 再下跌的螺旋" },
          { t: "熔断机制与流动性枯竭" }
        ]},
        { t: "债市结构", kids: [
          { t: "银行间市场：机构为主、单笔规模大（批发）" },
          { t: "交易所市场：散户与中小机构通过证券账户参与" },
          { t: "国债、地方债、政策性金融债、信用债" }
        ]},
        { t: "短期融资工具", kids: [
          { t: "短期融资券 CP / 超短融 SCP：1 年以内" },
          { t: "中期票据 MTN：更长期限" },
          { t: "两者都暴露发行人的信用风险" }
        ]}
      ]
    },

    part3: {
      root: "Part 3 · 利率的决定",
      note: "核心是可贷资金模型 + 利率分解式；两者都要能画图与算数。",
      kids: [
        { t: "货币时间价值", kids: [
          { t: "FV = PV(1+r)^n；PV = FV/(1+r)^n" },
          { t: "年金现值 PV = C × [1−(1+r)^−n]/r" },
          { t: "年金终值 FV = C × [(1+r)^n−1]/r" },
          { t: "折现率越高，未来现金流的现值越低" }
        ]},
        { t: "可贷资金理论", kids: [
          { t: "供给（储蓄）向上倾斜，需求（投资）向下倾斜" },
          { t: "交点决定均衡利率与均衡资金量" },
          { t: "沿曲线移动 = 利率变化；曲线平移 = 外生冲击" },
          { t: "供需同增时，量的方向确定、利率方向不确定" }
        ]},
        { t: "费雪效应", kids: [
          { t: "近似：r_nom ≈ r_real + E(π)" },
          { t: "精确：(1+r_nom) = (1+r_real)(1+E(π))" },
          { t: "实际利率不变时，通胀预期上升推高名义利率" }
        ]},
        { t: "利率分解（加总式）", kids: [
          { t: "r = r_real + IP + DRP + LRP + MRP" },
          { t: "IP 通胀溢价、DRP 违约风险溢价" },
          { t: "LRP 流动性溢价、MRP 期限风险溢价" }
        ]},
        { t: "收益率价差不是纯违约度量", kids: [
          { t: "价差扩大可能来自违约风险、流动性、或两者" },
          { t: "高承诺收益率 ≠ 高实际实现收益" }
        ]}
      ]
    },

    part4: {
      root: "Part 4 · 利率的期限结构",
      note: "三大理论解释同一条曲线；远期利率是计算题的固定入口。",
      kids: [
        { t: "三个经验事实", kids: [
          { t: "不同期限利率随时间同向变动" },
          { t: "短端低时曲线多陡，短端高时曲线多平/倒挂" },
          { t: "长期利率平均高于短期利率" }
        ]},
        { t: "无偏预期理论 UET", kids: [
          { t: "(1+z_n)^n = Π(1+ i_t^e)" },
          { t: "长端 = 未来短端预期的几何平均" },
          { t: "无法解释曲线为何通常向上倾斜" }
        ]},
        { t: "流动性溢价理论", kids: [
          { t: "长端 = 预期 + 正的期限（流动性）溢价" },
          { t: "即使预期短期利率不变，曲线也可以向上倾" },
          { t: "这是考试最常考的「修正版 UET」" }
        ]},
        { t: "市场分割理论", kids: [
          { t: "各期限市场独立，由各自的供需决定" },
          { t: "养老金买长债 → 长端价格升、收益率降、曲线变平" }
        ]},
        { t: "远期利率", kids: [
          { t: "(1+z_2)^2 = (1+z_1)(1+f_{1,2})" },
          { t: "把 f 读成预期未来即期利率需要 UET 假设" }
        ]},
        { t: "曲线移动四分类", kids: [
          { t: "牛陡 / 牛平 / 熊陡 / 熊平" },
          { t: "bull = 收益率整体下行；steepen = 价差扩大" },
          { t: "倒挂是衰退的统计信号，不是精确预测" }
        ]}
      ]
    },

    part5: {
      root: "Part 5 · 债券估值",
      note: "一条公式贯穿全章：价格 = 现金流按到期收益率折现。",
      kids: [
        { t: "基础定价式", kids: [
          { t: "P = Σ C/(1+y)^t + F/(1+y)^T" },
          { t: "付息频率变化时：周期利率 = 报价 YTM / m" }
        ]},
        { t: "三种收益率", kids: [
          { t: "票息率 coupon rate：合同给定的支付比例" },
          { t: "要求回报率 required return：与风险匹配的折现率" },
          { t: "实现回报率 realized HPR：买入价、票息、卖出价决定" },
          { t: "三者不必相等" }
        ]},
        { t: "溢价 / 平价 / 折价", kids: [
          { t: "y < c → 溢价；y = c → 平价；y > c → 折价" },
          { t: "价格与收益率反向变动" }
        ]},
        { t: "零息债与拉动至面值", kids: [
          { t: "P = F/(1+y)^T，收益全部来自购买折价" },
          { t: "溢价债随到期临近价格回落至面值（pull to par）" }
        ]},
        { t: "浮息债 FRN", kids: [
          { t: "票息 = 参考利率 + 利差，随重置日调整" },
          { t: "利率风险显著低于同期限固息债" }
        ]},
        { t: "YTM = 持有期年化收益的条件", kids: [
          { t: "持有至到期、不违约、不被提前赎回" },
          { t: "期间票息能以 YTM 再投资" }
        ]}
      ]
    },

    part6: {
      root: "Part 6 · 债券价格风险：久期与凸性",
      note: "Malkiel 五定性理是简答高频；久期与凸性是计算高频。",
      kids: [
        { t: "Malkiel 五定理", kids: [
          { t: "①价格与收益率反向变动" },
          { t: "②期限越长，价格对收益率的敏感性越大" },
          { t: "③敏感性随期限递增，但增速递减" },
          { t: "④票息越低，敏感性越大（固定期限）" },
          { t: "⑤收益率下降的收益 > 收益率同幅上升的损失" }
        ]},
        { t: "麦考利久期", kids: [
          { t: "D_mac = Σ t × PV(CF_t) / P，单位为年" },
          { t: "零息债久期 = 期限；付息债久期 < 期限" }
        ]},
        { t: "修正久期", kids: [
          { t: "D_mod = D_mac / (1 + y/m)" },
          { t: "ΔP/P ≈ −D_mod × Δy" },
          { t: " dollar 变化 = −D_mod × Δy × P" }
        ]},
        { t: "凸性", kids: [
          { t: "价格—收益率曲线是弯的，不是直线" },
          { t: "只用久期：涨时低估收益、跌时高估损失" },
          { t: "ΔP/P ≈ −D_mod Δy + ½ × Convexity × (Δy)²" }
        ]},
        { t: "决定敏感性的三个变量", kids: [
          { t: "期限 ↑ → 久期 ↑" },
          { t: "票息 ↑ → 久期 ↓" },
          { t: "收益率 ↑ → 久期 ↓" }
        ]}
      ]
    },

    part7: {
      root: "Part 7 · 股票估值",
      note: "两条路线：相对估值（乘数）与绝对估值（折现）；CAPM 提供折现率。",
      kids: [
        { t: "相对估值", kids: [
          { t: "Trailing P/E = P / 已实现 EPS" },
          { t: "Forward P/E = P / 预期 EPS，通常更低" },
          { t: "乘数必须与匹配的盈利口径相乘" },
          { t: "相对便宜 ≠ 绝对便宜（整组都可能被高估）" }
        ]},
        { t: "DDM：零增长", kids: [
          { t: "P_0 = D / r（永续年金）" },
          { t: "优先股的典型形式" }
        ]},
        { t: "DDM：固定增长", kids: [
          { t: "P_0 = D_1/(r − g)" },
          { t: "必须用下一期股利 D_1 = D_0(1+g)" },
          { t: "要求 r > g，否则级数不收敛" }
        ]},
        { t: "DDM：非常规增长", kids: [
          { t: "分段折现 + 终值 TV = D_{T+1}/(r − g)" },
          { t: "终值再折回当前" }
        ]},
        { t: "由价格反解预期回报", kids: [
          { t: "r = D_1/P_0 + g" },
          { t: "与要求回报率比较判断是否被低估" }
        ]},
        { t: "CAPM", kids: [
          { t: "E(r_i) = r_f + β_i [E(r_M) − r_f]" },
          { t: "只对系统性风险（beta）给溢价" },
          { t: "个体波动可通过分散化消除，不获溢价" }
        ]},
        { t: "Fama-French 三因子", kids: [
          { t: "MKTRF：市场超额收益" },
          { t: "SMB：small minus big（规模）" },
          { t: "HML：high minus low（账面市值比，价值）" },
          { t: "MOM：动量（近期赢家 − 近期输家）" },
          { t: "CAPM alpha 在三因子下变 0 → 暴露解释而非能力" }
        ]}
      ]
    },

    part8: {
      root: "Part 8 · 货币政策与美联储",
      note: "传导链条：准备金 → 信贷 → 支出 → 产出与通胀。",
      kids: [
        { t: "FOMC 与双重使命", kids: [
          { t: "FOMC 决定联邦基金利率目标区间" },
          { t: "价格稳定（PCE 通胀 2%）+ 充分就业" }
        ]},
        { t: "三大传统工具", kids: [
          { t: "公开市场操作 OMO：买卖证券改变准备金" },
          { t: "贴现率 discount rate：央行对机构的贷款利率" },
          { t: "法定准备金率 RRR：改变同样准备金的放贷能力" }
        ]},
        { t: "扩张 vs 收缩", kids: [
          { t: "买入证券 = 投放准备金 = 扩张" },
          { t: "卖出国债、提高贴现率、提高 RRR = 收缩" }
        ]},
        { t: "存款创造与货币乘数", kids: [
          { t: "最大存款增量 = 初始准备金 / 准备金率" },
          { t: "最大贷款增量 = 存款增量 − 初始存款" },
          { t: "现金漏损与超额准备金会缩小实际倍数" },
          { t: "倍数是条件模型，不是承诺" }
        ]},
        { t: "贴现窗 vs 联邦基金", kids: [
          { t: "贴现窗：央行贷给机构（央行是贷款人）" },
          { t: "联邦基金：机构之间拆借准备金，通常无抵押" },
          { t: "最后贷款人：缓解流动性短缺，不解决资不抵债" }
        ]},
        { t: "FOMC 公告阅读", kids: [
          { t: "Headline PCE 含食品能源；Core PCE 剔除" },
          { t: "点阵图每个点 = 一位参会者的预测，非集体承诺" },
          { t: "FedWatch：由期货价格反推的市场概率" }
        ]}
      ]
    },

    part9: {
      root: "Part 9 · 中国货币政策",
      note: "分清「数量型」与「价格型」，再记各工具的期限与抵押品。",
      kids: [
        { t: "多目标与冲突", kids: [
          { t: "物价稳定、经济增长、就业、外部平衡" },
          { t: "稳增长 vs 控通胀；降息 vs 汇率与资本流动" },
          { t: "目标多 → 沟通难度上升" }
        ]},
        { t: "数量型工具", kids: [
          { t: "存款准备金率 RRR" },
          { t: "公开市场操作与央行票据" },
          { t: "再贷款、再贴现、PSL（抵押补充贷款）" }
        ]},
        { t: "价格型工具", kids: [
          { t: "7 天逆回购政策利率（短期政策信号）" },
          { t: "MLF 利率（中期）、SLF 利率（上限）" },
          { t: "LPR 报价机制" }
        ]},
        { t: "三大便利的期限分工", kids: [
          { t: "7 天逆回购：短期流动性，滚动操作" },
          { t: "MLF：中期基础货币投放，需合格抵押品" },
          { t: "SLF：常备借贷便利，机构主动申请，构成利率上限" }
        ]},
        { t: "利率走廊", kids: [
          { t: "下限：隔夜逆回购（机构把钱放给央行）" },
          { t: "上限：隔夜回购 / SLF（机构向央行借钱）" },
          { t: "走廊宽度以基点计量，抑制市场利率越界" }
        ]},
        { t: "回购方向辨析", kids: [
          { t: "央行买券并约定卖回 = 逆回购 = 投放流动性" },
          { t: "到期不续做 = 收回流动性" },
          { t: "央行卖券并约定买回 = 正回购 = 回笼流动性" }
        ]},
        { t: "央行买存量债 vs 财政发新债", kids: [
          { t: "前者是二级市场交易，原持有人收到钱" },
          { t: "后者是一级市场发行，政府收到钱" }
        ]}
      ]
    },

    part10: {
      root: "Part 10 · 货币市场",
      note: "计算题核心是四种报价的转换；360 天 vs 365 天不能混用。",
      kids: [
        { t: "四种收益率报价", kids: [
          { t: "折现收益率 r_D = (D/F)(360/n)，分母用面值" },
          { t: "单利收益率 r_SPY = (D/P)(360/n)，分母用投资额" },
          { t: "BEY = (D/P)(365/n)，线性年化" },
          { t: "EAR = (1+HPR)^(365/n) − 1，复利年化" },
          { t: "同一工具：r_D < r_SPY < BEY < EAR" }
        ]},
        { t: "持有期回报 HPR", kids: [
          { t: "HPR = (F − P)/P" },
          { t: "报价年化率 ≠ 实际 90 天赚到的钱" }
        ]},
        { t: "国库券与拍卖", kids: [
          { t: "折价发行，到期按面值兑付" },
          { t: "单一价格拍卖：所有中标者付同一价格" },
          { t: "竞争性投标按折现收益率由低到高排序" },
          { t: "非竞争性投标放弃报价权，保证全额分配" },
          { t: "stop-out yield = 最高接受的折现收益率" }
        ]},
        { t: "交易商双向报价", kids: [
          { t: "客户买入按 ask（dealer 卖出价）" },
          { t: "折现收益率越高 → 价格越低（反向）" },
          { t: "买卖价差 = ask − bid" }
        ]},
        { t: "联邦基金与回购", kids: [
          { t: "联邦基金：无抵押、隔夜、机构间拆借准备金" },
          { t: "回购：有抵押融资，一方的回购 = 另一方的逆回购" },
          { t: "折减率 haircut 提供缓冲，但不消除全部风险" }
        ]},
        { t: "商票 CP", kids: [
          { t: "无抵押、短期、依赖发行人信用" },
          { t: "可能比银行贷款便宜（绕过中介成本）" },
          { t: "二级市场有限，提前变现要打折" }
        ]},
        { t: "大额可转让 CD", kids: [
          { t: "到期一次付息，报价用单利收益率（360 天）" },
          { t: "二级市场价格下跌 → 新买家收益率上升（反向）" },
          { t: "货币市场基金提供面额转换" }
        ]},
        { t: "银行承兑汇票 BA", kids: [
          { t: "银行承兑后承担到期付款义务" },
          { t: "出口商可贴现变现，代价是折价" }
        ]},
        { t: "欧洲美元与 LIBOR→SOFR", kids: [
          { t: "欧洲美元 = 美国境外的美元存款，与欧元无关" },
          { t: "LIBOR 报价丑闻后退场，SOFR 以回购为基准" }
        ]}
      ]
    }
  };

  function node(label, kids, depth) {
    var has = kids && kids.length;
    /* 主干（depth 1）可见，其下的细节（depth ≥ 2）默认折叠，点击 ➕ 展开 */
    var cls = "mm-item" + (has ? " mm-branch" : " mm-leaf") + (depth >= 1 ? " collapsed" : "");
    var s = "<li class='" + cls + "'>";
    if (has) {
      s += "<button type='button' class='mm-toggle' aria-label='展开或折叠'><span class='mm-sign'>−</span></button>";
    } else {
      s += "<span class='mm-bullet'></span>";
    }
    s += "<span class='mm-text'>" + label.replace(/</g, "&lt;") + "</span>";
    if (has) {
      s += "<ul>" + kids.map(function (k) { return node(k.t, k.kids, depth + 1); }).join("") + "</ul>";
    }
    return s + "</li>";
  }

  function render() {
    var host = document.getElementById("mindmap-host");
    if (!host) return;
    var key = document.body.getAttribute("data-page");
    var data = MAPS[key];
    if (!data) { host.style.display = "none"; return; }

    host.className = "mindmap";
    host.innerHTML =
      "<div class='mm-head'>" +
        "<div class='mm-head-l'><h3>知识地图 Mind Map</h3>" +
        "<p class='mm-note'>" + data.note + "</p></div>" +
        "<div class='mm-actions'>" +
          "<button type='button' class='mm-btn' data-act='expand'>全部展开</button>" +
          "<button type='button' class='mm-btn' data-act='collapse'>全部折叠</button>" +
        "</div>" +
      "</div>" +
      "<div class='mm-body'><ul class='mm-root'><li class='mm-item mm-branch'>" +
        "<button type='button' class='mm-toggle'><span class='mm-sign'>−</span></button>" +
        "<span class='mm-text mm-root-text'>" + data.root + "</span><ul>" +
        data.kids.map(function (k) { return node(k.t, k.kids, 1); }).join("") +
        "</ul></li></ul></div>";

    /* toggle a branch (and keep the root open so the map never looks empty) */
    host.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest(".mm-toggle") : null;
      if (btn) {
        var li = btn.parentNode;
        li.classList.toggle("collapsed");
        var sign = btn.querySelector(".mm-sign");
        if (sign) {
          sign.textContent = li.classList.contains("collapsed") ? "+" : "−";
        }
        return;
      }
      var act = e.target.closest ? e.target.closest(".mm-btn") : null;
      if (act) {
        var all = host.querySelectorAll(".mm-item.mm-branch");
        var collapse = act.getAttribute("data-act") === "collapse";
        Array.prototype.forEach.call(all, function (li) {
          if (li.classList.contains("mm-root-text") ||
              li.parentNode.classList.contains("mm-root")) return;
          li.classList.toggle("collapsed", collapse);
          var sg = li.querySelector(":scope > .mm-toggle .mm-sign");
          if (sg) { sg.textContent = collapse ? "+" : "−"; }
        });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
