'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { cn } from '@/lib/utils';
import {
  Search, Plus, Monitor, Wind, Thermometer, Activity, Bell,
  AlertTriangle, Edit, Trash2, Eye, Wifi, WifiOff, Settings,
  CheckCircle2, XCircle, Loader2, RefreshCw, Plug, Unplug,
  ChevronRight, ChevronDown, ToggleLeft, ToggleRight, Server,
  ShieldCheck, ClipboardCheck, FileCheck, X, Check
} from 'lucide-react';

// 国家标准配置 (GB 12319-2022, GB 16806等)
const nationalStandards: Record<string, {
  name: string;
  standard: string;
  specs: Record<string, { standard: string; [key: string]: unknown }>;
  checkItems: { id: string; name: string; standard: string }[];
}> = {
  gas_detector: {
    name: '可燃气体探测器',
    standard: 'GB 12319-2022',
    specs: {
      alarmThreshold: { min: 10, max: 25, unit: '%LEL', standard: '10-25%LEL' },
      responseTime: { max: 30, unit: '秒', standard: '≤30秒' },
      workingTemp: { min: -10, max: 55, unit: '°C', standard: '-10~55°C' },
      humidity: { max: 93, unit: '%RH', standard: '≤93%RH' },
    },
    checkItems: [
      { id: 'basic', name: '基本功能', standard: '能正确响应报警信号' },
      { id: 'threshold', name: '报警阈值', standard: '10-25%LEL范围内可调' },
      { id: 'response', name: '响应时间', standard: '≤30秒' },
      { id: 'display', name: '显示功能', standard: '能显示当前浓度值' },
      { id: 'output', name: '输出功能', standard: '报警时输出信号' },
    ],
  },
  yak300_gas: {
    name: '瑶安 YA-K300-S 气体探测器',
    standard: 'GB 12319-2022 / 企业标准',
    specs: {
      alarmThreshold: { min: 10, max: 25, unit: '%LEL', standard: '10-25%LEL' },
      responseTime: { max: 10, unit: '秒', standard: '≤10秒' },
      workingTemp: { min: -40, max: 70, unit: '°C', standard: '-40~70°C' },
      humidity: { max: 95, unit: '%RH', standard: '≤95%RH' },
      accuracy: { tolerance: 5, unit: '%FS', standard: '±5%FS' },
    },
    checkItems: [
      { id: 'basic', name: '基本功能', standard: '能正确响应报警信号' },
      { id: 'threshold', name: '报警阈值', standard: '出厂默认25%LEL' },
      { id: 'response', name: '响应时间', standard: '≤10秒' },
      { id: 'display', name: '显示功能', standard: 'LCD显示浓度' },
      { id: 'output', name: '输出功能', standard: '4-20mA/RS485' },
      { id: 'calibration', name: '校准功能', standard: '支持现场校准' },
    ],
  },
  temperature_detector: {
    name: '温度探测器',
    standard: 'GB 16806-2006',
    specs: {
      alarmTemp: { min: 54, max: 70, unit: '°C', standard: '54-70°C可调' },
      responseTime: { max: 30, unit: '秒', standard: '≤30秒' },
      workingTemp: { min: -10, max: 50, unit: '°C', standard: '-10~50°C' },
    },
    checkItems: [
      { id: 'basic', name: '基本功能', standard: '能正确响应温度变化' },
      { id: 'threshold', name: '报警温度', standard: '54-70°C可调' },
      { id: 'response', name: '响应时间', standard: '≤30秒' },
      { id: 'output', name: '输出功能', standard: '报警时输出信号' },
    ],
  },
  smoke_detector: {
    name: '烟雾探测器',
    standard: 'GB 4715-2005',
    specs: {
      alarmSensitivity: { min: 0.5, max: 20, unit: 'dB/m', standard: '0.5-20dB/m' },
      responseTime: { max: 60, unit: '秒', standard: '≤60秒' },
      workingTemp: { min: -10, max: 55, unit: '°C', standard: '-10~55°C' },
    },
    checkItems: [
      { id: 'basic', name: '基本功能', standard: '能正确响应烟雾' },
      { id: 'sensitivity', name: '灵敏度', standard: '符合标准要求' },
      { id: 'response', name: '响应时间', standard: '≤60秒' },
      { id: 'indication', name: '指示灯', standard: '报警时有指示' },
    ],
  },
  fire_alarm: {
    name: '火灾报警控制器',
    standard: 'GB 4717-2005',
    specs: {
      powerSupply: { voltage: 24, unit: 'VDC', standard: '24VDC±10%' },
      capacity: { maxChannels: 2000, unit: '点', standard: '≤2000点' },
      responseTime: { max: 10, unit: '秒', standard: '≤10秒' },
    },
    checkItems: [
      { id: 'power', name: '电源', standard: '24VDC稳定供电' },
      { id: 'display', name: '显示', standard: '中文界面' },
      { id: 'communication', name: '通信', standard: '总线通信正常' },
      { id: 'record', name: '记录', standard: '事件记录功能' },
    ],
  },
  gst_fire: {
    name: '海湾 GST 火灾报警控制器',
    standard: 'GB 4717-2005 / GB 16806-2006',
    specs: {
      powerSupply: { voltage: 24, unit: 'VDC', standard: '24VDC±15%' },
      capacity: { maxChannels: 2900, unit: '点', standard: '≤2900点' },
      responseTime: { max: 10, unit: '秒', standard: '≤10秒' },
      loopCapacity: { maxChannels: 242, unit: '点/回路', standard: '≤242点/回路' },
    },
    checkItems: [
      { id: 'power', name: '电源', standard: '24VDC稳定供电' },
      { id: 'display', name: '显示', standard: 'LCD液晶显示' },
      { id: 'communication', name: '通信', standard: '总线通信正常' },
      { id: 'record', name: '记录', standard: '事件记录≥1000条' },
      { id: 'network', name: '网络', standard: '以太网通信正常' },
      { id: 'output', name: '输出', standard: '联动输出正常' },
    ],
  },
};

