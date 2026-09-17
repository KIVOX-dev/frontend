"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, Trash2, ChevronLeft } from "lucide-react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { loadYoutubeIframeApi, type YoutubePlayer } from "@/lib/youtubePlayer";

type Lesson = {
  id: string;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  position: number;
  has_assessment: boolean;
  status: "not_started" | "in_progress" | "completed";
  watched_seconds: number;
};

type CourseDetail = {
  id: string;
  title: string;
  lesson_count: number;
  completed_lesson_count: number;
  progress_percentage: number;
  lessons: Lesson[];
};

type Note = { id: string; timestamp_seconds: number; text: string };

type AssessmentQuestion = { question: string; options: string[] };
type GradedQuestion = AssessmentQuestion & { correct_answer: string; selected: string | null; is_correct: boolean };
type AssessmentAttempt = { score: number; max_score: number; percentage: number };

function formatTime(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

type Tab = "notes" | "assessment";

/**
 * The course viewer — video player, "Course content" lesson sidebar with
 * completion checkmarks, and Notes/Assessment tabs. Real playback position
 * (for note timestamps) comes from the actual YouTube IFrame Player API, not
 * a guessed/typed value — see lib/youtubePlayer.ts. Lesson completion itself
 * is a manual toggle (matching the reference app's own "Mark as Incomplete"
 * button), not inferred from watch time.
 */
export function CourseViewer({
  courseId,
  onBack,
  onDeleted,
}: {
  courseId: string;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [error, setError] = useState("");
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("notes");
  const [togglingComplete, setTogglingComplete] = useState(false);
  const [removing, setRemoving] = useState(false);

  const playerRef = useRef<YoutubePlayer | null>(null);
  const playerContainerId = useRef(`yt-player-${courseId}`).current;

  const fetchCourse = () => {
    setError("");
    api
      .get<CourseDetail>(`/courses/${courseId}`)
      .then((res) => {
        setCourse(res.data);
        setActiveLessonId((current) => current ?? res.data.lessons.find((l) => l.status !== "completed")?.id ?? res.data.lessons[0]?.id ?? null);
      })
      .catch((err: unknown) => setError(extractErrorMessage(err, "Couldn't load this course")));
  };

  useEffect(() => {
    fetchCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const activeLesson = course?.lessons.find((l) => l.id === activeLessonId) || null;

  // One player instance per mount, then loadVideoById on lesson switch —
  // avoids tearing down/recreating the iframe (and losing playback) every
  // time the active lesson changes.
  useEffect(() => {
    if (!activeLesson) return;
    let cancelled = false;
    loadYoutubeIframeApi().then(() => {
      if (cancelled || !window.YT) return;
      if (playerRef.current) {
        playerRef.current.loadVideoById(activeLesson.youtube_video_id);
        return;
      }
      playerRef.current = new window.YT.Player(playerContainerId, {
        videoId: activeLesson.youtube_video_id,
        playerVars: { rel: 0 },
      });
    });
    return () => {
      cancelled = true;
    };
    // Deliberately only re-runs on lesson switch (via loadVideoById above),
    // not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLesson?.id]);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  const handleToggleComplete = async () => {
    if (!activeLesson || !course) return;
    setTogglingComplete(true);
    const nextStatus = activeLesson.status === "completed" ? "not_started" : "completed";
    try {
      await api.put(`/courses/${courseId}/lessons/${activeLesson.id}/progress`, { status: nextStatus });
      fetchCourse();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Couldn't update progress"));
    } finally {
      setTogglingComplete(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm("Remove this course? This deletes its progress and notes too.")) return;
    setRemoving(true);
    try {
      await api.delete(`/courses/${courseId}`);
      onDeleted();
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Couldn't remove this course"));
      setRemoving(false);
    }
  };

  if (error && !course) {
    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ChevronLeft className="size-4" /> Learnings
        </Button>
        <p className="text-small text-danger">{error}</p>
      </div>
    );
  }
  if (!course || !activeLesson) {
    return (
      <div className="p-6 md:p-10 max-w-5xl mx-auto">
        <p className="text-small">Loading…</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-1 text-small text-ink-muted hover:text-ink">
          <ChevronLeft className="size-4" /> Learnings <span className="mx-1">/</span> <span className="text-ink font-medium">{course.title}</span>
        </button>
        <Button variant="secondary" size="sm" onClick={handleDeleteCourse} loading={removing}>
          <Trash2 className="size-3.5" /> Remove course
        </Button>
      </div>

      {error && <p className="text-small text-danger mb-3">{error}</p>}

      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div>
          <div className="aspect-video rounded-lg overflow-hidden bg-black mb-3">
            <div id={playerContainerId} className="w-full h-full" />
          </div>

          <div className="flex items-center justify-between gap-4 mb-6">
            <p className="font-semibold text-ink">{activeLesson.title}</p>
            <Button
              variant={activeLesson.status === "completed" ? "secondary" : "primary"}
              size="sm"
              onClick={handleToggleComplete}
              loading={togglingComplete}
              className="shrink-0"
            >
              {activeLesson.status === "completed" ? "Mark as Incomplete" : "Mark as Complete"}
            </Button>
          </div>

          <div className="flex gap-1 border-b border-line mb-4">
            <TabButton active={activeTab === "notes"} onClick={() => setActiveTab("notes")}>
              Notes
            </TabButton>
            <TabButton active={activeTab === "assessment"} onClick={() => setActiveTab("assessment")}>
              Assessment
            </TabButton>
          </div>

          {activeTab === "notes" ? (
            <NotesTab courseId={courseId} lessonId={activeLesson.id} playerRef={playerRef} />
          ) : (
            <AssessmentTab courseId={courseId} lessonId={activeLesson.id} />
          )}
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-ink">Course content</p>
            <Badge tone="neutral">Completed {course.progress_percentage}%</Badge>
          </div>
          <div className="space-y-1 max-h-[70vh] overflow-y-auto -mx-1 px-1">
            {course.lessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => setActiveLessonId(lesson.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 rounded-md p-2 text-left transition-colors duration-150",
                  lesson.id === activeLesson.id ? "bg-paper-tint" : "hover:bg-paper-tint"
                )}
              >
                {lesson.status === "completed" ? (
                  <CheckCircle2 className="size-5 shrink-0 text-success" />
                ) : (
                  <Circle className="size-5 shrink-0 text-ink-faint" />
                )}
                {lesson.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={lesson.thumbnail_url} alt="" className="w-16 aspect-video object-cover rounded shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-small font-medium text-ink line-clamp-2">{lesson.title}</p>
                  <p className="text-caption">{formatTime(lesson.duration_seconds)}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3.5 py-2 text-sm font-medium rounded-t-md -mb-px border-b-2 transition-colors duration-150",
        active ? "border-primary text-primary" : "border-transparent text-ink-muted hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

function NotesTab({
  courseId,
  lessonId,
  playerRef,
}: {
  courseId: string;
  lessonId: string;
  playerRef: React.MutableRefObject<YoutubePlayer | null>;
}) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setNotes(null);
    api
      .get<Note[]>(`/courses/${courseId}/lessons/${lessonId}/notes`)
      .then((res) => setNotes(res.data))
      .catch((err: unknown) => setError(extractErrorMessage(err, "Couldn't load notes")));
  }, [courseId, lessonId]);

  const currentTimestamp = () => playerRef.current?.getCurrentTime() ?? 0;

  const handleAdd = async () => {
    if (!text.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await api.post<Note>(`/courses/${courseId}/lessons/${lessonId}/notes`, {
        timestampSeconds: currentTimestamp(),
        text: text.trim(),
      });
      setNotes((prev) => [...(prev || []), res.data].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds));
      setText("");
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Couldn't add note"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await api.delete(`/courses/${courseId}/lessons/${lessonId}/notes/${noteId}`);
      setNotes((prev) => (prev || []).filter((n) => n.id !== noteId));
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Couldn't delete note"));
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a note at the current timestamp…"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd} loading={saving} disabled={!text.trim()} className="shrink-0">
          Add
        </Button>
      </div>
      {error && <p className="text-small text-danger mb-3">{error}</p>}

      {notes === null ? (
        <p className="text-small">Loading…</p>
      ) : notes.length === 0 ? (
        <p className="text-small">No notes yet.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="flex items-start justify-between gap-3 rounded-md border border-line p-3">
              <div className="min-w-0">
                <button
                  onClick={() => playerRef.current?.seekTo(note.timestamp_seconds, true)}
                  className="text-caption font-semibold text-primary hover:underline"
                >
                  {formatTime(note.timestamp_seconds)}
                </button>
                <p className="text-small text-ink mt-0.5">{note.text}</p>
              </div>
              <button onClick={() => handleDelete(note.id)} className="shrink-0 text-ink-faint hover:text-danger" aria-label="Delete note">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssessmentTab({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const [questions, setQuestions] = useState<AssessmentQuestion[] | null>(null);
  const [latestAttempt, setLatestAttempt] = useState<AssessmentAttempt | null>(null);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [graded, setGraded] = useState<GradedQuestion[] | null>(null);
  const [result, setResult] = useState<AssessmentAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setGraded(null);
    setResult(null);
    setError("");
    api
      .get<{ questions: AssessmentQuestion[]; latest_attempt: AssessmentAttempt | null }>(
        `/courses/${courseId}/lessons/${lessonId}/assessment`
      )
      .then((res) => {
        setQuestions(res.data.questions);
        setLatestAttempt(res.data.latest_attempt);
        setAnswers(new Array(res.data.questions.length).fill(null));
      })
      .catch((err: unknown) => setError(extractErrorMessage(err, "Couldn't load the assessment")))
      .finally(() => setLoading(false));
  }, [courseId, lessonId]);

  const handleSubmit = async () => {
    if (!questions) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post<{ attempt: AssessmentAttempt; graded: GradedQuestion[] }>(
        `/courses/${courseId}/lessons/${lessonId}/assessment/submit`,
        { answers }
      );
      setGraded(res.data.graded);
      setResult(res.data.attempt);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Couldn't submit the assessment"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-small">Generating assessment…</p>;
  if (error && !questions) return <p className="text-small text-danger">{error}</p>;
  if (!questions || questions.length === 0) return <p className="text-small">No assessment available for this lesson.</p>;

  const displayGraded = graded;
  const displayResult = result || (latestAttempt && !graded ? latestAttempt : null);

  return (
    <div>
      {displayResult && (
        <p className="text-small font-semibold text-ink mb-4">
          Score: {displayResult.score}/{displayResult.max_score} ({displayResult.percentage}%)
        </p>
      )}
      <div className="space-y-5">
        {questions.map((q, i) => {
          const gradedQ = displayGraded?.[i];
          return (
            <div key={i}>
              <p className="text-small font-semibold text-ink mb-2">
                {i + 1}. {q.question}
              </p>
              <div className="space-y-1.5">
                {q.options.map((option) => {
                  const isSelected = answers[i] === option;
                  const showCorrectness = !!gradedQ;
                  const isCorrectOption = gradedQ?.correct_answer === option;
                  return (
                    <label
                      key={option}
                      className={cn(
                        "flex items-center gap-2 rounded-md border p-2.5 text-small cursor-pointer",
                        showCorrectness && isCorrectOption ? "border-success bg-[color-mix(in_srgb,var(--color-success)_8%,white)]" : "",
                        showCorrectness && isSelected && !isCorrectOption ? "border-danger bg-[color-mix(in_srgb,var(--color-danger)_8%,white)]" : "",
                        !showCorrectness ? "border-line hover:border-line-strong" : ""
                      )}
                    >
                      <input
                        type="radio"
                        name={`q-${i}`}
                        checked={isSelected}
                        disabled={!!displayGraded}
                        onChange={() => setAnswers((prev) => prev.map((a, idx) => (idx === i ? option : a)))}
                      />
                      {option}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="text-small text-danger mt-4">{error}</p>}

      {!displayGraded && (
        <Button className="mt-5" onClick={handleSubmit} loading={submitting} disabled={answers.some((a) => !a)}>
          Submit Assessment
        </Button>
      )}
    </div>
  );
}
