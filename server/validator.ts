import type { z } from "zod";

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
  code: DefectCode;
  location: {
    source: "spec" | "blueprint" | "template";
    section: number | null;
    refs: string[];
  };
  description: string;
  fix: string;
}

export interface SpecDataToValidate {
  template: "integrated" | "non_lab";
  template_override_reason?: string;
  course: {
    title: string;
    code: string;
    department: string;
    credits_ltp: string;
    course_type: string;
    summary: string;
  };
  course_outcomes: Array<{
    id: string;
    statement: string;
    bloom_level: number;
  }>;
  units: Array<{
    number: number;
    title: string;
    lab?: string | null;
  }>;
  co_po_pso_map: Record<string, Record<string, { level: 1 | 2 | 3; justification: string } | null>>;
  teaching_hours: {
    lectures?: number;
    lab?: number;
    tests_exams?: number;
    total?: number;
    [key: string]: number | undefined;
  };
  assessment: {
    components: Array<{ name: string; weight_percent: number }>;
    co_coverage: Record<string, string[]>;
  };
  rawHtmlTemplateText?: string;
}

export function validateCourseSpec(data: SpecDataToValidate): DefectItem[] {
  const defects: DefectItem[] = [];

  // V1 & V4: Check CO count and consistency in mapping table (Section 5)
  const coIds = new Set(data.course_outcomes.map((c) => c.id));
  const mappedCoIds = Object.keys(data.co_po_pso_map);

  for (const co of data.course_outcomes) {
    if (!data.co_po_pso_map[co.id] || Object.keys(data.co_po_pso_map[co.id] || {}).length === 0) {
      defects.push({
        code: "CO_MISSING_IN_TABLE",
        location: { source: "spec", section: 5, refs: [co.id] },
        description: `Course outcome ${co.id} is defined in Section 3 but missing in the CO-PO-PSO mapping table.`,
        fix: `Added row for ${co.id} in Section 5 with appropriate outcome alignments.`,
      });
    }
  }

  for (const mCoId of mappedCoIds) {
    if (!coIds.has(mCoId)) {
      defects.push({
        code: "CO_EXTRA_IN_TABLE",
        location: { source: "spec", section: 5, refs: [mCoId] },
        description: `CO identifier ${mCoId} appears in the mapping table but is not defined in Section 3.`,
        fix: `Removed undefined identifier ${mCoId} from Section 5 mapping table.`,
      });
    }
  }

  // V2: Every CO must map to at least one PO
  for (const co of data.course_outcomes) {
    const row = data.co_po_pso_map[co.id] || {};
    const hasPo = Object.keys(row).some((key) => key.startsWith("PO-") && row[key] !== null);
    if (!hasPo) {
      defects.push({
        code: "CO_MISSING_IN_TABLE",
        location: { source: "spec", section: 5, refs: [co.id] },
        description: `${co.id} is not mapped to any Program Outcome.`,
        fix: `Mapped ${co.id} to corresponding foundational Program Outcomes.`,
      });
    }
  }

  // V3: Every CO must be assessed in at least one component
  const coverage = data.assessment.co_coverage || {};
  for (const co of data.course_outcomes) {
    const comps = coverage[co.id] || [];
    if (comps.length === 0) {
      defects.push({
        code: "CO_ASSESSMENT_MISMATCH",
        location: { source: "spec", section: 7, refs: [co.id] },
        description: `${co.id} is not assessed in any evaluation component.`,
        fix: `Linked ${co.id} to continuous and end-semester assessment components.`,
      });
    }
  }

  // V5: Teaching hours add up to stated total
  const lecs = data.teaching_hours.lectures ?? 0;
  const lab = data.teaching_hours.lab ?? 0;
  const tests = data.teaching_hours.tests_exams ?? 0;
  const statedTotal = data.teaching_hours.total ?? 0;
  const calculatedTotal = lecs + lab + tests;

  if (statedTotal > 0 && calculatedTotal !== statedTotal) {
    defects.push({
      code: "HOURS_INCONSISTENT",
      location: { source: "spec", section: 8, refs: [] },
      description: `Teaching hours breakdown (${lecs}h lecture + ${lab}h lab + ${tests}h tests = ${calculatedTotal}h) does not equal stated total (${statedTotal}h).`,
      fix: `Adjusted teaching hours total to ${calculatedTotal}h to reflect component sum.`,
    });
  }

  // V6: Continuous evaluation + End semester exam total 100%
  const totalWeight = data.assessment.components.reduce((sum, c) => sum + (c.weight_percent || 0), 0);
  if (data.assessment.components.length > 0 && Math.abs(totalWeight - 100) > 0.01) {
    defects.push({
      code: "WEIGHTAGE_INCONSISTENT",
      location: { source: "spec", section: 7, refs: [] },
      description: `Assessment component weightages sum to ${totalWeight}%, but must total exactly 100%.`,
      fix: `Rebalanced continuous evaluation and end-exam weights to total exactly 100%.`,
    });
  }

  // V8: PSO columns check (must be PSO-1 and PSO-2 only)
  for (const co of data.course_outcomes) {
    const row = data.co_po_pso_map[co.id] || {};
    for (const key of Object.keys(row)) {
      if (key.startsWith("PSO-")) {
        const num = parseInt(key.replace("PSO-", ""), 10);
        if (num > 2) {
          defects.push({
            code: "PSO_COLUMN_MISMATCH",
            location: { source: "spec", section: 5, refs: [key] },
            description: `Found invalid PSO column '${key}'. Only PSO-1 and PSO-2 are defined for this program.`,
            fix: `Removed unsupported PSO column '${key}' from mapping table.`,
          });
        }
      }
    }
  }

  // V9: Bloom's cognitive ceiling check
  for (const co of data.course_outcomes) {
    const ceiling = co.bloom_level <= 2 ? 2 : 3;
    const row = data.co_po_pso_map[co.id] || {};
    for (const [outKey, cell] of Object.entries(row)) {
      if (cell && cell.level > ceiling && (outKey === "PO-3" || outKey === "PO-4" || outKey === "PO-5")) {
        defects.push({
          code: "MAPPING_BLOOM_MISMATCH",
          location: { source: "spec", section: 5, refs: [co.id, outKey] },
          description: `${co.id} (Bloom level L${co.bloom_level}) maps at strength ${cell.level} to complex engineering outcome ${outKey}, exceeding cognitive ceiling of ${ceiling}.`,
          fix: `Reduced mapping level of ${co.id} to ${outKey} to ${ceiling}.`,
        });
      }
    }
  }

  // V10: Template selection rule
  const creditParts = (data.course.credits_ltp || "").split(":").map(Number);
  const practicalCredits = creditParts[2] ?? 0;
  const isLabCourse = practicalCredits > 0 || data.course.course_type.toLowerCase().includes("lab");
  const expectedTemplate = isLabCourse ? "integrated" : "non_lab";

  if (data.template !== expectedTemplate && !data.template_override_reason) {
    defects.push({
      code: "WRONG_TEMPLATE",
      location: { source: "template", section: null, refs: [] },
      description: `Course with credit structure ${data.course.credits_ltp} requires the '${expectedTemplate}' template, but '${data.template}' was selected without an override reason.`,
      fix: `Assigned the compliant '${expectedTemplate}' template.`,
    });
  }

  return defects;
}
