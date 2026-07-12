import {
  refineImageValuationWithClaude,
  refineTextValuationWithClaude,
  scanImageLegacy,
  scanImageWithClaude,
  scanTextLegacy,
  scanTextWithClaude,
} from './claude.js';
import {
  evaluateIdGate,
  evaluateValueGate,
  getGateConfig,
  isPipelineEnabled,
  normalizeScanResponse,
  type IdGateResult,
  type ValueGateResult,
} from './scan-gates.js';
import type { ScanApiResponse } from './types.js';
import { isWebSearchEnabled } from './web-search.js';

export type PipelineMeta = {
  enabled: boolean;
  stages: string[];
  idGate: IdGateResult;
  valueGate: ValueGateResult | 'skipped';
  searchUsed: boolean;
  claudeCalls: number;
  durationMs: number;
};

export type PipelineScanResult = {
  result: ScanApiResponse;
  pipeline: PipelineMeta;
};

type SharedScanParams = {
  locale: string;
  currencyCode: string;
  countryCode?: string;
  marketContext?: string;
  model?: string;
};

function logPipelineTelemetry(payload: PipelineMeta & { modality: 'image' | 'text' }) {
  console.log(
    JSON.stringify({
      event: 'scan_pipeline',
      ...payload,
    }),
  );
}

function mergeValuation(
  stage1: ScanApiResponse,
  refined: ScanApiResponse,
): ScanApiResponse {
  return normalizeScanResponse({
    ...stage1,
    objectName: refined.objectName || stage1.objectName,
    estimatedValue: refined.estimatedValue,
    currencyCode: refined.currencyCode || stage1.currencyCode,
    confidence: refined.confidence,
    wowInsight: refined.wowInsight || stage1.wowInsight,
    explanation: refined.explanation?.summary
      ? refined.explanation
      : stage1.explanation,
    curiosityCards:
      refined.curiosityCards.length > 0
        ? refined.curiosityCards
        : stage1.curiosityCards,
    alternativeMatches:
      refined.alternativeMatches.length > 0
        ? refined.alternativeMatches
        : stage1.alternativeMatches,
    category: refined.category || stage1.category,
  });
}

async function runPipelineAfterStage1(
  modality: 'image' | 'text',
  stage1: ScanApiResponse,
  params: SharedScanParams,
  searchRunner: () => Promise<ScanApiResponse>,
): Promise<PipelineScanResult> {
  const started = Date.now();
  const config = getGateConfig();
  const normalizedStage1 = normalizeScanResponse(stage1);
  const idGate = evaluateIdGate(normalizedStage1, config);

  const meta: PipelineMeta = {
    enabled: true,
    stages: ['stage1'],
    idGate,
    valueGate: 'skipped',
    searchUsed: false,
    claudeCalls: 1,
    durationMs: 0,
  };

  if (idGate !== 'pass') {
    meta.durationMs = Date.now() - started;
    logPipelineTelemetry({ ...meta, modality });
    return { result: normalizedStage1, pipeline: meta };
  }

  const valueGate = evaluateValueGate(normalizedStage1, config);
  meta.valueGate = valueGate;

  if (valueGate === 'pass' || !isWebSearchEnabled()) {
    meta.durationMs = Date.now() - started;
    logPipelineTelemetry({ ...meta, modality });
    return { result: normalizedStage1, pipeline: meta };
  }

  meta.stages.push('stage3-search');
  const refined = normalizeScanResponse(await searchRunner());
  meta.searchUsed = true;
  meta.claudeCalls = 2;
  meta.durationMs = Date.now() - started;

  logPipelineTelemetry({ ...meta, modality });
  return {
    result: mergeValuation(normalizedStage1, refined),
    pipeline: meta,
  };
}

export async function runImageScanPipeline(params: {
  imageBase64: string;
} & SharedScanParams): Promise<PipelineScanResult> {
  if (!isPipelineEnabled()) {
    const started = Date.now();
    const result = normalizeScanResponse(await scanImageLegacy(params));
    const pipeline: PipelineMeta = {
      enabled: false,
      stages: ['legacy'],
      idGate: 'pass',
      valueGate: 'skipped',
      searchUsed: isWebSearchEnabled(),
      claudeCalls: 1,
      durationMs: Date.now() - started,
    };
    logPipelineTelemetry({ ...pipeline, modality: 'image' });
    return { result, pipeline };
  }

  const stage1 = await scanImageWithClaude({
    ...params,
    enableWebSearch: false,
  });

  return runPipelineAfterStage1(
    'image',
    stage1,
    params,
    () =>
      refineImageValuationWithClaude({
        imageBase64: params.imageBase64,
        stage1: normalizeScanResponse(stage1),
        locale: params.locale,
        currencyCode: params.currencyCode,
        countryCode: params.countryCode,
        model: params.model,
      }),
  );
}

export async function runTextScanPipeline(params: {
  query: string;
} & SharedScanParams): Promise<PipelineScanResult> {
  if (!isPipelineEnabled()) {
    const started = Date.now();
    const result = normalizeScanResponse(await scanTextLegacy(params));
    const pipeline: PipelineMeta = {
      enabled: false,
      stages: ['legacy'],
      idGate: 'pass',
      valueGate: 'skipped',
      searchUsed: isWebSearchEnabled(),
      claudeCalls: 1,
      durationMs: Date.now() - started,
    };
    logPipelineTelemetry({ ...pipeline, modality: 'text' });
    return { result, pipeline };
  }

  const stage1 = await scanTextWithClaude({
    ...params,
    enableWebSearch: false,
  });

  return runPipelineAfterStage1(
    'text',
    stage1,
    params,
    () =>
      refineTextValuationWithClaude({
        query: params.query,
        stage1: normalizeScanResponse(stage1),
        locale: params.locale,
        currencyCode: params.currencyCode,
        countryCode: params.countryCode,
        marketContext: params.marketContext,
        model: params.model,
      }),
  );
}
