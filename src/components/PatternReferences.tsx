import type { Language, PatternListItem } from "@/types";
import type { CopyDict } from "@/lib/copy";

/** Reference text comes only from the source-validated pattern database. */
export function PatternReferences({ pattern, language, copy }: { pattern: PatternListItem; language: Exclude<Language, "zh">; copy: CopyDict }) {
  const origin = pattern.origin;
  return <section className="space-y-4 border-t border-line p-4">
    <h3 className="text-caption font-semibold text-primary">{copy.referencesTitle}</h3>
    {([
      [copy.descriptionLabel, pattern[`description_${language}`]],
      [copy.patternMeaningTitle, pattern[`meaning_${language}`]],
      [copy.originLabel, origin?.[`text_${language}`]],
    ] as const).map(([label, text]) => <div key={label}>
      <h4 className="text-caption font-medium text-text-secondary">{label}</h4>
      <p className="mt-1 whitespace-pre-line text-body">{text?.trim() || copy.noReference}</p>
    </div>)}
    {pattern.source ? <Source source={pattern.source} /> : null}
    {origin?.source ? <Source source={origin.source} /> : null}
    <div><h4 className="text-caption font-medium text-text-secondary">{copy.worksLabel}</h4>
      {pattern.representative_works?.length ? <ul className="mt-2 space-y-3">{pattern.representative_works.map((work, index) => <li key={index}>
        <a className="underline" href={work.source_url} target="_blank" rel="noreferrer">{work.title}</a>
        <p className="text-caption text-text-secondary">{work.holder} · {work.date}</p>
      </li>)}</ul> : <p className="mt-1 text-body">{copy.noReference}</p>}
    </div>
  </section>;
}
function Source({ source }: { source: { organization: string; title: string; url: string } }) {
  return <p className="text-caption text-text-secondary"><a href={source.url} target="_blank" rel="noreferrer" className="underline">{source.organization} · {source.title}</a></p>;
}
