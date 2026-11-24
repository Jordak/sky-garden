import type {
  AnswerIconId,
  PanoptesAnswerOption,
  PanoptesProjectGuideItem,
  PanoptesSingleTask,
  PanoptesWorkflow,
} from '../data/galaxyZooWorkflow';

export interface RawPanoptesAnswer {
  readonly label?: string;
  readonly next?: string | null;
}

export interface RawPanoptesTask {
  readonly type?: string;
  readonly question?: string;
  readonly help?: string;
  readonly answers?: readonly RawPanoptesAnswer[];
}

export interface RawPanoptesWorkflowResource {
  readonly id?: string | number;
  readonly version?: string;
  readonly display_name?: string;
  readonly first_task?: string;
  readonly tasks?: Readonly<Record<string, RawPanoptesTask>>;
  readonly strings?: Readonly<Record<string, string>>;
  readonly links?: {
    readonly project?: string | number;
  };
}

export interface RawPanoptesFieldGuideItem {
  readonly title?: string;
  readonly content?: string;
}

export interface RawPanoptesFieldGuideResource {
  readonly id?: string | number;
  readonly items?: readonly RawPanoptesFieldGuideItem[];
}

export interface PanoptesAdaptSuccess {
  readonly workflow: PanoptesWorkflow;
  readonly warnings: readonly string[];
  readonly skippedTaskIds: readonly string[];
}

export type PanoptesAdaptResult = PanoptesAdaptSuccess | { readonly error: string };

const PANOPTES_WORKFLOW_ID_REGEX = /^\d{1,10}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function resolvePanoptesString(
  rawValue: unknown,
  strings?: Readonly<Record<string, string>>,
): string {
  if (typeof rawValue !== 'string') return '';
  if (strings && Object.prototype.hasOwnProperty.call(strings, rawValue)) {
    const resolved = strings[rawValue];
    return typeof resolved === 'string' ? resolved : rawValue;
  }
  return rawValue;
}

