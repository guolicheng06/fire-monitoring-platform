/**
 * 消防安全知识数据库
 * 包含各类消防安全知识、隐患自查清单、逃生指南、案例警示
 */

// 知识分类
export type KnowledgeCategory = 
  | 'fire_prevention'      // 火灾预防
  | 'fire_extinguisher'    // 灭火器使用
  | 'escape'               // 逃生知识
  | 'electricity'          // 用电安全
  | 'gas'                  // 燃气安全
  | 'daily'                // 日常防火
  | 'law'                  // 法律法规
  | 'cargo'                // 仓储安全
  | 'electrical'           // 电气火灾
  | 'highrise';            // 高层建筑

// 知识条目
export interface KnowledgeItem {
  id: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
  tags: string[];
  importance: 'high' | 'medium' | 'low';
}

// 逃生指南
export interface EscapeGuide {
  id: string;
  title: string;
  scenario: string;
  steps: string[];
  tips: string[];
  icon: string;
}

// 火灾案例
export interface FireCase {
  id: string;
  title: string;
  location: string;
  date: string;
  cause: string;
  casualties: number;
  injured: number;
  loss: string;
  lessons: string[];
  type: 'residential' | 'commercial' | 'industrial' | 'transport' | 'other';
}

// 隐患自查项
export interface HazardCheckItem {
  id: string;
  category: string;
  question: string;
  options: {
    label: string;
    score: number;
    feedback: string;
  }[];
}

// 每日提示
export interface DailyTip {
  day: number;
  title: string;
  content: string;
  icon: string;
}

