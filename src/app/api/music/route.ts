import {
  ApiError,
  body,
  db,
  failure,
  sameOrigin,
  staff,
} from "@/lib/order-server";
import {
  currentUser,
  customer,
  settings,
  checkWifi,
  seatFor,
  text,
  throttle,
  uuid,
} from "@/lib/cafe-server";
import type { Track } from "@/lib/cafe";
export async function GET() {
  try {
    const user = await currentUser();
    const [tracks, votes] = await Promise.all([
      db<Track[]>(
        "cafe_tracks?status=in.(queued,playing)&order=created_at.asc&limit=100",
      ),
      db<{ track_id: string; customer_id: string }[]>(
        "cafe_votes?select=track_id,customer_id",
      ),
    ]);
    return Response.json({
      tracks: tracks.map((t) => ({
        ...t,
        votes: votes.filter((v) => v.track_id === t.id).length,
        voted: votes.some(
          (v) => v.track_id === t.id && v.customer_id === user?.id,
        ),
      })),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const input = await body(req);
    if (
      input.action === "play" ||
      input.action === "remove" ||
      input.action === "add"
    ) {
      await staff();
      if (input.action === "add") {
        const video = text(input.video_id, 20);
        if (!/^[\w-]{11}$/.test(video))
          throw new ApiError("Enter an 11-character YouTube video ID.");
        await db("cafe_tracks", {
          method: "POST",
          body: JSON.stringify({
            title: text(input.title, 100),
            artist: text(input.artist, 100),
            video_id: video,
          }),
        });
      } else {
        if (!uuid.test(input.id)) throw new ApiError("Invalid track.");
        if (input.action === "play")
          await db("rpc/play_cafe_track", {
            method: "POST",
            body: JSON.stringify({ p_id: input.id }),
          });
        else
          await db("cafe_tracks?id=eq." + input.id, {
            method: "PATCH",
            body: JSON.stringify({ status: "removed" }),
          });
      }
    } else if (input.action === "vote" || input.action === "request") {
      const config = await settings();
      checkWifi(req, config);
      await seatFor(input.code);
      const user = await currentUser(true),
        profile = await customer(user!);
      if (profile.blocked_until && new Date(profile.blocked_until) > new Date())
        throw new ApiError("This account is temporarily restricted.", 403);
      if (input.action === "request") {
        throttle("song-request:" + user!.id, 2, 600000);
        const title = text(input.title, 100), artist = text(input.artist, 100), video = text(input.video_id, 20);
        if (!title || !artist || !/^[\w-]{11}$/.test(video)) throw new ApiError("Add a title, artist and valid YouTube video ID.");
        const queue = await db<{id:string}[]>("cafe_tracks?status=eq.queued&select=id&limit=100");
        if(queue.length>=100)throw new ApiError("The queue is full. Please request a song later.");
        await db("cafe_tracks",{method:"POST",body:JSON.stringify({title,artist,video_id:video})});
        return Response.json({ok:true});
      }
      throttle("vote:" + user!.id, 30);
      if (!uuid.test(input.id)) throw new ApiError("Invalid track.");
      const [track] = await db<Track[]>(
        "cafe_tracks?id=eq." + input.id + "&status=eq.queued",
      );
      if (!track) throw new ApiError("This track is no longer in the queue.");
      if (input.remove)
        await db(
          "cafe_votes?track_id=eq." + input.id + "&customer_id=eq." + user!.id,
          { method: "DELETE" },
        );
      else
        await db("cafe_votes?on_conflict=track_id,customer_id", {
          method: "POST",
          headers: { Prefer: "resolution=ignore-duplicates" },
          body: JSON.stringify({ track_id: input.id, customer_id: user!.id }),
        });
    } else throw new ApiError("Unknown action.");
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