function stripMarkdownForSummary(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferAnswerIcon(label: string): AnswerIconId {
  const lower = label.toLowerCase();
  if (lower.includes('star') || lower.includes('artifact')) return 'artifact';
  if (lower.includes('smooth')) return 'smooth';
  if (lower.includes('edge-on') || lower.includes('edge on')) return 'edge-on';
  if (lower.includes('face-on') || lower.includes('face on')) return 'face-on';
  if (lower.includes('completely round') || lower.includes('round')) return 'round';
  if (lower.includes('cigar')) return 'cigar';
  if (lower.includes('in-between') || lower.includes('elliptical')) return 'elliptical';
  if (lower.includes('box') || lower.includes('peanut')) return 'bulge-boxy';
  if (lower.includes('no bulge') || lower.includes('no central bulge')) return 'bulge-none';
  if (lower.includes('bulge')) return 'bulge-round';
  if (lower.includes('strong bar')) return 'bar-strong';
  if (lower.includes('weak bar')) return 'bar-weak';
  if (lower.includes('no bar')) return 'bar-none';
  if (lower.includes('tight')) return 'wind-tight';
  if (lower.includes('medium')) return 'wind-medium';
  if (lower.includes('loose') || lower.includes('open')) return 'wind-loose';
  if (lower.includes('spiral')) return 'spiral-yes';
  if (lower.includes('dust')) return 'ring-dust';
  if (lower.includes('ring')) return 'ring-only';
  if (lower.includes('merger') || lower.includes('merging') || lower.includes('bridge')) {
    return 'merger';
  }
  if (lower.includes('tidal') || lower.includes('shell') || lower.includes('disturb')) {
    return 'tidal-shells';
  }
  if (lower.includes('none') || lower.includes('no ')) return 'none';
  return 'features-disk';
}

function extractShortTitle(taskId: string, question: string): string {
  const cleaned = stripMarkdownForSummary(question);
  if (!cleaned) return `Task ${taskId}`;
  const firstClause = cleaned.split(/[?:.]/)[0]?.trim() ?? cleaned;
  return firstClause.length > 44 ? `${firstClause.slice(0, 41).trim()}...` : firstClause;
}

export function adaptPanoptesWorkflow(
  rawWorkflow: RawPanoptesWorkflowResource,
  rawFieldGuide?: RawPanoptesFieldGuideResource | null,
  sourceKind: 'panoptes-live' | 'panoptes-json' = 'panoptes-json',
): PanoptesAdaptResult {
  if (!isRecord(rawWorkflow) || !isRecord(rawWorkflow.tasks)) {
    return { error: 'Workflow JSON is missing a valid "tasks" object.' };
  }

  const rawTasks = rawWorkflow.tasks as Readonly<Record<string, RawPanoptesTask>>;
  const strings = isRecord(rawWorkflow.strings)
    ? (rawWorkflow.strings as Readonly<Record<string, string>>)
    : undefined;

  const firstTask =
    typeof rawWorkflow.first_task === 'string' && rawWorkflow.first_task.trim().length > 0
      ? rawWorkflow.first_task.trim()
      : Object.keys(rawTasks)[0] ?? '';

  if (!firstTask || !rawTasks[firstTask]) {
    return { error: `Workflow first_task "${firstTask}" does not exist in tasks.` };
  }

  const firstRawTask = rawTasks[firstTask];
  if (!firstRawTask || firstRawTask.type !== 'single') {
    return {
      error: `Entry task "${firstTask}" has unsupported type "${String(firstRawTask?.type)}". Sky Garden currently adapts Panoptes single-choice trees.`,
    };
  }

  const singleTaskIds = new Set<string>();
  const skippedTaskIds: string[] = [];
  const warnings: string[] = [];

  for (const [taskId, taskDef] of Object.entries(rawTasks)) {
    if (isRecord(taskDef) && taskDef.type === 'single' && Array.isArray(taskDef.answers)) {
      singleTaskIds.add(taskId);
    } else {
      skippedTaskIds.push(taskId);
      const kind = isRecord(taskDef) ? String(taskDef.type ?? 'unknown') : 'invalid';
      warnings.push(`Skipped non-single task "${taskId}" (${kind}); routes end safely before it.`);
    }
  }

  const adaptedTasks: Record<string, PanoptesSingleTask> = {};

  for (const taskId of singleTaskIds) {
    const rawTask = rawTasks[taskId]!;
    const question = resolvePanoptesString(rawTask.question, strings).trim() || `Task ${taskId}`;
    const helpMarkdown = resolvePanoptesString(rawTask.help, strings).trim();
    const rawAnswers: readonly RawPanoptesAnswer[] = Array.isArray(rawTask.answers)
      ? rawTask.answers
      : [];

    const answers: PanoptesAnswerOption[] = rawAnswers.map((ans, idx) => {
      const label =
        resolvePanoptesString(ans?.label, strings).trim() || `Choice ${idx + 1}`;
      const rawNext = typeof ans?.next === 'string' ? ans.next.trim() : '';
      let next = '';
      if (rawNext.length > 0) {
        if (singleTaskIds.has(rawNext)) {
          next = rawNext;
        } else {
          warnings.push(
            `Answer "${label}" on ${taskId} referenced skipped/missing task "${rawNext}"; converted to final step.`,
          );
        }
      }
      return {
        label,
        hint: next ? `Continues to ${next}` : 'Completes classification trail',
        icon: inferAnswerIcon(label),
        next,
      };
    });

    if (answers.length === 0) {
      warnings.push(`Skipped task "${taskId}" because it defines no answers.`);
      continue;
    }

    adaptedTasks[taskId] = {
      type: 'single',
      shortTitle: extractShortTitle(taskId, question),
      question,
      helpTip: helpMarkdown
        ? ''
        : 'Inspect this survey subject with ungated Zoom, Invert, and Optical Stretch before choosing an answer.',
      ...(helpMarkdown ? { helpMarkdown } : {}),
      fieldGuide: [],
      answers,
    };
  }

  if (!adaptedTasks[firstTask]) {
    return { error: `Entry task "${firstTask}" has no valid choices to render.` };
  }

  const projectFieldGuide: PanoptesProjectGuideItem[] = [];
  if (rawFieldGuide && Array.isArray(rawFieldGuide.items)) {
    for (const item of rawFieldGuide.items) {
      if (!isRecord(item)) continue;
      const title = resolvePanoptesString(item.title, strings).trim();
      const contentMarkdown = resolvePanoptesString(item.content, strings).trim();
      if (title || contentMarkdown) {
        projectFieldGuide.push({
          title: title || 'Field Guide Note',
          contentMarkdown,
        });
      }
    }
  }

  const id =
    rawWorkflow.id !== undefined && String(rawWorkflow.id).trim().length > 0
      ? String(rawWorkflow.id).trim()
      : 'panoptes-preview';
  const version =
    typeof rawWorkflow.version === 'string' && rawWorkflow.version.trim().length > 0
      ? rawWorkflow.version.trim()
      : '1.0';
  const displayName =
    typeof rawWorkflow.display_name === 'string' && rawWorkflow.display_name.trim().length > 0
      ? rawWorkflow.display_name.trim()
      : `Panoptes Workflow #${id}`;
  const rawLinks = isRecord(rawWorkflow.links) ? rawWorkflow.links : undefined;
  const projectId =
    rawLinks && rawLinks.project !== undefined ? String(rawLinks.project) : undefined;

  return {
    workflow: Object.freeze<PanoptesWorkflow>({
      id,
      version,
      display_name: displayName,
      first_task: firstTask,
      sourceKind,
      sourceLabel:
        sourceKind === 'panoptes-live'
          ? `Read-Only Panoptes Preview (#${id})`
          : `Imported Panoptes JSON (#${id})`,
      ...(projectId ? { projectId } : {}),
      ...(projectFieldGuide.length > 0 ? { projectFieldGuide } : {}),
      tasks: adaptedTasks,
    }),
    warnings,
    skippedTaskIds,
  };
}

export function parsePanoptesWorkflowJson(rawJsonText: string): PanoptesAdaptResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJsonText);
  } catch {
    return { error: 'Pasted text is not valid JSON.' };
  }

  if (!isRecord(parsed)) {
    return { error: 'Expected a JSON object or Panoptes API envelope ({ workflows: [...] }).' };
  }

  let rawWorkflow: unknown = parsed;
  let rawFieldGuide: RawPanoptesFieldGuideResource | null = null;

  if (Array.isArray(parsed.workflows)) {
    if (parsed.workflows.length === 0) {
      return { error: 'Panoptes "workflows" array is empty.' };
    }
    rawWorkflow = parsed.workflows[0];
  }

  if (Array.isArray(parsed.field_guides) && parsed.field_guides.length > 0) {
    rawFieldGuide = parsed.field_guides[0] as RawPanoptesFieldGuideResource;
  }

  return adaptPanoptesWorkflow(
    rawWorkflow as RawPanoptesWorkflowResource,
    rawFieldGuide,
    'panoptes-json',
  );
}