// 消防安全知识库
export const knowledgeBase: KnowledgeItem[] = [
  // 火灾预防
  {
    id: 'fp001',
    category: 'fire_prevention',
    title: '不要卧床吸烟',
    content: '躺卧或在沙发上吸烟时容易睡着，烟头一旦落在被褥、沙发等可燃物上，极易引发火灾。据统计，约30%的家庭火灾是由于乱扔烟头引起的。',
    tags: ['居家安全', '吸烟安全', '日常防火'],
    importance: 'high'
  },
  {
    id: 'fp002',
    category: 'fire_prevention',
    title: '安全使用蜡烛',
    content: '使用蜡烛时应有烛台或托盘固定，远离易燃物品。不要在无人看管的情况下点燃蜡烛，就寝前应将蜡烛熄灭。教育儿童不要玩弄蜡烛。',
    tags: ['居家安全', '明火安全'],
    importance: 'high'
  },
  {
    id: 'fp003',
    category: 'fire_prevention',
    title: '厨房用火不离人',
    content: '厨房是家庭火灾的高发区。烹饪时一定要有人看守，避免汤水溢出浇灭火焰造成燃气泄漏。离开厨房前务必关闭燃气阀门。',
    tags: ['厨房安全', '燃气安全', '用火安全'],
    importance: 'high'
  },
  {
    id: 'fp004',
    category: 'fire_prevention',
    title: '儿童玩火安全教育',
    content: '打火机、火柴等应放在儿童接触不到的地方。家长要教育儿童不玩火，说明玩火的危险性。研究表明，约20%的儿童火灾是因儿童玩火引起。',
    tags: ['儿童安全', '家庭教育'],
    importance: 'high'
  },

  // 灭火器使用
  {
    id: 'fe001',
    category: 'fire_extinguisher',
    title: '灭火器使用口诀',
    content: '记住灭火器使用口诀："一提二拔三瞄四压"。一提：提起灭火器；二拔：拔掉保险销；三瞄：将喷嘴对准火焰根部；四压：压下手柄喷射。',
    tags: ['灭火器', '灭火技能', '操作规程'],
    importance: 'high'
  },
  {
    id: 'fe002',
    category: 'fire_extinguisher',
    title: '灭火器检查要点',
    content: '定期检查灭火器：1. 压力表指针是否在绿色区域；2. 铅封是否完好；3. 喷嘴是否畅通；4. 瓶体有无变形损伤；5. 有效期是否在有效期内。',
    tags: ['灭火器维护', '设备检查'],
    importance: 'medium'
  },
  {
    id: 'fe003',
    category: 'fire_extinguisher',
    title: '不同类型灭火器的适用场景',
    content: '1. 干粉灭火器：适用于液体、气体、电气火灾；2. 二氧化碳灭火器：适用于精密仪器、图书档案；3. 水基灭火器：适用于普通固体物质火灾；4. 泡沫灭火器：适用于液体火灾。',
    tags: ['灭火器类型', '灭火选择'],
    importance: 'medium'
  },

  // 逃生知识
  {
    id: 'es001',
    category: 'escape',
    title: '火灾逃生黄金时间',
    content: '火灾发生后，一般家庭可在3-5分钟内成功逃生。超过这个时间，温度会急剧上升，氧气急剧下降，毒性气体增多，逃生难度大增。',
    tags: ['逃生知识', '时间概念'],
    importance: 'high'
  },
  {
    id: 'es002',
    category: 'escape',
    title: '低姿逃生法',
    content: '火灾时会产生大量有毒烟气，热气向上走，地面附近烟气较淡、温度较低。逃生时应弯腰低姿前进，有条件的可用湿毛巾捂住口鼻。',
    tags: ['逃生姿势', '防烟技巧'],
    importance: 'high'
  },
  {
    id: 'es003',
    category: 'escape',
    title: '切勿乘坐电梯',
    content: '火灾时电梯井会形成烟囱效应，电梯容易断电被困。必须使用楼梯逃生，平时应熟悉本楼层的逃生通道位置。',
    tags: ['逃生常识', '电梯安全'],
    importance: 'high'
  },
  {
    id: 'es004',
    category: 'escape',
    title: '固守待援的条件',
    content: '如果逃生通道被烟火封锁，在房间固守待援时：关好门窗，用湿毛巾塞住门缝，向窗外挥舞醒目物品求救，拨打119告知具体位置。',
    tags: ['固守待援', '求救技巧'],
    importance: 'medium'
  },

  // 用电安全
  {
    id: 'el001',
    category: 'electricity',
    title: '大功率电器使用规范',
    content: '使用空调、电暖器等大功率电器时，应使用专用插座，不要在一个插座上连接多个大功率电器。避免使用延长线串联多个大功率电器。',
    tags: ['用电安全', '大功率电器'],
    importance: 'high'
  },
  {
    id: 'el002',
    category: 'electricity',
    title: '电器火灾的正确处理',
    content: '电器着火时，应先切断电源，再用干粉或二氧化碳灭火器灭火。切勿用水或泡沫灭火器扑救，可能造成触电。无法断电时，用干沙土覆盖灭火。',
    tags: ['电器火灾', '灭火方法'],
    importance: 'high'
  },
  {
    id: 'el003',
    category: 'electricity',
    title: '插座使用安全',
    content: '插座额定电流不得大于所接电器的额定电流。不要用湿手触碰电源开关。发现插座、插头有发热或变色迹象时，应停止使用并及时检修。',
    tags: ['插座安全', '日常用电'],
    importance: 'medium'
  },

  // 燃气安全
  {
    id: 'gs001',
    category: 'gas',
    title: '燃气泄漏的识别',
    content: '燃气泄漏时会有特殊气味（添加了硫化物以便察觉）。如果听到嘶嘶声、看到气泡或闻到异味，可能是燃气泄漏。此时切勿开灯或使用电器。',
    tags: ['燃气安全', '泄漏识别'],
    importance: 'high'
  },
  {
    id: 'gs002',
    category: 'gas',
    title: '燃气泄漏的正确处置',
    content: '发现燃气泄漏时：1. 立即关闭燃气阀门；2. 打开门窗通风；3. 疏散人员；4. 到室外安全处拨打燃气公司电话或119报警；5. 切勿在室内使用手机或开关电器。',
    tags: ['燃气安全', '应急处置'],
    importance: 'high'
  },
  {
    id: 'gs003',
    category: 'gas',
    title: '燃气灶使用安全',
    content: '使用燃气灶时，先点火后开气。使用完毕后先关燃气阀门，再关灶具开关。定期检查燃气管路是否老化、龟裂。燃气灶周围不要放置易燃物品。',
    tags: ['燃气灶', '用气安全'],
    importance: 'medium'
  },

  // 日常防火
  {
    id: 'da001',
    category: 'daily',
    title: '电动车充电安全',
    content: '电动车应在室外充电，不要在楼道、地下室或室内充电。充电时间不宜过长，充满后及时拔掉电源。使用原装充电器，不要私拉电线充电。',
    tags: ['电动车安全', '充电安全'],
    importance: 'high'
  },
  {
    id: 'da002',
    category: 'daily',
    title: '杂物清理规范',
    content: '保持消防通道畅通，不要在楼道、楼梯间、安全出口堆放杂物。这些地方是逃生的生命通道。及时清理阳台、窗台上的花盆等可燃物品。',
    tags: ['通道安全', '杂物清理'],
    importance: 'high'
  },
  {
    id: 'da003',
    category: 'daily',
    title: '蚊香使用安全',
    content: '使用蚊香时应固定在非易燃支架上，远离窗帘、床单等易燃物品。不要在开着空调的密闭房间使用蚊香。睡前检查蚊香是否熄灭。',
    tags: ['夏季防火', '蚊香安全'],
    importance: 'medium'
  },

  // 法律法规
  {
    id: 'lw001',
    category: 'law',
    title: '消防法规定的公民义务',
    content: '《消防法》规定公民有维护消防安全、保护消防设施、预防火灾、报告火警的义务。任何单位、个人不得损坏、挪用或者擅自拆除、停用消防设施。',
    tags: ['消防法', '公民责任'],
    importance: 'medium'
  },
  {
    id: 'lw002',
    category: 'law',
    title: '火灾谎报的法律责任',
    content: '《消防法》明确规定，故意谎报火警将受到处罚。情节较轻的，处警告或500元以下罚款；情节严重的，可处5-10日拘留。',
    tags: ['消防法', '法律责任'],
    importance: 'low'
  },

  // 仓储安全
  {
    id: 'cg001',
    category: 'cargo',
    title: '仓库储存安全距离',
    content: '货物堆放应与灯保持50cm以上距离，与屋顶保持30cm以上距离。货架间通道宽度不小于1米。主要通道宽度不小于2米。不得堵塞消防设施和通道。',
    tags: ['仓储安全', '货物堆放'],
    importance: 'medium'
  },
  {
    id: 'cg002',
    category: 'cargo',
    title: '危险化学品储存要求',
    content: '危险化学品应储存在专用仓库，与其他物品保持安全距离。不同性质的化学品要分库储存。库房应有防爆电气、通风、防静电等设施。',
    tags: ['危化品', '仓储安全'],
    importance: 'high'
  },

  // 电气火灾
  {
    id: 'ec001',
    category: 'electrical',
    title: '电气火灾的常见原因',
    content: '1. 短路：线路绝缘损坏导致相线与中性线接触；2. 过载：用电负荷超过线路承载能力；3. 接触不良：接头松动导致发热；4. 漏电：线路或设备绝缘损坏。',
    tags: ['电气火灾', '原因分析'],
    importance: 'high'
  },
  {
    id: 'ec002',
    category: 'electrical',
    title: '预防电气火灾的措施',
    content: '1. 选用合格的电气产品和电线电缆；2. 定期检查电气线路和设备；3. 不私拉乱接电线；4. 安装漏电保护装置；5. 用电负荷大的场所应配置电气火灾监控系统。',
    tags: ['电气火灾', '预防措施'],
    importance: 'high'
  },

  // 高层建筑
  {
    id: 'hr001',
    category: 'highrise',
    title: '高层建筑火灾的特点',
    content: '1. 烟囱效应明显，烟火蔓延速度快；2. 人员疏散困难，高层逃生耗时长；3. 外部救援难度大，举高消防车受限多；4. 火灾扑救技术要求高。',
    tags: ['高层建筑', '火灾特点'],
    importance: 'high'
  },
  {
    id: 'hr002',
    category: 'highrise',
    title: '超高层建筑避难层',
    content: '建筑高度超过100米的公共建筑，应设置避难层。避难层应采用不燃材料装修，有独立的防烟楼梯和消防电梯。避难层可提供人员暂时避难。',
    tags: ['高层建筑', '避难层'],
    importance: 'medium'
  },
  {
    id: 'hr003',
    category: 'highrise',
    title: '商业综合体火灾防控',
    content: '商业综合体人员密集、功能复杂，火灾风险高。应确保疏散通道畅通、消防设施完好、电气线路规范、人员培训到位、应急演练常态化。',
    tags: ['商业综合体', '火灾防控'],
    importance: 'high'
  },

  // 新增更多火灾预防知识
  {
    id: 'fp005',
    category: 'fire_prevention',
    title: '燃放烟花爆竹安全',
    content: '燃放烟花爆竹应在指定地点，远离易燃易爆物品，儿童应在成人监护下燃放。购买正规厂家生产的合格产品，不要在室内、楼道、阳台燃放。',
    tags: ['烟花爆竹', '节日安全'],
    importance: 'high'
  },
  {
    id: 'fp006',
    category: 'fire_prevention',
    title: '酒精消毒使用安全',
    content: '使用酒精消毒时远离明火，不要在密闭空间大量喷洒酒精。酒精应储存在阴凉通风处，避免阳光直射。使用后及时密封保存。',
    tags: ['酒精消毒', '疫情防控'],
    importance: 'high'
  },
  {
    id: 'fp007',
    category: 'fire_prevention',
    title: '电热毯使用安全',
    content: '电热毯不要折叠使用，不要与热水袋同时使用。使用时间不宜过长，睡前关闭电源。定期检查电热毯是否有破损。',
    tags: ['电热毯', '冬季防火'],
    importance: 'high'
  },
  {
    id: 'fp008',
    category: 'fire_prevention',
    title: '祭祀用火安全',
    content: '焚香、烧纸钱等祭祀活动应在空旷地带，远离建筑物、树木、柴草等可燃物。用火后确保火源彻底熄灭。',
    tags: ['祭祀用火', '传统习俗'],
    importance: 'medium'
  },

  // 新增灭火器使用知识
  {
    id: 'fe004',
    category: 'fire_extinguisher',
    title: '灭火器有效喷射距离',
    content: '干粉灭火器喷射距离一般在2-5米。使用时站在上风方向，距离火焰2-3米处喷射，先上下颠倒几次，使筒内干粉松动。',
    tags: ['灭火器', '使用技巧'],
    importance: 'medium'
  },
  {
    id: 'fe005',
    category: 'fire_extinguisher',
    title: '灭火器有效期',
    content: '干粉灭火器有效期一般为5-10年。压力表指针在红色区域表示压力不足，需要更换或充装。',
    tags: ['灭火器', '有效期'],
    importance: 'medium'
  },
  {
    id: 'fe006',
    category: 'fire_extinguisher',
    title: '灭火器配置数量要求',
    content: '一般场所每50平方米配置1具2公斤干粉灭火器。重点场所每20平方米配置1具。灭火器应放置在明显、便于取用的位置。',
    tags: ['灭火器', '配置标准'],
    importance: 'low'
  },

  // 新增逃生知识
  {
    id: 'es005',
    category: 'escape',
    title: '防烟面罩使用方法',
    content: '防烟面罩使用时先拔掉保险销，拉开面罩，套住头部，收紧头带，拉紧密封带，确保面罩密封良好。',
    tags: ['防烟面罩', '逃生器材'],
    importance: 'high'
  },
  {
    id: 'es006',
    category: 'escape',
    title: '火场求救信号',
    content: '被困时可通过手电筒、手机屏幕、敲击金属等方式发出求救信号。夜间可晃动鲜艳衣物、挥动毛巾等。',
    tags: ['求救方法', '被困自救'],
    importance: 'high'
  },
  {
    id: 'es007',
    category: 'escape',
    title: '身上着火怎么办',
    content: '身上着火时不要奔跑，应就地打滚或用厚重衣物压灭火苗。也可跳入附近水源灭火。不要用灭火器直接喷射人体。',
    tags: ['身上着火', '自救方法'],
    importance: 'high'
  },
  {
    id: 'es008',
    category: 'escape',
    title: '疏散通道检查要点',
    content: '进入陌生场所先观察安全出口、疏散通道位置，熟悉逃生路线。检查疏散通道是否畅通、应急照明是否完好。',
    tags: ['疏散通道', '事前准备'],
    importance: 'medium'
  },

  // 新增用电安全知识
  {
    id: 'el004',
    category: 'electricity',
    title: '电线老化识别',
    content: '电线绝缘层变硬、变脆、变色、开裂、脱落表示老化。电线发热、有异味、绝缘层破损应及时更换。',
    tags: ['电线老化', '安全检查'],
    importance: 'high'
  },
  {
    id: 'el005',
    category: 'electricity',
    title: '漏电保护器测试',
    content: '漏电保护器应每月测试一次，按下测试按钮，应能自动跳闸。不能自动跳闸说明漏电保护器工作正常。',
    tags: ['漏电保护', '安全测试'],
    importance: 'medium'
  },
  {
    id: 'el006',
    category: 'electricity',
    title: '移动电源使用安全',
    content: '不要将充电器、充电宝等不要覆盖，不要在床边、沙发上使用充电。充电时有人看管，充满后及时断电。',
    tags: ['充电宝', '充电安全'],
    importance: 'high'
  },
  {
    id: 'el007',
    category: 'electricity',
    title: '雷电天气用电安全',
    content: '雷电天气时，关闭电视、电脑等电器，拔掉电源插头。不要使用固定电话，不要靠近窗户、阳台。',
    tags: ['雷电安全', '防雷安全'],
    importance: 'medium'
  },

  // 新增燃气安全知识
  {
    id: 'gs004',
    category: 'gas',
    title: '燃气胶管更换周期',
    content: '燃气胶管使用寿命一般为18个月。发现胶管老化、龟裂、变硬应立即更换。胶管长度不应超过2米。',
    tags: ['燃气胶管', '定期更换'],
    importance: 'high'
  },
  {
    id: 'gs005',
    category: 'gas',
    title: '燃气热水器安装要求',
    content: '燃气热水器应安装在通风良好的地方，不要安装在浴室、卧室。必须安装烟道通向室外，定期检查烟道是否堵塞。',
    tags: ['燃气热水器', '安装规范'],
    importance: 'high'
  },
  {
    id: 'gs006',
    category: 'gas',
    title: '瓶装液化气使用安全',
    content: '瓶装液化气钢瓶不要倒立、横放使用。钢瓶与灶具距离不应小于0.5米。不要自行倾倒残液。',
    tags: ['瓶装液化气', '使用安全'],
    importance: 'high'
  },
  {
    id: 'gs007',
    category: 'gas',
    title: '燃气报警器安装位置',
    content: '天然气比空气轻，报警器安装在距天花板30厘米处。液化气比空气重，报警器安装在距地面30厘米处。',
    tags: ['燃气报警器', '安装位置'],
    importance: 'medium'
  },

  // 新增日常防火知识
  {
    id: 'da004',
    category: 'daily',
    title: '家庭消防器材配备',
    content: '家庭应配备灭火器、防烟面罩、应急手电筒、逃生绳等消防器材。定期检查器材是否完好有效。',
    tags: ['消防器材', '家庭配备'],
    importance: 'high'
  },
  {
    id: 'da005',
    category: 'daily',
    title: '家庭逃生演练',
    content: '家庭应每半年进行一次逃生演练。演练时模拟火灾场景，熟悉逃生路线，掌握逃生技能。',
    tags: ['逃生演练', '家庭安全'],
    importance: 'medium'
  },
  {
    id: 'da006',
    category: 'daily',
    title: '阳台防火注意事项',
    content: '阳台不要堆放易燃物品，不要堵塞逃生通道。安装防盗窗时预留逃生出口。定期清理阳台杂物。',
    tags: ['阳台安全', '日常防火'],
    importance: 'medium'
  },
  {
    id: 'da007',
    category: 'daily',
    title: '汽车火灾预防',
    content: '车内不要放置打火机、香水、充电宝等易燃易爆物品。定期检查车辆电路、油路。配备车载灭火器。',
    tags: ['汽车防火', '车辆安全'],
    importance: 'medium'
  },
  {
    id: 'da008',
    category: 'daily',
    title: '儿童消防教育',
    content: '教育儿童认识火灾的危险性，不玩火，知道火警电话119。教会儿童基本的逃生技能。',
    tags: ['儿童教育', '消防安全'],
    importance: 'high'
  },

  // 新增法律法规知识
  {
    id: 'lw003',
    category: 'law',
    title: '消防控制室值班要求',
    content: '消防控制室必须24小时有人值班，每班不少于2人。值班人员应持证上岗，熟悉消防设施操作。',
    tags: ['消防控制室', '值班要求'],
    importance: 'medium'
  },
  {
    id: 'lw004',
    category: 'law',
    title: '公众聚集场所消防安全要求',
    content: '商场、宾馆等公众聚集场所开业前应经消防验收合格。营业期间不得锁闭安全出口。',
    tags: ['公众聚集场所', '消防安全'],
    importance: 'high'
  },

  // 新增仓储安全知识
  {
    id: 'cg003',
    category: 'cargo',
    title: '仓库消防安全管理',
    content: '仓库应建立消防安全管理制度，配备消防设施，保持通道畅通，严禁火种进入，定期进行消防安全检查。',
    tags: ['仓库安全', '消防安全管理'],
    importance: 'high'
  },
  {
    id: 'cg004',
    category: 'cargo',
    title: '仓库照明灯具要求',
    content: '仓库照明灯具应采用防爆型，与货物保持安全距离。仓库内禁止使用移动式照明灯具。',
    tags: ['仓库照明', '电气安全'],
    importance: 'medium'
  },

  // 新增电气火灾知识
  {
    id: 'ec003',
    category: 'electrical',
    title: '电气线路敷设要求',
    content: '电气线路应穿管保护，接头处应采用接线盒。线路不应超负荷使用，定期检测绝缘。',
    tags: ['电气线路', '敷设要求'],
    importance: 'high'
  },
  {
    id: 'ec004',
    category: 'electrical',
    title: '配电箱安全要求',
    content: '配电箱内应保持清洁，无杂物。配电箱门应关闭上锁。配电箱周围不应堆放易燃物品。',
    tags: ['配电箱', '电气安全'],
    importance: 'medium'
  }
];

