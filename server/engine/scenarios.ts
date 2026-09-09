import {
  Entity,
  Alert,
  Case,
  Investigation,
  Escalation,
  Closure,
  EvidenceRecord,
  ScenarioDefinition
} from '../types';

export interface ScenarioDataset {
  scenario: ScenarioDefinition;
  entities: Entity[];
  alerts: Alert[];
  cases: Case[];
  investigations: Investigation[];
  escalations: Escalation[];
  closures: Closure[];
  evidences: EvidenceRecord[];
}

export const SCENARIO_DEFINITIONS: ScenarioDefinition[] = [
  {
    id: 'SCENARIO_1',
    name: 'Scenario 1: Normal SOC Workflow',
    badge: 'Baseline Benchmark',
    description: 'Clean operational lifecycle: Alerts triaged, cases acknowledged, investigations evidenced, high-severity escalations logged, and timely supervisor closures.',
    expectedOutcome: 'Zero high/critical execution gaps. Normal workflow conversion (>88%). SLA targets met.',
    keyGaps: []
  },
  {
    id: 'SCENARIO_2',
    name: 'Scenario 2: Missing Escalation Gap',
    badge: 'Execution Gap',
    description: 'Critical ransomware and C2 beaconing alerts investigated by Tier 1 analysts and closed directly without required Tier 2/CISO escalation.',
    expectedOutcome: 'High-priority supervisory finding: "Potential Escalation Execution Gap [CRITICAL]" and negative space gap on escalation column.',
    keyGaps: ['Missing Escalation Record on P1/Critical Incidents', 'Unsupervised Critical Closure']
  },
  {
    id: 'SCENARIO_3',
    name: 'Scenario 3: SLA Breach & Stagnation',
    badge: 'SLA Breach',
    description: 'Investigation duration extensively breaches the 60-minute critical response SLA (cases lingering over 240 minutes without extension waivers).',
    expectedOutcome: 'SLA breach rate spikes to 60%+. Deterministic signals flagged for delayed investigation and attacker dwell exposure.',
    keyGaps: ['240-minute Investigation Duration vs 60m SLA Target', 'Missing SLA Extension Waivers']
  },
  {
    id: 'SCENARIO_4',
    name: 'Scenario 4: Missing Investigation Evidence',
    badge: 'Missing Evidence',
    description: 'Cases marked completed with analytical conclusions, but zero digital forensic artifacts, PCAP captures, or verified hashes attached to the case repository.',
    expectedOutcome: 'Negative Space analysis highlights "MISSING" artifacts across entities. Definitive evidence deficit flags raised.',
    keyGaps: ['0 Forensic Artifacts / PCAP Linked', 'Unsubstantiated Remediation Claims']
  },
  {
    id: 'SCENARIO_5',
    name: 'Scenario 5: Premature Critical Closure',
    badge: 'Premature Closure',
    description: 'High and Critical severity alerts triaged and closed in under 4 minutes with dismissive notes, presenting extreme risk of uncontained false negatives.',
    expectedOutcome: 'Critical Premature Closure finding triggered. ML Anomaly engine isolates rapid closure outliers with high deviation scores.',
    keyGaps: ['3-minute Closure on Critical Asset Intrusion', 'Zero Containment Validation']
  }
];

