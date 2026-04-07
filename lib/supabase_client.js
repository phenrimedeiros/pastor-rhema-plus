import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

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
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
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
    return data;
  },

  async deleteSeries(seriesId) {
    const { error } = await supabase
      .from("series")
      .delete()
      .eq("id", seriesId);
    if (error) throw new Error(error.message);
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
export async function loadFullState() {
  try {
    const session = await auth.getSession();
    if (!session) return { authenticated: false };

    const user = await auth.getUser();
    const profile = await profiles.getProfile(user.id);
    const userSeries = await series.getSeries(user.id);

    // Para cada série, carrega semanas e conteúdo
    const seriesWithWeeks = await Promise.all(
      userSeries.map(async (s) => {
        const weeks = await seriesWeeks.getWeeksBySeriesId(s.id);
        const weeksWithContent = await Promise.all(
          weeks.map(async (w) => {
            const study = await sermonContent.getActiveContent(w.id, "study");
            const builder = await sermonContent.getActiveContent(w.id, "builder");
            const illustrations = await sermonContent.getActiveContent(
              w.id,
              "illustrations"
            );
            const application = await sermonContent.getActiveContent(
              w.id,
              "application"
            );

            return {
              ...w,
              study,
              builder,
              illustrations,
              application,
            };
          })
        );
        return { ...s, weeks: weeksWithContent };
      })
    );

    return {
      authenticated: true,
      user,
      profile,
      series: seriesWithWeeks,
    };
  } catch (err) {
    console.error("Erro ao carregar estado:", err);
    return { authenticated: false, error: err.message };
  }
}
