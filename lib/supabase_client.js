import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// State cache — lives at module level, persists across page navigations
let _stateCache = null;
let _stateCacheTime = 0;
const STATE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function _invalidate() {
  _stateCache = null;
  _stateCacheTime = 0;
}

const BIBLE_NOTES_LOCAL_KEY = "rhema_bible_notes_v1";

function isBibleNotesSchemaError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    message.includes("could not find the table 'public.bible_notes'") ||
    message.includes('could not find the table "public.bible_notes"') ||
    message.includes('relation "public.bible_notes" does not exist') ||
    message.includes('relation "bible_notes" does not exist')
  );
}

function readLocalBibleNotes() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BIBLE_NOTES_LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalBibleNotes(notes) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BIBLE_NOTES_LOCAL_KEY, JSON.stringify(notes));
}

function getLocalBibleNotesForChapter(userId, lang, bookIdx, chapter) {
  return readLocalBibleNotes().filter((note) => (
    note.user_id === userId &&
    note.lang === lang &&
    note.book_idx === bookIdx &&
    note.chapter === chapter
  ));
}

function sortBibleNotes(notes) {
  return [...notes].sort((a, b) => (
    (a.verse_start - b.verse_start) ||
    String(a.created_at).localeCompare(String(b.created_at))
  ));
}

function bibleNoteLooksSame(left, right) {
  return (
    left.user_id === right.user_id &&
    left.lang === right.lang &&
    left.book_idx === right.book_idx &&
    left.chapter === right.chapter &&
    left.verse_start === right.verse_start &&
    left.verse_end === right.verse_end &&
    left.selected_text === right.selected_text &&
    (left.note || "") === (right.note || "") &&
    (left.highlight_color || "gold") === (right.highlight_color || "gold")
  );
}

function toRemoteBibleNotePayload(note) {
  const payload = { ...note };
  delete payload.id;
  delete payload.local_only;
  delete payload.created_at;
  delete payload.updated_at;

  return {
    ...payload,
    note: payload.note || "",
    ai_context: payload.ai_context || null,
  };
}

async function migrateLocalBibleNotesForChapter(userId, lang, bookIdx, chapter, remoteNotes) {
  const allLocalNotes = readLocalBibleNotes();
  const localNotes = getLocalBibleNotesForChapter(userId, lang, bookIdx, chapter)
    .filter((localNote) => !remoteNotes.some((remoteNote) => bibleNoteLooksSame(localNote, remoteNote)));

  if (localNotes.length === 0) return [];

  const migratedNotes = [];
  const migratedLocalIds = new Set();

  for (const localNote of localNotes) {
    const { data, error } = await supabase
      .from("bible_notes")
      .insert([toRemoteBibleNotePayload(localNote)])
      .select()
      .single();

    if (error) continue;

    migratedNotes.push(data);
    migratedLocalIds.add(localNote.id);
  }

  if (migratedLocalIds.size > 0) {
    writeLocalBibleNotes(allLocalNotes.filter((note) => !migratedLocalIds.has(note.id)));
  }

  return migratedNotes;
}

