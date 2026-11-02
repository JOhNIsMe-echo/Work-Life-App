import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const HomePage = lazy(() =>
  import("../features/home/HomePage").then((module) => ({
    default: module.HomePage,
  })),
);
const TodosPage = lazy(() =>
  import("../features/todos/TodosPage").then((module) => ({
    default: module.TodosPage,
  })),
);
const FitnessPage = lazy(() =>
  import("../features/fitness/FitnessPage").then((module) => ({
    default: module.FitnessPage,
  })),
);
const DietPage = lazy(() =>
  import("../features/diet/DietPage").then((module) => ({
    default: module.DietPage,
  })),
);
const EntertainmentPage = lazy(() =>
  import("../features/entertainment/EntertainmentPage").then((module) => ({
    default: module.EntertainmentPage,
  })),
);
const StudyPage = lazy(() =>
  import("../features/study/StudyPage").then((module) => ({
    default: module.StudyPage,
  })),
);
const MoodPage = lazy(() =>
  import("../features/mood/MoodPage").then((module) => ({
    default: module.MoodPage,
  })),
);
const SettingsPage = lazy(() =>
  import("../features/settings/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);

export function AppRoutes() {
  return (
    <Suspense
      fallback={
        <p className="route-loading" role="status">
          正在读取本地记录…
        </p>
      }
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/todos" element={<TodosPage />} />
        <Route path="/fitness" element={<FitnessPage />} />
        <Route path="/diet" element={<DietPage />} />
        <Route path="/entertainment" element={<EntertainmentPage />} />
        <Route path="/study" element={<StudyPage />} />
        <Route path="/mood" element={<MoodPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
