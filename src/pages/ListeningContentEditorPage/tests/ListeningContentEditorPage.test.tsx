import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ListeningContentEditorPage } from "../ListeningContentEditorPage";
import { useListeningEditorState } from "../hooks/useListeningEditorState";

const {
  mockNavigate,
  mockUseParams,
  mockSetStatus,
  mockSetInstructions,
  mockSetTranscript,
  mockSetTitle,
  mockSetTask,
  mockSetDurationMinutes,
  mockHandleSaveExit,
  mockAddNewQuestion,
  mockDeleteQuestion,
  mockSetSelectedQuestionTempId,
  mockHandleSaveQuestion,
  mockHandleCancelQuestion,
  mockHandleSaveThumbnail,
  mockHandleSaveAudio,
  mockHandleRemoveThumbnail,
  mockHandleRemoveAudio,
  mockHandleSaveImage,
  mockHandleRemoveImage,
  mockHandleCopyUrl,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseParams: vi.fn(),
  mockSetStatus: vi.fn(),
  mockSetInstructions: vi.fn(),
  mockSetTranscript: vi.fn(),
  mockSetTitle: vi.fn(),
  mockSetTask: vi.fn(),
  mockSetDurationMinutes: vi.fn(),
  mockHandleSaveExit: vi.fn(),
  mockAddNewQuestion: vi.fn(),
  mockDeleteQuestion: vi.fn(),
  mockSetSelectedQuestionTempId: vi.fn(),
  mockHandleSaveQuestion: vi.fn(),
  mockHandleCancelQuestion: vi.fn(),
  mockHandleSaveThumbnail: vi.fn(),
  mockHandleSaveAudio: vi.fn(),
  mockHandleRemoveThumbnail: vi.fn(),
  mockHandleRemoveAudio: vi.fn(),
  mockHandleSaveImage: vi.fn(),
  mockHandleRemoveImage: vi.fn(),
  mockHandleCopyUrl: vi.fn(),
}));

vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

vi.mock("../hooks/useListeningEditorState", () => ({
  useListeningEditorState: vi.fn(),
}));

