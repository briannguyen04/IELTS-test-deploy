import { API_BASE } from "../../../env";
import { useApiPutByParams } from "../../../utils/api";
import {
  RefreshStudyPlanAfterSubmissionParams,
  RefreshStudyPlanAfterSubmissionResponseDTO,
  RefreshStudyPlanAfterSubmissionResponse,
} from "../types";

const initialParams: RefreshStudyPlanAfterSubmissionParams = {
  userId: "",
  skill: "WRITING",
};

const initialStudyPlanRefresh: RefreshStudyPlanAfterSubmissionResponse = {
  userId: "",
};

function mapRefreshStudyPlanAfterSubmissionDTOToStudyPlanRefresh(
  dto: RefreshStudyPlanAfterSubmissionResponseDTO,
): RefreshStudyPlanAfterSubmissionResponse {
  return {
    userId: dto.userId ?? "",
  };
}

export function useRefreshStudyPlanAfterSubmission(
  params?: RefreshStudyPlanAfterSubmissionParams,
) {
  const defaultParams = params ?? initialParams;

  const {
    item: studyPlanRefresh,
    setItem: setStudyPlanRefresh,
    loading,
    error,
    put,
  } = useApiPutByParams<
    RefreshStudyPlanAfterSubmissionResponseDTO,
    RefreshStudyPlanAfterSubmissionResponse,
    RefreshStudyPlanAfterSubmissionParams,
    undefined
  >({
    buildRequest: (requestParams) => {
      const resolvedParams = requestParams ?? defaultParams;

      return {
        apiBase: API_BASE,
        path: `/api/learner-study-plan/user/${resolvedParams.userId}/skill/${resolvedParams.skill}/refresh-after-submission`,
      };
    },
    initialItem: initialStudyPlanRefresh,
    mapItem: mapRefreshStudyPlanAfterSubmissionDTOToStudyPlanRefresh,
  });

  return {
    studyPlanRefresh,
    setStudyPlanRefresh,
    loading,
    error,
    put,
  };
}
