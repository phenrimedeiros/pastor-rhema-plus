export async function saveVersionedSermonContent(supabase, weekId, step, content) {
  const { data: existingVersions, error: versionsError } = await supabase
    .from("sermon_content")
    .select("id, version, is_active")
    .eq("week_id", weekId)
    .eq("step", step)
    .order("version", { ascending: false });

  if (versionsError) throw versionsError;

  const nextVersion = (existingVersions?.[0]?.version || 0) + 1;

  if (existingVersions?.some((item) => item.is_active)) {
    const { error: deactivateError } = await supabase
      .from("sermon_content")
      .update({ is_active: false })
      .eq("week_id", weekId)
      .eq("step", step)
      .eq("is_active", true);

    if (deactivateError) throw deactivateError;
  }

  const { data, error } = await supabase
    .from("sermon_content")
    .insert([
      {
        week_id: weekId,
        step,
        content,
        version: nextVersion,
        is_active: true,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}