// 逃生指南
export const escapeGuides: EscapeGuide[] = [
  {
    id: 'eg001',
    title: '家庭火灾逃生',
    scenario: '当家中发生火灾时',
    steps: [
      '发现火灾后保持冷静，迅速判断火势大小',
      '立即拨打119报警，说清详细地址和起火物质',
      '如果火势较小，可用灭火器或湿毛巾扑救初期火灾',
      '如火势无法控制，立即沿疏散通道逃生',
      '逃生时用湿毛巾捂住口鼻，低姿前进',
      '到达安全地带后，清点人数，迎接消防救援'
    ],
    tips: [
      '平时要熟悉家庭逃生路线',
      '家庭应配备灭火器、防烟面罩等消防器材',
      '逃生时切勿返回火场取财物',
      '固守待援比盲目逃生更安全时要选择固守'
    ],
    icon: 'home'
  },
  {
    id: 'eg002',
    title: '公共场所火灾逃生',
    scenario: '当商场、酒店等公共场所发生火灾时',
    steps: [
      '保持冷静，服从工作人员指挥',
      '寻找安全出口指示牌，按指示方向疏散',
      '不要乘坐电梯，使用楼梯逃生',
      '人流密集时不要拥挤，有序撤离',
      '用湿毛巾捂住口鼻，压低身体快速通过烟气区',
      '到达一楼后尽快离开建筑'
    ],
    tips: [
      '进入公共场所时先观察安全出口位置',
      '人员密集场所发生火灾不要围观',
      '身上着火可就地打滚或用厚重衣物压灭火苗',
      '若安全出口被堵，可选择窗户、阳台逃生'
    ],
    icon: 'building'
  },
  {
    id: 'eg003',
    title: '高楼火灾逃生',
    scenario: '当居住在高层建筑遭遇火灾时',
    steps: [
      '判断起火楼层和自己的位置',
      '如果起火点在楼上，可通过楼梯向下逃生',
      '如果起火点在自己楼层，尽快向楼下撤离',
      '如果楼梯被烟火封锁，判断是否固守待援',
      '固守时关好房门，用湿毛巾塞住门缝',
      '在窗口挥舞醒目物品求救'
    ],
    tips: [
      '不要试图穿越着火层',
      '高层建筑应配备应急逃生绳等器材',
      '固守待援时要做好长时间等待的准备',
      '报警时要告知被困的具体楼层和房间号'
    ],
    icon: 'highrise'
  },
  {
    id: 'eg004',
    title: '地下建筑火灾逃生',
    scenario: '当地铁站、地下商场等地下建筑发生火灾时',
    steps: [
      '保持镇定，不要惊慌',
      '按指示标志向地面疏散',
      '使用墙壁触摸行进，不要触摸天花板',
      '穿过烟气区时用湿毛巾捂住口鼻',
      '不要返回取任何物品',
      '到达地面后迅速远离建筑'
    ],
    tips: [
      '地下建筑火灾烟气扩散更快',
      '不要乘坐电梯或扶梯',
      '保持低姿，避免吸入有毒烟气',
      '平时注意观察地下建筑的安全出口'
    ],
    icon: 'subway'
  },
  {
    id: 'eg005',
    title: '车辆火灾逃生',
    scenario: '当乘坐的车辆（公交车、私家车）发生火灾时',
    steps: [
      '立即靠边停车，熄火',
      '引导乘客有序下车',
      '如果车门无法打开，使用安全锤敲碎车窗',
      '逃出后迅速转移至安全地带',
      '如果衣物着火，就地打滚灭火',
      '拨打119报警，说明车辆位置和情况'
    ],
    tips: [
      '私家车应配备灭火器和安全锤',
      '火灾发生时不要返回车内取物品',
      '公交车起火时从最近的门或窗户撤离',
      '加油时不要使用明火或吸烟'
    ],
    icon: 'car'
  },
  {
    id: 'eg006',
    title: '森林火灾避险',
    scenario: '当在野外遇到森林火灾时',
    steps: [
      '保持冷静，判断风向和火势',
      '向逆风或侧风方向撤离',
      '转移到没有植被的开阔地带',
      '如果无法撤离，找低洼地或岩石后躲避',
      '用湿衣物或泥土覆盖身体',
      '拨打119报警，说明你的位置'
    ],
    tips: [
      '进入森林时先了解周围环境',
      '不要在森林中使用明火',
      '森林火灾蔓延速度很快',
      '不要尝试扑救森林火灾'
    ],
    icon: 'tree'
  },
  {
    id: 'eg007',
    title: '地震次生火灾逃生',
    scenario: '当地震引发火灾时',
    steps: [
      '地震停止后迅速撤离到室外',
      '关闭燃气阀门和电源开关',
      '沿安全出口快速撤离',
      '避开掉落物和玻璃幕墙',
      '到达开阔地带后远离建筑物',
      '注意次生灾害'
    ],
    tips: [
      '平时应准备应急包',
      '熟悉应急避难场所位置',
      '地震时不要乘坐电梯',
      '了解燃气阀门位置'
    ],
    icon: 'earthquake'
  },
  {
    id: 'eg008',
    title: '实验室火灾逃生',
    scenario: '当化学实验室发生火灾时',
    steps: [
      '立即停止实验，关闭电源和燃气',
      '根据起火物质选择合适的灭火方式',
      '如果火势无法控制，立即撤离',
      '撤离时关闭实验室门',
      '到达安全地带后清点人数',
      '向消防人员说明化学品情况'
    ],
    tips: [
      '了解实验室化学品的特性',
      '实验室应配备合适的灭火器',
      '熟悉紧急喷淋和洗眼器位置',
      '化学品应按规定存放'
    ],
    icon: 'flask'
  }
];

