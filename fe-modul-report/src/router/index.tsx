import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/Layout/MainLayout";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import ReportTemplatePage from "../pages/report/ReportTemplatePage";
import ReportStoragePage from "../pages/report/ReportStoragePage";
import ReportDetailPage from "../pages/report/ReportDetailPage";
import DepartmentCategoryPage from "../pages/category/DepartmentCategoryPage";
import EmployeePage from "../pages/Employee/Employee";
import ReportStorageDepartment from "../pages/report/ReportStorageDepartment";
import ReportDetail from "../pages/ReportDetail";
import { ReportList } from "../pages/ReportList";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/employee", element: <EmployeePage /> },
      { path: "/category/employee", element: <div>Chức danh</div> },
      { path: "/category/departments", element: <DepartmentCategoryPage/> },

      { path: "/reports/template/list", element: <ReportList/> },
      { path: "/reports/template/us/:reportId", element: <ReportDetail/> },
      { path: "/reports/template/edit/:reportId", element: <ReportDetail/> },

      { path: "/reports/template", element: <ReportTemplatePage />},
      { path: "/reports/storage", element: <ReportStoragePage />},
      { path: "/reports/storage/:departmentId", element: <ReportStorageDepartment />},
      { path: "/report/:id", element: <ReportDetailPage/>},
    ],
  },
  
]);