export function generateScenarioData(scenarioId: string): ScenarioDataset {
  const baseEntities: Entity[] = [
    {
      id: 'ENT-FIN-01',
      name: 'Reserve Bank Payment Switch',
      code: 'RBPS-PROD',
      criticality: 'CRITICAL',
      sector: 'Banking & Financial Services',
      activeCases: 4,
      totalFindings: 0,
      slaBreachRate: 0,
      lastAssessedAt: new Date().toISOString()
    },
    {
      id: 'ENT-GRID-02',
      name: 'Northern Power Grid SCADA Network',
      code: 'NPG-OT-SEC',
      criticality: 'CRITICAL',
      sector: 'Energy & Critical Infrastructure',
      activeCases: 3,
      totalFindings: 0,
      slaBreachRate: 0,
      lastAssessedAt: new Date().toISOString()
    },
    {
      id: 'ENT-HEALTH-03',
      name: 'National Health Authority HealthID Registry',
      code: 'NHA-ABHA-REG',
      criticality: 'HIGH',
      sector: 'Healthcare & Public Health',
      activeCases: 2,
      totalFindings: 0,
      slaBreachRate: 0,
      lastAssessedAt: new Date().toISOString()
    },
    {
      id: 'ENT-TRANS-04',
      name: 'Metropolitan Rapid Rail Automated Signalling',
      code: 'MRR-TCMS',
      criticality: 'HIGH',
      sector: 'Transportation & Logistics',
      activeCases: 2,
      totalFindings: 0,
      slaBreachRate: 0,
      lastAssessedAt: new Date().toISOString()
    },
    {
      id: 'ENT-CIVIL-05',
      name: 'Digital India Public Portal Infra',
      code: 'DIP-GATEWAY',
      criticality: 'MEDIUM',
      sector: 'Government e-Services',
      activeCases: 1,
      totalFindings: 0,
      slaBreachRate: 0,
      lastAssessedAt: new Date().toISOString()
    }
  ];

  const now = Date.now();
  const timeOffset = (minsAgo: number) => new Date(now - minsAgo * 60000).toISOString();

  let alerts: Alert[] = [];
  let cases: Case[] = [];
  let investigations: Investigation[] = [];
  let escalations: Escalation[] = [];
  let closures: Closure[] = [];
  let evidences: EvidenceRecord[] = [];

  const normalizedId = (scenarioId || 'SCENARIO_2').replace('-', '_').toUpperCase();
  const def = SCENARIO_DEFINITIONS.find(s => s.id === normalizedId || s.id === scenarioId) || SCENARIO_DEFINITIONS[0];

  switch (normalizedId) {
    case 'SCENARIO_1': // Normal SOC
      alerts = [
        {
          id: 'ALT-1001',
          entityId: 'ENT-FIN-01',
          assetId: 'PAY-CORE-SW01',
          title: 'Suspicious Kerberos Ticket Request (Pass-the-Ticket)',
          severity: 'HIGH',
          source: 'EDR-CrowdStrike',
          rawTimestamp: timeOffset(180),
          normalizedTimestamp: timeOffset(180),
          category: 'Credential Access',
          description: 'Abnormal SPN query detected from unmanaged workstation.',
          status: 'TRIAGED'
        },
        {
          id: 'ALT-1002',
          entityId: 'ENT-GRID-02',
          assetId: 'SCADA-PLC-NODE4',
          title: 'Unauthorized Modbus Function Code Write Attempt',
          severity: 'CRITICAL',
          source: 'OT-Nozomi',
          rawTimestamp: timeOffset(150),
          normalizedTimestamp: timeOffset(150),
          category: 'Industrial Protocol Manipulation',
          description: 'Direct coil override signal directed at generator regulator.',
          status: 'ESCALATED'
        },
        {
          id: 'ALT-1003',
          entityId: 'ENT-HEALTH-03',
          assetId: 'DB-FHIR-CLUSTER',
          title: 'High-Volume Outbound Encrypted Transfer (Potential Exfiltration)',
          severity: 'MEDIUM',
          source: 'PaloAlto-NGFW',
          rawTimestamp: timeOffset(120),
          normalizedTimestamp: timeOffset(120),
          category: 'Exfiltration',
          description: 'Session egress volume to unknown cloud bucket exceeded baseline.',
          status: 'TRIAGED'
        }
      ];

      cases = [
        {
          id: 'CASE-1001',
          caseNumber: 'INC-2026-0811',
          alertId: 'ALT-1001',
          entityId: 'ENT-FIN-01',
          title: 'Pass-the-Ticket Investigation on Core Switch',
          severity: 'HIGH',
          status: 'CLOSED',
          assignedAnalyst: 'Priya Sharma (Analyst Tier 2)',
          createdAt: timeOffset(175),
          acknowledgedAt: timeOffset(170),
          closedAt: timeOffset(95),
          slaTargetMinutes: 120,
          slaActualMinutes: 80,
          slaBreached: false
        },
        {
          id: 'CASE-1002',
          caseNumber: 'INC-2026-0812',
          alertId: 'ALT-1002',
          entityId: 'ENT-GRID-02',
          title: 'PLC Modbus Unauthorized Modification',
          severity: 'CRITICAL',
          status: 'CLOSED',
          assignedAnalyst: 'Vikram Mehta (Lead Threat Hunter)',
          createdAt: timeOffset(145),
          acknowledgedAt: timeOffset(143),
          closedAt: timeOffset(90),
          slaTargetMinutes: 60,
          slaActualMinutes: 55,
          slaBreached: false
        }
      ];

      investigations = [
        {
          id: 'INV-1001',
          caseId: 'CASE-1001',
          analystId: 'Priya Sharma',
          startedAt: timeOffset(170),
          completedAt: timeOffset(105),
          durationMinutes: 65,
          hypothesis: 'Compromised admin credentials used from jump server. Session terminated.',
          evidenceIds: ['EVD-101', 'EVD-102'],
          findingsNotes: 'Account locked; domain controller hashes verified clean.',
          status: 'COMPLETED'
        },
        {
          id: 'INV-1002',
          caseId: 'CASE-1002',
          analystId: 'Vikram Mehta',
          startedAt: timeOffset(143),
          completedAt: timeOffset(100),
          durationMinutes: 43,
          hypothesis: 'Engineering maintenance workstation IP spoofed. OT firewall rule enforced.',
          evidenceIds: ['EVD-103', 'EVD-104'],
          findingsNotes: 'Field technician laptop isolated; firmware hashes validated.',
          status: 'COMPLETED'
        }
      ];

      escalations = [
        {
          id: 'ESC-1001',
          caseId: 'CASE-1001',
          escalatedBy: 'Priya Sharma',
          escalatedTo: 'Incident Commander',
          escalatedAt: timeOffset(150),
          delayMinutesFromAlert: 30,
          escalationReason: 'Core banking asset impacted; mandated CISO notification.',
          priority: 'HIGH',
          tier: 'Tier 2'
        },
        {
          id: 'ESC-1002',
          caseId: 'CASE-1002',
          escalatedBy: 'Vikram Mehta',
          escalatedTo: 'National CERT-In & Grid Operations',
          escalatedAt: timeOffset(135),
          delayMinutesFromAlert: 15,
          escalationReason: 'Critical infrastructure control command integrity violation.',
          priority: 'CRITICAL',
          tier: 'CISO / Incident Commander'
        }
      ];

      closures = [
        {
          id: 'CLS-1001',
          caseId: 'CASE-1001',
          closedBy: 'Rajeev Menon (SOC Supervisor)',
          closedAt: timeOffset(95),
          classification: 'TRUE_POSITIVE',
          justification: 'Threat contained, attacker evicted, credential resets enforced.',
          approvedBySupervisor: true
        },
        {
          id: 'CLS-1002',
          caseId: 'CASE-1002',
          closedBy: 'Rajeev Menon (SOC Supervisor)',
          closedAt: timeOffset(90),
          classification: 'TRUE_POSITIVE',
          justification: 'PLC safety verification confirmed normal operational telemetry.',
          approvedBySupervisor: true
        }
      ];

      evidences = [
        {
          id: 'EVD-101',
          caseId: 'CASE-1001',
          type: 'LOG_ARCHIVE',
          name: 'AD_EventLog_4769_Extract.evtx',
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          collectedAt: timeOffset(165),
          collectedBy: 'Priya Sharma',
          sourceSystem: 'DC-PRIMARY-01',
          verified: true
        },
        {
          id: 'EVD-102',
          caseId: 'CASE-1001',
          type: 'MEMORY_DUMP',
          name: 'lsass_minidump_triage.dmp',
          hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
          collectedAt: timeOffset(160),
          collectedBy: 'Priya Sharma',
          sourceSystem: 'WORKSTATION-SEC-09',
          verified: true
        },
        {
          id: 'EVD-103',
          caseId: 'CASE-1002',
          type: 'PCAP',
          name: 'modbus_tcp_write_coil_capture.pcap',
          hash: 'c89c5e4277717bc42fa79ecdc5c0e1db5c4a52026194b63e80ab26bca2de2454',
          collectedAt: timeOffset(138),
          collectedBy: 'Vikram Mehta',
          sourceSystem: 'SPAN-OT-ZONE1',
          verified: true
        },
        {
          id: 'EVD-104',
          caseId: 'CASE-1002',
          type: 'HOST_ARTIFACT',
          name: 'plc_firmware_sha256_audit.json',
          hash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
          collectedAt: timeOffset(125),
          collectedBy: 'Vikram Mehta',
          sourceSystem: 'SCADA-ENG-STATION',
          verified: true
        }
      ];
      break;

    case 'SCENARIO_2': // Missing Escalation
      alerts = [
        {
          id: 'ALT-2001',
          entityId: 'ENT-FIN-01',
          assetId: 'SWIFT-GATEWAY-01',
          title: 'Suspected Lazarus Group Beaconing over DNS Tunneling',
          severity: 'CRITICAL',
          source: 'Network-Suricata',
          rawTimestamp: timeOffset(240),
          normalizedTimestamp: timeOffset(240),
          category: 'Command and Control',
          description: 'High entropy TXT queries resolved to known APT infrastructure.',
          status: 'TRIAGED'
        },
        {
          id: 'ALT-2002',
          entityId: 'ENT-GRID-02',
          assetId: 'GRID-EMS-DISPATCH',
          title: 'Cobalt Strike Named Pipe SMB Propagation',
          severity: 'HIGH',
          source: 'EDR-SentinelOne',
          rawTimestamp: timeOffset(210),
          normalizedTimestamp: timeOffset(210),
          category: 'Lateral Movement',
          description: 'PsExec service creation detected across control center consoles.',
          status: 'TRIAGED'
        }
      ];

      cases = [
        {
          id: 'CASE-2001',
          caseNumber: 'INC-2026-1044',
          alertId: 'ALT-2001',
          entityId: 'ENT-FIN-01',
          title: 'DNS Tunneling Investigation on Financial Switch Gateway',
          severity: 'CRITICAL',
          status: 'CLOSED',
          assignedAnalyst: 'Amit Roy (Analyst Tier 1)',
          createdAt: timeOffset(235),
          acknowledgedAt: timeOffset(230),
          closedAt: timeOffset(160),
          slaTargetMinutes: 60,
          slaActualMinutes: 75,
          slaBreached: true
        },
        {
          id: 'CASE-2002',
          caseNumber: 'INC-2026-1045',
          alertId: 'ALT-2002',
          entityId: 'ENT-GRID-02',
          title: 'SMB Pipe Lateral Movement on Grid Dispatch Console',
          severity: 'HIGH',
          status: 'CLOSED',
          assignedAnalyst: 'Amit Roy (Analyst Tier 1)',
          createdAt: timeOffset(205),
          acknowledgedAt: timeOffset(200),
          closedAt: timeOffset(140),
          slaTargetMinutes: 120,
          slaActualMinutes: 65,
          slaBreached: false
        }
      ];

      investigations = [
        {
          id: 'INV-2001',
          caseId: 'CASE-2001',
          analystId: 'Amit Roy',
          startedAt: timeOffset(230),
          completedAt: timeOffset(165),
          durationMinutes: 65,
          hypothesis: 'Attacker payload active on gateway; analyst terminated task locally.',
          evidenceIds: ['EVD-201'],
          findingsNotes: 'Closed locally without notifying Incident Commander or CERT-In.',
          status: 'COMPLETED'
        },
        {
          id: 'INV-2002',
          caseId: 'CASE-2002',
          analystId: 'Amit Roy',
          startedAt: timeOffset(200),
          completedAt: timeOffset(145),
          durationMinutes: 55,
          hypothesis: 'Service deleted; presumed resolved by local analyst.',
          evidenceIds: ['EVD-202'],
          findingsNotes: 'No Tier 2 escalation performed despite high severity.',
          status: 'COMPLETED'
        }
      ];

      // ESCALATIONS ARE DELIBERATELY EMPTY TO DEMONSTRATE THE EXECUTION GAP
      escalations = [];

      closures = [
        {
          id: 'CLS-2001',
          caseId: 'CASE-2001',
          closedBy: 'Amit Roy (Tier 1)',
          closedAt: timeOffset(160),
          classification: 'TRUE_POSITIVE',
          justification: 'Threat terminated locally on endpoint. No further action taken.',
          approvedBySupervisor: false
        },
        {
          id: 'CLS-2002',
          caseId: 'CASE-2002',
          closedBy: 'Amit Roy (Tier 1)',
          closedAt: timeOffset(140),
          classification: 'TRUE_POSITIVE',
          justification: 'Endpoint rebooted; service stopped.',
          approvedBySupervisor: false
        }
      ];

      evidences = [
        {
          id: 'EVD-201',
          caseId: 'CASE-2001',
          type: 'LOG_ARCHIVE',
          name: 'dns_query_extract_tunneling.log',
          hash: '6a87b7a58c8e889b7b9d09c2a8c3e8e7a8c3e8e7a8c3e8e7a8c3e8e7a8c3e8e7',
          collectedAt: timeOffset(210),
          collectedBy: 'Amit Roy',
          sourceSystem: 'DNS-RESOLVER-01',
          verified: true
        },
        {
          id: 'EVD-202',
          caseId: 'CASE-2002',
          type: 'HOST_ARTIFACT',
          name: 'autoruns_registry_dump.txt',
          hash: '7b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c',
          collectedAt: timeOffset(180),
          collectedBy: 'Amit Roy',
          sourceSystem: 'GRID-DISPATCH-03',
          verified: true
        }
      ];
      break;

    case 'SCENARIO_3': // SLA Breach
      alerts = [
        {
          id: 'ALT-3001',
          entityId: 'ENT-TRANS-04',
          assetId: 'RAIL-SIG-GATEWAY',
          title: 'Ransomware Precursor — Shadow Copies Deleted via VSSAdmin',
          severity: 'CRITICAL',
          source: 'EDR-Defender',
          rawTimestamp: timeOffset(360),
          normalizedTimestamp: timeOffset(360),
          category: 'Defense Evasion',
          description: 'vssadmin delete shadows /all /quiet executed by SYSTEM user.',
          status: 'TRIAGED'
        },
        {
          id: 'ALT-3002',
          entityId: 'ENT-HEALTH-03',
          assetId: 'HEALTH-EHR-SRV02',
          title: 'Multiple Brute-Force RDP Logon Failures Followed by Success',
          severity: 'HIGH',
          source: 'SIEM-Splunk',
          rawTimestamp: timeOffset(320),
          normalizedTimestamp: timeOffset(320),
          category: 'Initial Access',
          description: '1,420 failed attempts followed by Event 4624 Type 10 logon.',
          status: 'TRIAGED'
        }
      ];

      cases = [
        {
          id: 'CASE-3001',
          caseNumber: 'INC-2026-3091',
          alertId: 'ALT-3001',
          entityId: 'ENT-TRANS-04',
          title: 'VSSAdmin Shadow Copy Deletion on Rail Signalling Gateway',
          severity: 'CRITICAL',
          status: 'CLOSED',
          assignedAnalyst: 'Karan Joshi',
          createdAt: timeOffset(355),
          acknowledgedAt: timeOffset(350),
          closedAt: timeOffset(115),
          slaTargetMinutes: 60,
          slaActualMinutes: 240, // 240 MINUTES VS 60M TARGET!
          slaBreached: true
        },
        {
          id: 'CASE-3002',
          caseNumber: 'INC-2026-3092',
          alertId: 'ALT-3002',
          entityId: 'ENT-HEALTH-03',
          title: 'RDP Brute-Force Compromise on EHR Server',
          severity: 'HIGH',
          status: 'CLOSED',
          assignedAnalyst: 'Karan Joshi',
          createdAt: timeOffset(315),
          acknowledgedAt: timeOffset(300),
          closedAt: timeOffset(125),
          slaTargetMinutes: 120,
          slaActualMinutes: 190, // 190 MINUTES VS 120M TARGET!
          slaBreached: true
        }
      ];

      investigations = [
        {
          id: 'INV-3001',
          caseId: 'CASE-3001',
          analystId: 'Karan Joshi',
          startedAt: timeOffset(350),
          completedAt: timeOffset(118),
          durationMinutes: 232,
          hypothesis: 'Analyst experienced shift overlap; ticket unmonitored for 3 hours.',
          evidenceIds: ['EVD-301'],
          findingsNotes: 'Critical case sat idle in queue without triage reassignment.',
          status: 'COMPLETED'
        }
      ];

      escalations = [
        {
          id: 'ESC-3001',
          caseId: 'CASE-3001',
          escalatedBy: 'Karan Joshi',
          escalatedTo: 'Incident Commander',
          escalatedAt: timeOffset(130),
          delayMinutesFromAlert: 230,
          escalationReason: 'Escalated only after analyst realized delay exceeded 3 hours.',
          priority: 'CRITICAL',
          tier: 'CISO / Incident Commander'
        }
      ];

      closures = [
        {
          id: 'CLS-3001',
          caseId: 'CASE-3001',
          closedBy: 'Rajeev Menon',
          closedAt: timeOffset(115),
          classification: 'TRUE_POSITIVE',
          justification: 'Investigation completed with severe SLA violation recorded.',
          approvedBySupervisor: true
        }
      ];

      evidences = [
        {
          id: 'EVD-301',
          caseId: 'CASE-3001',
          type: 'LOG_ARCHIVE',
          name: 'security_eventlog_4688_process_creation.evtx',
          hash: '5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
          collectedAt: timeOffset(125),
          collectedBy: 'Karan Joshi',
          sourceSystem: 'RAIL-SIG-GATEWAY',
          verified: true
        }
      ];
      break;

    case 'SCENARIO_4': // Missing Evidence
      alerts = [
        {
          id: 'ALT-4001',
          entityId: 'ENT-CIVIL-05',
          assetId: 'CIVIL-PORTAL-WEB01',
          title: 'SQL Injection Extracting User Credential Table',
          severity: 'HIGH',
          source: 'WAF-Cloudflare',
          rawTimestamp: timeOffset(190),
          normalizedTimestamp: timeOffset(190),
          category: 'Injection',
          description: 'UNION SELECT pattern detected against public authentication portal.',
          status: 'TRIAGED'
        },
        {
          id: 'ALT-4002',
          entityId: 'ENT-FIN-01',
          assetId: 'PAY-API-PROXY',
          title: 'Suspicious API Key Usage from Foreign Tor Exit Node',
          severity: 'CRITICAL',
          source: 'API-Gateway-Kong',
          rawTimestamp: timeOffset(170),
          normalizedTimestamp: timeOffset(170),
          category: 'Credential Misuse',
          description: 'Administrative token invoked from unapproved geolocations.',
          status: 'TRIAGED'
        }
      ];

      cases = [
        {
          id: 'CASE-4001',
          caseNumber: 'INC-2026-4401',
          alertId: 'ALT-4001',
          entityId: 'ENT-CIVIL-05',
          title: 'SQL Injection Investigation on Civil Portal',
          severity: 'HIGH',
          status: 'CLOSED',
          assignedAnalyst: 'Neha Kapoor',
          createdAt: timeOffset(185),
          acknowledgedAt: timeOffset(180),
          closedAt: timeOffset(110),
          slaTargetMinutes: 120,
          slaActualMinutes: 75,
          slaBreached: false
        },
        {
          id: 'CASE-4002',
          caseNumber: 'INC-2026-4402',
          alertId: 'ALT-4002',
          entityId: 'ENT-FIN-01',
          title: 'Tor Exit Node API Key Abuse',
          severity: 'CRITICAL',
          status: 'CLOSED',
          assignedAnalyst: 'Neha Kapoor',
          createdAt: timeOffset(165),
          acknowledgedAt: timeOffset(160),
          closedAt: timeOffset(105),
          slaTargetMinutes: 60,
          slaActualMinutes: 60,
          slaBreached: false
        }
      ];

      investigations = [
        {
          id: 'INV-4001',
          caseId: 'CASE-4001',
          analystId: 'Neha Kapoor',
          startedAt: timeOffset(180),
          completedAt: timeOffset(115),
          durationMinutes: 65,
          hypothesis: 'Analyst concluded SQL payload was blocked, but attached no WAF raw logs or database query dumps.',
          evidenceIds: [], // EMPTY EVIDENCE
          findingsNotes: 'Closed based on verbal reassurance from developer.',
          status: 'COMPLETED'
        },
        {
          id: 'INV-4002',
          caseId: 'CASE-4002',
          analystId: 'Neha Kapoor',
          startedAt: timeOffset(160),
          completedAt: timeOffset(108),
          durationMinutes: 52,
          hypothesis: 'Token revoked; zero authentication headers or traffic PCAP preserved.',
          evidenceIds: [], // EMPTY EVIDENCE
          findingsNotes: 'No digital evidence preserved for post-incident audit.',
          status: 'COMPLETED'
        }
      ];

      escalations = [
        {
          id: 'ESC-4001',
          caseId: 'CASE-4002',
          escalatedBy: 'Neha Kapoor',
          escalatedTo: 'Incident Commander',
          escalatedAt: timeOffset(150),
          delayMinutesFromAlert: 20,
          escalationReason: 'Tor involvement on financial API.',
          priority: 'CRITICAL',
          tier: 'Tier 2'
        }
      ];

      closures = [
        {
          id: 'CLS-4001',
          caseId: 'CASE-4001',
          closedBy: 'Neha Kapoor',
          closedAt: timeOffset(110),
          classification: 'FALSE_POSITIVE',
          justification: 'Developer stated test vulnerability scanner, no logs retained.',
          approvedBySupervisor: false
        },
        {
          id: 'CLS-4002',
          caseId: 'CASE-4002',
          closedBy: 'Neha Kapoor',
          closedAt: timeOffset(105),
          classification: 'TRUE_POSITIVE',
          justification: 'API token rotated.',
          approvedBySupervisor: false
        }
      ];

      // EVIDENCES ARE DELIBERATELY ZERO TO DEMONSTRATE NEGATIVE SPACE DEFICIT
      evidences = [];
      break;

    case 'SCENARIO_5': // Premature Closure
      alerts = [
        {
          id: 'ALT-5001',
          entityId: 'ENT-GRID-02',
          assetId: 'SUBSTATION-RTU-08',
          title: 'Industroyer2 Malicious Payload Injected into Telemetry Buffer',
          severity: 'CRITICAL',
          source: 'OT-Dragos',
          rawTimestamp: timeOffset(100),
          normalizedTimestamp: timeOffset(100),
          category: 'ICS Malware Exploitation',
          description: 'Known ICS wiper signature matched in IEC-104 packet payload.',
          status: 'TRIAGED'
        },
        {
          id: 'ALT-5002',
          entityId: 'ENT-FIN-01',
          assetId: 'ATM-SWITCH-SWITCHER',
          title: 'ATM Cash-Out Malware (FastPOS) Memory Injection',
          severity: 'CRITICAL',
          source: 'EDR-CrowdStrike',
          rawTimestamp: timeOffset(80),
          normalizedTimestamp: timeOffset(80),
          category: 'Financial Malware',
          description: 'Process hollowing observed on ATM transaction dispatcher service.',
          status: 'TRIAGED'
        }
      ];

      cases = [
        {
          id: 'CASE-5001',
          caseNumber: 'INC-2026-5501',
          alertId: 'ALT-5001',
          entityId: 'ENT-GRID-02',
          title: 'Industroyer2 Signature Alert on Substation RTU',
          severity: 'CRITICAL',
          status: 'CLOSED',
          assignedAnalyst: 'Rohan Verma',
          createdAt: timeOffset(98),
          acknowledgedAt: timeOffset(97),
          closedAt: timeOffset(94), // ONLY 4 MINUTES TOTAL!
          slaTargetMinutes: 60,
          slaActualMinutes: 4,
          slaBreached: false
        },
        {
          id: 'CASE-5002',
          caseNumber: 'INC-2026-5502',
          alertId: 'ALT-5002',
          entityId: 'ENT-FIN-01',
          title: 'FastPOS Memory Injection on ATM Dispatcher',
          severity: 'CRITICAL',
          status: 'CLOSED',
          assignedAnalyst: 'Rohan Verma',
          createdAt: timeOffset(78),
          acknowledgedAt: timeOffset(77),
          closedAt: timeOffset(75), // ONLY 3 MINUTES TOTAL!
          slaTargetMinutes: 60,
          slaActualMinutes: 3,
          slaBreached: false
        }
      ];

      investigations = [
        {
          id: 'INV-5001',
          caseId: 'CASE-5001',
          analystId: 'Rohan Verma',
          startedAt: timeOffset(97),
          completedAt: timeOffset(94),
          durationMinutes: 3, // 3 MINUTES INVESTIGATION!
          hypothesis: 'Analyst dismissed signature as benign broadcast noise without inspection.',
          evidenceIds: [],
          findingsNotes: 'Dismissed without firmware check or IEC-104 inspection.',
          status: 'COMPLETED'
        },
        {
          id: 'INV-5002',
          caseId: 'CASE-5002',
          analystId: 'Rohan Verma',
          startedAt: timeOffset(77),
          completedAt: timeOffset(75),
          durationMinutes: 2, // 2 MINUTES INVESTIGATION!
          hypothesis: 'Analyst assumed false positive due to heavy transaction load.',
          evidenceIds: [],
          findingsNotes: 'No memory dump taken. Extreme false negative risk.',
          status: 'COMPLETED'
        }
      ];

      escalations = [];

      closures = [
        {
          id: 'CLS-5001',
          caseId: 'CASE-5001',
          closedBy: 'Rohan Verma',
          closedAt: timeOffset(94),
          classification: 'FALSE_POSITIVE',
          justification: 'Presumed noise. Closed ticket.',
          approvedBySupervisor: false
        },
        {
          id: 'CLS-5002',
          caseId: 'CASE-5002',
          closedBy: 'Rohan Verma',
          closedAt: timeOffset(75),
          classification: 'FALSE_POSITIVE',
          justification: 'Treated as routine benign spike.',
          approvedBySupervisor: false
        }
      ];

      evidences = [];
      break;
  }

  return {
    scenario: def,
    entities: baseEntities,
    alerts,
    cases,
    investigations,
    escalations,
    closures,
    evidences
  };
}
