import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a client with the caller's JWT to check their role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the caller exists and is an admin
    const { data: { user: caller }, error: authError } = await callerClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await callerClient
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (!callerProfile || callerProfile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin-privileged client using service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action } = body;

    // ── INVITE USER ──────────────────────────────────────────
    if (action === "invite") {
      const { email, name, role, phone } = body;

      if (!email || !name || !role) {
        return new Response(JSON.stringify({ error: "Email, name, and role are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!["rep", "manager", "admin"].includes(role)) {
        return new Response(JSON.stringify({ error: "Invalid role" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { name, role, phone: phone || "" },
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, user: { id: data.user.id, email: data.user.email } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── RESET PASSWORD ───────────────────────────────────────
    if (action === "reset-password") {
      const { email } = body;

      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use the admin client to generate a password reset link
      const { data, error } = await adminClient.auth.admin.generateLink({
        type: "recovery",
        email,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Also send the reset email via the standard flow
      await adminClient.auth.resetPasswordForEmail(email);

      return new Response(JSON.stringify({ success: true, message: "Password reset email sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── DISABLE / ENABLE USER ────────────────────────────────
    if (action === "disable" || action === "enable") {
      const { userId } = body;

      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Prevent admin from disabling themselves
      if (userId === caller.id) {
        return new Response(JSON.stringify({ error: "You cannot disable your own account" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const isDisable = action === "disable";

      // Ban/unban in Supabase Auth
      const { error: authErr } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: isDisable ? "876600h" : "none", // ~100 years ban or unban
      });

      if (authErr) {
        return new Response(JSON.stringify({ error: authErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update profile status
      const { error: profileErr } = await adminClient
        .from("profiles")
        .update({ status: isDisable ? "inactive" : "active" })
        .eq("id", userId);

      if (profileErr) {
        return new Response(JSON.stringify({ error: profileErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, message: `User ${isDisable ? "disabled" : "enabled"}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── DELETE USER ──────────────────────────────────────────
    if (action === "delete") {
      const { userId } = body;

      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Prevent admin from deleting themselves
      if (userId === caller.id) {
        return new Response(JSON.stringify({ error: "You cannot delete your own account" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete from Supabase Auth (profile cascades via ON DELETE CASCADE)
      const { error } = await adminClient.auth.admin.deleteUser(userId);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, message: "User deleted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
