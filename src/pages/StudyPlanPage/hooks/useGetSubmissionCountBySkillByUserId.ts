import { API_BASE } from "../../../env";
import { useApiGetByParams } from "../../../utils/api";
import {
  SubmissionCountBySkill,
  SubmissionCountBySkillDTO,
  SubmissionCountBySkillParams,
} from "../types";

function mapSubmissionCountBySkillDTOToSubmissionCountBySkill(
  dto: SubmissionCountBySkillDTO,
): SubmissionCountBySkill {
  return {
    listeningCount: dto.listeningCount ?? 0,
    readingCount: dto.readingCount ?? 0,
    writingCount: dto.writingCount ?? 0,
    speakingCount: dto.speakingCount ?? 0,
  };
}

const initialParams: SubmissionCountBySkillParams = {
  userId: "",
};

const initialSubmissionCountBySkill: SubmissionCountBySkill = {
  listeningCount: 0,
  readingCount: 0,
  writingCount: 0,
  speakingCount: 0,
};

export function useGetSubmissionCountBySkillByUserId(
  params?: SubmissionCountBySkillParams,
) {
  const defaultParams = params ?? initialParams;

  const {
    item: submissionCountBySkill,
    setItem: setSubmissionCountBySkill,
    loading,
    error,
    get,
  } = useApiGetByParams<
    SubmissionCountBySkillDTO,
    SubmissionCountBySkill,
    SubmissionCountBySkillParams
  >({
    buildRequest: (requestParams) => {
      const resolvedParams = requestParams ?? defaultParams;
      const userId = resolvedParams.userId ?? "";

      return {
        apiBase: API_BASE,
        path: `/api/practice-submission/count-by-skill/user/${userId}`,
      };
    },
    initialItem: initialSubmissionCountBySkill,
    mapItem: mapSubmissionCountBySkillDTOToSubmissionCountBySkill,
  });

  return {
    submissionCountBySkill,
    setSubmissionCountBySkill,
    loading,
    error,
    get,
  };
}