function createLocalId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `local-${crypto.randomUUID()}`;
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ============================================
// AUTH
// ============================================
export const auth = {
  async signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    _invalidate();
  },

  async updateUserMetadata(updates) {
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });
    if (error) throw new Error(error.message);
    return data?.user;
  },

  async updatePassword(password) {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });
    if (error) throw new Error(error.message);
    return data?.user;
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data?.session;
  },

  async getUser() {
    const { data } = await supabase.auth.getUser();
    return data?.user;
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ============================================
// PROFILES
// ============================================
export const profiles = {
  async getProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateProfile(userId, updates) {
    if (Object.prototype.hasOwnProperty.call(updates, "email")) {
      throw new Error("Email cannot be changed.");
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    _invalidate();
    return data;
  },

  async incrementStreakOrReset(userId) {
    const profile = await this.getProfile(userId);
    const lastSermonDate = new Date(profile.last_sermon_date);
    const today = new Date();
    const diffDays = Math.floor((today - lastSermonDate) / (1000 * 60 * 60 * 24));

    let newStreak = profile.weekly_streak;
    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }

    return await this.updateProfile(userId, {
      weekly_streak: newStreak,
      last_sermon_date: today.toISOString(),
      sermons_this_month: (profile.sermons_this_month || 0) + 1,
    });
  },
};

// ============================================
// BIBLE NOTES
// ============================================
export const bibleNotes = {
  async getForChapter(userId, lang, bookIdx, chapter) {
    const query = supabase
      .from("bible_notes")
      .select("*")
      .eq("user_id", userId)
      .eq("lang", lang)
      .eq("book_idx", bookIdx)
      .eq("chapter", chapter)
      .order("verse_start", { ascending: true })
      .order("created_at", { ascending: true });

    const { data, error } = await query;
    if (!error) {
      const remoteNotes = data || [];
      const migratedNotes = await migrateLocalBibleNotesForChapter(
        userId,
        lang,
        bookIdx,
        chapter,
        remoteNotes
      );
      return sortBibleNotes([...remoteNotes, ...migratedNotes]);
    }

    if (!isBibleNotesSchemaError(error)) {
      throw new Error(error.message);
    }

    return sortBibleNotes(getLocalBibleNotesForChapter(userId, lang, bookIdx, chapter));
  },

  async createNote(noteData) {
    const payload = {
      ...noteData,
      note: noteData.note || "",
      ai_context: noteData.ai_context || null,
    };

    const { data, error } = await supabase
      .from("bible_notes")
      .insert([payload])
      .select()
      .single();

    if (!error) return data;

    if (!isBibleNotesSchemaError(error)) {
      throw new Error(error.message);
    }

    const now = new Date().toISOString();
    const localNote = {
      id: createLocalId(),
      ...payload,
      local_only: true,
      created_at: now,
      updated_at: now,
    };
    const notes = readLocalBibleNotes();
    writeLocalBibleNotes([localNote, ...notes]);
    return localNote;
  },

  async updateNote(noteId, updates) {
    if (String(noteId).startsWith("local-")) {
      const notes = readLocalBibleNotes();
      const updatedAt = new Date().toISOString();
      const next = notes.map((note) => (
        note.id === noteId ? { ...note, ...updates, updated_at: updatedAt } : note
      ));
      writeLocalBibleNotes(next);
      return next.find((note) => note.id === noteId) || null;
    }

    const { data, error } = await supabase
      .from("bible_notes")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", noteId)
      .select()
      .single();

    if (!error) return data;

    if (!isBibleNotesSchemaError(error)) {
      throw new Error(error.message);
    }

    return null;
  },

  async deleteNote(noteId) {
    if (String(noteId).startsWith("local-")) {
      writeLocalBibleNotes(readLocalBibleNotes().filter((note) => note.id !== noteId));
      return;
    }

    const { error } = await supabase
      .from("bible_notes")
      .delete()
      .eq("id", noteId);

    if (error && !isBibleNotesSchemaError(error)) {
      throw new Error(error.message);
    }
  },
};

// ============================================
// SERIES
// ============================================
export const series = {
  async createSeries(userId, seriesData) {
    const { data, error } = await supabase
      .from("series")
      .insert([
        {
          user_id: userId,
          series_name: seriesData.name,
          overview: seriesData.overview,
          current_week: 1,
          completed_steps: [],
        },
      ])
      .select()
      .single();
    if (error) throw new Error(error.message);
    _invalidate();
    return data;
  },

  async getSeries(userId) {
    const { data, error } = await supabase
      .from("series")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  async getSeriesById(seriesId) {
    const { data, error } = await supabase
      .from("series")
      .select("*")
      .eq("id", seriesId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateSeries(seriesId, updates) {
    const { data, error } = await supabase
      .from("series")
      .update(updates)
      .eq("id", seriesId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    _invalidate();
    return data;
  },

  async deleteSeries(seriesId) {
    const { error } = await supabase
      .from("series")
      .delete()
      .eq("id", seriesId);
    if (error) throw new Error(error.message);
    _invalidate();
  },
};

// ============================================
// SERIES WEEKS
// ============================================
export const seriesWeeks = {
  async createWeeks(seriesId, weeksData) {
    const weeks = weeksData.map((week, index) => ({
      series_id: seriesId,
      week_number: index + 1,
      title: week.title,
      passage: week.passage,
      focus: week.focus,
      big_idea: week.big_idea,
    }));

    const { data, error } = await supabase
      .from("series_weeks")
      .insert(weeks)
      .select();
    if (error) throw new Error(error.message);
    return data;
  },

  async getWeeksBySeriesId(seriesId) {
    const { data, error } = await supabase
      .from("series_weeks")
      .select("*")
      .eq("series_id", seriesId)
      .order("week_number", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  },

  async getWeekById(weekId) {
    const { data, error } = await supabase
      .from("series_weeks")
      .select("*")
      .eq("id", weekId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateWeek(weekId, updates) {
    const { data, error } = await supabase
      .from("series_weeks")
      .update(updates)
      .eq("id", weekId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
};

// ============================================
// SERMON CONTENT
// ============================================
export const sermonContent = {
  async saveContent(weekId, step, content, version = 1) {
    const { data, error } = await supabase
      .from("sermon_content")
      .insert([
        {
          week_id: weekId,
          step,
          content,
          version,
          is_active: true,
        },
      ])
      .select()
      .single();
    if (error) throw new Error(error.message);
    _invalidate();
    return data;
  },

  async getActiveContent(weekId, step) {
    const { data, error } = await supabase
      .from("sermon_content")
      .select("*")
      .eq("week_id", weekId)
      .eq("step", step)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    // Retorna null se não encontrar em vez de erro
    if (error?.code === "PGRST116") return null;
    if (error) throw new Error(error.message);
    return data;
  },

  async getContentVersions(weekId, step) {
    const { data, error } = await supabase
      .from("sermon_content")
      .select("*")
      .eq("week_id", weekId)
      .eq("step", step)
      .order("version", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  async deactivateContent(weekId, step) {
    const { error } = await supabase
      .from("sermon_content")
      .update({ is_active: false })
      .eq("week_id", weekId)
      .eq("step", step);
    if (error) throw new Error(error.message);
  },

  async setActiveVersion(contentId, weekId, step) {
    // Desativa todos da semana/step
    await this.deactivateContent(weekId, step);

    // Ativa o específico
    const { data, error } = await supabase
      .from("sermon_content")
      .update({ is_active: true })
      .eq("id", contentId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    _invalidate();
    return data;
  },

  async duplicateVersion(contentId, weekId, step) {
    const { data: source, error: sourceError } = await supabase
      .from("sermon_content")
      .select("*")
      .eq("id", contentId)
      .single();
    if (sourceError) throw new Error(sourceError.message);

    const { data: existingVersions, error: versionsError } = await supabase
      .from("sermon_content")
      .select("id, version, is_active")
      .eq("week_id", weekId)
      .eq("step", step)
      .order("version", { ascending: false });
    if (versionsError) throw new Error(versionsError.message);

    const nextVersion = (existingVersions?.[0]?.version || 0) + 1;

    await this.deactivateContent(weekId, step);

    const { data, error } = await supabase
      .from("sermon_content")
      .insert([
        {
          week_id: weekId,
          step,
          content: source.content,
          version: nextVersion,
          is_active: true,
        },
      ])
      .select()
      .single();
    if (error) throw new Error(error.message);
    _invalidate();
    return data;
  },

  async updateActiveContent(weekId, step, content) {
    const active = await this.getActiveContent(weekId, step);
    if (!active) throw new Error("Conteúdo ativo não encontrado");

    const { data, error } = await supabase
      .from("sermon_content")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", active.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    _invalidate();
    return data;
  },
};

// ============================================
// SERMON HISTORY
// ============================================
export const sermonHistory = {
  async archiveSermon(userId, seriesId, weekId, fullContent) {
    const { data, error } = await supabase
      .from("sermon_history")
      .insert([
        {
          user_id: userId,
          series_id: seriesId,
          week_id: weekId,
          full_content: fullContent,
          preached_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async getHistoryByUserId(userId) {
    const { data, error } = await supabase
      .from("sermon_history")
      .select("*")
      .eq("user_id", userId)
      .order("preached_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  async getHistoryBySeriesId(seriesId) {
    const { data, error } = await supabase
      .from("sermon_history")
      .select("*")
      .eq("series_id", seriesId)
      .order("preached_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },
};

// ============================================
// HIGH-LEVEL ACTIONS
// ============================================
export const actions = {
  async completeSermonWeek(userId, seriesId, weekId, fullContent) {
    try {
      // Arquivo no história
      await sermonHistory.archiveSermon(userId, seriesId, weekId, fullContent);

      // Atualiza streak e contadores do pastor
      await profiles.incrementStreakOrReset(userId);

      // Marca série como progredindo
      const weeks = await seriesWeeks.getWeeksBySeriesId(seriesId);
      const currentWeekIndex = weeks.findIndex((w) => w.id === weekId);

      if (currentWeekIndex < weeks.length - 1) {
        await series.updateSeries(seriesId, {
          current_week: currentWeekIndex + 2, // próxima semana
        });
      } else {
        // Série completada
        await series.updateSeries(seriesId, { completed_steps: ["all"] });
      }

      return { success: true };
    } catch (err) {
      throw new Error(`Erro ao completar semana: ${err.message}`);
    }
  },

  async savePodcast(userId, weekId, podcastUrl) {
    try {
      const { data, error } = await supabase
        .from("podcast_exports")
        .insert([
          {
            user_id: userId,
            week_id: weekId,
            podcast_url: podcastUrl,
          },
        ])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    } catch (err) {
      throw new Error(`Erro ao salvar podcast: ${err.message}`);
    }
  },
};

// ============================================
// LOAD FULL STATE
// ============================================

/** Call after any mutation (create series, generate content, etc.) */
export function invalidateStateCache() {
  _invalidate();
}

export async function loadFullState(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && _stateCache && now - _stateCacheTime < STATE_CACHE_TTL) {
    return _stateCache;
  }

  try {
    const session = await auth.getSession();
    if (!session) return { authenticated: false };

    // Fetch user + profile + series list in parallel
    const [user, userSeries] = await Promise.all([
      auth.getUser(),
      session.user?.id
        ? series.getSeries(session.user.id)
        : Promise.resolve([]),
    ]);

    const profile = await profiles.getProfile(user.id);

    // For each series: fetch weeks, then fetch all content in parallel
    const seriesWithWeeks = await Promise.all(
      userSeries.map(async (s) => {
        const weeks = await seriesWeeks.getWeeksBySeriesId(s.id);
        const weeksWithContent = await Promise.all(
          weeks.map(async (w) => {
            const [study, builder, illustrations, application] =
              await Promise.all([
                sermonContent.getActiveContent(w.id, "study"),
                sermonContent.getActiveContent(w.id, "builder"),
                sermonContent.getActiveContent(w.id, "illustrations"),
                sermonContent.getActiveContent(w.id, "application"),
              ]);
            return { ...w, study, builder, illustrations, application };
          })
        );
        return { ...s, weeks: weeksWithContent };
      })
    );

    const result = {
      authenticated: true,
      user,
      profile,
      series: seriesWithWeeks,
    };

    _stateCache = result;
    _stateCacheTime = now;
    return result;
  } catch (err) {
    console.error("Erro ao carregar estado:", err);
    return { authenticated: false, error: err.message };
  }
}
