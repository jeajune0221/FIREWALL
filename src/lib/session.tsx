"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  VisualObservation,
  ColorId,
  GeneratedContent,
  Language,
  PatternCandidate,
  ProductTypeId,
  UiLanguage,
  VisualFeatureId,
} from "@/types";
import {
  DEFAULT_LANGUAGE,
  DEFAULT_UI_LANGUAGE,
  isLanguage,
  UI_LANGUAGES,
} from "@/types";

const STORAGE_KEY = "ai-pottery-story:session";

export type Step = "upload" | "analyze" | "verify" | "story" | "result";

/** DESIGN.md 27번 항목 — 사진 Binary는 저장하지 않고 서버 image_id만 저장한다. */
type SessionState = {
  observation: VisualObservation | null;
  imageId: string | null;
  previewUrl: string | null;
  patternCandidates: PatternCandidate[];
  productTypeId: ProductTypeId | null;
  colorIds: ColorId[];
  visualFeatureIds: VisualFeatureId[];
  patternId: string | null;
  artisanStoryOriginal: string;
  currentStep: Step;
  selectedContentLanguage: Language;
  uiLanguage: UiLanguage;
  generatedContentCache: Partial<Record<Language, GeneratedContent>>;
};

const EMPTY_STATE: SessionState = {
  observation: null,
  imageId: null,
  previewUrl: null,
  patternCandidates: [],
  productTypeId: null,
  colorIds: [],
  visualFeatureIds: [],
  patternId: null,
  artisanStoryOriginal: "",
  currentStep: "upload",
  selectedContentLanguage: DEFAULT_LANGUAGE,
  uiLanguage: DEFAULT_UI_LANGUAGE,
  generatedContentCache: {},
};

type AnalysisResult = {
  observation: VisualObservation;
  imageId: string;
  productTypeId: ProductTypeId;
  colorIds: ColorId[];
  visualFeatureIds: VisualFeatureId[];
  patternCandidates: PatternCandidate[];
};

type SessionContextValue = SessionState & {
  hydrated: boolean;
  hasAnalysis: boolean;
  setPreview: (previewUrl: string) => void;
  setImageId: (imageId: string | null) => void;
  setAnalysis: (result: AnalysisResult) => void;
  setProductType: (productTypeId: ProductTypeId) => void;
  setColorIds: (colorIds: ColorId[]) => void;
  setVisualFeatureIds: (featureIds: VisualFeatureId[]) => void;
  setPatternId: (patternId: string | null) => void;
  setArtisanStory: (story: string) => void;
  setStep: (step: Step) => void;
  setContentLanguage: (language: Language) => void;
  setUiLanguage: (language: UiLanguage) => void;
  cacheContent: (language: Language, content: GeneratedContent) => void;
  clearContentCache: () => void;
  reset: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<SessionState>;
        const uiLanguage = UI_LANGUAGES.includes(parsed.uiLanguage as UiLanguage)
          ? parsed.uiLanguage as UiLanguage
          : DEFAULT_UI_LANGUAGE;
        setState({
          ...EMPTY_STATE,
          ...parsed,
          uiLanguage,
          selectedContentLanguage: isLanguage(parsed.selectedContentLanguage)
            ? parsed.selectedContentLanguage
            : uiLanguage,
        });
      }
    } catch {
      // 저장값이 깨졌으면 빈 상태로 시작한다.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = state.uiLanguage;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // 저장 실패해도 현재 세션 진행은 막지 않는다.
    }
  }, [state, hydrated]);

  // 관찰값·문양·이야기가 바뀌면 생성 캐시를 전부 버린다. (DESIGN.md 24번 항목)
  const withClearedCache = useCallback(
    (patch: Partial<SessionState>) => (prev: SessionState) => ({
      ...prev,
      ...patch,
      generatedContentCache: {},
    }),
    [],
  );

  const setPreview = useCallback((previewUrl: string) => {
    setState((prev) => ({ ...prev, previewUrl }));
  }, []);

  // 사진이 바뀌면 이전 분석 결과와 생성 결과는 모두 버린다.
  const setImageId = useCallback((imageId: string | null) => {
    setState((prev) => ({
      ...prev,
      imageId,
      observation: null,
      productTypeId: null,
      colorIds: [],
      visualFeatureIds: [],
      patternCandidates: [],
      patternId: null,
      currentStep: "upload",
      generatedContentCache: {},
    }));
  }, []);

  const setAnalysis = useCallback(
    (result: AnalysisResult) => {
      setState(
        withClearedCache({
          observation: result.observation,
          imageId: result.imageId,
          previewUrl: `/api/image/${result.imageId}`,
          productTypeId: result.productTypeId,
          colorIds: result.colorIds,
          visualFeatureIds: result.visualFeatureIds,
          patternCandidates: result.patternCandidates,
          patternId: null,
          currentStep: "verify",
        }),
      );
    },
    [withClearedCache],
  );

  const setProductType = useCallback(
    (productTypeId: ProductTypeId) => setState(withClearedCache({ productTypeId })),
    [withClearedCache],
  );

  const setColorIds = useCallback(
    (colorIds: ColorId[]) => setState(withClearedCache({ colorIds })),
    [withClearedCache],
  );

  const setVisualFeatureIds = useCallback(
    (visualFeatureIds: VisualFeatureId[]) =>
      setState(withClearedCache({ visualFeatureIds })),
    [withClearedCache],
  );

  const setPatternId = useCallback(
    (patternId: string | null) => setState(withClearedCache({ patternId })),
    [withClearedCache],
  );

  const setArtisanStory = useCallback(
    (artisanStoryOriginal: string) =>
      setState(withClearedCache({ artisanStoryOriginal })),
    [withClearedCache],
  );

  const setStep = useCallback((currentStep: Step) => {
    setState((prev) => ({ ...prev, currentStep }));
  }, []);

  const setContentLanguage = useCallback((selectedContentLanguage: Language) => {
    setState((prev) => ({ ...prev, selectedContentLanguage }));
  }, []);

  const setUiLanguage = useCallback((uiLanguage: UiLanguage) => {
    setState((prev) => ({ ...prev, uiLanguage, selectedContentLanguage: uiLanguage }));
  }, []);

  const cacheContent = useCallback((language: Language, content: GeneratedContent) => {
    setState((prev) => ({
      ...prev,
      generatedContentCache: { ...prev.generatedContentCache, [language]: content },
    }));
  }, []);

  const clearContentCache = useCallback(() => {
    setState((prev) => ({ ...prev, generatedContentCache: {} }));
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({ ...EMPTY_STATE, uiLanguage: prev.uiLanguage }));
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // 무시
    }
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      ...state,
      hydrated,
      hasAnalysis: state.imageId !== null && state.productTypeId !== null,
      setPreview,
      setImageId,
      setAnalysis,
      setProductType,
      setColorIds,
      setVisualFeatureIds,
      setPatternId,
      setArtisanStory,
      setStep,
      setContentLanguage,
      setUiLanguage,
      cacheContent,
      clearContentCache,
      reset,
    }),
    [
      state,
      hydrated,
      setPreview,
      setImageId,
      setAnalysis,
      setProductType,
      setColorIds,
      setVisualFeatureIds,
      setPatternId,
      setArtisanStory,
      setStep,
      setContentLanguage,
      setUiLanguage,
      cacheContent,
      clearContentCache,
      reset,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside SessionProvider");
  }
  return context;
}
