'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/app-shell';
import { cn } from '@/lib/utils';
import {
  Bot, Send, Loader2, MessageCircle, X, RefreshCw,
  AlertTriangle, Radio, Flame, Wind, Shield, Clock,
  Zap, TrendingUp, CheckCircle, Settings, Play,
  FileText, ExternalLink, AlertCircle
} from 'lucide-react';

// 消息类型
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  hasAttachment?: boolean;
}

// 平台数据
interface PlatformStats {
  devices: { total: number; online: number; offline: number; fault: number };
  alarms: { total: number; pending: number; todayCount: number };
  customers: { total: number };
}

// 故障类型配置
const faultTypes = [
  { type: 'gas_leak', name: '燃气泄漏', icon: <Wind className="w-4 h-4" />, color: '#FF9800' },
  { type: 'smoke_detect', name: '烟雾报警', icon: <Flame className="w-4 h-4" />, color: '#D32F2F' },
  { type: 'high_temp', name: '温度异常', icon: <AlertTriangle className="w-4 h-4" />, color: '#F72C25' },
  { type: 'device_offline', name: '设备离线', icon: <Radio className="w-4 h-4" />, color: '#9C27B0' },
  { type: 'fire_alarm', name: '火灾报警', icon: <Shield className="w-4 h-4" />, color: '#D32F2F' },
];

// 商户位置选项
const locationOptions = {
  '串串香火锅': ['一楼后厨', '二楼包间区', '后厨炒料区', '储藏室', '收银台'],
  '重庆火锅': ['底料炒制区', '涮菜区', '中央厨房', '冷藏库', '员工餐厅'],
  '烧烤专门店': ['烧烤操作区', '炭火储存区', '前厅就餐区', '后厨备菜区', '油烟净化区'],
  '川味小馆': ['炒菜厨房', '蒸笼区', '洗碗间', '前厅', '后院'],
  '麻辣香锅': ['炒制区', '备菜区', '调料区', '就餐区', '杂物间'],
  '老街火锅店': ['九宫格火锅区', '鸳鸯锅区', '调料台', '厨房', '卫生间附近']
};

// 商户列表 - 与位置选项对应
const merchants = Object.keys(locationOptions);