// 火灾案例
export const fireCases: FireCase[] = [
  {
    id: 'fc001',
    title: '哈尔滨酒店火灾',
    location: '黑龙江省哈尔滨市',
    date: '2022年9月',
    cause: '违规使用电热毯',
    casualties: 4,
    injured: 24,
    loss: '过火面积约200平方米',
    lessons: [
      '酒店必须严格管理电气设备',
      '旅客应遵守酒店安全规定',
      '酒店应配备完善的烟雾报警系统',
      '人员密集场所应加强夜间巡查'
    ],
    type: 'commercial'
  },
  {
    id: 'fc002',
    title: '北京长峰医院火灾',
    location: '北京市丰台区',
    date: '2023年4月',
    cause: '内部改造施工违规动火',
    casualties: 29,
    injured: 42,
    loss: '重大人员伤亡',
    lessons: [
      '医疗机构必须严格管控动火作业',
      '改造施工期间应采取特殊防火措施',
      '医疗机构应具备快速疏散能力',
      '医院消防安全责任重大'
    ],
    type: 'commercial'
  },
  {
    id: 'fc003',
    title: '浙江厂房火灾',
    location: '浙江省温州市',
    date: '2023年11月',
    cause: '违章作业引发火灾',
    casualties: 3,
    injured: 15,
    loss: '厂房严重损毁',
    lessons: [
      '企业必须严格执行动火审批制度',
      '员工必须经过消防安全培训',
      '车间应配备足够的灭火器材',
      '发现隐患应及时整改'
    ],
    type: 'industrial'
  },
  {
    id: 'fc004',
    title: '电动车室内充电火灾',
    location: '广东省广州市',
    date: '2023年8月',
    cause: '电动车电池故障',
    casualties: 0,
    injured: 5,
    loss: '财产损失约50万元',
    lessons: [
      '电动车严禁在室内充电',
      '应使用正规品牌的电池和充电器',
      '发现电池异常应立即停止使用',
      '社区应建设集中充电设施'
    ],
    type: 'residential'
  },
  {
    id: 'fc005',
    title: '长沙电信大楼火灾',
    location: '湖南省长沙市',
    date: '2022年9月',
    cause: '外墙保温材料起火',
    casualties: 0,
    injured: 0,
    loss: '建筑外立面严重受损',
    lessons: [
      '建筑外墙保温材料应选用阻燃材料',
      '高层建筑应定期检查外立面安全',
      '建筑物应配备有效的防火分隔',
      '火灾预防要注重细节'
    ],
    type: 'commercial'
  },
  {
    id: 'fc006',
    title: '居民楼燃气泄漏爆炸',
    location: '江苏省南京市',
    date: '2023年6月',
    cause: '燃气管道老化泄漏',
    casualties: 1,
    injured: 28,
    loss: '多户房屋受损',
    lessons: [
      '定期检查燃气管道和阀门',
      '发现燃气泄漏立即开窗通风',
      '不要在漏气现场开关电器',
      '燃气公司应加强管网维护'
    ],
    type: 'residential'
  },
  {
    id: 'fc007',
    title: '吉林商业大厦火灾',
    location: '吉林省吉林市',
    date: '2010年11月',
    cause: '违规电焊作业引发',
    casualties: 19,
    injured: 24,
    loss: '建筑严重损毁',
    lessons: [
      '动火作业必须办理审批手续',
      '动火现场必须有人监护',
      '人员密集场所应加强消防管理',
      '建筑装修材料应使用不燃材料'
    ],
    type: 'commercial'
  },
  {
    id: 'fc008',
    title: '河南安阳特大火灾',
    location: '河南省安阳市',
    date: '2022年11月',
    cause: '违规操作引发火灾',
    casualties: 38,
    injured: 89,
    loss: '重大人员伤亡',
    lessons: [
      '企业必须落实消防安全主体责任',
      '严禁违规使用易燃装饰材料',
      '必须保持疏散通道畅通',
      '员工必须经过消防安全培训'
    ],
    type: 'commercial'
  },
  {
    id: 'fc009',
    title: '深圳KTV火灾',
    location: '广东省深圳市',
    date: '2008年9月',
    cause: '燃放烟花引燃装修材料',
    casualties: 43,
    injured: 88,
    loss: '重大人员伤亡',
    lessons: [
      '娱乐场所严禁燃放烟花',
      '装修材料应达到防火标准',
      '应安装自动喷水灭火系统',
      '应保持疏散通道畅通'
    ],
    type: 'commercial'
  },
  {
    id: 'fc010',
    title: '上海高层住宅火灾',
    location: '上海市静安区',
    date: '2010年11月',
    cause: '违规电焊作业',
    casualties: 58,
    injured: 71,
    loss: '整栋建筑严重损毁',
    lessons: [
      '高层建筑施工必须严格防火管理',
      '外墙保温材料应使用阻燃材料',
      '动火作业必须有人监护',
      '高层建筑应配备完善的消防设施'
    ],
    type: 'residential'
  },
  {
    id: 'fc011',
    title: '天津港特别重大火灾爆炸',
    location: '天津市滨海新区',
    date: '2015年8月',
    cause: '危险化学品违规堆放',
    casualties: 165,
    injured: 798,
    loss: '重大财产损失和人员伤亡',
    lessons: [
      '危险化学品必须按规定储存',
      '港口物流园必须严格安全管理',
      '企业必须落实安全生产主体责任',
      '应建立应急救援预案体系'
    ],
    type: 'industrial'
  },
  {
    id: 'fc012',
    title: '广东东莞火灾',
    location: '广东省东莞市',
    date: '2017年2月',
    cause: '电热器具使用不当',
    casualties: 9,
    injured: 2,
    loss: '厂房严重损毁',
    lessons: [
      '工厂必须加强电气安全管理',
      '下班后应关闭不必要的电器',
      '宿舍与生产车间应分开设置',
      '应配备自动报警和灭火系统'
    ],
    type: 'industrial'
  },
  {
    id: 'fc013',
    title: '北京西单商场火灾',
    location: '北京市西城区',
    date: '2017年5月',
    cause: '厨房油烟管道起火',
    casualties: 0,
    injured: 0,
    loss: '商场部分区域受损',
    lessons: [
      '餐饮场所应定期清洗油烟管道',
      '厨房应安装自动灭火装置',
      '商场应加强消防安全检查',
      '应制定完善的应急预案'
    ],
    type: 'commercial'
  },
  {
    id: 'fc014',
    title: '四川凉山森林火灾',
    location: '四川省凉山州',
    date: '2019年3月',
    cause: '雷击引发森林火灾',
    casualties: 31,
    injured: 0,
    loss: '大面积森林被毁',
    lessons: [
      '森林防火责任重大',
      '应建立完善的森林防火监测体系',
      '扑救森林火灾要科学施救',
      '应加强森林防火宣传教育'
    ],
    type: 'other'
  },
  {
    id: 'fc015',
    title: '浙江温州民房火灾',
    location: '浙江省温州市',
    date: '2020年12月',
    cause: '电瓶车违规充电',
    casualties: 5,
    injured: 8,
    loss: '民房严重受损',
    lessons: [
      '电瓶车严禁在楼道和室内充电',
      '应建设电瓶车集中充电场所',
      '社区应加强消防安全管理',
      '居民应提高消防安全意识'
    ],
    type: 'residential'
  },
  {
    id: 'fc016',
    title: '福建泉州酒店倒塌事故',
    location: '福建省泉州市',
    date: '2020年3月',
    cause: '违规改造建筑结构',
    casualties: 29,
    injured: 42,
    loss: '整栋建筑倒塌',
    lessons: [
      '严禁违规改造建筑结构',
      '酒店等人员密集场所应定期安全检查',
      '建筑改造必须经过正规审批',
      '发现安全隐患应及时停业整改'
    ],
    type: 'commercial'
  },
  {
    id: 'fc017',
    title: '山东寿光火灾',
    location: '山东省寿光市',
    date: '2018年8月',
    cause: '电器线路故障',
    casualties: 18,
    injured: 13,
    loss: '重大财产损失',
    lessons: [
      '化工企业必须严格安全管理',
      '应定期检查电气线路和设备',
      '企业应制定完善的应急预案',
      '员工必须经过专业安全培训'
    ],
    type: 'industrial'
  }
];

