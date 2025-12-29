import { createBrowserRouter } from "react-router-dom";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import ReportTemplatePage from "../features/report/pages/ReportTemplatePage";
import ReportStoragePage from "../features/report/pages/ReportStoragePage";
import ReportDetailPage from "../features/report/pages/ReportDetailPage";
import EmployeePage from "../features/employee/pages/Employee";
import ReportStorageDepartment from "../features/report/pages/ReportStorageDepartment";
import ReportDetail from "../features/report/pages/ReportDetail";
import ReportTemplateDepartment from "../features/report/pages/ReportTemplateDepartment";
import ReportCategoryPage from "../features/category/reportCategory/pages/ReportCategory";
import DepartmentCategoryPage from "../features/department/pages/DepartmentCategoryPage";
import LoginPage from "../features/auth/pages/LoginPage";
import LuckeyExcelViewer from "../features/report/components/previewFile/LuckeyExcel";
import PreviewFilePdf from "../features/report/components/previewFile/PreviewFilePdf";
import ProfilePage from "../features/employee/pages/ProfilePage";
import MainLayout from "../features/layout/MainLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/employee", element: <EmployeePage /> },
      { path: "/employee/:employeeId", element: <ProfilePage /> },


      { path: "/category/report", element: <ReportCategoryPage/> },
      { path: "/category/departments", element: <DepartmentCategoryPage/> },

      {
        path: "/reports/view/excel/:fileKey",
        element: <LuckeyExcelViewer />,
      },

      {
        path: "/reports/view/pdf/:fileKey",
        element: <PreviewFilePdf />,
      },
      

      { path: "/reports/template/us/:reportId", element: <ReportDetail/> },
      { path: "/reports/template/edit/:reportId", element: <ReportDetail/> },
      
      { path: "/reports/template", element: <ReportTemplatePage />},
      { path: "/reports/template/department/:departmentId", element: <ReportTemplateDepartment />},

      { path: "/reports/storage", element: <ReportStoragePage />},
      { path: "/reports/storage/department/:departmentId", element: <ReportStorageDepartment />},

      { path: "/report/:id", element: <ReportDetailPage/>},
    ],
  },

  {
    path: "/login",
    element: <LoginPage />,
    
  },

  
]);
