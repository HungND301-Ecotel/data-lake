import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../components/Layout/MainLayout";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import ReportTemplatePage from "../pages/report/ReportTemplatePage";
import ReportStoragePage from "../pages/report/ReportStoragePage";
import ReportDetailPage from "../pages/report/ReportDetailPage";
import EmployeePage from "../pages/Employee/Employee";
import ReportStorageDepartment from "../pages/report/ReportStorageDepartment";
import ReportDetail from "../pages/ReportDetail";
import ReportTemplateDepartment from "../pages/report/ReportTemplateDepartment";
import ReportCategoryPage from "../pages/category/ReportCategory";
import DepartmentCategoryPage from "../pages/category/DepartmentCategoryPage";
import LoginPage from "../pages/user/LoginPage";
import LuckeyExcelViewer from "../components/previewFile/LuckeyExcel";
import PreviewFilePdf from "../components/previewFile/PreviewFilePdf";
import ProfilePage from "../pages/Employee/ProfilePage";

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