export async function fetchPublicPanoptesWorkflow(
  workflowIdInput: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PanoptesAdaptResult> {
  const workflowId = workflowIdInput.trim();
  if (!PANOPTES_WORKFLOW_ID_REGEX.test(workflowId)) {
    return { error: 'Enter a numeric public Zooniverse workflow ID (e.g. 5733 or 20751).' };
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.api+json; version=1',
  };

  let workflowPayload: unknown;
  try {
    const res = await fetchImpl(
      `https://www.zooniverse.org/api/workflows/${encodeURIComponent(workflowId)}`,
      {
        method: 'GET',
        headers,
      },
    );
    if (!res.ok) {
      return { error: `Zooniverse API returned HTTP ${res.status} for workflow #${workflowId}.` };
    }
    workflowPayload = await res.json();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'network request failed';
    return { error: `Could not fetch workflow #${workflowId} (${msg}).` };
  }

  if (!isRecord(workflowPayload) || !Array.isArray(workflowPayload.workflows)) {
    return { error: 'Unexpected JSON shape from Zooniverse /api/workflows endpoint.' };
  }
  const rawWorkflow = workflowPayload.workflows[0] as RawPanoptesWorkflowResource | undefined;
  if (!rawWorkflow) {
    return { error: `Workflow #${workflowId} was not found in the response.` };
  }

  let rawFieldGuide: RawPanoptesFieldGuideResource | null = null;
  const projectId =
    rawWorkflow.links && rawWorkflow.links.project !== undefined
      ? String(rawWorkflow.links.project)
      : '';
  if (/^\d+$/.test(projectId)) {
    try {
      const fgRes = await fetchImpl(
        `https://www.zooniverse.org/api/field_guides?project_id=${encodeURIComponent(projectId)}`,
        {
          method: 'GET',
          headers,
        },
      );
      if (fgRes.ok) {
        const fgPayload = await fgRes.json();
        if (isRecord(fgPayload) && Array.isArray(fgPayload.field_guides)) {
          rawFieldGuide = (fgPayload.field_guides[0] as RawPanoptesFieldGuideResource) ?? null;
        }
      }
    } catch {
      // Project Field Guide enrichment is best-effort and non-fatal.
    }
  }

  return adaptPanoptesWorkflow(rawWorkflow, rawFieldGuide, 'panoptes-live');
}