// 故障类型详细配置
const faultTypeConfigs = {
  gas_leak: {
    name: '燃气泄漏',
    icon: '💨',
    color: '#FF9800',
    severity: '高危',
    severityLevel: 1,
    alarmLevel: '一级',
    detectorType: '可燃气体探测器',
    threshold: '25%LEL',
    location: '后厨燃气管道/灶具附近',
    riskPoints: [
      '燃气管道老化、接口松动',
      '灶具阀门未关紧',
      '通风系统故障导致燃气积聚',
      '瓶装液化气罐泄漏'
    ],
    immediateActions: [
      '立即关闭该区域燃气总阀',
      '打开门窗进行自然通风',
      '禁止开启任何电器开关（包括排风扇）',
      '立即疏散现场人员',
      '在安全区域使用防爆电话报警'
    ],
    disposalSteps: [
      '消控中心值班员收到报警后，3分钟内通知区域安全员',
      '安全员佩戴防毒面具和便携式燃气检测仪到达现场',
      '使用检测仪测定燃气浓度，确认泄漏点位置',
      '关闭燃气阀门后，用肥皂水或检漏仪检测接口密封性',
      '如发现管道破损，立即用管道夹或堵漏材料临时处理',
      '通知燃气公司专业人员到场进行修复',
      '修复完成后进行泄漏检测，浓度降至0后方可恢复供气',
      '填写《燃气设施故障处理记录表》并存档'
    ],
    notifications: [
      { to: '物业安全主管', time: '立即', method: '电话' },
      { to: '商户负责人', time: '5分钟内', method: '电话+短信' },
      { to: '消防维保单位', time: '30分钟内', method: '系统工单' },
      { to: '燃气公司', time: '必要时', method: '电话' }
    ],
    preventionMeasures: [
      '每月检查燃气管道接口密封性',
      '每半年更换灶具燃气软管',
      '安装燃气泄漏报警器联动自动切断装置',
      '商户每日营业前检查燃气阀门状态',
      '保持厨房通风系统24小时运行'
    ],
    fileNote: '包含燃气泄漏应急处置流程、现场处置规范、事后分析报告模板'
  },
  smoke_detect: {
    name: '烟雾报警',
    icon: '🔥',
    color: '#D32F2F',
    severity: '高危',
    severityLevel: 1,
    alarmLevel: '二级',
    detectorType: '感烟探测器',
    threshold: '报警灵敏度0.15dB/m',
    location: '厨房/客房/仓库/配电房',
    riskPoints: [
      '厨房油烟未及时清理导致探测器误报',
      '电气线路短路产生烟雾',
      '明火作业未做好防护',
      '易燃物品自燃'
    ],
    immediateActions: [
      '消控中心值班员收到报警后，2分钟内响应',
      '立即调取报警区域监控视频核实情况',
      '确认为真实火警后，立即拨打119',
      '启动消防应急预案，通知相关人员疏散',
      '确认消防设备（如喷淋、防火门）是否联动'
    ],
    disposalSteps: [
      '查看火灾报警控制器显示的报警点位',
      '通知最近的巡逻人员携带灭火器到达现场确认',
      '确认为火灾时，立即启动声光报警器疏散人员',
      '关闭着火区域电源和燃气阀门',
      '如火势可控，使用灭火器或消火栓进行初期扑救',
      '如火势无法控制，保持安全距离等待消防队',
      '火灾扑灭后，查找起火原因并拍照留证',
      '填写《火灾事故记录表》，上报消防部门备案'
    ],
    notifications: [
      { to: '物业总经理', time: '立即', method: '电话' },
      { to: '商户负责人', time: '3分钟内', method: '电话' },
      { to: '微型消防站', time: '立即', method: '对讲机' },
      { to: '119指挥中心', time: '确认后', method: '电话' }
    ],
    preventionMeasures: [
      '厨房安装复合型探测器（烟+温）避免油烟误报',
      '每月清洗厨房烟罩和烟道',
      '每季度测试探测器灵敏度',
      '电气线路定期检查，老化线路及时更换',
      '严禁在禁烟区域吸烟'
    ],
    fileNote: '包含火灾应急响应流程、人员疏散方案、火灾原因调查报告模板'
  },
  high_temp: {
    name: '温度异常',
    icon: '🌡️',
    color: '#F72C25',
    severity: '高危',
    severityLevel: 1,
    alarmLevel: '二级',
    detectorType: '感温探测器',
    threshold: '报警温度57℃（定温）或15℃/min升温速率',
    location: '厨房/配电房/机房/锅炉房',
    riskPoints: [
      '厨房油锅温度过高未及时处理',
      '配电柜/变压器过载发热',
      '锅炉房温度控制失效',
      '设备散热不良导致温度积聚'
    ],
    immediateActions: [
      '确认温度异常的具体位置和当前读数',
      '如温度持续上升超过阈值，视为火灾前兆处理',
      '配电房温度异常时，立即联系电工检查',
      '厨房温度异常时，检查灶具和油锅状态',
      '做好记录，30分钟内未能查明原因需升级处理'
    ],
    disposalSteps: [
      '查看历史温度曲线，分析温度变化趋势',
      '温度超过70℃时，视为紧急情况处理',
      '配电房温度异常：检查负载情况，测量各相电流',
      '检查通风散热系统（风扇/空调）是否正常',
      '如为设备故障导致过热，立即停机降温',
      '厨房温度异常时，检查是否有火情或油锅干烧',
      '必要时请专业人员使用红外测温仪精准定位热点',
      '处理完成后持续监控2小时，确认温度恢复正常',
      '填写《设备温度异常处理记录》并存档'
    ],
    notifications: [
      { to: '工程部负责人', time: '立即', method: '电话' },
      { to: '商户负责人', time: '5分钟内', method: '电话' },
      { to: '安全主管', time: '10分钟内', method: '短信' },
      { to: '设备维保单位', time: '30分钟内', method: '工单' }
    ],
    preventionMeasures: [
      '配电柜安装温控开关和自动灭火装置',
      '厨房安装油温监测和自动灭火系统',
      '重要设备配置温度传感器实时监控',
      '建立设备温度基准档案，每日巡检记录',
      '高温季节增加设备巡检频次'
    ],
    fileNote: '包含温度异常分析规范、设备降温处置流程、热点排查指南'
  },
  device_offline: {
    name: '设备离线',
    icon: '📡',
    color: '#9C27B0',
    severity: '中危',
    severityLevel: 2,
    alarmLevel: '三级',
    detectorType: '各类探测器（网络中断）',
    threshold: '持续离线超过5分钟',
    location: '任意安装位置',
    riskPoints: [
      '探测器供电中断（电源故障/断电）',
      '网络通信故障（网线断开/路由器故障）',
      '探测器本身硬件故障',
      '信号干扰导致通讯中断'
    ],
    immediateActions: [
      '检查探测器电源指示灯是否正常',
      '检查区域网络交换机/路由器状态',
      '尝试远程重启探测器（如支持）',
      '记录离线时间和探测器基本信息',
      '2小时内无法恢复视为故障升级'
    ],
    disposalSteps: [
      '登录设备管理平台，查看离线探测器详情',
      '检查探测器最近一次在线时间，分析断连原因',
      '现场检查：查看探测器指示灯状态（红/绿/灭）',
      '检查供电情况：测量DC12V电源输出是否正常',
      '检查网络：ping探测器IP地址，测试网络连通性',
      '如为电源问题，更换电源适配器或检查线路',
      '如为网络问题，检查水晶头、水晶头制作、交换机端口',
      '如为探测器本身故障，拆下返厂维修或更换新设备',
      '更换或修复后，重新配对注册，上报消控中心确认在线',
      '填写《设备故障维修记录》，归档备查'
    ],
    notifications: [
      { to: '设备维保单位', time: '2小时内未恢复', method: '工单' },
      { to: '商户负责人', time: '12小时内', method: '短信' },
      { to: '安全主管', time: '每日汇总', method: '报表' }
    ],
    preventionMeasures: [
      '重要区域设备采用双路供电',
      '每季度检查网络线路和设备',
      '储备常用备件（电源、探测器）',
      '建立设备健康度评分机制，提前更换老旧设备',
      '重要设备接入UPS不间断电源'
    ],
    fileNote: '包含设备离线排查流程、常见故障代码速查表、维修工单模板'
  },
  fire_alarm: {
    name: '火灾报警',
    icon: '🚨',
    color: '#D32F2F',
    severity: '紧急',
    severityLevel: 0,
    alarmLevel: '一级',
    detectorType: '火灾报警控制器',
    threshold: '任意报警信号',
    location: '全区域',
    riskPoints: [
      '真实火灾发生',
      '探测器误报（粉尘/蒸汽/蚊虫）',
      '探测器老化误报',
      '人为误操作触发报警'
    ],
    immediateActions: [
      '消控中心值班员必须1分钟内响应',
      '查看控制器报警信息，记录报警点位和时间',
      '立即使用对讲机或电话通知区域巡逻人员现场确认',
      '同时启动视频监控查看报警区域实况',
      '确认为真实火情立即拨打119',
      '未确认前不得远程复位或消音'
    ],
    disposalSteps: [
      '火灾报警控制器显示报警区域、探测器编码、报警时间',
      '消控员通知2名以上巡逻人员携装备5分钟内到场',
      '巡逻人员到达现场后，用对讲机报告现场情况：有无明火、烟雾、温度',
      '确认为真实火情：立即启动消防应急预案',
      '确认为误报：查找原因（环境因素/探测器故障/误操作）',
      '误报处理：改善环境（如通风、除尘），或更换探测器',
      '任何人不得擅自复位控制器，需由消控员确认现场安全后操作',
      '每次报警必须填写《火灾报警记录表》，包括：报警时间、确认时间、原因、处理结果',
      '如为探测器故障误报，当日内更换；如为环境因素，制定改善计划'
    ],
    notifications: [
      { to: '物业总经理', time: '立即', method: '电话' },
      { to: '微型消防站', time: '立即', method: '对讲机' },
      { to: '119指挥中心', time: '确认真实火情后', method: '电话' },
      { to: '所有商户', time: '确认真实火情后', method: '广播' }
    ],
    preventionMeasures: [
      '每年对所有探测器进行专业清洗和灵敏度测试',
      '易产生油烟、蒸汽的区域安装防虫罩',
      '建立探测器台账，记录安装日期和更换周期',
      '消控中心24小时双人值班，确保1分钟响应',
      '每季度组织消防演练，提高应急能力'
    ],
    fileNote: '包含火灾确认流程、误报原因分析标准、探测器维护周期表'
  }
};

