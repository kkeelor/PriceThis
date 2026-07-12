import {
  refineImageValuationWithClaude,
  refineTextValuationWithClaude,
  scanImageLegacy,
  scanImageWithClaude,
  scanTextLegacy,
  scanTextWithClaude,
} from './claude.js';
import {
  refineImageValuationWithGemini,
  refineTextValuationWithGemini,
  scanImageWithGemini,
  scanTextWithGemini,
} from './gemini.js';
import {
  evaluateIdGate,
  evaluateValueGate,
  getGateConfig,
  isPipelineEnabled,
  normalizeScanResponse,
  type IdGateResult,
  type ValueGateResult,
} from './scan-gates.js';
import { isGeminiConfigured, resolveScanTarget, type ScanProvider } from './resolve-scan.js';
import type { ScanApiResponse } from './types.js';
import { isWebSearchEnabled } from './web-search.js';

export type PipelineMeta = {
  enabled: boolean;
  provider: ScanProvider;
  stages: string[];
  idGate: IdGateResult;
  valueGate: ValueGateResult | 'skipped';
  searchUsed: boolean;
  inferenceCalls: number;
  /** @deprecated Use inferenceCalls */
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
    identificationConfidence: refined.identificationConfidence,
    valuationConfidence: refined.valuationConfidence,
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

async function runStage1Image(
  target: ReturnType<typeof resolveScanTarget>,
  params: { imageBase64: string } & SharedScanParams,
): Promise<ScanApiResponse> {
  if (target.provider === 'gemini') {
    if (!isGeminiConfigured()) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    return scanImageWithGemini({
      ...params,
      model: target.modelId,
    });
  }

  return scanImageWithClaude({
    ...params,
    enableWebSearch: false,
  });
}

async function runStage1Text(
  target: ReturnType<typeof resolveScanTarget>,
  params: { query: string } & SharedScanParams,
): Promise<ScanApiResponse> {
  if (target.provider === 'gemini') {
    if (!isGeminiConfigured()) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    return scanTextWithGemini({
      ...params,
      model: target.modelId,
    });
  }

  return scanTextWithClaude({
    ...params,
    enableWebSearch: false,
  });
}

async function runPipelineAfterStage1(
  modality: 'image' | 'text',
  stage1: ScanApiResponse,
  target: ReturnType<typeof resolveScanTarget>,
  params: SharedScanParams,
  searchRunner: () => Promise<ScanApiResponse>,
): Promise<PipelineScanResult> {
  const started = Date.now();
  const config = getGateConfig();
  const normalizedStage1 = normalizeScanResponse(stage1);
  const idGate = evaluateIdGate(normalizedStage1, config);

  const meta: PipelineMeta = {
    enabled: true,
    provider: target.provider,
    stages: ['stage1'],
    idGate,
    valueGate: 'skipped',
    searchUsed: false,
    inferenceCalls: 1,
    claudeCalls: target.provider === 'claude' ? 1 : 0,
    durationMs: 0,
  };

  if (idGate !== 'pass') {
    meta.durationMs = Date.now() - started;
    logPipelineTelemetry({ ...meta, modality });
    return { result: normalizedStage1, pipeline: meta };
  }

  const valueGate = evaluateValueGate(normalizedStage1, config);
  meta.valueGate = valueGate;

  const shouldSearch =
    valueGate === 'fail' &&
    (target.provider === 'claude' ? isWebSearchEnabled() : true);

  if (!shouldSearch) {
    meta.durationMs = Date.now() - started;
    logPipelineTelemetry({ ...meta, modality });
    return { result: normalizedStage1, pipeline: meta };
  }

  meta.stages.push(target.provider === 'claude' ? 'stage3-search' : 'stage3-refine');
  const refined = normalizeScanResponse(await searchRunner());
  meta.searchUsed = target.provider === 'claude';
  meta.inferenceCalls = 2;
  meta.claudeCalls = target.provider === 'claude' ? 2 : 0;
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
  const target = resolveScanTarget(params.model);

  if (!isPipelineEnabled()) {
    const started = Date.now();
    const result =
      target.provider === 'gemini'
        ? normalizeScanResponse(
            await scanImageWithGemini({ ...params, model: target.modelId }),
          )
        : normalizeScanResponse(await scanImageLegacy(params));
    const pipeline: PipelineMeta = {
      enabled: false,
      provider: target.provider,
      stages: ['legacy'],
      idGate: 'pass',
      valueGate: 'skipped',
      searchUsed: target.provider === 'claude' && isWebSearchEnabled(),
      inferenceCalls: 1,
      claudeCalls: target.provider === 'claude' ? 1 : 0,
      durationMs: Date.now() - started,
    };
    logPipelineTelemetry({ ...pipeline, modality: 'image' });
    return { result, pipeline };
  }

  const stage1 = await runStage1Image(target, params);

  return runPipelineAfterStage1(
    'image',
    stage1,
    target,
    params,
    () =>
      target.provider === 'gemini'
        ? refineImageValuationWithGemini({
            imageBase64: params.imageBase64,
            stage1: normalizeScanResponse(stage1),
            locale: params.locale,
            currencyCode: params.currencyCode,
            countryCode: params.countryCode,
            model: target.modelId,
          })
        : refineImageValuationWithClaude({
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
  const target = resolveScanTarget(params.model);

  if (!isPipelineEnabled()) {
    const started = Date.now();
    const result =
      target.provider === 'gemini'
        ? normalizeScanResponse(
            await scanTextWithGemini({ ...params, model: target.modelId }),
          )
        : normalizeScanResponse(await scanTextLegacy(params));
    const pipeline: PipelineMeta = {
      enabled: false,
      provider: target.provider,
      stages: ['legacy'],
      idGate: 'pass',
      valueGate: 'skipped',
      searchUsed: target.provider === 'claude' && isWebSearchEnabled(),
      inferenceCalls: 1,
      claudeCalls: target.provider === 'claude' ? 1 : 0,
      durationMs: Date.now() - started,
    };
    logPipelineTelemetry({ ...pipeline, modality: 'text' });
    return { result, pipeline };
  }

  const stage1 = await runStage1Text(target, params);

  return runPipelineAfterStage1(
    'text',
    stage1,
    target,
    params,
    () =>
      target.provider === 'gemini'
        ? refineTextValuationWithGemini({
            query: params.query,
            stage1: normalizeScanResponse(stage1),
            locale: params.locale,
            currencyCode: params.currencyCode,
            countryCode: params.countryCode,
            marketContext: params.marketContext,
            model: target.modelId,
          })
        : refineTextValuationWithClaude({
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