vi.mock("../../../components/NavBarUnified", () => ({
  NavBarUnified: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock("../../../components/Footer", () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

vi.mock("../../../components/ui/label", () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

vi.mock("../../../components/ui/textarea", () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

vi.mock("../components/EditorHeader", () => ({
  EditorHeader: ({
    isEditMode,
    status,
    onStatusChange,
    onCancel,
    onSaveExit,
    disableCancel,
  }: any) => (
    <div data-testid="editor-header">
      <span>isEditMode: {String(isEditMode)}</span>
      <span>status: {status}</span>
      <span>disableCancel: {String(disableCancel)}</span>

      <button onClick={() => onStatusChange("PUBLISHED")}>Change Status</button>
      <button onClick={onCancel}>Cancel</button>
      <button onClick={onSaveExit}>Save Exit</button>
    </div>
  ),
}));

vi.mock("../components/QuestionsTable", () => ({
  QuestionsTable: ({ questions, onAdd, onSelect, onDelete }: any) => (
    <div data-testid="questions-table">
      <span>Questions Count: {questions.length}</span>

      <button onClick={onAdd}>Add Question</button>
      <button onClick={() => onSelect("q-1")}>Select Question</button>
      <button onClick={() => onDelete("q-1")}>Delete Question</button>
    </div>
  ),
}));

vi.mock("../components/AnswerScoringPanel", () => ({
  AnswerScoringPanel: ({
    selectedQuestionNumber,
    questionType,
    topicTag,
    handleSaveQuestion,
    handleCancelQuestion,
  }: any) => (
    <div data-testid="answer-scoring-panel">
      <span>Selected Question: {selectedQuestionNumber}</span>
      <span>Question Type: {questionType}</span>
      <span>Topic Tag: {topicTag}</span>

      <button onClick={handleSaveQuestion}>Save Question</button>
      <button onClick={handleCancelQuestion}>Cancel Question</button>
    </div>
  ),
}));

vi.mock("../components/SupportingImagesBlock", () => ({
  SupportingImagesBlock: ({
    uploadedImages,
    handleSaveImage,
    handleRemoveImage,
    handleCopyUrl,
  }: any) => (
    <div data-testid="supporting-images-block">
      <span>Images Count: {uploadedImages.length}</span>

      <button onClick={handleSaveImage}>Save Image</button>
      <button onClick={() => handleRemoveImage("image-1")}>Remove Image</button>
      <button onClick={() => handleCopyUrl("image-url")}>Copy Url</button>
    </div>
  ),
}));

vi.mock("../components/UploadThumbnailCard", () => ({
  UploadThumbnailCard: ({ thumbnailPreview, onSave, onRemove }: any) => (
    <div data-testid="upload-thumbnail-card">
      <span>Thumbnail: {thumbnailPreview}</span>

      <button onClick={onSave}>Save Thumbnail</button>
      <button onClick={onRemove}>Remove Thumbnail</button>
    </div>
  ),
}));

vi.mock("../components/UploadAudioCard", () => ({
  UploadAudioCard: ({ audioPreview, onSave, onRemove }: any) => (
    <div data-testid="upload-audio-card">
      <span>Audio: {audioPreview}</span>

      <button onClick={onSave}>Save Audio</button>
      <button onClick={onRemove}>Remove Audio</button>
    </div>
  ),
}));

vi.mock("../components/ExerciseInfoCard", () => ({
  ExerciseInfoCard: ({
    title,
    onTitleChange,
    task,
    onTaskChange,
    questionsCount,
    durationMinutes,
    onDurationChange,
  }: any) => (
    <div data-testid="exercise-info-card">
      <span>Title: {title}</span>
      <span>Task: {task}</span>
      <span>Questions Count: {questionsCount}</span>
      <span>Duration: {durationMinutes}</span>

      <button onClick={() => onTitleChange("Updated Listening Title")}>
        Change Title
      </button>
      <button onClick={() => onTaskChange("PART_2")}>Change Task</button>
      <button onClick={() => onDurationChange(45)}>Change Duration</button>
    </div>
  ),
}));

describe("ListeningContentEditorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseParams.mockReturnValue({
      exerciseId: "listening-123",
    });

    vi.mocked(useListeningEditorState).mockReturnValue({
      title: "Listening Practice 1",
      setTitle: mockSetTitle,

      instructions: "Initial instructions",
      setInstructions: mockSetInstructions,

      transcript: "Initial transcript",
      setTranscript: mockSetTranscript,

      task: "PART_1",
      setTask: mockSetTask,

      durationMinutes: 30,
      setDurationMinutes: mockSetDurationMinutes,

      status: "DRAFT",
      setStatus: mockSetStatus,

      questions: [
        {
          tempId: "q-1",
          number: 1,
        },
      ],
      setQuestions: vi.fn(),

      selectedQuestionTempId: "q-1",
      setSelectedQuestionTempId: mockSetSelectedQuestionTempId,

      selectedQuestion: {
        tempId: "q-1",
        number: 1,
      },

      addNewQuestion: mockAddNewQuestion,
      deleteQuestion: mockDeleteQuestion,
      handleSaveQuestion: mockHandleSaveQuestion,
      handleCancelQuestion: mockHandleCancelQuestion,

      questionTypeTags: ["Multiple Choice"],
      setQuestionTypeTags: vi.fn(),

      topicTags: ["Education"],
      setTopicTags: vi.fn(),

      questionType: "MULTIPLE_CHOICE",
      setQuestionType: vi.fn(),

      topicTag: "Education",
      setTopicTag: vi.fn(),

      correctAnswers: ["A"],
      setCorrectAnswers: vi.fn(),

      newAnswerInput: "",
      setNewAnswerInput: vi.fn(),

      saveState: "saved",
      setSaveState: vi.fn(),
      markAsUnsaved: vi.fn(),

      thumbnailFile: null,
      setThumbnailFile: vi.fn(),
      thumbnailPreview: "thumbnail-url",
      setThumbnailPreview: vi.fn(),

      thumbnailInputRef: { current: null },
      audioInputRef: { current: null },

      handleThumbnailChange: vi.fn(),
      handleAudioChange: vi.fn(),
      handleThumbnailDrop: vi.fn(),
      handleAudioDrop: vi.fn(),
      handleDragOver: vi.fn(),

      displayUpdatedOn: "2026-01-01",

      audioPreview: "audio-url",
      setAudioPreview: vi.fn(),

      updatedOn: "2026-01-01",
      setUpdatedOn: vi.fn(),

      audioFile: null,
      setAudioFile: vi.fn(),

      safeRevokeObjectUrl: vi.fn(),

      handleSaveThumbnail: mockHandleSaveThumbnail,
      handleSaveAudio: mockHandleSaveAudio,

      thumbnailSaved: true,
      audioSaved: true,

      handleRemoveThumbnail: mockHandleRemoveThumbnail,
      handleRemoveAudio: mockHandleRemoveAudio,

      multiImageInputRef: { current: null },
      uploadedImages: [{ id: "image-1", url: "image-url" }],

      handleMultiImageChange: vi.fn(),
      handleSaveImage: mockHandleSaveImage,
      handleRemoveImage: mockHandleRemoveImage,
      handleCopyUrl: mockHandleCopyUrl,

      hasImageChanges: false,
      setHasImageChanges: vi.fn(),

      handleSaveExit: mockHandleSaveExit,
    } as any);
  });

  test("renders editor page in edit mode", () => {
    render(<ListeningContentEditorPage />);

    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();

    expect(screen.getByTestId("editor-header")).toHaveTextContent(
      "isEditMode: true",
    );
    expect(screen.getByTestId("editor-header")).toHaveTextContent(
      "status: DRAFT",
    );

    expect(
      screen.getByDisplayValue("Initial instructions"),
    ).toBeInTheDocument();

    expect(screen.getByDisplayValue("Initial transcript")).toBeInTheDocument();

    expect(screen.getByTestId("questions-table")).toHaveTextContent(
      "Questions Count: 1",
    );

    expect(screen.getByTestId("answer-scoring-panel")).toHaveTextContent(
      "Selected Question: 1",
    );

    expect(screen.getByTestId("supporting-images-block")).toHaveTextContent(
      "Images Count: 1",
    );

    expect(screen.getByTestId("upload-thumbnail-card")).toHaveTextContent(
      "Thumbnail: thumbnail-url",
    );

    expect(screen.getByTestId("upload-audio-card")).toHaveTextContent(
      "Audio: audio-url",
    );

    expect(screen.getByTestId("exercise-info-card")).toHaveTextContent(
      "Title: Listening Practice 1",
    );
  });

  test("renders editor page in create mode when exerciseId is missing", () => {
    mockUseParams.mockReturnValue({
      exerciseId: undefined,
    });

    render(<ListeningContentEditorPage />);

    expect(screen.getByTestId("editor-header")).toHaveTextContent(
      "isEditMode: false",
    );

    expect(useListeningEditorState).toHaveBeenCalledWith(false, undefined);
  });

  test("updates instructions and transcript textareas", async () => {
    const user = userEvent.setup();

    render(<ListeningContentEditorPage />);

    await user.clear(screen.getByDisplayValue("Initial instructions"));
    await user.type(
      screen.getByPlaceholderText(
        "Type the shared instructions and notes layout here...",
      ),
      "Updated instructions",
    );

    expect(mockSetInstructions).toHaveBeenCalled();

    await user.clear(screen.getByDisplayValue("Initial transcript"));
    await user.type(
      screen.getByPlaceholderText(
        "Type the audio script/transcript for this listening exercise here...",
      ),
      "Updated transcript",
    );

    expect(mockSetTranscript).toHaveBeenCalled();
  });

  test("calls header actions", async () => {
    const user = userEvent.setup();

    render(<ListeningContentEditorPage />);

    await user.click(screen.getByRole("button", { name: /change status/i }));
    expect(mockSetStatus).toHaveBeenCalledWith("PUBLISHED");

    await user.click(screen.getByRole("button", { name: /save exit/i }));
    expect(mockHandleSaveExit).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/content-management");
  });

  test("calls question table actions", async () => {
    const user = userEvent.setup();

    render(<ListeningContentEditorPage />);

    await user.click(screen.getByRole("button", { name: /add question/i }));
    expect(mockAddNewQuestion).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /select question/i }));
    expect(mockSetSelectedQuestionTempId).toHaveBeenCalledWith("q-1");

    await user.click(screen.getByRole("button", { name: /delete question/i }));
    expect(mockDeleteQuestion).toHaveBeenCalledWith("q-1");
  });

  test("calls answer scoring panel actions", async () => {
    const user = userEvent.setup();

    render(<ListeningContentEditorPage />);

    await user.click(screen.getByRole("button", { name: /save question/i }));
    expect(mockHandleSaveQuestion).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /cancel question/i }));
    expect(mockHandleCancelQuestion).toHaveBeenCalled();
  });

  test("calls upload and image actions", async () => {
    const user = userEvent.setup();

    render(<ListeningContentEditorPage />);

    await user.click(screen.getByRole("button", { name: /save thumbnail/i }));
    expect(mockHandleSaveThumbnail).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /remove thumbnail/i }));
    expect(mockHandleRemoveThumbnail).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /save audio/i }));
    expect(mockHandleSaveAudio).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /remove audio/i }));
    expect(mockHandleRemoveAudio).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /save image/i }));
    expect(mockHandleSaveImage).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /remove image/i }));
    expect(mockHandleRemoveImage).toHaveBeenCalledWith("image-1");

    await user.click(screen.getByRole("button", { name: /copy url/i }));
    expect(mockHandleCopyUrl).toHaveBeenCalledWith("image-url");
  });

  test("calls exercise info card handlers", async () => {
    const user = userEvent.setup();

    render(<ListeningContentEditorPage />);

    await user.click(screen.getByRole("button", { name: /change title/i }));
    expect(mockSetTitle).toHaveBeenCalledWith("Updated Listening Title");

    await user.click(screen.getByRole("button", { name: /change task/i }));
    expect(mockSetTask).toHaveBeenCalledWith("PART_2");

    await user.click(screen.getByRole("button", { name: /change duration/i }));
    expect(mockSetDurationMinutes).toHaveBeenCalledWith(45);
  });
});