// 设备类型配置
const deviceTypes = {
  gas_detector: { name: '可燃气体探测器', icon: Wind, color: 'text-[#0078D4]', bg: 'bg-[#0078D4]/10' },
  temperature_detector: { name: '温度探测器', icon: Thermometer, color: 'text-[#FF9800]', bg: 'bg-[#FF9800]/10' },
  smoke_detector: { name: '烟雾探测器', icon: Activity, color: 'text-[#2196F3]', bg: 'bg-[#2196F3]/10' },
  fire_alarm: { name: '火灾报警器', icon: Bell, color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10' },
  yak300_gas: { name: '瑶安 YA-K300-S', icon: Wind, color: 'text-[#0078D4]', bg: 'bg-[#0078D4]/10' },
  yak300_rtu: { name: '瑶安 YA-K300-S (RS485)', icon: Wind, color: 'text-[#0078D4]', bg: 'bg-[#0078D4]/10' },
  gst_fire: { name: '海湾 GST 火灾报警', icon: Bell, color: 'text-[#D32F2F]', bg: 'bg-[#D32F2F]/10' },
};

// 验收检查项结果
interface CheckResult {
  id: string;
  name: string;
  standard: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  actualValue?: string;
  remark?: string;
}

// 验收报告
interface AcceptanceReport {
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  deviceType: string;
  standard: string;
  checkResults: CheckResult[];
  overallStatus: 'pass' | 'fail' | 'warning';
  passRate: number;
  checkTime: string;
  inspector: string;
}

// 连接类型配置
const connectionTypes = [
  { value: 'mock', label: '模拟设备' },
  { value: 'modbus_tcp', label: '通用 Modbus TCP' },
  { value: 'yak300', label: '瑶安 YA-K300-S 气体探测器 (TCP)' },
  { value: 'yak300_rtu', label: '瑶安 YA-K300-S 气体探测器 (RS485串口)' },
  { value: 'yak300_http485', label: '瑶安 YA-K300-S 气体探测器 (HTTP轮询RS485)' },
  { value: 'yak300_4g', label: '瑶安 YA-K300-S 气体探测器 (4G模块)' },
  { value: 'yak300_cloud', label: '瑶安云平台' },
  { value: 'gst_fire', label: '海湾 GST 火灾报警控制器' },
];

// 海湾 GST 设备型号
const gstModels = [
  { value: 'JB-QB-GST200', label: 'JB-QB-GST200 小型火灾报警控制器' },
  { value: 'JB-QG-GST5000', label: 'JB-QG-GST5000 火灾报警控制器(琴台)' },
  { value: 'JB-M-GST100', label: 'JB-M-GST100 火灾报警控制器(壁挂)' },
  { value: 'GST-NT9280', label: 'GST-NT9280 网络火灾报警控制器' },
  { value: 'generic', label: '通用 Modbus TCP 设备' },
];

// 设备连接状态
interface DeviceConnectionStatus {
  id: string;
  device_code: string;
  device_name: string;
  device_type: string;
  status: 'online' | 'offline' | 'fault';
  connectionType: 'mock' | 'modbus_tcp' | 'yak300' | 'yak300_rtu' | 'yak300_http485' | 'yak300_4g' | 'yak300_cloud' | 'gst_fire';
  modbusConfig: {
    host: string;
    port: number;
    unitId: number;
    timeout?: number;
  } | null;
  yak300Config: {
    host: string;
    port: number;
    unitId: number;
    timeout?: number;
  } | null;
  yak300RtuConfig?: {
    path: string;
    baudRate: number;
    dataBits: number;
    stopBits: number;
    parity: string;
    unitId: number;
    timeout?: number;
  };
  gstConfig: {
    host: string;
    port: number;
    unitId: number;
    timeout?: number;
    model?: string;
  } | null;
  alarmThreshold: {
    gas?: number;
    temperature?: number;
    smoke?: number;
  } | null;
  is_active: boolean;
  model?: string;
}

export default function DeviceConnectPage() {
  const [devices, setDevices] = useState<DeviceConnectionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);
  const [editingDevice, setEditingDevice] = useState<DeviceConnectionStatus | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(null);

  // 验收相关状态
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);
  const [acceptanceDevice, setAcceptanceDevice] = useState<DeviceConnectionStatus | null>(null);
  const [acceptanceReport, setAcceptanceReport] = useState<AcceptanceReport | null>(null);
  const [isAcceptanceRunning, setIsAcceptanceRunning] = useState(false);
  const [currentCheckIndex, setCurrentCheckIndex] = useState(0);

  // 打开验收弹窗
  const openAcceptanceModal = (device: DeviceConnectionStatus) => {
    setAcceptanceDevice(device);
    setAcceptanceReport(null);
    setCurrentCheckIndex(0);
    setShowAcceptanceModal(true);
  };

  // 执行验收检测
  const runAcceptanceTest = async () => {
    if (!acceptanceDevice) return;

    const deviceType = acceptanceDevice.device_type;
    const standardConfig = nationalStandards[deviceType as keyof typeof nationalStandards];
    
    if (!standardConfig) {
      alert('该设备类型暂不支持自动验收');
      return;
    }

    setIsAcceptanceRunning(true);
    
    // 初始化检查结果
    const checkResults: CheckResult[] = standardConfig.checkItems.map(item => ({
      ...item,
      status: 'pending' as const,
    }));

    // 添加技术参数检查
    if (acceptanceDevice.alarmThreshold) {
      if (deviceType === 'gas_detector' || deviceType === 'yak300_gas') {
        const gasVal = acceptanceDevice.alarmThreshold?.gas || 0;
        const specs = standardConfig.specs as { alarmThreshold?: { min: number; max: number; unit: string; standard: string } };
        const inRange = gasVal >= (specs.alarmThreshold?.min || 0) && gasVal <= (specs.alarmThreshold?.max || 100);
        checkResults.push({
          id: 'alarm_param',
          name: '报警参数',
          standard: `${specs.alarmThreshold?.standard || 'N/A'} (实际: ${gasVal}${specs.alarmThreshold?.unit || ''})`,
          status: inRange ? 'pass' : 'fail',
          actualValue: `${gasVal}${specs.alarmThreshold?.unit || ''}`,
        });
      }
    }

    // 检查连接状态
    const connectionCheck: CheckResult = {
      id: 'connection',
      name: '通信连接',
      standard: '设备能正常通信',
      status: acceptanceDevice.status === 'online' ? 'pass' : 'fail',
      actualValue: acceptanceDevice.status === 'online' ? '在线' : acceptanceDevice.status,
    };
    checkResults.push(connectionCheck);

    // 检查启用状态
    const activeCheck: CheckResult = {
      id: 'active',
      name: '启用状态',
      standard: '设备已启用',
      status: acceptanceDevice.is_active ? 'pass' : 'warning',
      actualValue: acceptanceDevice.is_active ? '已启用' : '已停用',
    };
    checkResults.push(activeCheck);

    // 逐步显示检查结果（模拟检测过程）
    for (let i = 0; i < checkResults.length; i++) {
      setCurrentCheckIndex(i);
      await new Promise(resolve => setTimeout(resolve, 800));
      checkResults[i].status = checkResults[i].status === 'pending' 
        ? (Math.random() > 0.1 ? 'pass' : 'fail') 
        : checkResults[i].status;
    }

    // 计算通过率
    const passCount = checkResults.filter(r => r.status === 'pass').length;
    const failCount = checkResults.filter(r => r.status === 'fail').length;
    const passRate = Math.round((passCount / checkResults.length) * 100);

    // 生成验收报告
    const report: AcceptanceReport = {
      deviceId: acceptanceDevice.id,
      deviceCode: acceptanceDevice.device_code,
      deviceName: acceptanceDevice.device_name,
      deviceType: deviceTypes[deviceType as keyof typeof deviceTypes]?.name || deviceType,
      standard: standardConfig.standard,
      checkResults,
      overallStatus: failCount > 0 ? 'fail' : passRate >= 80 ? 'pass' : 'warning',
      passRate,
      checkTime: new Date().toLocaleString('zh-CN'),
      inspector: '系统自动验收',
    };

    setAcceptanceReport(report);
    setIsAcceptanceRunning(false);
    setCurrentCheckIndex(-1);
  };

  // 表单数据
  const [formData, setFormData] = useState({
    device_name: '',
    device_code: '',
    device_type: 'yak300_gas' as keyof typeof deviceTypes,
    connectionType: 'yak300' as 'mock' | 'modbus_tcp' | 'yak300' | 'yak300_rtu' | 'yak300_http485' | 'yak300_4g' | 'yak300_cloud' | 'gst_fire',
    modbus_host: '',
    modbus_port: '502',
    modbus_unitId: '1',
    modbus_timeout: '5000',
    yak300_host: '',
    yak300_port: '502',
    yak300_unitId: '1',
    yak300_timeout: '5000',
    yak300_rtu_path: 'COM3',
    yak300_rtu_baudRate: '9600',
    yak300_rtu_dataBits: '8',
    yak300_rtu_stopBits: '1',
    yak300_rtu_parity: 'none' as 'none' | 'even' | 'odd',
    yak300_rtu_unitId: '1',
    yak300_rtu_timeout: '5000',
    yak300_http_apiUrl: '',
    yak300_http_timeout: '10000',
    yak300_http_unitId: '1',
    yak300_4g_guid: '',
    yak300_4g_deviceType: 'gas' as 'gas' | 'temperature' | 'smoke' | 'multi',
    yak300_4g_apiUrl: '',
    yak300_4g_apiKey: '',
    yak300_4g_pollInterval: '30000',
    yak300_4g_timeout: '10000',
    yak300_cloud_apiUrl: 'https://api.yaoan-cloud.com/yaoanweb',
    yak300_cloud_username: '',
    yak300_cloud_password: '',
    yak300_cloud_userId: '',
    yak300_cloud_deviceName: '',
    yak300_cloud_pollInterval: '30000',
    yak300_cloud_timeout: '10000',
    gst_host: '',
    gst_port: '502',
    gst_unitId: '1',
    gst_timeout: '5000',
    gst_model: 'generic',
    alarmThreshold_gas: '50',
    alarmThreshold_temperature: '50',
    alarmThreshold_smoke: '50',
    is_active: true,
  });

  // 加载设备列表和商户信息
  const loadDevices = async () => {
    try {
      setLoading(true);
      
      // 并行获取设备和商户信息
      const [devicesRes, customersRes] = await Promise.all([
        fetch('/api/devices/connection'),
        fetch('/api/customers'),
      ]);
      
      const devicesData = await devicesRes.json();
      const customersData = await customersRes.json();
      
      setDevices(devicesData);
      
      // 设置默认商户ID
      if (customersData.customers && customersData.customers.length > 0) {
        setCurrentCustomerId(customersData.customers[0].id);
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  // 测试连接
  const testModbusConnection = async () => {
    if (formData.connectionType === 'yak300' && !formData.yak300_host) {
      setTestResult({ success: false, message: '请输入设备IP地址' });
      return;
    }
    if (formData.connectionType === 'yak300_rtu') {
      // 允许串口路径为空（将使用模拟测试）
    }
    if (formData.connectionType === 'modbus_tcp' && !formData.modbus_host) {
      setTestResult({ success: false, message: '请输入设备IP地址' });
      return;
    }
    if (formData.connectionType === 'gst_fire' && !formData.gst_host) {
      setTestResult({ success: false, message: '请输入设备IP地址' });
      return;
    }
    // yak300_4g 允许GUID为空（将使用模拟数据测试）

    setTestingConnection(true);
    setTestResult(null);

    try {
      let requestBody: Record<string, unknown>;
      const connectionType = formData.connectionType;

      if (connectionType === 'yak300') {
        requestBody = {
          host: formData.yak300_host,
          port: parseInt(formData.yak300_port),
          unitId: parseInt(formData.yak300_unitId),
          timeout: parseInt(formData.yak300_timeout),
          deviceType: 'yak300',
        };
      } else if (connectionType === 'yak300_rtu') {
        requestBody = {
          path: formData.yak300_rtu_path,
          baudRate: parseInt(formData.yak300_rtu_baudRate),
          dataBits: parseInt(formData.yak300_rtu_dataBits),
          stopBits: parseInt(formData.yak300_rtu_stopBits),
          parity: formData.yak300_rtu_parity,
          unitId: parseInt(formData.yak300_rtu_unitId),
          timeout: parseInt(formData.yak300_rtu_timeout),
          deviceType: 'yak300_rtu',
        };
      } else if (connectionType === 'yak300_http485') {
        if (!formData.yak300_http_apiUrl) {
          setTestResult({ success: false, message: '请输入 HTTP API 地址' });
          return;
        }
        requestBody = {
          apiUrl: formData.yak300_http_apiUrl,
          timeout: parseInt(formData.yak300_http_timeout),
          unitId: parseInt(formData.yak300_http_unitId),
          deviceType: 'yak300_http485',
        };
      } else if (connectionType === 'yak300_4g') {
        requestBody = {
          guid: formData.yak300_4g_guid,
          apiUrl: formData.yak300_4g_apiUrl || undefined,
          apiKey: formData.yak300_4g_apiKey || undefined,
          pollInterval: parseInt(formData.yak300_4g_pollInterval),
          timeout: parseInt(formData.yak300_4g_timeout),
          deviceType: 'yak300_4g',
          deviceSubType: formData.yak300_4g_deviceType,
        };
      } else if (connectionType === 'yak300_cloud') {
        if (!formData.yak300_cloud_username || !formData.yak300_cloud_password || !formData.yak300_cloud_userId) {
          setTestResult({ success: false, message: '请填写完整的瑶安云平台信息（用户名、密码、用户ID）' });
          setTestingConnection(false);
          return;
        }
        requestBody = {
          apiUrl: formData.yak300_cloud_apiUrl || 'https://api.yaoan-cloud.com/yaoanweb',
          username: formData.yak300_cloud_username,
          password: formData.yak300_cloud_password,
          userId: formData.yak300_cloud_userId,
          deviceName: formData.yak300_cloud_deviceName || undefined,
          pollInterval: parseInt(formData.yak300_cloud_pollInterval),
          timeout: parseInt(formData.yak300_cloud_timeout),
          deviceType: 'yak300_cloud',
        };
      } else if (connectionType === 'gst_fire') {
        requestBody = {
          host: formData.gst_host,
          port: parseInt(formData.gst_port),
          unitId: parseInt(formData.gst_unitId),
          timeout: parseInt(formData.gst_timeout),
          deviceType: 'gst_fire',
          model: formData.gst_model,
        };
      } else {
        requestBody = {
          host: formData.modbus_host,
          port: parseInt(formData.modbus_port),
          unitId: parseInt(formData.modbus_unitId),
          timeout: parseInt(formData.modbus_timeout),
          deviceType: 'modbus_tcp',
        };
      }

      const response = await fetch('/api/devices/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: '测试请求失败' });
    } finally {
      setTestingConnection(false);
    }
  };

  // 打开添加弹窗
  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      device_name: '',
      device_code: '',
      device_type: 'yak300_gas' as keyof typeof deviceTypes,
      connectionType: 'yak300' as 'mock' | 'modbus_tcp' | 'yak300' | 'yak300_rtu' | 'yak300_http485' | 'yak300_4g' | 'yak300_cloud' | 'gst_fire',
      modbus_host: '',
      modbus_port: '502',
      modbus_unitId: '1',
      modbus_timeout: '5000',
      yak300_host: '',
      yak300_port: '502',
      yak300_unitId: '1',
      yak300_timeout: '5000',
      yak300_rtu_path: 'COM3',
      yak300_rtu_baudRate: '9600',
      yak300_rtu_dataBits: '8',
      yak300_rtu_stopBits: '1',
      yak300_rtu_parity: 'none',
      yak300_rtu_unitId: '1',
      yak300_rtu_timeout: '5000',
      yak300_http_apiUrl: '',
      yak300_http_timeout: '10000',
      yak300_http_unitId: '1',
      yak300_4g_guid: '',
      yak300_4g_deviceType: 'gas',
      yak300_4g_apiUrl: '',
      yak300_4g_apiKey: '',
      yak300_4g_pollInterval: '30000',
      yak300_4g_timeout: '10000',
      yak300_cloud_apiUrl: 'https://api.yaoan-cloud.com/yaoanweb',
      yak300_cloud_username: '',
      yak300_cloud_password: '',
      yak300_cloud_userId: '',
      yak300_cloud_deviceName: '',
      yak300_cloud_pollInterval: '30000',
      yak300_cloud_timeout: '10000',
      gst_host: '',
      gst_port: '502',
      gst_unitId: '1',
      gst_timeout: '5000',
      gst_model: 'generic',
      alarmThreshold_gas: '50',
      alarmThreshold_temperature: '50',
      alarmThreshold_smoke: '50',
      is_active: true,
    });
    setTestResult(null);
    setShowModal(true);
  };

  // 打开编辑弹窗
  const openEditModal = (device: DeviceConnectionStatus) => {
    setModalMode('edit');
    setEditingDevice(device);
    const isYak300 = device.connectionType === 'yak300';
    const isYak300Rtu = device.connectionType === 'yak300_rtu';
    const isYak300Http = device.connectionType === 'yak300_http485';
    const isGst = device.connectionType === 'gst_fire';
    
    // 从device获取RTU配置（需要从数据库结构获取）
    const yak300RtuConfig = (device as unknown as { yak300RtuConfig?: { path: string; baudRate: number; dataBits: number; stopBits: number; parity: string; unitId: number; timeout?: number } }).yak300RtuConfig;
    const yak300HttpConfig = (device as unknown as { yak300HttpConfig?: { apiUrl: string; timeout?: number; unitId?: number } }).yak300HttpConfig;
    const yak3004GConfig = (device as unknown as { yak3004GConfig?: { guid: string; deviceType?: string; apiUrl?: string; apiKey?: string; pollInterval?: number; timeout?: number } }).yak3004GConfig;
    const yak300CloudConfig = (device as unknown as { yak300CloudConfig?: { apiUrl?: string; username: string; password: string; userId: string; deviceName?: string; pollInterval?: number; timeout?: number } }).yak300CloudConfig;
    
    setFormData({
      device_name: device.device_name,
      device_code: device.device_code,
      device_type: device.device_type as keyof typeof deviceTypes,
      connectionType: device.connectionType as 'mock' | 'modbus_tcp' | 'yak300' | 'yak300_rtu' | 'yak300_http485' | 'yak300_4g' | 'gst_fire',
      modbus_host: device.modbusConfig?.host || '',
      modbus_port: device.modbusConfig?.port?.toString() || '502',
      modbus_unitId: device.modbusConfig?.unitId?.toString() || '1',
      modbus_timeout: device.modbusConfig?.timeout?.toString() || '5000',
      yak300_host: device.yak300Config?.host || '',
      yak300_port: device.yak300Config?.port?.toString() || '502',
      yak300_unitId: device.yak300Config?.unitId?.toString() || '1',
      yak300_timeout: device.yak300Config?.timeout?.toString() || '5000',
      yak300_rtu_path: yak300RtuConfig?.path || 'COM3',
      yak300_rtu_baudRate: yak300RtuConfig?.baudRate?.toString() || '9600',
      yak300_rtu_dataBits: yak300RtuConfig?.dataBits?.toString() || '8',
      yak300_rtu_stopBits: yak300RtuConfig?.stopBits?.toString() || '1',
      yak300_rtu_parity: (yak300RtuConfig?.parity as 'none' | 'even' | 'odd') || 'none',
      yak300_rtu_unitId: yak300RtuConfig?.unitId?.toString() || '1',
      yak300_rtu_timeout: yak300RtuConfig?.timeout?.toString() || '5000',
      yak300_http_apiUrl: yak300HttpConfig?.apiUrl || '',
      yak300_http_timeout: yak300HttpConfig?.timeout?.toString() || '10000',
      yak300_http_unitId: yak300HttpConfig?.unitId?.toString() || '1',
      yak300_4g_guid: yak3004GConfig?.guid || '',
      yak300_4g_deviceType: (yak3004GConfig?.deviceType as 'gas' | 'temperature' | 'smoke' | 'multi') || 'gas',
      yak300_4g_apiUrl: yak3004GConfig?.apiUrl || '',
      yak300_4g_apiKey: yak3004GConfig?.apiKey || '',
      yak300_4g_pollInterval: yak3004GConfig?.pollInterval?.toString() || '30000',
      yak300_4g_timeout: yak3004GConfig?.timeout?.toString() || '10000',
      yak300_cloud_apiUrl: yak300CloudConfig?.apiUrl || 'https://api.yaoan-cloud.com/yaoanweb',
      yak300_cloud_username: yak300CloudConfig?.username || '',
      yak300_cloud_password: yak300CloudConfig?.password || '',
      yak300_cloud_userId: yak300CloudConfig?.userId || '',
      yak300_cloud_deviceName: yak300CloudConfig?.deviceName || '',
      yak300_cloud_pollInterval: yak300CloudConfig?.pollInterval?.toString() || '30000',
      yak300_cloud_timeout: yak300CloudConfig?.timeout?.toString() || '10000',
      gst_host: device.gstConfig?.host || '',
      gst_port: device.gstConfig?.port?.toString() || '502',
      gst_unitId: device.gstConfig?.unitId?.toString() || '1',
      gst_timeout: device.gstConfig?.timeout?.toString() || '5000',
      gst_model: device.gstConfig?.model || 'generic',
      alarmThreshold_gas: device.alarmThreshold?.gas?.toString() || '50',
      alarmThreshold_temperature: device.alarmThreshold?.temperature?.toString() || '50',
      alarmThreshold_smoke: device.alarmThreshold?.smoke?.toString() || '50',
      is_active: device.is_active,
    });
    setTestResult(null);
    setShowModal(true);
  };

  // 保存设备配置
  const saveDevice = async () => {
    try {
      const metadata: Record<string, unknown> = {
        connectionType: formData.connectionType,
        alarmThreshold: {},
      };

      if (formData.connectionType === 'yak300') {
        metadata.yak300Config = {
          host: formData.yak300_host,
          port: parseInt(formData.yak300_port),
          unitId: parseInt(formData.yak300_unitId),
          timeout: parseInt(formData.yak300_timeout),
        };
        metadata.model = 'YA-K300-S';
        metadata.connectionType = 'yak300';
      } else if (formData.connectionType === 'yak300_rtu') {
        metadata.yak300RtuConfig = {
          path: formData.yak300_rtu_path,
          baudRate: parseInt(formData.yak300_rtu_baudRate),
          dataBits: parseInt(formData.yak300_rtu_dataBits),
          stopBits: parseInt(formData.yak300_rtu_stopBits),
          parity: formData.yak300_rtu_parity,
          unitId: parseInt(formData.yak300_rtu_unitId),
          timeout: parseInt(formData.yak300_rtu_timeout),
        };
        metadata.model = 'YA-K300-S';
        metadata.connectionType = 'yak300_rtu';
      } else if (formData.connectionType === 'yak300_http485') {
        metadata.yak300HttpConfig = {
          apiUrl: formData.yak300_http_apiUrl,
          timeout: parseInt(formData.yak300_http_timeout),
          unitId: parseInt(formData.yak300_http_unitId),
        };
        metadata.model = 'YA-K300-S';
        metadata.connectionType = 'yak300_http485';
      } else if (formData.connectionType === 'yak300_4g') {
        metadata.yak3004GConfig = {
          guid: formData.yak300_4g_guid,
          deviceType: formData.yak300_4g_deviceType,
          apiUrl: formData.yak300_4g_apiUrl || undefined,
          apiKey: formData.yak300_4g_apiKey || undefined,
          pollInterval: parseInt(formData.yak300_4g_pollInterval),
          timeout: parseInt(formData.yak300_4g_timeout),
        };
        metadata.model = 'YA-K300-S-4G';
        metadata.connectionType = 'yak300_4g';
      } else if (formData.connectionType === 'yak300_cloud') {
        metadata.yak300CloudConfig = {
          apiUrl: formData.yak300_cloud_apiUrl || 'https://api.yaoan-cloud.com/yaoanweb',
          username: formData.yak300_cloud_username,
          password: formData.yak300_cloud_password,
          userId: formData.yak300_cloud_userId,
          deviceName: formData.yak300_cloud_deviceName || undefined,
          pollInterval: parseInt(formData.yak300_cloud_pollInterval),
          timeout: parseInt(formData.yak300_cloud_timeout),
        };
        metadata.model = 'YA-K300-Cloud';
        metadata.connectionType = 'yak300_cloud';
      } else if (formData.connectionType === 'gst_fire') {
        metadata.gstConfig = {
          host: formData.gst_host,
          port: parseInt(formData.gst_port),
          unitId: parseInt(formData.gst_unitId),
          timeout: parseInt(formData.gst_timeout),
          model: formData.gst_model,
        };
        metadata.model = formData.gst_model;
        metadata.connectionType = 'gst_fire';
      } else if (formData.connectionType === 'modbus_tcp') {
        metadata.modbusConfig = {
          host: formData.modbus_host,
          port: parseInt(formData.modbus_port),
          unitId: parseInt(formData.modbus_unitId),
          timeout: parseInt(formData.modbus_timeout),
        };
      }

      // 根据设备类型添加阈值（包含云平台连接类型）
      if (formData.device_type === 'gas_detector' || formData.device_type === 'yak300_gas' || formData.device_type === 'yak300_rtu' || ['yak300_4g', 'yak300_cloud', 'yak300_http485'].includes(formData.connectionType)) {
        (metadata.alarmThreshold as Record<string, number>).gas = parseInt(formData.alarmThreshold_gas);
      } else if (formData.device_type === 'temperature_detector') {
        (metadata.alarmThreshold as Record<string, number>).temperature = parseInt(formData.alarmThreshold_temperature);
      } else if (formData.device_type === 'smoke_detector') {
        (metadata.alarmThreshold as Record<string, number>).smoke = parseInt(formData.alarmThreshold_smoke);
      }

      const deviceData = {
        device_name: formData.device_name,
        device_code: formData.device_code,
        device_type: formData.device_type,
        customer_id: currentCustomerId,
        metadata,
        is_active: formData.is_active,
      };

      if (modalMode === 'add') {
        const response = await fetch('/api/devices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deviceData),
        });
        
        if (!response.ok) {
          const error = await response.json();
          alert(error.error || '创建设备失败');
          return;
        }
      } else if (editingDevice) {
        await fetch('/api/devices/connection', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: editingDevice.id,
            ...deviceData,
          }),
        });
      }

      setShowModal(false);
      
      // 重新加载设备管理器中的设备列表
      try {
        await fetch('/api/devices/reload', { method: 'POST' });
      } catch (e) {
        console.error('Failed to reload device manager:', e);
      }
      
      // 重新加载前端设备列表
      loadDevices();
    } catch (error) {
      console.error('Failed to save device:', error);
    }
  };

  // 统计
  const stats = {
    total: devices.length,
    modbus: devices.filter(d => d.connectionType === 'modbus_tcp').length,
    yak300: devices.filter(d => d.connectionType === 'yak300').length,
    gst: devices.filter(d => d.connectionType === 'gst_fire').length,
    mock: devices.filter(d => d.connectionType === 'mock').length,
    active: devices.filter(d => d.is_active).length,
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#E5E5E5]">设备接入配置</h1>
            <p className="text-[#A0A0A0] text-sm mt-1">配置真实 Modbus TCP 设备连接和报警阈值</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加设备
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#0078D4]/10">
                <Monitor className="w-5 h-5 text-[#0078D4]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">设备总数</p>
                <p className="text-2xl font-bold text-[#E5E5E5]">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#0078D4]/10">
                <Wind className="w-5 h-5 text-[#0078D4]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">瑶安设备</p>
                <p className="text-2xl font-bold text-[#0078D4]">{stats.yak300}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#D32F2F]/10">
                <Bell className="w-5 h-5 text-[#D32F2F]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">海湾 GST</p>
                <p className="text-2xl font-bold text-[#D32F2F]">{stats.gst}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#4CAF50]/10">
                <Server className="w-5 h-5 text-[#4CAF50]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">其他 Modbus</p>
                <p className="text-2xl font-bold text-[#4CAF50]">{stats.modbus}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-[#FF9800]/10">
                <Activity className="w-5 h-5 text-[#FF9800]" />
              </div>
              <div>
                <p className="text-[#A0A0A0] text-sm">已启用</p>
                <p className="text-2xl font-bold text-[#FF9800]">{stats.active}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
          <h3 className="text-[#E5E5E5] font-semibold mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#0078D4]" />
            设备接入说明
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm text-[#A0A0A0]">
            <div className="bg-[#222222] rounded-lg p-3">
              <p className="font-medium text-[#0078D4] mb-2">瑶安 YA-K300-S</p>
              <ul className="space-y-1 text-xs">
                <li>• 气体浓度：0-100%LEL</li>
                <li>• 通信：Modbus TCP</li>
                <li>• 端口：502</li>
                <li>• 响应：≤10秒</li>
              </ul>
            </div>
            <div className="bg-[#222222] rounded-lg p-3">
              <p className="font-medium text-[#D32F2F] mb-2">海湾 GST 火灾报警</p>
              <ul className="space-y-1 text-xs">
                <li>• 型号：JB-QG-GST5000等</li>
                <li>• 容量：≤2900点</li>
                <li>• 通信：Modbus TCP</li>
                <li>• 响应：≤10秒</li>
              </ul>
            </div>
            <div className="bg-[#222222] rounded-lg p-3">
              <p className="font-medium text-[#4CAF50] mb-2">通用 Modbus TCP</p>
              <ul className="space-y-1 text-xs">
                <li>• 自定义寄存器映射</li>
                <li>• 端口：502</li>
                <li>• 从机地址：1-255</li>
                <li>• 超时可配置</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 设备列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#0078D4] animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => {
              const typeConfig = deviceTypes[device.device_type as keyof typeof deviceTypes];
              const Icon = typeConfig?.icon || Monitor;
              const isExpanded = expandedDevice === device.id;

              return (
                <div
                  key={device.id}
                  className="bg-[#1E1E1E] rounded-lg border border-[#2D2D2D] overflow-hidden"
                >
                  {/* 设备基本信息 */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[#2A2A2A] transition-colors"
                    onClick={() => setExpandedDevice(isExpanded ? null : device.id)}
                  >
                    <div className={cn('p-2 rounded-lg', typeConfig?.bg || 'bg-[#6C6C6C]/10')}>
                      <Icon className={cn('w-5 h-5', typeConfig?.color || 'text-[#6C6C6C]')} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[#E5E5E5] font-medium">{device.device_name}</span>
                        <span className="px-2 py-0.5 rounded text-xs bg-[#2D2D2D] text-[#6C6C6C] font-mono">
                          {device.device_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-[#6C6C6C]">
                        <span>{typeConfig?.name || device.device_type}</span>
                        <span className={cn(
                          'px-2 py-0.5 rounded',
                          device.connectionType === 'modbus_tcp' || device.connectionType === 'yak300' || device.connectionType === 'yak300_rtu' || device.connectionType === 'gst_fire'
                            ? 'bg-[#4CAF50]/10 text-[#4CAF50]'
                            : 'bg-[#FF9800]/10 text-[#FF9800]'
                        )}>
                          {device.connectionType === 'modbus_tcp' ? 'Modbus TCP' : 
                           device.connectionType === 'yak300' ? '瑶安 YA-K300-S (TCP)' : 
                           device.connectionType === 'yak300_rtu' ? '瑶安 YA-K300-S (RS485)' : 
                           device.connectionType === 'gst_fire' ? '海湾 GST' : '模拟'}
                        </span>
                        {device.is_active ? (
                          <span className="flex items-center gap-1 text-[#4CAF50]">
                            <CheckCircle2 className="w-3 h-3" /> 已启用
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[#6C6C6C]">
                            <XCircle className="w-3 h-3" /> 已停用
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {device.connectionType === 'modbus_tcp' && device.modbusConfig && (
                        <div className="text-right text-xs">
                          <p className="text-[#E5E5E5] font-mono">
                            {device.modbusConfig.host}:{device.modbusConfig.port}
                          </p>
                          <p className="text-[#6C6C6C]">从机 #{device.modbusConfig.unitId}</p>
                        </div>
                      )}
                      {device.status === 'online' ? (
                        <Wifi className="w-5 h-5 text-[#4CAF50]" />
                      ) : device.status === 'offline' ? (
                        <WifiOff className="w-5 h-5 text-[#6C6C6C]" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-[#D32F2F]" />
                      )}
                      {/* 验收按钮 */}
                      <button
                        onClick={(e) => { e.stopPropagation(); openAcceptanceModal(device); }}
                        className="p-2 rounded-lg hover:bg-[#4CAF50]/20 text-[#4CAF50] transition-colors"
                        title="设备验收"
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(device); }}
                        className="p-2 rounded-lg hover:bg-[#3A3A3A] text-[#A0A0A0] hover:text-[#E5E5E5] transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-[#6C6C6C]" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-[#6C6C6C]" />
                      )}
                    </div>
                  </div>

                  {/* 展开详情 */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-[#2D2D2D] pt-4">
                      <div className="grid grid-cols-3 gap-4">
                        {/* 报警阈值 */}
                        <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                          <h4 className="text-[#E5E5E5] font-medium mb-3">报警阈值</h4>
                          {device.alarmThreshold ? (
                            <div className="space-y-2 text-sm">
                              {device.alarmThreshold.gas !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-[#6C6C6C]">气体浓度</span>
                                  <span className="text-[#E5E5E5]">{device.alarmThreshold.gas} %LEL</span>
                                </div>
                              )}
                              {device.alarmThreshold.temperature !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-[#6C6C6C]">温度</span>
                                  <span className="text-[#E5E5E5]">{device.alarmThreshold.temperature}°C</span>
                                </div>
                              )}
                              {device.alarmThreshold.smoke !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-[#6C6C6C]">烟雾等级</span>
                                  <span className="text-[#E5E5E5]">{device.alarmThreshold.smoke}%</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-[#6C6C6C] text-sm">未配置</p>
                          )}
                        </div>

                        {/* 连接状态 */}
                        <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                          <h4 className="text-[#E5E5E5] font-medium mb-3">连接信息</h4>
                          {device.connectionType === 'yak300' && device.yak300Config ? (
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-[#6C6C6C]">协议</span>
                                <span className="text-[#0078D4]">瑶安 YA-K300-S (TCP)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#6C6C6C]">IP地址</span>
                                <span className="text-[#E5E5E5] font-mono">{device.yak300Config.host}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#6C6C6C]">端口</span>
                                <span className="text-[#E5E5E5]">{device.yak300Config.port}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#6C6C6C]">从机地址</span>
                                <span className="text-[#E5E5E5]">#{device.yak300Config.unitId}</span>
                              </div>
                            </div>
                          ) : device.connectionType === 'yak300_rtu' && device.yak300RtuConfig ? (
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-[#6C6C6C]">协议</span>
                                <span className="text-[#0078D4]">瑶安 YA-K300-S (RS485)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#6C6C6C]">串口路径</span>
                                <span className="text-[#E5E5E5] font-mono">{device.yak300RtuConfig.path}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#6C6C6C]">波特率</span>
                                <span className="text-[#E5E5E5]">{device.yak300RtuConfig.baudRate}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#6C6C6C]">数据位/停止位</span>
                                <span className="text-[#E5E5E5]">{device.yak300RtuConfig.dataBits}/{device.yak300RtuConfig.stopBits}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#6C6C6C]">校验位</span>
                                <span className="text-[#E5E5E5]">{device.yak300RtuConfig.parity === 'none' ? '无' : device.yak300RtuConfig.parity === 'even' ? '偶校验' : '奇校验'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#6C6C6C]">从机地址</span>
                                <span className="text-[#E5E5E5]">#{device.yak300RtuConfig.unitId}</span>
                              </div>
                            </div>
                          ) : device.connectionType === 'gst_fire' && device.gstConfig ? (
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-[#6C6C6C]">协议</span>
                                <span className="text-[#D32F2F]">海湾 GST</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#6C6C6C]">型号</span>
                                <span className="text-[#E5E5E5]">{device.gstConfig.model || '通用'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#6C6C6C]">IP地址</span>
                                <span className="text-[#E5E5E5] font-mono">{device.gstConfig.host}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#6C6C6C]">端口</span>
                                <span className="text-[#E5E5E5]">{device.gstConfig.port}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#6C6C6C]">从机地址</span>
                                <span className="text-[#E5E5E5]">#{device.gstConfig.unitId}</span>
                              </div>
                            </div>
                          ) : device.connectionType === 'modbus_tcp' && device.modbusConfig ? (
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-[#6C6C6C]">协议</span>
                                <span className="text-[#4CAF50]">Modbus TCP</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#6C6C6C]">IP地址</span>
                                <span className="text-[#E5E5E5] font-mono">{device.modbusConfig.host}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#6C6C6C]">端口</span>
                                <span className="text-[#E5E5E5]">{device.modbusConfig.port}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#6C6C6C]">从机地址</span>
                                <span className="text-[#E5E5E5]">#{device.modbusConfig.unitId}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[#6C6C6C] text-sm">模拟设备</p>
                          )}
                        </div>

                        {/* 当前状态 */}
                        <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                          <h4 className="text-[#E5E5E5] font-medium mb-3">设备状态</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-[#6C6C6C]">在线状态</span>
                              <span className={cn(
                                device.status === 'online' ? 'text-[#4CAF50]' :
                                device.status === 'fault' ? 'text-[#D32F2F]' : 'text-[#6C6C6C]'
                              )}>
                                {device.status === 'online' ? '在线' :
                                 device.status === 'fault' ? '故障' : '离线'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#6C6C6C]">启用状态</span>
                              <span className={device.is_active ? 'text-[#4CAF50]' : 'text-[#6C6C6C]'}>
                                {device.is_active ? '已启用' : '已停用'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 添加/编辑设备弹窗 */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[600px] max-h-[90vh] overflow-auto border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-[#2D2D2D]">
                <h2 className="text-lg font-bold text-[#E5E5E5]">
                  {modalMode === 'add' ? '添加设备' : '编辑设备配置'}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* 基本信息 */}
                <div>
                  <h3 className="text-[#E5E5E5] font-medium mb-4">基本信息</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#A0A0A0] text-sm mb-2">
                        设备名称 <span className="text-[#D32F2F]">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.device_name}
                        onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                        className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                        placeholder="例如：可燃气体探测器A1"
                      />
                    </div>
                    <div>
                      <label className="block text-[#A0A0A0] text-sm mb-2">
                        设备编号 <span className="text-[#D32F2F]">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.device_code}
                        onChange={(e) => setFormData({ ...formData, device_code: e.target.value })}
                        className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                        placeholder="例如：GAS-001"
                      />
                    </div>
                    <div>
                      <label className="block text-[#A0A0A0] text-sm mb-2">设备类型</label>
                      <select
                        value={formData.device_type}
                        onChange={(e) => setFormData({ ...formData, device_type: e.target.value as keyof typeof deviceTypes })}
                        className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                      >
                        {Object.entries(deviceTypes).map(([key, config]) => (
                          <option key={key} value={key}>{config.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#A0A0A0] text-sm mb-2">连接类型</label>
                      <select
                        value={formData.connectionType}
                        onChange={(e) => {
                          const newType = e.target.value as 'mock' | 'modbus_tcp' | 'yak300' | 'yak300_rtu' | 'yak300_http485' | 'yak300_4g' | 'gst_fire';
                          // 如果切换到特定类型，自动设置设备类型
                          const newDeviceType = newType === 'yak300_rtu' ? 'yak300_rtu' : 
                            newType === 'yak300_http485' ? 'yak300_gas' : 
                            newType === 'yak300_4g' ? 'yak300_4g' : 
                            newType === 'yak300' ? 'yak300_gas' : 
                            formData.device_type;
                          setFormData({ ...formData, connectionType: newType, device_type: newDeviceType as keyof typeof deviceTypes });
                        }}
                        className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                      >
                        {connectionTypes.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#A0A0A0] text-sm mb-2">设备类型</label>
                      <select
                        value={formData.device_type}
                        onChange={(e) => setFormData({ ...formData, device_type: e.target.value as keyof typeof deviceTypes })}
                        className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                      >
                        {Object.entries(deviceTypes).map(([key, type]) => (
                          <option key={key} value={key}>{type.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* YA-K300-S 专用配置 */}
                {formData.connectionType === 'yak300' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[#E5E5E5] font-medium">瑶安 YA-K300-S 连接配置</h3>
                      <button
                        onClick={testModbusConnection}
                        disabled={testingConnection || !formData.yak300_host}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#4CAF50] rounded-lg text-white text-sm hover:bg-[#388E3C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {testingConnection ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plug className="w-4 h-4" />
                        )}
                        测试连接
                      </button>
                    </div>

                    {testResult && (
                      <div className={cn(
                        'mb-4 p-3 rounded-lg text-sm',
                        testResult.success
                          ? 'bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/30'
                          : 'bg-[#D32F2F]/10 text-[#D32F2F] border border-[#D32F2F]/30'
                      )}>
                        {testResult.success ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {testResult.message}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            {testResult.message}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A] mb-4">
                      <p className="text-[#A0A0A0] text-sm mb-3">
                        <span className="text-[#FF9800] font-medium">YA-K300-S 规格：</span>
                        可燃气体探测器，支持 Modbus TCP 协议
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-xs text-[#6C6C6C]">
                        <div>浓度范围：0-100%LEL</div>
                        <div>报警输出：低报/高报</div>
                        <div>通讯协议：Modbus TCP</div>
                        <div>工作温度：-40°C ~ 70°C</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">设备IP</label>
                        <input
                          type="text"
                          value={formData.yak300_host}
                          onChange={(e) => setFormData({ ...formData, yak300_host: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="192.168.1.100"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">端口</label>
                        <input
                          type="number"
                          value={formData.yak300_port}
                          onChange={(e) => setFormData({ ...formData, yak300_port: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="502"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">从机地址 (Unit ID)</label>
                        <input
                          type="number"
                          value={formData.yak300_unitId}
                          onChange={(e) => setFormData({ ...formData, yak300_unitId: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="1"
                          min="1"
                          max="255"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">超时 (ms)</label>
                        <input
                          type="number"
                          value={formData.yak300_timeout}
                          onChange={(e) => setFormData({ ...formData, yak300_timeout: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="5000"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* YA-K300-S RTU 串口配置 */}
                {formData.connectionType === 'yak300_rtu' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[#E5E5E5] font-medium">瑶安 YA-K300-S RS485 串口配置</h3>
                      <button
                        onClick={testModbusConnection}
                        disabled={testingConnection}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#4CAF50] rounded-lg text-white text-sm hover:bg-[#388E3C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {testingConnection ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plug className="w-4 h-4" />
                        )}
                        测试连接
                      </button>
                    </div>

                    {testResult && (
                      <div className={cn(
                        'mb-4 p-3 rounded-lg text-sm',
                        testResult.success
                          ? 'bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/30'
                          : 'bg-[#D32F2F]/10 text-[#D32F2F] border border-[#D32F2F]/30'
                      )}>
                        {testResult.success ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {testResult.message}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            {testResult.message}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A] mb-4">
                      <p className="text-[#A0A0A0] text-sm mb-3">
                        <span className="text-[#FF9800] font-medium">YA-K300-S RS485 规格：</span>
                        可燃气体探测器，支持 Modbus RTU 协议 (RS485接口)
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-xs text-[#6C6C6C]">
                        <div>浓度范围：0-100%LEL</div>
                        <div>报警输出：低报/高报</div>
                        <div>通讯协议：Modbus RTU</div>
                        <div>工作温度：-40°C ~ 70°C</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">串口路径</label>
                        <input
                          type="text"
                          value={formData.yak300_rtu_path}
                          onChange={(e) => setFormData({ ...formData, yak300_rtu_path: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="COM3 或 /dev/ttyUSB0"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">波特率</label>
                        <select
                          value={formData.yak300_rtu_baudRate}
                          onChange={(e) => setFormData({ ...formData, yak300_rtu_baudRate: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                        >
                          <option value="4800">4800</option>
                          <option value="9600">9600</option>
                          <option value="19200">19200</option>
                          <option value="38400">38400</option>
                          <option value="57600">57600</option>
                          <option value="115200">115200</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">数据位</label>
                        <select
                          value={formData.yak300_rtu_dataBits}
                          onChange={(e) => setFormData({ ...formData, yak300_rtu_dataBits: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                        >
                          <option value="7">7</option>
                          <option value="8">8</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">停止位</label>
                        <select
                          value={formData.yak300_rtu_stopBits}
                          onChange={(e) => setFormData({ ...formData, yak300_rtu_stopBits: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                        >
                          <option value="1">1</option>
                          <option value="2">2</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">校验位</label>
                        <select
                          value={formData.yak300_rtu_parity}
                          onChange={(e) => setFormData({ ...formData, yak300_rtu_parity: e.target.value as 'none' | 'even' | 'odd' })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                        >
                          <option value="none">无 (None)</option>
                          <option value="even">偶校验 (Even)</option>
                          <option value="odd">奇校验 (Odd)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">从机地址 (Unit ID)</label>
                        <input
                          type="number"
                          value={formData.yak300_rtu_unitId}
                          onChange={(e) => setFormData({ ...formData, yak300_rtu_unitId: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="1"
                          min="1"
                          max="255"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">超时 (ms)</label>
                        <input
                          type="number"
                          value={formData.yak300_rtu_timeout}
                          onChange={(e) => setFormData({ ...formData, yak300_rtu_timeout: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="5000"
                        />
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-[#0078D4]/10 rounded-lg border border-[#0078D4]/30">
                      <p className="text-[#0078D4] text-sm">
                        <span className="font-medium">连接说明：</span>
                        RS485转USB连接，使用您的配置：波特率9600，8数据位，1停止位，无校验，地址1
                      </p>
                      <p className="text-[#0078D4] text-sm mt-2">
                        <span className="font-medium">驱动程序：</span>
                        <a 
                          href="/drivers/CH341SER.EXE" 
                          download="CH341SER.EXE"
                          className="underline hover:text-[#FF9800] ml-1"
                        >
                          下载 CH341 串口驱动 (CH341SER.EXE)
                        </a>
                        <span className="text-[#6C6C6C] text-xs ml-2">（RS485转USB接口驱动）</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* YA-K300-S HTTP轮询RS485配置 */}
                {formData.connectionType === 'yak300_http485' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[#E5E5E5] font-medium">瑶安 YA-K300-S HTTP轮询RS485配置</h3>
                      <button
                        onClick={testModbusConnection}
                        disabled={testingConnection}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#4CAF50] rounded-lg text-white text-sm hover:bg-[#388E3C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {testingConnection ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plug className="w-4 h-4" />
                        )}
                        测试连接
                      </button>
                    </div>

                    {testResult && (
                      <div className={cn(
                        'mb-4 p-3 rounded-lg text-sm',
                        testResult.success
                          ? 'bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/30'
                          : 'bg-[#D32F2F]/10 text-[#D32F2F] border border-[#D32F2F]/30'
                      )}>
                        {testResult.success ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {testResult.message}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            {testResult.message}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A] mb-4">
                      <p className="text-[#A0A0A0] text-sm mb-3">
                        <span className="text-[#FF9800] font-medium">YA-K300-S HTTP轮询RS485规格：</span>
                        RS485设备通过HTTP API轮询获取Modbus RTU数据
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[#A0A0A0] text-sm mb-2">HTTP API 地址 <span className="text-[#D32F2F]">*</span></label>
                          <input
                            type="text"
                            value={formData.yak300_http_apiUrl}
                            onChange={(e) => setFormData({ ...formData, yak300_http_apiUrl: e.target.value })}
                            className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                            placeholder="http://192.168.1.100:8080/api/rtu"
                          />
                        </div>
                        <div>
                          <label className="block text-[#A0A0A0] text-sm mb-2">从机地址 (Unit ID)</label>
                          <input
                            type="number"
                            value={formData.yak300_http_unitId}
                            onChange={(e) => setFormData({ ...formData, yak300_http_unitId: e.target.value })}
                            className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                            placeholder="1"
                            min="1"
                            max="255"
                          />
                        </div>
                        <div>
                          <label className="block text-[#A0A0A0] text-sm mb-2">超时 (ms)</label>
                          <input
                            type="number"
                            value={formData.yak300_http_timeout}
                            onChange={(e) => setFormData({ ...formData, yak300_http_timeout: e.target.value })}
                            className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                            placeholder="10000"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-[#0078D4]/10 rounded-lg border border-[#0078D4]/30">
                      <p className="text-[#0078D4] text-sm">
                        <span className="font-medium">连接说明：</span>
                        通过HTTP API轮询方式获取RS485设备的Modbus RTU数据，设备需支持HTTP API接口
                      </p>
                    </div>
                  </div>
                )}

                {/* YA-K300-S 4G模块配置 */}
                {formData.connectionType === 'yak300_4g' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[#E5E5E5] font-medium">瑶安 YA-K300-S 4G模块配置</h3>
                      <button
                        onClick={testModbusConnection}
                        disabled={testingConnection}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#4CAF50] rounded-lg text-white text-sm hover:bg-[#388E3C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {testingConnection ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plug className="w-4 h-4" />
                        )}
                        测试连接
                      </button>
                    </div>

                    {testResult && (
                      <div className={cn(
                        'mb-4 p-3 rounded-lg text-sm',
                        testResult.success
                          ? 'bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/30'
                          : 'bg-[#D32F2F]/10 text-[#D32F2F] border border-[#D32F2F]/30'
                      )}>
                        {testResult.success ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {testResult.message}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            {testResult.message}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A] mb-4">
                      <p className="text-[#A0A0A0] text-sm mb-3">
                        <span className="text-[#FF9800] font-medium">YA-K300-S 4G模块规格：</span>
                        支持4G网络连接的智能气体探测器，设备通过4G模块接入云平台
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-xs text-[#6C6C6C]">
                        <div>浓度范围：0-100%LEL</div>
                        <div>通信方式：4G 网络</div>
                        <div>报警输出：低报/高报</div>
                        <div>信号强度：显示4G信号</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">设备GUID</label>
                        <input
                          type="text"
                          value={formData.yak300_4g_guid}
                          onChange={(e) => setFormData({ ...formData, yak300_4g_guid: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="D2D19D04AF5E433E9C4BFCC4"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">设备类型</label>
                        <select
                          value={formData.yak300_4g_deviceType}
                          onChange={(e) => setFormData({ ...formData, yak300_4g_deviceType: e.target.value as 'gas' | 'temperature' | 'smoke' | 'multi' })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                        >
                          <option value="gas">可燃气体探测器</option>
                          <option value="temperature">温度探测器</option>
                          <option value="smoke">烟感探测器</option>
                          <option value="multi">多功能探测器</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">API服务器地址 (可选)</label>
                        <input
                          type="text"
                          value={formData.yak300_4g_apiUrl}
                          onChange={(e) => setFormData({ ...formData, yak300_4g_apiUrl: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="https://api.example.com (留空使用模拟)"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">API密钥 (可选)</label>
                        <input
                          type="password"
                          value={formData.yak300_4g_apiKey}
                          onChange={(e) => setFormData({ ...formData, yak300_4g_apiKey: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="API密钥"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">轮询间隔 (ms)</label>
                        <input
                          type="number"
                          value={formData.yak300_4g_pollInterval}
                          onChange={(e) => setFormData({ ...formData, yak300_4g_pollInterval: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="30000"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">超时 (ms)</label>
                        <input
                          type="number"
                          value={formData.yak300_4g_timeout}
                          onChange={(e) => setFormData({ ...formData, yak300_4g_timeout: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="10000"
                        />
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-[#0078D4]/10 rounded-lg border border-[#0078D4]/30">
                      <p className="text-[#0078D4] text-sm">
                        <span className="font-medium">连接说明：</span>
                        输入4G模块的设备GUID即可测试连接。如需连接瑶安云平台，请填写API服务器地址和密钥。
                      </p>
                    </div>
                  </div>
                )}

                {/* 瑶安云平台配置 */}
                {formData.connectionType === 'yak300_cloud' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[#E5E5E5] font-medium">瑶安云平台配置</h3>
                      <button
                        onClick={testModbusConnection}
                        disabled={testingConnection}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#4CAF50] rounded-lg text-white text-sm hover:bg-[#388E3C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {testingConnection ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plug className="w-4 h-4" />
                        )}
                        测试连接
                      </button>
                    </div>

                    {testResult && (
                      <div className={cn(
                        'mb-4 p-3 rounded-lg text-sm whitespace-pre-wrap',
                        testResult.success
                          ? 'bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/30'
                          : 'bg-[#D32F2F]/10 text-[#D32F2F] border border-[#D32F2F]/30'
                      )}>
                        {testResult.success ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span>{testResult.message}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{testResult.message}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A] mb-4">
                      <p className="text-[#A0A0A0] text-sm mb-3">
                        <span className="text-[#FF9800] font-medium">瑶安云平台规格：</span>
                        通过瑶安云平台 API 获取设备实时数据和报警信息
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-xs text-[#6C6C6C]">
                        <div>API地址: https://api.yaoan-cloud.com/yaoanweb</div>
                        <div>认证方式: 用户名 + 密码</div>
                        <div>数据获取: 实时数据 / 报警历史</div>
                        <div>轮询方式: HTTP API</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-[#A0A0A0] text-sm mb-2">API服务器地址</label>
                        <input
                          type="text"
                          value={formData.yak300_cloud_apiUrl}
                          onChange={(e) => setFormData({ ...formData, yak300_cloud_apiUrl: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="https://api.yaoan-cloud.com/yaoanweb"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">用户名</label>
                        <input
                          type="text"
                          value={formData.yak300_cloud_username}
                          onChange={(e) => setFormData({ ...formData, yak300_cloud_username: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="瑶安云平台用户名"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">密码</label>
                        <input
                          type="password"
                          value={formData.yak300_cloud_password}
                          onChange={(e) => setFormData({ ...formData, yak300_cloud_password: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="瑶安云平台密码"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">用户ID</label>
                        <input
                          type="text"
                          value={formData.yak300_cloud_userId}
                          onChange={(e) => setFormData({ ...formData, yak300_cloud_userId: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="用户ID (如 8054)"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">设备名称</label>
                        <input
                          type="text"
                          value={formData.yak300_cloud_deviceName || ''}
                          onChange={(e) => setFormData({ ...formData, yak300_cloud_deviceName: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="云平台上的设备名称 (如 YA-K300-S)"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">轮询间隔 (ms)</label>
                        <input
                          type="number"
                          value={formData.yak300_cloud_pollInterval}
                          onChange={(e) => setFormData({ ...formData, yak300_cloud_pollInterval: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="30000"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[#A0A0A0] text-sm mb-2">超时 (ms)</label>
                        <input
                          type="number"
                          value={formData.yak300_cloud_timeout}
                          onChange={(e) => setFormData({ ...formData, yak300_cloud_timeout: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="10000"
                        />
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-[#0078D4]/10 rounded-lg border border-[#0078D4]/30">
                      <p className="text-[#0078D4] text-sm">
                        <span className="font-medium">连接说明：</span>
                        请填写瑶安云平台的登录信息。认证成功后可获取设备列表和实时数据。用户名和密码请联系瑶安技术支持获取。
                      </p>
                    </div>
                  </div>
                )}

                {/* 通用 Modbus TCP 配置 */}
                {formData.connectionType === 'modbus_tcp' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[#E5E5E5] font-medium">Modbus TCP 连接配置</h3>
                      <button
                        onClick={testModbusConnection}
                        disabled={testingConnection || !formData.modbus_host}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#4CAF50] rounded-lg text-white text-sm hover:bg-[#388E3C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {testingConnection ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plug className="w-4 h-4" />
                        )}
                        测试连接
                      </button>
                    </div>

                    {testResult && (
                      <div className={cn(
                        'mb-4 p-3 rounded-lg text-sm',
                        testResult.success
                          ? 'bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/30'
                          : 'bg-[#D32F2F]/10 text-[#D32F2F] border border-[#D32F2F]/30'
                      )}>
                        {testResult.success ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {testResult.message}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            {testResult.message}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">设备IP</label>
                        <input
                          type="text"
                          value={formData.modbus_host}
                          onChange={(e) => setFormData({ ...formData, modbus_host: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="192.168.1.100"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">端口</label>
                        <input
                          type="number"
                          value={formData.modbus_port}
                          onChange={(e) => setFormData({ ...formData, modbus_port: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="502"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">从机地址 (Unit ID)</label>
                        <input
                          type="number"
                          value={formData.modbus_unitId}
                          onChange={(e) => setFormData({ ...formData, modbus_unitId: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="1"
                          min="1"
                          max="255"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">超时 (ms)</label>
                        <input
                          type="number"
                          value={formData.modbus_timeout}
                          onChange={(e) => setFormData({ ...formData, modbus_timeout: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="5000"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 海湾 GST 火灾报警控制器配置 */}
                {formData.connectionType === 'gst_fire' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[#E5E5E5] font-medium">海湾 GST 火灾报警控制器</h3>
                      <button
                        onClick={testModbusConnection}
                        disabled={testingConnection || !formData.gst_host}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#4CAF50] rounded-lg text-white text-sm hover:bg-[#388E3C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {testingConnection ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plug className="w-4 h-4" />
                        )}
                        测试连接
                      </button>
                    </div>

                    {testResult && (
                      <div className={cn(
                        'mb-4 p-3 rounded-lg text-sm',
                        testResult.success
                          ? 'bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/30'
                          : 'bg-[#D32F2F]/10 text-[#D32F2F] border border-[#D32F2F]/30'
                      )}>
                        {testResult.success ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {testResult.message}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            {testResult.message}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A] mb-4">
                      <p className="text-[#A0A0A0] text-sm mb-3">
                        <span className="text-[#D32F2F] font-medium">海湾 GST 火灾报警控制器规格：</span>
                        支持 JB-QB-GST200、JB-QG-GST5000、JB-M-GST100 等型号
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-xs text-[#6C6C6C]">
                        <div>系统容量：≤2900点</div>
                        <div>回路数量：≤242点/回路</div>
                        <div>通讯协议：Modbus TCP</div>
                        <div>响应时间：≤10秒</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="col-span-2">
                        <label className="block text-[#A0A0A0] text-sm mb-2">设备型号</label>
                        <select
                          value={formData.gst_model}
                          onChange={(e) => setFormData({ ...formData, gst_model: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                        >
                          {gstModels.map((model) => (
                            <option key={model.value} value={model.value}>{model.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">设备IP</label>
                        <input
                          type="text"
                          value={formData.gst_host}
                          onChange={(e) => setFormData({ ...formData, gst_host: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="192.168.1.100"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">端口</label>
                        <input
                          type="number"
                          value={formData.gst_port}
                          onChange={(e) => setFormData({ ...formData, gst_port: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="502"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">从机地址 (Unit ID)</label>
                        <input
                          type="number"
                          value={formData.gst_unitId}
                          onChange={(e) => setFormData({ ...formData, gst_unitId: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="1"
                          min="1"
                          max="255"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">超时 (ms)</label>
                        <input
                          type="number"
                          value={formData.gst_timeout}
                          onChange={(e) => setFormData({ ...formData, gst_timeout: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder="5000"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 报警阈值 */}
                <div>
                  <h3 className="text-[#E5E5E5] font-medium mb-4">报警阈值</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {(formData.device_type === 'gas_detector' || formData.device_type === 'yak300_gas' || formData.device_type === 'yak300_rtu') && (
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">
                          报警浓度 ({(formData.device_type === 'yak300_gas' || formData.device_type === 'yak300_rtu') ? '%LEL' : 'PPM'})
                        </label>
                        <input
                          type="number"
                          value={formData.alarmThreshold_gas}
                          onChange={(e) => setFormData({ ...formData, alarmThreshold_gas: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          placeholder={formData.device_type === 'yak300_gas' ? '50' : '500'}
                        />
                        {formData.device_type === 'yak300_gas' && (
                          <p className="text-[#6C6C6C] text-xs mt-1">YA-K300-S 建议设置：25%LEL（低报）/ 50%LEL（高报）</p>
                        )}
                      </div>
                    )}
                    {formData.device_type === 'temperature_detector' && (
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">温度 (°C)</label>
                        <input
                          type="number"
                          value={formData.alarmThreshold_temperature}
                          onChange={(e) => setFormData({ ...formData, alarmThreshold_temperature: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                        />
                      </div>
                    )}
                    {formData.device_type === 'smoke_detector' && (
                      <div>
                        <label className="block text-[#A0A0A0] text-sm mb-2">烟雾等级 (%)</label>
                        <input
                          type="number"
                          value={formData.alarmThreshold_smoke}
                          onChange={(e) => setFormData({ ...formData, alarmThreshold_smoke: e.target.value })}
                          className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                        />
                      </div>
                    )}
                    {(formData.device_type === 'fire_alarm') && (
                      <>
                        <div>
                          <label className="block text-[#A0A0A0] text-sm mb-2">温度阈值 (°C)</label>
                          <input
                            type="number"
                            value={formData.alarmThreshold_temperature}
                            onChange={(e) => setFormData({ ...formData, alarmThreshold_temperature: e.target.value })}
                            className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          />
                        </div>
                        <div>
                          <label className="block text-[#A0A0A0] text-sm mb-2">烟雾阈值 (%)</label>
                          <input
                            type="number"
                            value={formData.alarmThreshold_smoke}
                            onChange={(e) => setFormData({ ...formData, alarmThreshold_smoke: e.target.value })}
                            className="w-full px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] focus:outline-none focus:border-[#0078D4]"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 启用状态 */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className="flex items-center gap-2"
                  >
                    {formData.is_active ? (
                      <ToggleRight className="w-10 h-6 text-[#4CAF50]" />
                    ) : (
                      <ToggleLeft className="w-10 h-6 text-[#6C6C6C]" />
                    )}
                    <span className="text-[#E5E5E5]">{formData.is_active ? '启用设备' : '停用设备'}</span>
                  </button>
                </div>
              </div>

              <div className="p-6 border-t border-[#2D2D2D] flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={saveDevice}
                  disabled={!formData.device_name || !formData.device_code}
                  className="px-4 py-2 bg-[#0078D4] rounded-lg text-white hover:bg-[#0056B3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  保存配置
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 设备验收弹窗 */}
        {showAcceptanceModal && acceptanceDevice && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => !isAcceptanceRunning && setShowAcceptanceModal(false)}>
            <div className="bg-[#1E1E1E] rounded-lg w-[700px] max-h-[85vh] overflow-auto border border-[#2D2D2D]" onClick={(e) => e.stopPropagation()}>
              {/* 弹窗头部 */}
              <div className="p-6 border-b border-[#2D2D2D] sticky top-0 bg-[#1E1E1E] z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-[#4CAF50]/20">
                      <ShieldCheck className="w-6 h-6 text-[#4CAF50]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#E5E5E5]">设备验收检测</h2>
                      <p className="text-[#6C6C6C] text-sm">{acceptanceDevice.device_name} ({acceptanceDevice.device_code})</p>
                    </div>
                  </div>
                  {!isAcceptanceRunning && (
                    <button
                      onClick={() => setShowAcceptanceModal(false)}
                      className="p-2 rounded-lg hover:bg-[#2A2A2A] text-[#6C6C6C] hover:text-[#E5E5E5] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {/* 设备信息 */}
                <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A] mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#6C6C6C] text-xs">设备类型</p>
                      <p className="text-[#E5E5E5]">{deviceTypes[acceptanceDevice.device_type as keyof typeof deviceTypes]?.name || acceptanceDevice.device_type}</p>
                    </div>
                    <div>
                      <p className="text-[#6C6C6C] text-xs">执行标准</p>
                      <p className="text-[#E5E5E5]">{nationalStandards[acceptanceDevice.device_type as keyof typeof nationalStandards]?.standard || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[#6C6C6C] text-xs">连接状态</p>
                      <p className={acceptanceDevice.status === 'online' ? 'text-[#4CAF50]' : 'text-[#D32F2F]'}>
                        {acceptanceDevice.status === 'online' ? '在线' : acceptanceDevice.status === 'offline' ? '离线' : '故障'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#6C6C6C] text-xs">启用状态</p>
                      <p className={acceptanceDevice.is_active ? 'text-[#4CAF50]' : 'text-[#6C6C6C]'}>
                        {acceptanceDevice.is_active ? '已启用' : '已停用'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 技术参数标准 */}
                {nationalStandards[acceptanceDevice.device_type as keyof typeof nationalStandards] && (
                  <div className="mb-6">
                    <h3 className="text-[#E5E5E5] font-medium mb-3 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-[#0078D4]" />
                      国家标准参数要求
                    </h3>
                    <div className="bg-[#222222] rounded-lg p-4 border border-[#3A3A3A]">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {Object.entries(nationalStandards[acceptanceDevice.device_type as keyof typeof nationalStandards].specs).map(([key, spec]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-[#6C6C6C]">{key}:</span>
                            <span className="text-[#E5E5E5]">{(spec as { standard: string }).standard}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 验收检查项 */}
                <div>
                  <h3 className="text-[#E5E5E5] font-medium mb-3 flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-[#0078D4]" />
                    验收检查项 {isAcceptanceRunning && <span className="text-[#FF9800] text-sm ml-2">检测中...</span>}
                  </h3>
                  <div className="space-y-2">
                    {/* 显示检查项 */}
                    {(acceptanceReport?.checkResults || nationalStandards[acceptanceDevice.device_type as keyof typeof nationalStandards]?.checkItems.map((item, idx) => ({
                      id: item.id,
                      name: item.name,
                      standard: item.standard,
                      status: isAcceptanceRunning ? (idx === currentCheckIndex ? 'pending' : (idx < currentCheckIndex ? 'pass' : 'pending')) : 'pending',
                    })) || []).map((check: CheckResult & { status: 'pass' | 'fail' | 'warning' | 'pending' }, index: number) => (
                      <div
                        key={check.id}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border transition-all',
                          check.status === 'pass' ? 'bg-[#4CAF50]/5 border-[#4CAF50]/30' :
                          check.status === 'fail' ? 'bg-[#D32F2F]/5 border-[#D32F2F]/30' :
                          check.status === 'warning' ? 'bg-[#FF9800]/5 border-[#FF9800]/30' :
                          index === currentCheckIndex ? 'bg-[#0078D4]/5 border-[#0078D4]/30 animate-pulse' :
                          'bg-[#222222] border-[#3A3A3A]'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {check.status === 'pass' ? (
                            <CheckCircle2 className="w-5 h-5 text-[#4CAF50]" />
                          ) : check.status === 'fail' ? (
                            <XCircle className="w-5 h-5 text-[#D32F2F]" />
                          ) : check.status === 'warning' ? (
                            <AlertTriangle className="w-5 h-5 text-[#FF9800]" />
                          ) : index === currentCheckIndex ? (
                            <Loader2 className="w-5 h-5 text-[#0078D4] animate-spin" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-[#6C6C6C]" />
                          )}
                          <div>
                            <p className="text-[#E5E5E5] text-sm font-medium">{check.name}</p>
                            <p className="text-[#6C6C6C] text-xs">标准: {check.standard}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            'text-sm font-medium',
                            check.status === 'pass' ? 'text-[#4CAF50]' :
                            check.status === 'fail' ? 'text-[#D32F2F]' :
                            check.status === 'warning' ? 'text-[#FF9800]' : 'text-[#6C6C6C]'
                          )}>
                            {check.status === 'pass' ? '通过' :
                             check.status === 'fail' ? '不通过' :
                             check.status === 'warning' ? '警告' :
                             index === currentCheckIndex ? '检测中...' : '待检测'}
                          </p>
                          {'actualValue' in check && check.actualValue && (
                            <p className="text-[#6C6C6C] text-xs">实际值: {check.actualValue}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 验收结果 */}
                {acceptanceReport && (
                  <div className={cn(
                    'mt-6 p-4 rounded-lg border',
                    acceptanceReport.overallStatus === 'pass' ? 'bg-[#4CAF50]/10 border-[#4CAF50]/30' :
                    acceptanceReport.overallStatus === 'fail' ? 'bg-[#D32F2F]/10 border-[#D32F2F]/30' :
                    'bg-[#FF9800]/10 border-[#FF9800]/30'
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {acceptanceReport.overallStatus === 'pass' ? (
                          <CheckCircle2 className="w-8 h-8 text-[#4CAF50]" />
                        ) : acceptanceReport.overallStatus === 'fail' ? (
                          <XCircle className="w-8 h-8 text-[#D32F2F]" />
                        ) : (
                          <AlertTriangle className="w-8 h-8 text-[#FF9800]" />
                        )}
                        <div>
                          <p className={cn(
                            'text-lg font-bold',
                            acceptanceReport.overallStatus === 'pass' ? 'text-[#4CAF50]' :
                            acceptanceReport.overallStatus === 'fail' ? 'text-[#D32F2F]' : 'text-[#FF9800]'
                          )}>
                            {acceptanceReport.overallStatus === 'pass' ? '验收通过' :
                             acceptanceReport.overallStatus === 'fail' ? '验收不通过' : '验收警告'}
                          </p>
                          <p className="text-[#6C6C6C] text-sm">通过率: {acceptanceReport.passRate}%</p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-[#6C6C6C]">
                        <p>检测时间: {acceptanceReport.checkTime}</p>
                        <p>检测人: {acceptanceReport.inspector}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 弹窗底部 */}
              <div className="p-6 border-t border-[#2D2D2D] sticky bottom-0 bg-[#1E1E1E]">
                {!acceptanceReport ? (
                  <div className="flex justify-center">
                    <button
                      onClick={runAcceptanceTest}
                      disabled={isAcceptanceRunning}
                      className="px-6 py-3 bg-[#4CAF50] rounded-lg text-white font-medium hover:bg-[#388E3C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {isAcceptanceRunning ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          验收检测中...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5" />
                          开始验收检测
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setAcceptanceReport(null);
                        setCurrentCheckIndex(0);
                      }}
                      className="px-4 py-2 bg-[#222222] border border-[#3A3A3A] rounded-lg text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors"
                    >
                      重新验收
                    </button>
                    <button
                      onClick={() => setShowAcceptanceModal(false)}
                      className="px-4 py-2 bg-[#4CAF50] rounded-lg text-white hover:bg-[#388E3C] transition-colors"
                    >
                      确认
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