// 隐患自查清单
export const hazardCheckList: HazardCheckItem[] = [
  // 用电安全
  {
    id: 'hc001',
    category: '用电安全',
    question: '家中电线是否老化、破损或私拉乱接？',
    options: [
      { label: '没有，我定期检查', score: 10, feedback: '做得很好，继续保持！' },
      { label: '有小部分老化但不影响使用', score: 5, feedback: '建议尽快更换老化电线' },
      { label: '有私拉乱接现象', score: 0, feedback: '私拉乱接极易引发火灾，必须立即整改' },
      { label: '不清楚', score: 3, feedback: '建议进行一次全面检查' }
    ]
  },
  {
    id: 'hc002',
    category: '用电安全',
    question: '插座是否过载使用（一个插座连接多个大功率电器）？',
    options: [
      { label: '没有，每个大功率电器专用插座', score: 10, feedback: '安全意识很强！' },
      { label: '偶尔会，但不超过额定功率', score: 5, feedback: '应避免大功率电器共用插座' },
      { label: '经常这样做', score: 0, feedback: '极易导致插座过热起火！' },
      { label: '不清楚', score: 3, feedback: '请了解插座的额定功率' }
    ]
  },
  {
    id: 'hc003',
    category: '用电安全',
    question: '电器使用后是否及时拔掉电源插头？',
    options: [
      { label: '是，特别是长期不用的电器', score: 10, feedback: '非常好，安全习惯很棒！' },
      { label: '常用电器会拔，不常用的不拔', score: 6, feedback: '建议不用的电器也拔掉电源' },
      { label: '基本不拔', score: 0, feedback: '这样做既费电又不安全！' },
      { label: '不清楚', score: 4, feedback: '建议养成拔掉不用电器电源的习惯' }
    ]
  },

  // 燃气安全
  {
    id: 'hc004',
    category: '燃气安全',
    question: '燃气管道和阀门是否定期检查？',
    options: [
      { label: '每半年检查一次，有记录', score: 10, feedback: '做得非常到位！' },
      { label: '一年检查一次', score: 7, feedback: '基本合格，建议增加检查频率' },
      { label: '安装后从未检查过', score: 0, feedback: '必须立即检查燃气设施！' },
      { label: '不清楚', score: 3, feedback: '建议联系燃气公司进行检查' }
    ]
  },
  {
    id: 'hc005',
    category: '燃气安全',
    question: '使用燃气灶时是否有人看守？',
    options: [
      { label: '始终有人，从不离人', score: 10, feedback: '安全意识很强！' },
      { label: '偶尔会离开一小会儿', score: 5, feedback: '建议全程有人看守' },
      { label: '经常离开做其他事', score: 0, feedback: '汤水溢出可能浇灭火焰造成危险！' },
      { label: '不清楚', score: 4, feedback: '厨房用火必须有人看守' }
    ]
  },

  // 消防设施
  {
    id: 'hc006',
    category: '消防设施',
    question: '家中是否配备灭火器？',
    options: [
      { label: '有，并放在易取用的地方', score: 10, feedback: '非常好！建议家人都会使用' },
      { label: '有，但位置不好找', score: 5, feedback: '应放在显眼易取的位置' },
      { label: '没有', score: 0, feedback: '建议配备家用灭火器' },
      { label: '不清楚', score: 3, feedback: '家用灭火器是必要的' }
    ]
  },
  {
    id: 'hc007',
    category: '消防设施',
    question: '住宅楼的消防通道是否畅通？',
    options: [
      { label: '畅通，无任何杂物', score: 10, feedback: '做得很好！' },
      { label: '基本畅通，偶尔有少量杂物', score: 5, feedback: '应立即清理杂物' },
      { label: '经常被占用', score: 0, feedback: '消防通道是生命通道！' },
      { label: '不清楚', score: 4, feedback: '请检查楼道和疏散通道' }
    ]
  },

  // 日常生活
  {
    id: 'hc008',
    category: '日常生活',
    question: '是否在床上或沙发上吸烟？',
    options: [
      { label: '从不，都是在指定位置吸烟', score: 10, feedback: '非常安全！' },
      { label: '偶尔会在沙发上吸烟', score: 3, feedback: '沙发等软体易燃，建议不要这样做' },
      { label: '经常在床上吸烟', score: 0, feedback: '这是极其危险的行为！' },
      { label: '不吸烟', score: 10, feedback: '不吸烟更安全！' }
    ]
  },
  {
    id: 'hc009',
    category: '日常生活',
    question: '电动车在哪里充电？',
    options: [
      { label: '室外集中充电桩', score: 10, feedback: '非常安全！' },
      { label: '车棚或储藏室充电', score: 5, feedback: '尽量使用室外充电桩' },
      { label: '室内（楼道/家中）充电', score: 0, feedback: '严禁室内充电！非常危险！' },
      { label: '没有电动车', score: 10, feedback: '注意提醒身边有电动车的朋友' }
    ]
  },
  {
    id: 'hc010',
    category: '日常生活',
    question: '厨房的油垢是否定期清理？',
    options: [
      { label: '每周清洗', score: 10, feedback: '做得很好！' },
      { label: '每月清洗一次', score: 7, feedback: '基本合格，建议增加频率' },
      { label: '很少清理', score: 2, feedback: '油垢遇明火极易燃烧！' },
      { label: '不清楚', score: 4, feedback: '厨房油垢是火灾隐患' }
    ]
  },

  // 逃生准备
  {
    id: 'hc011',
    category: '逃生准备',
    question: '是否了解住所的逃生路线？',
    options: [
      { label: '非常清楚，知道所有出口', score: 10, feedback: '非常好！' },
      { label: '知道主要出口', score: 6, feedback: '建议熟悉所有逃生路线' },
      { label: '只知道电梯', score: 0, feedback: '火灾时不能使用电梯！' },
      { label: '不清楚', score: 2, feedback: '必须立即熟悉逃生路线' }
    ]
  },
  {
    id: 'hc012',
    category: '逃生准备',
    question: '家中是否配备了应急逃生器材（防烟面罩、逃生绳等）？',
    options: [
      { label: '配备了全套', score: 10, feedback: '安全意识很强！' },
      { label: '只有部分', score: 5, feedback: '建议配备更完善的逃生器材' },
      { label: '没有', score: 0, feedback: '建议配备基础逃生器材' },
      { label: '不清楚', score: 3, feedback: '家用逃生器材很有必要' }
    ]
  },
  // 新增自查项
  {
    id: 'hc013',
    category: '用电安全',
    question: '家中是否安装了漏电保护器？',
    options: [
      { label: '已安装，每月测试一次', score: 10, feedback: '做得非常好！' },
      { label: '已安装，但从未测试', score: 6, feedback: '建议定期测试漏电保护器' },
      { label: '没有安装', score: 0, feedback: '建议立即安装漏电保护器' },
      { label: '不清楚', score: 3, feedback: '漏电保护器是重要的安全装置' }
    ]
  },
  {
    id: 'hc014',
    category: '燃气安全',
    question: '家中是否安装了燃气报警器？',
    options: [
      { label: '已安装，定期检查', score: 10, feedback: '安全意识很强！' },
      { label: '已安装，很少检查', score: 6, feedback: '建议定期检查燃气报警器' },
      { label: '没有安装', score: 0, feedback: '建议安装燃气报警器' },
      { label: '不清楚', score: 3, feedback: '燃气报警器能及时发现泄漏' }
    ]
  },
  {
    id: 'hc015',
    category: '消防设施',
    question: '是否知道物业或社区的消防电话？',
    options: [
      { label: '知道，已保存', score: 10, feedback: '很好！紧急情况能快速联系' },
      { label: '大概知道，但不确定', score: 5, feedback: '建议保存消防电话' },
      { label: '不知道', score: 0, feedback: '建议向物业了解消防电话' },
      { label: '不清楚', score: 3, feedback: '消防电话在紧急时很重要' }
    ]
  },
  {
    id: 'hc016',
    category: '日常生活',
    question: '家中是否存放烟花爆竹或其他易燃易爆物品？',
    options: [
      { label: '没有存放', score: 10, feedback: '非常安全！' },
      { label: '有少量，但妥善保管', score: 5, feedback: '建议不要在家中存放' },
      { label: '有存放', score: 0, feedback: '易燃易爆物品很危险！' },
      { label: '不清楚', score: 3, feedback: '建议检查家中是否有危险品' }
    ]
  },
  {
    id: 'hc017',
    category: '日常生活',
    question: '是否在阳台、窗台上堆放花盆、纸箱等物品？',
    options: [
      { label: '没有堆放，保持整洁', score: 10, feedback: '做得很好！' },
      { label: '有少量物品', score: 5, feedback: '建议及时清理阳台' },
      { label: '堆放了很多物品', score: 0, feedback: '阳台物品可能影响逃生！' },
      { label: '不清楚', score: 3, feedback: '建议检查阳台是否整洁' }
    ]
  },
  {
    id: 'hc018',
    category: '用电安全',
    question: '是否使用"三无"电器或充电器？',
    options: [
      { label: '从不，只买正规产品', score: 10, feedback: '安全意识很强！' },
      { label: '偶尔会买便宜的', score: 5, feedback: '建议只购买正规产品' },
      { label: '经常买便宜的', score: 0, feedback: '三无产品极易引发火灾！' },
      { label: '不清楚', score: 3, feedback: '购买电器要看是否有3C认证' }
    ]
  },
  {
    id: 'hc019',
    category: '消防设施',
    question: '是否参加过消防培训或演练？',
    options: [
      { label: '经常参加，掌握很多技能', score: 10, feedback: '非常棒！继续保持' },
      { label: '参加过一两次', score: 6, feedback: '建议多参加消防培训' },
      { label: '从未参加过', score: 0, feedback: '建议参加消防培训和演练' },
      { label: '不清楚', score: 3, feedback: '消防培训很有必要' }
    ]
  },
  {
    id: 'hc020',
    category: '日常生活',
    question: '家中是否有小孩或老人需要特别照顾？',
    options: [
      { label: '有，已制定特殊逃生方案', score: 10, feedback: '考虑非常周全！' },
      { label: '有，但没想过特殊方案', score: 5, feedback: '建议制定特殊逃生方案' },
      { label: '没有', score: 10, feedback: '很好，但也要关注邻居' },
      { label: '不清楚', score: 4, feedback: '老人和小孩需要特别照顾' }
    ]
  },
  {
    id: 'hc021',
    category: '逃生准备',
    question: '家中是否有约定的火灾集合地点？',
    options: [
      { label: '有，家人都知道', score: 10, feedback: '非常好！能快速清点人数' },
      { label: '大概想过，但没约定', score: 5, feedback: '建议约定具体集合地点' },
      { label: '没有', score: 0, feedback: '建议约定火灾集合地点' },
      { label: '不清楚', score: 3, feedback: '集合地点能避免混乱' }
    ]
  },
  {
    id: 'hc022',
    category: '用电安全',
    question: '空调、电暖器等大功率电器是否专用插座？',
    options: [
      { label: '是，每个大功率电器专用插座', score: 10, feedback: '做得非常好！' },
      { label: '大部分是，偶尔共用', score: 5, feedback: '建议全部使用专用插座' },
      { label: '经常共用', score: 0, feedback: '极易导致插座过热起火！' },
      { label: '不清楚', score: 3, feedback: '大功率电器需要专用插座' }
    ]
  },
  {
    id: 'hc023',
    category: '燃气安全',
    question: '燃气胶管是否超过18个月？',
    options: [
      { label: '没有，定期更换', score: 10, feedback: '安全意识很强！' },
      { label: '大概1年多，还没换', score: 5, feedback: '建议立即更换' },
      { label: '已经很久没换了', score: 0, feedback: '燃气胶管老化极易泄漏！' },
      { label: '不清楚', score: 3, feedback: '燃气胶管寿命一般18个月' }
    ]
  },
  {
    id: 'hc024',
    category: '消防设施',
    question: '楼道内的灭火器是否在有效期内？',
    options: [
      { label: '检查过，都在有效期内', score: 10, feedback: '非常好！' },
      { label: '没太注意', score: 5, feedback: '建议检查灭火器有效期' },
      { label: '过期了也没关系', score: 0, feedback: '过期灭火器无法正常使用！' },
      { label: '不清楚', score: 3, feedback: '灭火器有效期很重要' }
    ]
  }
];

