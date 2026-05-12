import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "../../../components/ui/input";
import { SelectV2 } from "./SelectV2";
import { useGetAllPracticeSubmissionsByUserId } from "../hooks";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function PracticeTestHistory() {
  // const handleCloseDeleteDialog = () => {
  //   setDeleteIndex(null);
  //   setShowDeleteDialog(false);
  // };

  // =========================
  // Auth
  // =========================

  const { user } = useAuth();

  const userId = user?.id;

  // =========================
  // Navigation
  // =========================

  const navigate = useNavigate();

  // =========================
  // Get all practice submissions by user id
  // =========================

  const getAllPracticeSubmissionsByUserId =
    useGetAllPracticeSubmissionsByUserId();

  useEffect(() => {
    if (!userId) return;
    getAllPracticeSubmissionsByUserId.get({ userId: userId });
  }, [userId]);

  // =========================
  // Skill options
  // =========================

  const skillOptions = [
    { value: "all", label: "All Skills" },
    { value: "LISTENING", label: "Listening" },
    { value: "READING", label: "Reading" },
    { value: "WRITING", label: "Writing" },
    { value: "SPEAKING", label: "Speaking" },
  ];

  // =========================
  // Filter submissions
  // =========================

  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSubmissions =
    getAllPracticeSubmissionsByUserId.practiceSubmissions.filter(
      (submission) => {
        const matchesSkill =
          skillFilter === "all" || submission.skill === skillFilter;

        const matchesSearch =
          searchQuery === "" ||
          submission.title.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSkill && matchesSearch;
      },
    );

  // =========================
  // Handle click review button
  // =========================

  const handleOnClickReviewButton = (id: string) => {
    navigate(`/test/result/${id}`);
  };

  // =========================
  // Pagination
  // =========================

  const [paginationPage, setPaginationPage] = useState(1);
  const itemsPerPage = 8;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSubmissions.length / itemsPerPage),
  );

  const startIndex = (paginationPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

  useEffect(() => {
    setPaginationPage(1);
  }, [filteredSubmissions.length]);

  // =========================
  // Format band score
  // =========================

  const formatBandScore = (score?: number | null, skill?: string | null) => {
    if (score == null) {
      return "-";
    }

    if (skill === "WRITING" && score === 0) {
      return "Not Scored";
    }

    return score.toFixed(1);
  };

  return (
    <>
      <h1 className="font-['Inter'] text-[28px] font-semibold text-gray-900 mb-[32px]">
        Practice Test History
      </h1>

      {/* Filters and Search */}
      <div className="flex gap-[16px] mb-[24px]">
        {/* Search Bar - 80% width */}
        <div className="w-[80%] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search by exercise name or title"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 font-['Inter']"
          />
        </div>

        {/* Skill Filter - 20% width */}
        <div className="w-[20%]">
          <SelectV2
            value={skillFilter}
            onChange={setSkillFilter}
            options={skillOptions}
            placeholder="Skill"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-[12px] overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-[20px] py-[14px] text-left font-['Inter'] text-[13px] font-semibold text-gray-700 uppercase w-[120px]">
                Date
              </th>
              <th className="px-[20px] py-[14px] text-left font-['Inter'] text-[13px] font-semibold text-gray-700 uppercase">
                Test name
              </th>
              <th className="px-[20px] py-[14px] text-left font-['Inter'] text-[13px] font-semibold text-gray-700 uppercase w-[100px]">
                Score
              </th>
              <th className="px-[20px] py-[14px] text-left font-['Inter'] text-[13px] font-semibold text-gray-700 uppercase w-[120px]">
                Time spent
              </th>
              <th className="px-[20px] py-[14px] text-center font-['Inter'] text-[13px] font-semibold text-gray-700 uppercase w-[120px]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedSubmissions.map((test) => (
              <tr
                key={test.id}
                className="border-t border-gray-200 hover:bg-gray-50"
              >
                <td className="px-[20px] py-[16px] font-['Inter'] text-[14px] text-gray-900">
                  {test.submittedAt}
                </td>
                <td className="px-[20px] py-[16px]">
                  <div className="font-['Inter'] text-[14px] text-[#1977f3]">
                    {test.title}
                  </div>
                </td>
                <td className="px-[20px] py-[16px] font-['Inter'] text-[14px] text-gray-900 whitespace-nowrap">
                  {formatBandScore(test.score, test.skill)}
                </td>
                <td className="px-[20px] py-[16px] font-['Inter'] text-[14px] text-gray-900 whitespace-nowrap">
                  {test.timeTaken || "-"}
                </td>
                <td className="px-[20px] py-[16px]">
                  <div className="flex items-center justify-center">
                    <Button
                      variant="default"
                      className="bg-[#1e3a5f] hover:bg-[#152b47] font-['Inter'] text-[13px] h-[36px]"
                      onClick={() => handleOnClickReviewButton(test.id)}
                    >
                      Review
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="border-t border-gray-200 bg-white px-[20px] py-[14px]">
          <div className="flex items-center justify-between gap-[16px]">
            <span className="text-[#202224] text-[14px] opacity-60 font-['Nunito_Sans']">
              Showing {filteredSubmissions.length === 0 ? 0 : startIndex + 1}-
              {Math.min(endIndex, filteredSubmissions.length)} of{" "}
              {filteredSubmissions.length}
            </span>

            <div className="flex items-center gap-[10px]">
              <span className="text-[#202224] text-[14px] opacity-60 font-['Nunito_Sans'] mr-[10px]">
                Page {paginationPage} of {totalPages}
              </span>

              <div className="flex items-center gap-[10px] bg-[#FAFBFD] border border-[#D5D5D5] rounded-[8px] px-[10px] py-[5px]">
                <button
                  onClick={() =>
                    setPaginationPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={paginationPage === 1}
                  className={`${
                    paginationPage === 1
                      ? "opacity-30 cursor-not-allowed"
                      : "opacity-60 hover:opacity-100"
                  } transition-opacity`}
                >
                  <ChevronLeft className="w-[20px] h-[20px]" />
                </button>

                <div className="w-[1px] h-[20px] bg-[#979797]" />

                <button
                  onClick={() =>
                    setPaginationPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={paginationPage === totalPages}
                  className={`${
                    paginationPage === totalPages
                      ? "opacity-30 cursor-not-allowed"
                      : "opacity-90 hover:opacity-100"
                  } transition-opacity`}
                >
                  <ChevronRight className="w-[20px] h-[20px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
