export const SERMON_FLOW_STEPS = [
  { key: "study", label: "Study", fullLabel: "Study & Context", page: "/study" },
  { key: "builder", label: "Builder", fullLabel: "Sermon Structure", page: "/builder" },
  { key: "illustrations", label: "Illustrations", fullLabel: "Illustrations", page: "/illustrations" },
  { key: "application", label: "Application", fullLabel: "Applications", page: "/application" },
  { key: "final", label: "Final", fullLabel: "Final Sermon", page: "/final" },
];

export function getSermonFlowStatus(week, index) {
  if (!week) return "locked";
  const key = SERMON_FLOW_STEPS[index].key;
  const done = key === "final" ? !!week.application : !!week[key];
  if (done) return "done";
  const previousStepDone = index === 0 || !!(index === SERMON_FLOW_STEPS.length - 1
    ? week.application
    : week[SERMON_FLOW_STEPS[index - 1].key]);
  return previousStepDone ? "current" : "locked";
}

export function getCompletedSermonFlowCount(week) {
  if (!week) return 0;
  return SERMON_FLOW_STEPS.filter((_, index) => getSermonFlowStatus(week, index) === "done").length;
}

export function getNextSermonFlowStep(week) {
  for (let index = 0; index < SERMON_FLOW_STEPS.length; index += 1) {
    if (getSermonFlowStatus(week, index) === "current") {
      return SERMON_FLOW_STEPS[index];
    }
  }
  return null;
}

export function upsertCurrentWeekStep(state, stepKey, content) {
  if (!state?.series?.length) return state;

  const activeSerieIndex = state.series.findIndex((s) => !s.is_archived);
  const targetIndex = activeSerieIndex >= 0 ? activeSerieIndex : 0;

  return {
    ...state,
    series: state.series.map((serie, serieIndex) => {
      if (serieIndex !== targetIndex) return serie;
      const weekIndex = (serie.current_week || 1) - 1;
      return {
        ...serie,
        weeks: (serie.weeks || []).map((week, index) => {
          if (index !== weekIndex) return week;
          return {
            ...week,
            [stepKey]: {
              ...(week[stepKey] || {}),
              content,
              is_active: true,
            },
          };
        }),
      };
    }),
  };
}
