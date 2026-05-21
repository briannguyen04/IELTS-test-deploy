import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { ExerciseMetadata } from "../types";
import { useAuth } from "../../../contexts/AuthContext";
import { buildImageUrl } from "../utils/buildImageUrl";
import { usePutUserPracticeContentProgress } from "../hooks";

interface ExerciseCardProps {
  exercise: ExerciseMetadata;
  onSelect: () => void;
  isBookmarked?: boolean;
  onBookmarkChange?: () => void | Promise<void>;
}

export function ExerciseCard({
  exercise,
  onSelect,
  isBookmarked = false,
  onBookmarkChange,
}: ExerciseCardProps) {
  // =========================
  // Auth
  // =========================

  const { isLoggedIn, user } = useAuth();

  // =========================
  // Post user practice content progress to update bookmark status
  // =========================

  const [isBookmarkedLocal, setIsBookmarkedLocal] =
    useState<boolean>(isBookmarked);

  useEffect(() => {
    setIsBookmarkedLocal(isBookmarked);
  }, [isBookmarked]);

  const putUserPracticeContentProgress = usePutUserPracticeContentProgress({
    userId: user?.id ?? "",
    practiceContentId: exercise.id,
    body: {
      isBookmarked: !isBookmarkedLocal,
    },
  });

  // =========================
  // Bookmark practice content
  // =========================

  const handleBookmarkClick = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();

    await putUserPracticeContentProgress.put();
    setIsBookmarkedLocal((prev) => !prev);
    await onBookmarkChange?.();
  };

  return (
    <div
      id={`browse-exercise-card-${exercise.id}`}
      className="cursor-pointer group"
      onClick={onSelect}
    >
      <div className="relative w-full aspect-[4/3] rounded-[8px] overflow-hidden mb-[10px]">
        <img
          src={buildImageUrl(exercise.image)}
          alt={exercise.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {/* Bookmark Icon - Only show for logged in users */}
        {isLoggedIn && (
          <button
            id={`browse-exercise-bookmark-button-${exercise.id}`}
            onClick={handleBookmarkClick}
            className="absolute top-[12px] right-[12px] z-10 bg-white/90 hover:bg-white rounded-full p-[8px] transition-colors"
            type="button"
          >
            <Bookmark
              className={`w-[20px] h-[20px] transition-colors ${
                isBookmarkedLocal
                  ? "fill-[#fcbf65] stroke-[#fcbf65]"
                  : "stroke-gray-700"
              }`}
            />
          </button>
        )}
      </div>
      <h3 className="font-['Inter'] font-semibold text-[14px] mb-[4px]">
        {exercise.title}
      </h3>
      <p className="font-['Inter'] text-[12px] text-[rgba(0,0,0,0.47)] flex items-center gap-1">
        <span aria-hidden>↻</span>
        {Number(exercise.attempts || 0).toLocaleString()} attempts
      </p>
    </div>
  );
}
