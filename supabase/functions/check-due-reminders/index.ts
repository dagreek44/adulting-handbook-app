import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Query tasks due today
    const { data: dueTodayTasks, error: todayError } = await supabase
      .from("user_tasks")
      .select("id, user_id, title")
      .eq("due_date", today)
      .eq("status", "pending")
      .eq("enabled", true);

    if (todayError) {
      console.error("Error fetching due-today tasks:", todayError);
    }

    // Query medium/hard tasks due in 7 days (advance warning)
    const { data: upcomingTasks, error: upcomingError } = await supabase
      .from("user_tasks")
      .select("id, user_id, title, difficulty")
      .eq("due_date", nextWeek)
      .eq("status", "pending")
      .eq("enabled", true)
      .in("difficulty", ["Medium", "Hard"]);

    if (upcomingError) {
      console.error("Error fetching upcoming tasks:", upcomingError);
    }

    // Group due-today tasks by user_id
    const dueTodayByUser: Record<string, Array<{ id: string; title: string }>> = {};
    for (const task of (dueTodayTasks || [])) {
      if (!task.user_id) continue;
      if (!dueTodayByUser[task.user_id]) dueTodayByUser[task.user_id] = [];
      dueTodayByUser[task.user_id].push({ id: task.id, title: task.title || "Reminder" });
    }

    // Group upcoming tasks by user_id
    const upcomingByUser: Record<string, Array<{ id: string; title: string }>> = {};
    for (const task of (upcomingTasks || [])) {
      if (!task.user_id) continue;
      if (!upcomingByUser[task.user_id]) upcomingByUser[task.user_id] = [];
      upcomingByUser[task.user_id].push({ id: task.id, title: task.title || "Reminder" });
    }

    let notificationsSent = 0;

    // Send "due today" notifications
    for (const [userId, tasks] of Object.entries(dueTodayByUser)) {
      const taskTitles = tasks.map(t => t.title).join(", ");
      const body = tasks.length === 1
        ? `Your task "${tasks[0].title}" is due today`
        : `You have ${tasks.length} tasks due today: ${taskTitles}`;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          user_ids: [userId],
          title: "Reminder Due Today",
          body,
          data: { taskId: tasks[0].id, action: "openReminder" },
        }),
      });

      if (response.ok) {
        notificationsSent++;
        console.log(`Sent due-today notification to user ${userId}`);
      } else {
        console.error(`Failed to send due-today notification to ${userId}:`, await response.text());
      }
    }

    // Send "upcoming" advance warning notifications
    for (const [userId, tasks] of Object.entries(upcomingByUser)) {
      const taskTitles = tasks.map(t => t.title).join(", ");
      const body = tasks.length === 1
        ? `Your task "${tasks[0].title}" is due next week. Make sure you have everything ready!`
        : `You have ${tasks.length} big tasks due next week: ${taskTitles}`;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          user_ids: [userId],
          title: "Big Task Coming Up",
          body,
          data: { taskId: tasks[0].id, action: "openReminder" },
        }),
      });

      if (response.ok) {
        notificationsSent++;
        console.log(`Sent advance warning to user ${userId}`);
      } else {
        console.error(`Failed to send advance warning to ${userId}:`, await response.text());
      }
    }

    const summary = {
      success: true,
      due_today_users: Object.keys(dueTodayByUser).length,
      due_today_tasks: (dueTodayTasks || []).length,
      upcoming_users: Object.keys(upcomingByUser).length,
      upcoming_tasks: (upcomingTasks || []).length,
      notifications_sent: notificationsSent,
    };

    console.log("check-due-reminders summary:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("check-due-reminders error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
