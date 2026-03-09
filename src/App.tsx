import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import ClassHistory from "./pages/ClassHistory";
import LessonGenerator from "./pages/LessonGenerator";
import MaterialGenerator from "./pages/MaterialGenerator";
import LessonPlans from "./pages/LessonPlans";
import ProgressTracking from "./pages/ProgressTracking";
import SearchPage from "./pages/Search";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            <Route path="/history" element={<ClassHistory />} />
            <Route path="/generate-lesson" element={<LessonGenerator />} />
            <Route path="/generate-material" element={<MaterialGenerator />} />
            <Route path="/plans" element={<LessonPlans />} />
            <Route path="/progress" element={<ProgressTracking />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
