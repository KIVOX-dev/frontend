"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreVertical, Trash2, Search } from "lucide-react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { useUiStore } from "@/stores/uiStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CourseViewer } from "@/components/learner/CourseViewer";

export type CourseSummary = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  source_type: "playlist" | "video";
  lesson_count: number;
  total_duration_seconds: number;
  completed_lesson_count: number;
  progress_percentage: number;
};

type Filter = "all" | "learning" | "to_begin" | "completed";

function matchesFilter(course: CourseSummary, filter: Filter) {
  if (filter === "learning") return course.progress_percentage > 0 && course.progress_percentage < 100;
  if (filter === "to_begin") return course.progress_percentage === 0;
  if (filter === "completed") return course.progress_percentage >= 100;
  return true;
}

/**
 * "Learnings" — the student's own list of courses converted via Tools >
 * YouTube to Course (YoutubeCourseImport.tsx). Picking one switches this
 * same screen into the course viewer (CourseViewer.tsx) rather than a
 * separate nav entry — mirrors how PracticeModule.tsx already holds its own
 * list/detail state internally instead of adding new uiStore screen ids for
 * every drill-down.
 */
export function MyLearnings() {
  const setActiveScreen = useUiStore((s) => s.setActiveScreen);
  const [courses, setCourses] = useState<CourseSummary[] | null>(null);
  const [error, setError] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchCourses = () => {
    setError("");
    api
      .get<CourseSummary[]>("/courses")
      .then((res) => setCourses(res.data))
      .catch((err: unknown) => setError(extractErrorMessage(err, "Couldn't load your courses")));
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const counts = useMemo(() => {
    const list = courses || [];
    return {
      all: list.length,
      learning: list.filter((c) => matchesFilter(c, "learning")).length,
      to_begin: list.filter((c) => matchesFilter(c, "to_begin")).length,
      completed: list.filter((c) => matchesFilter(c, "completed")).length,
    };
  }, [courses]);

  const visibleCourses = useMemo(() => {
    return (courses || [])
      .filter((c) => matchesFilter(c, filter))
      .filter((c) => c.title.toLowerCase().includes(search.trim().toLowerCase()));
  }, [courses, filter, search]);

  const handleRemove = async (courseId: string) => {
    setOpenMenuId(null);
    if (!window.confirm("Remove this course? This deletes its progress and notes too.")) return;
    setRemovingId(courseId);
    try {
      await api.delete(`/courses/${courseId}`);
      setCourses((prev) => (prev || []).filter((c) => c.id !== courseId));
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Couldn't remove this course"));
    } finally {
      setRemovingId(null);
    }
  };

  if (selectedCourseId) {
    return (
      <CourseViewer
        courseId={selectedCourseId}
        onBack={() => {
          setSelectedCourseId(null);
          fetchCourses();
        }}
        onDeleted={() => {
          setSelectedCourseId(null);
          fetchCourses();
        }}
      />
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-heading-l mb-1">Learnings</h1>
        <p className="text-body text-ink-muted">Courses you&apos;ve converted from YouTube.</p>
      </div>

      {error && <p className="text-small text-danger mb-4">{error}</p>}

      {courses !== null && courses.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1.5 flex-wrap">
            <FilterTab active={filter === "all"} onClick={() => setFilter("all")}>
              All ({counts.all})
            </FilterTab>
            <FilterTab active={filter === "learning"} onClick={() => setFilter("learning")}>
              Learning ({counts.learning})
            </FilterTab>
            <FilterTab active={filter === "to_begin"} onClick={() => setFilter("to_begin")}>
              To Begin ({counts.to_begin})
            </FilterTab>
            <FilterTab active={filter === "completed"} onClick={() => setFilter("completed")}>
              Completed ({counts.completed})
            </FilterTab>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search all courses…"
              className="h-9 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
      )}

      {courses === null ? (
        <p className="text-small">Loading…</p>
      ) : courses.length === 0 ? (
        <Card className="text-center py-12">
          <p className="font-semibold text-ink mb-1">No courses yet</p>
          <p className="text-small mb-4">Convert a YouTube video or playlist to get started.</p>
          <Button onClick={() => setActiveScreen("youtube-course-import")}>Convert a YouTube link</Button>
        </Card>
      ) : visibleCourses.length === 0 ? (
        <p className="text-small">No courses match this filter.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleCourses.map((course) => (
            <Card key={course.id} interactive className="p-0 overflow-hidden relative">
              <button className="block w-full text-left cursor-pointer" onClick={() => setSelectedCourseId(course.id)}>
                <div className="aspect-video bg-paper-tint">
                  {course.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-4 pr-10">
                  <p className="font-semibold text-ink line-clamp-2 mb-3">{course.title}</p>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-caption">Progress</span>
                    <span className="text-caption font-semibold text-ink">{course.progress_percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-paper-tint overflow-hidden mb-2">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${course.progress_percentage}%` }} />
                  </div>
                  <p className="text-caption">Powered by YouTube</p>
                </div>
              </button>

              <div className="absolute top-3 right-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId((id) => (id === course.id ? null : course.id));
                  }}
                  className="size-7 flex items-center justify-center rounded-md text-ink-muted hover:bg-paper-tint hover:text-ink"
                  aria-label="Course options"
                >
                  <MoreVertical className="size-4" />
                </button>
                {openMenuId === course.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                    <div className="absolute right-0 top-8 z-20 min-w-[140px] rounded-md border border-line bg-white shadow-dropdown overflow-hidden">
                      <button
                        onClick={() => handleRemove(course.id)}
                        disabled={removingId === course.id}
                        className="w-full flex items-center gap-2 px-3 py-2 text-small text-danger hover:bg-paper-tint text-left"
                      >
                        <Trash2 className="size-3.5" /> Remove
                      </button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${
        active ? "bg-paper-tint text-ink" : "text-ink-muted hover:text-ink hover:bg-paper-tint"
      }`}
    >
      {children}
    </button>
  );
}
