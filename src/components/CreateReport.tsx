"use client";

import { ShieldWarning } from "@phosphor-icons/react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useI18n } from "@/i18n";
import { categoryLabel } from "@/i18n/messages";
import { DESCRIPTION_MAX, EMPTY_DESCRIPTION } from "@/lib/config";
import { fmt, parseCoordinate } from "@/lib/format";
import { reportHref } from "@/lib/paths";
import { DEFAULT_PERSONA_KEY, PERSONAS } from "@/lib/personas";
import { useCategories, useCreateReport } from "@/lib/queries";
import { missingFields } from "@/lib/submit";
import { SIZES, type Size } from "@/lib/types";
import { PointPicker } from "./map/PointPicker";
import { Button, ButtonLink } from "./ui/Button";
import { StatusChip } from "./ui/Chips";
import { Field } from "./ui/Field";
import { PhotoTile } from "./ui/PhotoTile";
import { ErrorState, Skeleton, Toast } from "./ui/States";

/** S2 report creation. No gallery, no file picker (ADR-0005); the photo is a placeholder tile. */
export function CreateReport() {
  const { locale, m } = useI18n();
  const uid = useId();
  const categories = useCategories();
  const mutation = useCreateReport();

  const [hasPhoto, setHasPhoto] = useState(false);
  const [category, setCategory] = useState("");
  const [size, setSize] = useState<Size>("medium");
  const [latText, setLatText] = useState("");
  const [lngText, setLngText] = useState("");
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [personaKey, setPersonaKey] = useState(DEFAULT_PERSONA_KEY);

  const lat = parseCoordinate(latText, 90);
  const lng = parseCoordinate(lngText, 180);
  const point = lat !== null && lng !== null ? { lat, lng } : null;
  const latInvalid = latText.trim() !== "" && lat === null;
  const lngInvalid = lngText.trim() !== "" && lng === null;

  const selected = useMemo(
    () => categories.data?.items.find((item) => item.code === category),
    [categories.data, category],
  );
  const missing = missingFields({ hasPhoto, hasPoint: point !== null, category });
  const submitting = mutation.isPending;
  const blocked = missing.length > 0 || submitting;

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (missing.length > 0 || submitting || !point) return;
    const persona = PERSONAS.find((item) => item.key === personaKey) ?? PERSONAS[0];
    mutation.mutate({
      actorId: persona.actorId,
      input: {
        category,
        size,
        lat: point.lat,
        lng: point.lng,
        description: description.trim() || EMPTY_DESCRIPTION,
        anonymous,
      },
    });
  }

  function reset() {
    mutation.reset();
    setHasPhoto(false);
    setCategory("");
    setSize("medium");
    setLatText("");
    setLngText("");
    setDescription("");
    setAnonymous(false);
  }

  if (mutation.data) {
    const created = mutation.data;
    return (
      <div className="kg-page kg-page--narrow">
        <h1 className="kg-display">{m.create.title}</h1>
        <Toast title={m.create.successTitle}>
          <p className="kg-body-small">
            {m.create.successStatus}: <StatusChip status={created.status} />
          </p>
        </Toast>
        <div className="kg-actions">
          <ButtonLink href={reportHref(created.id)} variant="primary">
            {m.create.successOpen}
          </ButtonLink>
          <Button onClick={reset}>{m.create.successAnother}</Button>
          <Link href="/map" className="kg-link">
            {m.create.successToMap}
          </Link>
        </div>
      </div>
    );
  }

  const reasonId = `${uid}-reason`;
  const coordsError = latInvalid || lngInvalid ? m.create.coordsInvalid : undefined;

  return (
    <div className="kg-page">
      <h1 className="kg-display">{m.create.title}</h1>
      <p className="kg-mono-data kg-muted">{m.demo.screenLine}</p>

      <form className="kg-form" onSubmit={submit} noValidate>
        <div className="kg-grid-2">
          <section className="kg-fieldset" aria-labelledby={`${uid}-photo`}>
            <h2 className="kg-label" id={`${uid}-photo`}>
              {m.create.photoLabel}
            </h2>
            {hasPhoto ? (
              <>
                <PhotoTile caption={m.create.photoNote} />
                <div>
                  <Button onClick={() => setHasPhoto(false)}>{m.create.photoRemove}</Button>
                </div>
              </>
            ) : (
              <>
                <p className="kg-help">{m.create.photoNote}</p>
                <div>
                  <Button onClick={() => setHasPhoto(true)}>{m.create.photoAdd}</Button>
                </div>
              </>
            )}
          </section>

          <div className="kg-fieldset">
            {categories.isError ? (
              <ErrorState error={categories.error} onRetry={() => void categories.refetch()} />
            ) : categories.isPending ? (
              <Skeleton label={m.create.categoriesLoading} />
            ) : (
              <Field
                id={`${uid}-category`}
                label={m.create.categoryLabel}
                helper={
                  selected?.hidden_from_volunteers ? (
                    <span className="kg-note">
                      <ShieldWarning className="kg-icon" weight="light" aria-hidden="true" />
                      {m.create.notVolunteer}
                    </span>
                  ) : undefined
                }
              >
                <select
                  id={`${uid}-category`}
                  className="kg-select"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  aria-describedby={selected?.hidden_from_volunteers ? `${uid}-category-help` : undefined}
                  required
                >
                  <option value="">{m.create.categoryPlaceholder}</option>
                  {categories.data?.items.map((item) => (
                    <option key={item.code} value={item.code}>
                      {categoryLabel(item, locale)}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field id={`${uid}-size`} label={m.create.sizeLabel}>
              <select
                id={`${uid}-size`}
                className="kg-select"
                value={size}
                onChange={(event) => setSize(event.target.value as Size)}
              >
                {SIZES.map((code) => (
                  <option key={code} value={code}>
                    {m.size[code]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <section className="kg-fieldset" aria-labelledby={`${uid}-point`}>
          <h2 className="kg-label" id={`${uid}-point`}>
            {m.create.pointLabel}
          </h2>
          <p className="kg-help">{m.create.pointHint}</p>
          <PointPicker
            point={point}
            onPick={(pickedLat, pickedLng) => {
              setLatText(String(pickedLat));
              setLngText(String(pickedLng));
            }}
          />
          <div className="kg-grid-2 kg-grid-2--tight">
            <Field id={`${uid}-lat`} label={m.create.lat}>
              <input
                id={`${uid}-lat`}
                className="kg-input kg-input--mono"
                inputMode="decimal"
                autoComplete="off"
                value={latText}
                onChange={(event) => setLatText(event.target.value)}
                aria-invalid={latInvalid || undefined}
                aria-describedby={latInvalid ? `${uid}-coords-error` : undefined}
              />
            </Field>
            <Field id={`${uid}-lng`} label={m.create.lng}>
              <input
                id={`${uid}-lng`}
                className="kg-input kg-input--mono"
                inputMode="decimal"
                autoComplete="off"
                value={lngText}
                onChange={(event) => setLngText(event.target.value)}
                aria-invalid={lngInvalid || undefined}
                aria-describedby={lngInvalid ? `${uid}-coords-error` : undefined}
              />
            </Field>
          </div>
          {coordsError ? (
            <p className="kg-error-text" id={`${uid}-coords-error`} role="alert">
              {coordsError}
            </p>
          ) : null}
        </section>

        <Field
          id={`${uid}-description`}
          label={m.create.descriptionLabel}
          helper={
            <>
              {fmt(m.create.descriptionHelp, { max: DESCRIPTION_MAX })}{" "}
              <span className="kg-mono">
                {fmt(m.create.descriptionCounter, { count: description.length, max: DESCRIPTION_MAX })}
              </span>
            </>
          }
        >
          <textarea
            id={`${uid}-description`}
            className="kg-textarea"
            value={description}
            maxLength={DESCRIPTION_MAX}
            onChange={(event) => setDescription(event.target.value)}
            aria-describedby={`${uid}-description-help`}
          />
        </Field>

        <div className="kg-check">
          <input
            id={`${uid}-anonymous`}
            type="checkbox"
            className="kg-check__box"
            checked={anonymous}
            onChange={(event) => setAnonymous(event.target.checked)}
            aria-describedby={`${uid}-anonymous-help`}
          />
          <div>
            <label className="kg-check__label" htmlFor={`${uid}-anonymous`}>
              {m.create.anonymousLabel}
            </label>
            <p className="kg-help" id={`${uid}-anonymous-help`}>
              {m.create.anonymousHelp}
            </p>
          </div>
        </div>

        <Field id={`${uid}-persona`} label={m.create.personaLabel} helper={m.create.personaHelp}>
          <select
            id={`${uid}-persona`}
            className="kg-select"
            value={personaKey}
            onChange={(event) => setPersonaKey(event.target.value)}
            aria-describedby={`${uid}-persona-help`}
          >
            {PERSONAS.map((persona) => (
              <option key={persona.key} value={persona.key}>
                {persona.name}
              </option>
            ))}
          </select>
        </Field>

        {mutation.isError ? (
          <ErrorState error={mutation.error} onRetry={() => submit()} />
        ) : null}

        <div className="kg-submit">
          <Button
            type="submit"
            variant="primary"
            disabled={blocked}
            aria-describedby={missing.length > 0 ? reasonId : undefined}
          >
            {submitting ? m.create.submitting : m.create.submit}
          </Button>
          {missing.length > 0 ? (
            <p className="kg-help kg-submit__reason" id={reasonId}>
              {m.create.missingPrefix} {missing.map((field) => m.create.missing[field]).join(", ")}.
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
