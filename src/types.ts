// SpecForge domain and application types

export type ScreenId =
  | "dashboard"
  | "spec"
  | "mapping"
  | "validation"
  | "export"
  | "workflow";

export type Role = "Author" | "Reviewer" | "HOD";

export type WorkflowStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Pending HOD"
  | "Approved"
  | "Returned";

export type TemplateType = "integrated" | "non_lab";

export interface CourseOutcome {
  id: string;
  statement: string;
  bloom_level: number;
}

export interface CourseUnit {
  number: number;
  title: string;
  lab: string | null;
  content?: string;
  hours?: number;
}

export interface CourseData {
  title: string;
  code: string;
  department: string;
  credits_ltp: string;
  course_type: string;
  summary: string;
}

export interface TeachingHours {
  lectures: number;
  lab: number;
  tests_exams: number;
  total: number;
  [key: string]: number;
}

export interface AssessmentComponent {
  name: string;
  weight_percent: number;
}

export interface AssessmentData {
  components: AssessmentComponent[];
  co_coverage: Record<string, string[]>;
}

export interface MappingCell {
  level: 1 | 2 | 3;
  justification: string;
}

export type CoPoPsoMap = Record<string, Record<string, MappingCell | null>>;

export type DefectCode =
  | "CO_MISSING_IN_TABLE"
  | "CO_EXTRA_IN_TABLE"
  | "CO_ASSESSMENT_MISMATCH"
  | "PSO_COLUMN_MISMATCH"
  | "MAPPING_BLOOM_MISMATCH"
  | "MAPPING_UNSUPPORTED"
  | "WRONG_TEMPLATE"
  | "PLACEHOLDER_TEXT"
  | "SUMMARY_SYLLABUS_MISMATCH"
  | "LABEL_OR_TITLE_MISMATCH"
  | "HOURS_INCONSISTENT"
  | "WEIGHTAGE_INCONSISTENT"
  | "TYPO_OR_FORMAT"
  | "SECTION_NOT_IN_TEMPLATE"
  | "MARKS_INCONSISTENT"
  | "OTHER";

export interface DefectItem {
  id: string;
  code: DefectCode;
  location: {
    source: "spec" | "blueprint" | "template";
    section: number | null;
    refs: string[];
  };
  description: string;
  fix: string;
  severity: "High" | "Medium" | "Low";
}

export interface AuditLogEntry {
  id: string;
  user: string;
  role: Role;
  timestamp: string;
  action: string;
  comment?: string;
}

export interface SpecState {
  schema_version: "1.0";
  input_id: string;
  template: TemplateType;
  template_override_reason?: string;
  course: CourseData;
  course_outcomes: CourseOutcome[];
  units: CourseUnit[];
  co_po_pso_map: CoPoPsoMap;
  teaching_hours: TeachingHours;
  assessment: AssessmentData;
  defects: DefectItem[];
  workflow_status: WorkflowStatus;
  audit_log: AuditLogEntry[];
  spec_file_name?: string;
  blueprint_file_name?: string;
}