// 每日提示
export const dailyTips: DailyTip[] = [
  { day: 1, title: '出门断电', content: '出门前检查是否关闭了不必要的电器电源，既省电又安全。', icon: 'power' },
  { day: 2, title: '厨房防火', content: '烹饪时不要离开厨房，汤水溢出可能浇灭火焰造成燃气泄漏。', icon: 'flame' },
  { day: 3, title: '燃气检查', content: '用肥皂水检查燃气管道接口，发现气泡说明有泄漏，要及时报修。', icon: 'droplet' },
  { day: 4, title: '通道畅通', content: '楼道、楼梯间不要堆放杂物，这是逃生的生命通道。', icon: 'door-open' },
  { day: 5, title: '烟头安全', content: '吸完烟一定要确认完全熄灭，不要随手扔进垃圾桶。', icon: 'cigarette' },
  { day: 6, title: '电器检查', content: '发现电线老化、插座发黑、电器异常发热要及时更换或维修。', icon: 'plug' },
  { day: 7, title: '灭火器位置', content: '家中和办公场所都要知道灭火器的位置，并学会使用方法。', icon: 'fire-extinguisher' },
  { day: 8, title: '逃生路线', content: '每到一个新的场所，先观察安全出口的位置和逃生路线。', icon: 'route' },
  { day: 9, title: '电动车充电', content: '电动车严禁在室内充电，应到室外集中充电桩充电。', icon: 'battery-charging' },
  { day: 10, title: '儿童教育', content: '教育孩子不要玩火，告诉他们火灾的危险性。', icon: 'baby' },
  { day: 11, title: '燃气安全阀', content: '睡觉前检查燃气阀门是否关闭，长期外出要关总阀。', icon: 'lock' },
  { day: 12, title: '蚊香安全', content: '使用蚊香要远离易燃物品，放在非燃的支架上，人走灯灭。', icon: 'moon' },
  { day: 13, title: '空调安全', content: '空调使用季节开始前要清洗，长时间不用要拔掉电源。', icon: 'snowflake' },
  { day: 14, title: '取暖安全', content: '使用电暖器时不要覆盖衣物，离开时要关闭电源。', icon: 'thermometer' },
  { day: 15, title: '电线整理', content: '整理好凌乱的电线，不要压在家具下或在地毯下走线。', icon: 'cable' },
  { day: 16, title: '消防演习', content: '建议单位或家庭每年至少进行一次消防演练，熟悉逃生技能。', icon: 'users' },
  { day: 17, title: '烟雾报警器', content: '建议在家中安装烟雾报警器，能及时发现初期火灾。', icon: 'bell' },
  { day: 18, title: '油锅灭火', content: '油锅起火时，不要用水浇，立即关火，用锅盖或湿毛巾覆盖。', icon: 'pot' },
  { day: 19, title: '燃气灶保养', content: '定期清理燃气灶的炉头和火孔，保持燃气灶的正常工作。', icon: 'chef-hat' },
  { day: 20, title: '保险丝选择', content: '不要用铜丝、铁丝代替保险丝，过载会自动熔断保护电路。', icon: 'zap' },
  { day: 21, title: '睡前检查', content: '养成睡前检查的习惯：关好门窗、关闭电源、关闭燃气。', icon: 'bed' },
  { day: 22, title: '阳台杂物', content: '阳台不要堆放易燃杂物，高空掷物是违法行为。', icon: 'box' },
  { day: 23, title: '电线过载', content: '不要在一个插座上使用太多电器，避免插座过载发热。', icon: 'plug' },
  { day: 24, title: '手机充电', content: '手机充电时不要放在床上或沙发上，避免过热引发火灾。', icon: 'smartphone' },
  { day: 25, title: '酒精安全', content: '存放酒精等易燃品要远离火源，放在阴凉处，盖紧容器。', icon: 'droplet' },
  { day: 26, title: '电器远离水', content: '手湿时不要触碰电器，电器不要放在潮湿的地方使用。', icon: 'droplets' },
  { day: 27, title: '火灾报警', content: '发现火情要立即报警，拨打119要说清地址和起火物质。', icon: 'phone-call' },
  { day: 28, title: '防烟面具', content: '家中配备防烟面具，逃生时能有效过滤有毒烟气。', icon: 'mask' },
  { day: 29, title: '逃生绳', content: '高楼住户可配备逃生绳，平时要学会使用方法。', icon: 'rope' },
  { day: 30, title: '自救技能', content: '学会灭火器的使用和初期火灾的扑救，关键时刻能救命。', icon: 'award' },
  { day: 31, title: '全员防火', content: '消防安全是每个人的责任，发现隐患要及时处理或上报。', icon: 'shield' },
  { day: 32, title: '电热毯使用', content: '电热毯不要折叠使用，不要通宵通电，睡前关闭电源。', icon: 'thermometer' },
  { day: 33, title: '充电器管理', content: '充电器不要长时间插在插座上，不用时及时拔掉。', icon: 'battery' },
  { day: 34, title: '窗帘防火', content: '窗帘等布艺要远离火源，建议选用阻燃材料。', icon: 'sun' },
  { day: 35, title: '厨房油烟', content: '定期清理抽油烟机和油烟管道，油垢遇明火极易燃烧。', icon: 'wind' },
  { day: 36, title: '应急照明', content: '家中准备应急手电筒，停电或火灾时能照明逃生。', icon: 'lightbulb' },
  { day: 37, title: '家庭会议', content: '定期召开家庭消防安全会议，讨论安全问题和逃生方案。', icon: 'home' },
  { day: 38, title: '钥匙存放', content: '家门钥匙要有备用，放在家人都知道的地方，方便紧急取用。', icon: 'key' },
  { day: 39, title: '窗户逃生', content: '窗户应能方便打开，防盗窗要预留逃生出口。', icon: 'window' },
  { day: 40, title: '社区消防', content: '关心社区消防工作，参加社区组织的消防安全活动。', icon: 'building' },
  { day: 41, title: '汽车防火', content: '汽车内不要放打火机、香水等易燃易爆物品。', icon: 'car' },
  { day: 42, title: '仓库防火', content: '家中杂物间或仓库要保持整洁，分类存放物品。', icon: 'archive' },
  { day: 43, title: '纸张管理', content: '报纸、纸箱等易燃物要及时清理，不要大量堆积。', icon: 'file' },
  { day: 44, title: '火种隔离', content: '打火机、火柴等火种要放在儿童接触不到的地方。', icon: 'flame' },
  { day: 45, title: '装修防火', content: '家庭装修尽量选用不燃或难燃材料，减少火灾隐患。', icon: 'tool' },
  { day: 46, title: '楼梯通道', content: '楼梯间不要停放自行车、电动车，保持通道畅通。', icon: 'navigation' },
  { day: 47, title: '消防标识', content: '注意观察公共场所的消防标识，了解消防设施位置。', icon: 'alert-triangle' },
  { day: 48, title: '用电习惯', content: '养成良好用电习惯，不用的电器及时关闭电源。', icon: 'power' },
  { day: 49, title: '燃气使用', content: '使用燃气时要保持通风，不要在密闭空间使用。', icon: 'wind' },
  { day: 50, title: '节日防火', content: '节日期间燃放烟花爆竹要在指定地点，远离可燃物。', icon: 'sparkles' },
  { day: 51, title: '夏季防火', content: '夏季高温要注意电器散热，不要长时间连续使用。', icon: 'sun' },
  { day: 52, title: '冬季取暖', content: '冬季取暖设备要与可燃物保持安全距离。', icon: 'snowflake' },
  { day: 53, title: '安全责任', content: '每个人都是自己安全的第一责任人，要对自己和家人负责。', icon: 'shield' },
  { day: 54, title: '隐患报告', content: '发现火灾隐患要及时向物业或消防部门报告。', icon: 'alert-circle' },
  { day: 55, title: '知识学习', content: '经常学习消防安全知识，提高自救互救能力。', icon: 'book' },
  { day: 56, title: '器材维护', content: '定期检查和维护家中的消防器材，确保完好有效。', icon: 'settings' },
  { day: 57, title: '邻里互助', content: '和邻居互相提醒消防安全，紧急时互相帮助。', icon: 'users' },
  { day: 58, title: '应急预案', content: '制定家庭火灾应急预案，让每个家庭成员都熟悉。', icon: 'clipboard' },
  { day: 59, title: '生命至上', content: '火灾时生命第一，不要贪恋财物，尽快逃生。', icon: 'heart' },
  { day: 60, title: '消防安全', content: '消防安全，人人有责。让我们共同守护平安家园！', icon: 'shield-check' }
];

// 分类中文名称
export const categoryNames: Record<KnowledgeCategory, string> = {
  fire_prevention: '火灾预防',
  fire_extinguisher: '灭火器使用',
  escape: '逃生知识',
  electricity: '用电安全',
  gas: '燃气安全',
  daily: '日常防火',
  law: '法律法规',
  cargo: '仓储安全',
  electrical: '电气火灾',
  highrise: '高层建筑'
};

// 获取今日提示
export function getTodayTip(): DailyTip {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % dailyTips.length;
  return dailyTips[index];
}

// 按分类获取知识
export function getKnowledgeByCategory(category: KnowledgeCategory): KnowledgeItem[] {
  return knowledgeBase.filter(item => item.category === category);
}

// 获取重要知识（高重要性）
export function getHighImportanceKnowledge(): KnowledgeItem[] {
  return knowledgeBase.filter(item => item.importance === 'high');
}

// 获取随机知识
export function getRandomKnowledge(count: number = 5): KnowledgeItem[] {
  const shuffled = [...knowledgeBase].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
