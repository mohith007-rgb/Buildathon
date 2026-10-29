import type { SpecState } from "./types";

export const EMPTY_SPEC: SpecState = {
  schema_version: "1.0",
  input_id: "SAMPLE",
  template: "non_lab",
  course: {
    title: "",
    code: "",
    department: "",
    credits_ltp: "3:0:0",
    course_type: "Theory",
    summary: "",
  },
  course_outcomes: [],
  units: [],
  co_po_pso_map: {},
  teaching_hours: {
    lectures: 0,
    lab: 0,
    tests_exams: 0,
    total: 0,
  },
  assessment: {
    components: [],
    co_coverage: {},
  },
  defects: [],
  workflow_status: "Draft",
  audit_log: [
    {
      id: "log-1",
      user: "Course Coordinator",
      role: "Author",
      timestamp: new Date().toISOString(),
      action: "Initialized course specification draft",
    },
  ],
};

export function createPracticeSpec(): SpecState {
  return {
    schema_version: "1.0",
    input_id: "SAMPLE",
    template: "integrated",
    spec_file_name: "sample_course_spec.docx",
    blueprint_file_name: "sample_blueprint.doc",
    course: {
      title: "Data Engineering and Distributed Computing",
      code: "CS302",
      department: "Computer Science and Engineering",
      credits_ltp: "3:0:1",
      course_type: "Integrated Laboratory",
      summary:
        "Comprehensive coverage of distributed data architectures, streaming ingestion, batch computation pipelines, partition tolerance, and cluster optimization.",
    },
    course_outcomes: [
      {
        id: "CO-1",
        statement: "Explain core principles of distributed systems, data partitioning, and consistency models.",
        bloom_level: 2,
      },
      {
        id: "CO-2",
        statement: "Apply stream processing architectures to ingest and transform high-throughput data streams.",
        bloom_level: 3,
      },
      {
        id: "CO-3",
        statement: "Analyse distributed consensus protocols and fault-tolerant storage algorithms under network partitions.",
        bloom_level: 4,
      },
      {
        id: "CO-4",
        statement: "Design scalable batch and event-driven data pipelines using modern workflow scheduling tools.",
        bloom_level: 6,
      },
      {
        id: "CO-5",
        statement: "Evaluate cluster performance, resource utilization, and query bottlenecks across distributed data stores.",
        bloom_level: 5,
      },
    ],
    units: [
      {
        number: 1,
        title: "Distributed Data Architectures & Replication",
        lab: "Cluster setup and node discovery configuration",
      },
      {
        number: 2,
        title: "Stream Ingestion & Message Buffering",
        lab: "Publish-subscribe broker integration and offset management",
      },
      {
        number: 3,
        title: "Batch Transformation & Distributed Querying",
        lab: "Dataframe operations and distributed join optimization",
      },
      {
        number: 4,
        title: "Workflow Orchestration & Pipeline Automation",
        lab: "Directed Acyclic Graph (DAG) construction and retry policies",
      },
      {
        number: 5,
        title: "Cluster Monitoring & Scalability Tuning",
        lab: "Latency benchmarking and partition rebalancing",
      },
    ],
    co_po_pso_map: {
      "CO-1": {
        "PO-1": { level: 2, justification: "Applies foundational computing principles to distributed topologies." },
        "PO-2": { level: 2, justification: "Analyzes fundamental architectural consistency models." },
        "PSO-1": { level: 2, justification: "Understands core data structures in distributed storage." },
      },
      "CO-2": {
        "PO-1": { level: 3, justification: "Implements stream algorithms using advanced mathematical windowing." },
        "PO-3": { level: 2, justification: "Designs streaming components to meet throughput requirements." },
        "PO-5": { level: 3, justification: "Utilizes industry stream processing frameworks and message brokers." },
        "PSO-2": { level: 3, justification: "Builds modern software solutions with cloud-native tooling." },
      },
      "CO-3": {
        "PO-2": { level: 3, justification: "Investigates consensus failure modes and partition recovery." },
        "PO-4": { level: 2, justification: "Conducts diagnostic investigations into cluster split-brain conditions." },
        "PSO-1": { level: 3, justification: "Applies algorithmic rigor to solve complex distributed synchronization." },
      },
      "CO-4": {
        "PO-3": { level: 3, justification: "Develops end-to-end resilient data pipelines meeting enterprise specifications." },
        "PO-5": { level: 3, justification: "Leverages workflow orchestrators and distributed container platforms." },
        "PO-10": { level: 2, justification: "Manages computational resource budget and pipeline execution costs." },
        "PSO-2": { level: 3, justification: "Implements production-grade software delivery pipelines." },
      },
      "CO-5": {
        "PO-2": { level: 3, justification: "Formulates benchmark hypotheses and identifies scalability bottlenecks." },
        "PO-4": { level: 3, justification: "Analyzes experimental telemetry metrics to derive optimization conclusions." },
        "PO-11": { level: 2, justification: "Fosters self-directed evaluation of emerging storage and query engines." },
        "PSO-1": { level: 2, justification: "Evaluates algorithmic complexity in real-world distributed settings." },
      },
    },
    teaching_hours: {
      lectures: 42,
      lab: 28,
      tests_exams: 10,
      total: 80,
    },
    assessment: {
      components: [
        { name: "Continuous Internal Evaluation (CIE)", weight_percent: 50 },
        { name: "Semester End Examination (SEE)", weight_percent: 50 },
      ],
      co_coverage: {
        "CO-1": ["CIE", "SEE"],
        "CO-2": ["CIE", "SEE"],
        "CO-3": ["CIE", "SEE"],
        "CO-4": ["CIE"],
        "CO-5": ["CIE", "SEE"],
      },
    },
    defects: [],
    workflow_status: "Draft",
    audit_log: [
      {
        id: "log-1",
        user: "Course Coordinator",
        role: "Author",
        timestamp: new Date().toISOString(),
        action: "Ingested course syllabus and blueprint references",
      },
    ],
  };
}