// 处理建议生成器
const generateProcessingAdvice = (faultType: string, merchant: string, location: string) => {
  const config = faultTypeConfigs[faultType as keyof typeof faultTypeConfigs];
  const merchantLocations = locationOptions[merchant as keyof typeof locationOptions] || ['后厨', '前厅', '收银台'];
  const actualLocation = location || merchantLocations[0];
  const currentTime = new Date();
  const formattedTime = currentTime.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  const fileName = 'assets/探测器故障智能体处置及通知示例.docx';
  const fileUrl = `https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E6%8E%A2%E6%B5%8B%E5%99%A8%E6%95%85%E9%9A%9C%E6%99%BA%E8%83%BD%E4%BD%93%E5%A4%84%E7%BD%AE%E5%8F%8A%E9%80%9A%E7%9F%A5%E7%A4%BA%E4%BE%8B.docx&nonce=${crypto.randomUUID()}&project_id=7627017833323020288&sign=74a1118510e976438f0872dfc09088a98840e8be6213551504a6e826e80b575b`;

  return {
    summary: `【${merchant} · ${actualLocation}】${config.name}模拟报告`,
    faultInfo: {
      type: config.name,
      typeIcon: config.icon,
      merchant,
      location: actualLocation,
      time: formattedTime,
      severity: config.severity,
      alarmLevel: config.alarmLevel,
      detectorType: config.detectorType,
      threshold: config.threshold,
    },
    riskPoints: config.riskPoints,
    immediateActions: config.immediateActions,
    disposalSteps: config.disposalSteps,
    notifications: config.notifications,
    preventionMeasures: config.preventionMeasures,
    file: {
      name: fileName,
      url: fileUrl,
      note: config.fileNote
    },
  };
};

