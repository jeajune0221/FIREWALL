"use client";

import { useState } from "react";
import type { CopyDict } from "@/lib/copy";
import {
  COLORS,
  colorHex,
  colorLabel,
  featureLabel,
  productTypeLabel,
} from "@/lib/taxonomy";
import { PRODUCT_TYPES } from "@/lib/taxonomy";
import type { ColorId, ProductTypeId, UiLanguage, VisualFeatureId } from "@/types";

/**
 * DESIGN.md 11번 항목
 * - 제품 종류는 Dropdown으로 수정
 * - 색상은 미리 정한 색만 선택
 * - 특징은 잘못된 항목만 삭제 가능
 * - 자유 입력 금지
 */
type Props = {
  copy: CopyDict;
  uiLanguage: UiLanguage;
  productTypeId: ProductTypeId;
  colorIds: ColorId[];
  visualFeatureIds: VisualFeatureId[];
  onProductTypeChange: (id: ProductTypeId) => void;
  onColorsChange: (ids: ColorId[]) => void;
  onFeaturesChange: (ids: VisualFeatureId[]) => void;
};

function Chip({
  children,
  onRemove,
  removeLabel,
}: {
  children: React.ReactNode;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <span className="flex h-11 items-center gap-2 rounded-[12px] border border-line bg-surface pl-3 pr-1 text-body">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="flex h-9 w-9 items-center justify-center rounded-[10px] text-text-secondary"
      >
        ×
      </button>
    </span>
  );
}

export function ObservationEditor({
  copy,
  uiLanguage,
  productTypeId,
  colorIds,
  visualFeatureIds,
  onProductTypeChange,
  onColorsChange,
  onFeaturesChange,
}: Props) {
  const [pickingColor, setPickingColor] = useState(false);
  const unusedColors = COLORS.filter((color) => !colorIds.includes(color.id as ColorId));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label
          htmlFor="product-type"
          className="block pb-2 text-caption font-medium text-text-secondary"
        >
          {copy.productType}
        </label>
        <select
          id="product-type"
          value={productTypeId}
          onChange={(event) => onProductTypeChange(event.target.value as ProductTypeId)}
          className="h-[52px] w-full rounded-[12px] border border-line bg-surface px-4 text-text-primary"
        >
          {PRODUCT_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {productTypeLabel(type.id as ProductTypeId, uiLanguage)}
            </option>
          ))}
        </select>
        <p className="field-help">{copy.typeHelp}</p>
      </div>

      <div>
        <p className="pb-2 text-caption font-medium text-text-secondary">
          {copy.mainColors}
        </p>
        <div className="flex flex-wrap gap-2">
          {colorIds.map((id) => (
            <Chip
              key={id}
              removeLabel={`${colorLabel(id, uiLanguage)} ${copy.removeItem}`}
              onRemove={() => onColorsChange(colorIds.filter((item) => item !== id))}
            >
              <span
                className="h-3.5 w-3.5 rounded-full border border-line"
                style={{ backgroundColor: colorHex(id) }}
                aria-hidden
              />
              {colorLabel(id, uiLanguage)}
            </Chip>
          ))}

          {unusedColors.length > 0 && colorIds.length < 3 ? (
            <button
              type="button"
              onClick={() => setPickingColor((open) => !open)}
              aria-expanded={pickingColor}
              className="h-11 rounded-[12px] border border-dashed border-line px-3 text-body text-text-secondary"
            >
              {copy.addColor}
            </button>
          ) : null}
        </div>

        <p className="field-help">{copy.colorHelp}</p>

        {pickingColor ? (
          <div className="mt-2 flex flex-wrap gap-2 rounded-[12px] border border-line bg-surface p-3">
            {unusedColors.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => {
                  onColorsChange([...colorIds, color.id as ColorId]);
                  setPickingColor(false);
                }}
                className="flex h-11 items-center gap-2 rounded-[10px] border border-line px-3 text-body"
              >
                <span
                  className="h-3.5 w-3.5 rounded-full border border-line"
                  style={{ backgroundColor: color.hex }}
                  aria-hidden
                />
                {colorLabel(color.id as ColorId, uiLanguage)}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <p className="pb-2 text-caption font-medium text-text-secondary">
          {copy.visualFeatures}
        </p>
        {visualFeatureIds.length === 0 ? (
          <p className="text-body text-text-secondary">{copy.noFeatures}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {visualFeatureIds.map((id) => (
              <Chip
                key={id}
                removeLabel={`${featureLabel(id, uiLanguage)} ${copy.removeItem}`}
                onRemove={() =>
                  onFeaturesChange(visualFeatureIds.filter((item) => item !== id))
                }
              >
                {featureLabel(id, uiLanguage)}
              </Chip>
            ))}
          </div>
        )}
        <p className="field-help">{copy.featureHelp}</p>
      </div>
    </div>
  );
}