// 快捷建议
const quickSuggestions = [
  { icon: <AlertTriangle className="w-4 h-4" />, label: '当前报警情况', query: '当前报警情况怎么样？' },
  { icon: <Radio className="w-4 h-4" />, label: '设备状态', query: '设备在线状态如何？' },
  { icon: <Flame className="w-4 h-4" />, label: '火灾风险', query: '今天有哪些火灾风险？' },
  { icon: <Shield className="w-4 h-4" />, label: '安全隐患', query: '有哪些安全隐患需要关注？' },
  { icon: <Wind className="w-4 h-4" />, label: '燃气安全', query: '燃气设备运行正常吗？' },
  { icon: <TrendingUp className="w-4 h-4" />, label: '趋势分析', query: '本周报警趋势如何？' },
];

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '您好！我是消防安全智能助手。我可以帮您：\n\n• 分析当前报警情况并给出处理建议\n• 查询设备运行状态\n• 了解商户风险等级\n• 解答消防安全知识\n• 提供安全隐患排查指导\n• 模拟故障场景进行应急演练\n\n请描述您想了解的问题，或点击下方快捷问题开始。',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  
  // AI故障模拟状态
  const [showSimulator, setShowSimulator] = useState(false);
  const [simFaultType, setSimFaultType] = useState('');
  const [simMerchant, setSimMerchant] = useState('');
  const [simLocation, setSimLocation] = useState('');
  const [simulating, setSimulating] = useState(false);

  // 加载平台数据
  const loadPlatformStats = useCallback(async () => {
    try {
      const res = await fetch('/api/platform-data?type=dashboard');
      if (res.ok) {
        const data = await res.json();
        setPlatformStats({
          devices: data.data.stats.devices,
          alarms: data.data.stats.alarms,
          customers: { total: data.data.customers.length },
        });
      }
    } catch (error) {
      console.error('Failed to load platform stats:', error);
    }
  }, []);

  useEffect(() => {
    loadPlatformStats();
  }, [loadPlatformStats]);

  // AI响应逻辑
  const getAIResponse = (question: string, stats: PlatformStats | null): string => {
    const q = question.toLowerCase();

    // 报警相关
    if (q.includes('报警') || q.includes('告警') || q.includes('警报')) {
      const pending = stats?.alarms.pending || 0;
      const today = stats?.alarms.todayCount || 0;
      const total = stats?.alarms.total || 0;

      let response = `📊 **当前报警统计**\n\n`;
      response += `• 待处理报警：${pending} 条\n`;
      response += `• 今日报警：${today} 条\n`;
      response += `• 报警总数：${total} 条\n\n`;

      if (pending > 0) {
        response += `⚠️ **紧急提醒**：您有 ${pending} 条待处理报警，请及时查看处理。\n\n`;
        response += `**处理建议**：\n`;
        response += `1. 优先处理高危报警（红色/橙色）\n`;
        response += `2. 核实报警真实性\n`;
        response += `3. 联系相关商户确认情况\n`;
        response += `4. 必要时启动应急预案\n`;
      } else {
        response += `✅ 目前没有待处理报警，系统运行正常。\n`;
      }
      return response;
    }

    // 设备相关
    if (q.includes('设备') || q.includes('在线') || q.includes('离线') || q.includes('故障')) {
      const total = stats?.devices.total || 0;
      const online = stats?.devices.online || 0;
      const offline = stats?.devices.offline || 0;
      const fault = stats?.devices.fault || 0;
      const rate = total > 0 ? Math.round((online / total) * 100) : 0;

      let response = `📡 **设备状态概览**\n\n`;
      response += `• 设备总数：${total} 台\n`;
      response += `• 在线设备：${online} 台\n`;
      response += `• 离线设备：${offline} 台\n`;
      response += `• 故障设备：${fault} 台\n`;
      response += `• 在线率：${rate}%\n\n`;

      if (fault > 0) {
        response += `⚠️ **注意**：有 ${fault} 台设备故障，请尽快检修。\n\n`;
      }

      if (rate < 90) {
        response += `**建议**：在线率偏低，请检查网络连接和设备电源。\n`;
      } else {
        response += `✅ 设备运行状态良好。\n`;
      }
      return response;
    }

    // 商户相关
    if (q.includes('商户') || q.includes('商家') || q.includes('店铺')) {
      const total = stats?.customers.total || 0;
      return `🏢 **商户信息**\n\n• 商户总数：${total} 家\n\n您可以在「商户信息」页面查看：\n• 商户详细信息\n• 风险等级评估\n• 关联设备状态\n• 报警历史记录`;
    }

    // 火灾风险
    if (q.includes('火灾') || q.includes('着火') || q.includes('火情')) {
      return `🔥 **火灾风险分析**\n\n当前主要火灾风险点：\n\n**高风险区域**：\n• 餐饮后厨（油烟积聚）\n• 电气设备集中区域\n• 仓储区域\n\n**预防措施**：\n1. 确保烟感、温感探测器正常工作\n2. 定期检查电气线路\n3. 保持消防通道畅通\n4. 配备并检查灭火器\n\n**紧急情况**：\n如遇真实火情，请立即拨打 119！`;
    }

    // 燃气安全
    if (q.includes('燃气') || q.includes('天然气') || q.includes('液化气')) {
      return `💨 **燃气安全监测**\n\n**监测内容**：\n• 可燃气体浓度（%LEL）\n• 燃气泄漏预警\n• 通风状态\n\n**安全标准**：\n• 浓度 < 10%LEL：正常\n• 浓度 10-25%LEL：预警\n• 浓度 > 25%LEL：危险\n\n**应急处理**：\n1. 立即切断气源\n2. 打开窗户通风\n3. 禁止明火和电器开关\n4. 撤离人员并报警`;
    }

    // 趋势分析
    if (q.includes('趋势') || q.includes('统计') || q.includes('分析')) {
      return `📈 **数据分析建议**\n\n您可以在以下页面查看详细数据：\n\n• **报警趋势**：「报警记录」页面可查看历史报警统计\n• **设备状态**：「设备监控」页面查看设备在线率变化\n• **商户风险**：「风险分级」页面评估商户风险等级\n\n如需导出报表，可在「任务管理」中创建数据导出任务。`;
    }

    // 安全建议
    if (q.includes('安全') || q.includes('隐患') || q.includes('检查')) {
      return `🔒 **消防安全建议**\n\n**日常检查项目**：\n\n1. **设备检查**\n   • 确认探测器指示灯正常\n   • 检查信号强度稳定\n   • 测试报警功能\n\n2. **环境检查**\n   • 确保通风良好\n   • 检查燃气管道无泄漏\n   • 清理易燃物品\n\n3. **应急准备**\n   • 确认消防器材完备\n   • 保持通道畅通\n   • 员工熟知应急预案\n\n如需详细指导，请描述具体场景。`;
    }

    // 默认回复
    return `我理解您想了解"${question}"。\n\n**当前平台状态**：\n• 设备：${stats?.devices.total || 0} 台（在线 ${stats?.devices.online || 0} 台）\n• 报警：待处理 ${stats?.alarms.pending || 0} 条，今日 ${stats?.alarms.todayCount || 0} 条\n• 商户：${stats?.customers.total || 0} 家\n\n您可以：\n• 描述具体的报警现象\n• 询问设备维护问题\n• 了解安全检查步骤\n• 查询某个商户的信息`;
  };

  // 发送消息
  const handleSend = async (text?: string) => {
    const textToSend = text || inputValue.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // 模拟AI思考延迟
    setTimeout(() => {
      const response = getAIResponse(textToSend, platformStats);
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 600);
  };

  // 键盘发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 清空对话
  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: '对话已清空。请问还有什么可以帮您？',
      timestamp: new Date(),
    }]);
  };

  // 模拟故障
  const handleSimulate = async () => {
    if (!simFaultType || !simMerchant || !simLocation) {
      return;
    }

    setSimulating(true);

    const faultName = faultTypes.find(f => f.type === simFaultType)?.name || simFaultType;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `请模拟${faultName}故障，发生在${simMerchant}${simLocation}，生成故障处理方案`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // 模拟AI分析
    setTimeout(() => {
      const advice = generateProcessingAdvice(simFaultType, simMerchant, simLocation);
      const config = faultTypeConfigs[simFaultType as keyof typeof faultTypeConfigs];
      
      const responseContent = `${config.icon} **故障模拟报告**

---

## 一、基本信息

| 项目 | 内容 |
|------|------|
| **故障类型** | ${config.icon} ${advice.faultInfo.type} |
| **发生位置** | 📍 ${advice.faultInfo.merchant} · ${advice.faultInfo.location} |
| **发生时间** | ⏰ ${advice.faultInfo.time} |
| **报警等级** | 🔴 ${advice.faultInfo.alarmLevel} |
| **危险等级** | ⚠️ ${advice.faultInfo.severity} |
| **探测器类型** | 📡 ${advice.faultInfo.detectorType} |
| **报警阈值** | ${advice.faultInfo.threshold} |

---

## 二、风险分析

**可能原因**：
${advice.riskPoints.map((point, i) => `• ${point}`).join('\n')}

---

## 三、现场处置步骤

${advice.disposalSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

---

## 四、通知流程

| 通知对象 | 通知时间 | 通知方式 |
|----------|----------|----------|
${advice.notifications.map(n => `| ${n.to} | ${n.time} | ${n.method} |`).join('\n')}

---

## 五、预防措施

${advice.preventionMeasures.map((m, i) => `${i + 1}. ${m}`).join('\n')}

---

## 六、相关文档

📎 [${advice.file.name}](${advice.file.url})

> ${advice.file.note}

---

⚠️ **本次为模拟演练，请根据实际情况参考处置流程**`;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        hasAttachment: true,
      };
      setMessages(prev => [...prev, assistantMessage]);
      setSimulating(false);
      setShowSimulator(false);
      setSimFaultType('');
      setSimMerchant('');
      setSimLocation('');
    }, 1500);
  };

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-7rem)] gap-4">
        {/* 左侧：快捷问题和统计 */}
        <div className="w-80 flex flex-col gap-4">
          {/* 统计卡片 */}
          <div className="bg-[#1E1E1E] rounded-xl border border-[#2D2D2D] p-4">
            <h3 className="text-[#E5E5E5] font-medium mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FF6B35]" />
              实时数据
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#222222] rounded-lg p-3">
                <div className="flex items-center gap-2 text-[#A0A0A0] text-xs mb-1">
                  <Radio className="w-3 h-3" />
                  总设备
                </div>
                <p className="text-xl font-bold text-[#E5E5E5]">{platformStats?.devices.total || '-'}</p>
              </div>
              <div className="bg-[#222222] rounded-lg p-3">
                <div className="flex items-center gap-2 text-[#A0A0A0] text-xs mb-1">
                  <CheckCircle className="w-3 h-3 text-[#4CAF50]" />
                  在线
                </div>
                <p className="text-xl font-bold text-[#4CAF50]">{platformStats?.devices.online || '-'}</p>
              </div>
              <div className="bg-[#222222] rounded-lg p-3">
                <div className="flex items-center gap-2 text-[#A0A0A0] text-xs mb-1">
                  <AlertTriangle className="w-3 h-3 text-[#FF9800]" />
                  待处理
                </div>
                <p className="text-xl font-bold text-[#FF9800]">{platformStats?.alarms.pending || '-'}</p>
              </div>
              <div className="bg-[#222222] rounded-lg p-3">
                <div className="flex items-center gap-2 text-[#A0A0A0] text-xs mb-1">
                  <Clock className="w-3 h-3" />
                  今日
                </div>
                <p className="text-xl font-bold text-[#E5E5E5]">{platformStats?.alarms.todayCount || '-'}</p>
              </div>
            </div>
            <button
              onClick={loadPlatformStats}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-[#222222] rounded-lg text-[#A0A0A0] text-sm hover:bg-[#2A2A2A] hover:text-[#E5E5E5] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              刷新数据
            </button>
          </div>

          {/* AI故障模拟 */}
          <div className="bg-[#1E1E1E] rounded-xl border border-[#2D2D2D] p-4">
            <h3 className="text-[#E5E5E5] font-medium mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#9C27B0]" />
              AI故障模拟
            </h3>
            
            {!showSimulator ? (
              <button
                onClick={() => setShowSimulator(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#9C27B0]/10 text-[#9C27B0] rounded-lg text-sm hover:bg-[#9C27B0]/20 transition-colors"
              >
                <Play className="w-4 h-4" />
                模拟故障场景
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[#A0A0A0] text-xs mb-1 block">故障类型</label>
                  <select
                    value={simFaultType}
                    onChange={(e) => setSimFaultType(e.target.value)}
                    className="w-full bg-[#222222] border border-[#3A3A3A] rounded-lg px-3 py-2 text-[#E5E5E5] text-sm"
                  >
                    <option value="">请选择故障类型</option>
                    {faultTypes.map((fault) => (
                      <option key={fault.type} value={fault.type}>{fault.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[#A0A0A0] text-xs mb-1 block">商户</label>
                  <select
                    value={simMerchant}
                    onChange={(e) => {
                      setSimMerchant(e.target.value);
                      // 自动设置位置为该商户的第一个位置
                      const locations = locationOptions[e.target.value as keyof typeof locationOptions];
                      if (locations && locations.length > 0) {
                        setSimLocation(locations[0]);
                      } else {
                        setSimLocation('');
                      }
                    }}
                    className="w-full bg-[#222222] border border-[#3A3A3A] rounded-lg px-3 py-2 text-[#E5E5E5] text-sm"
                  >
                    <option value="">请选择商户</option>
                    {merchants.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[#A0A0A0] text-xs mb-1 block">位置</label>
                  <select
                    value={simLocation}
                    onChange={(e) => setSimLocation(e.target.value)}
                    disabled={!simMerchant}
                    className="w-full bg-[#222222] border border-[#3A3A3A] rounded-lg px-3 py-2 text-[#E5E5E5] text-sm disabled:opacity-50"
                  >
                    <option value="">请选择位置</option>
                    {simMerchant && (locationOptions[simMerchant as keyof typeof locationOptions] || []).map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowSimulator(false);
                      setSimFaultType('');
                      setSimMerchant('');
                      setSimLocation('');
                    }}
                    className="flex-1 py-2 bg-[#222222] text-[#A0A0A0] rounded-lg text-sm hover:bg-[#2A2A2A] transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSimulate}
                    disabled={!simFaultType || !simMerchant || !simLocation || simulating}
                    className="flex-1 py-2 bg-[#9C27B0] text-white rounded-lg text-sm hover:bg-[#7B1FA2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {simulating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        模拟中...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        开始模拟
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 快捷问题 */}
          <div className="bg-[#1E1E1E] rounded-xl border border-[#2D2D2D] p-4 flex-1">
            <h3 className="text-[#E5E5E5] font-medium mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#FF6B35]" />
              快捷问题
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {quickSuggestions.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(item.query)}
                  className="flex items-center gap-2 px-3 py-2.5 bg-[#222222] rounded-lg text-[#A0A0A0] text-sm hover:bg-[#2A2A2A] hover:text-[#E5E5E5] transition-colors text-left"
                >
                  <span className="text-[#FF6B35]">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：对话区域 */}
        <div className="flex-1 flex flex-col bg-[#1E1E1E] rounded-xl border border-[#2D2D2D] overflow-hidden">
          {/* 头部 */}
          <div className="px-6 py-4 border-b border-[#2D2D2D] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#F72C25] flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-[#E5E5E5] font-semibold">消防安全智能助手</h2>
                <p className="text-[#6C6C6C] text-sm">基于平台数据的AI分析</p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="px-3 py-1.5 text-sm text-[#A0A0A0] hover:text-[#E5E5E5] hover:bg-[#2A2A2A] rounded-lg transition-colors"
            >
              清空对话
            </button>
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#F72C25] flex items-center justify-center mr-3 flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-5 py-3',
                    msg.role === 'user'
                      ? 'bg-[#0078D4] text-white rounded-br-md'
                      : 'bg-[#222222] text-[#E5E5E5] rounded-bl-md'
                  )}
                >
                  {/* 渲染消息内容，支持链接格式 */}
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content.split('\n').map((line, i) => {
                      // 处理文件链接格式: **文件**：[xxx]
                      if (line.includes('**文件**') || line.includes('File:')) {
                        const parts = line.split(/(\*\*文件\*\*：\[.*?\]|\[.*?\]\(.*?\))/g);
                        return (
                          <div key={i} className="flex items-center gap-2 py-1">
                            <FileText className="w-4 h-4 text-[#0078D4] flex-shrink-0" />
                            {parts.map((part, j) => {
                              const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                              if (linkMatch) {
                                return (
                                  <a
                                    key={j}
                                    href={linkMatch[2]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#0078D4] hover:underline flex items-center gap-1"
                                  >
                                    {linkMatch[1]}
                                    <ExternalLink className="w-3 h-3 inline" />
                                  </a>
                                );
                              }
                              if (part.includes('**文件**')) {
                                return <span key={j} className="text-[#A0A0A0]">文件：</span>;
                              }
                              return part;
                            })}
                          </div>
                        );
                      }
                      // 处理URL链接格式 (Markdown链接: [text](url))
                      const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                      if (mdLinkRegex.test(line)) {
                        const parts: React.ReactNode[] = [];
                        let lastIndex = 0;
                        let match;
                        const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
                        while ((match = regex.exec(line)) !== null) {
                          // 添加链接前的文本
                          if (match.index > lastIndex) {
                            parts.push(line.slice(lastIndex, match.index));
                          }
                          // 添加链接
                          parts.push(
                            <a
                              key={`link-${match.index}`}
                              href={match[2]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0078D4] hover:underline"
                            >
                              {match[1]}
                            </a>
                          );
                          lastIndex = match.index + match[0].length;
                        }
                        // 添加剩余文本
                        if (lastIndex < line.length) {
                          parts.push(line.slice(lastIndex));
                        }
                        return <p key={i}>{parts}</p>;
                      }
                      // 处理粗体
                      return (
                        <p key={i}>
                          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={j}>{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          })}
                        </p>
                      );
                    })}
                  </div>
                  <p className={cn(
                    'text-xs mt-2',
                    msg.role === 'user' ? 'text-white/60' : 'text-[#6C6C6C]'
                  )}>
                    {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#F72C25] flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-[#222222] rounded-2xl rounded-bl-md px-5 py-3">
                  <div className="flex items-center gap-2 text-[#A0A0A0]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">正在分析...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 输入框 */}
          <div className="p-4 border-t border-[#2D2D2D]">
            <div className="flex items-center gap-3 bg-[#222222] rounded-xl px-4 py-3 border border-[#3A3A3A] focus-within:border-[#FF6B35] transition-colors">
              <MessageCircle className="w-5 h-5 text-[#6C6C6C] flex-shrink-0" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入您的问题..."
                className="flex-1 bg-transparent text-[#E5E5E5] text-sm placeholder-[#6C6C6C] focus:outline-none"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isLoading}
                className="p-2 rounded-lg bg-gradient-to-r from-[#FF6B35] to-[#F72C25] hover:from-[#F72C25] hover:to-[#D32F2F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Send className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
            <p className="text-[#6C6C6C] text-xs mt-2 text-center">
              智能助手可帮助分析报警情况、设备状态、安全建议等
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
