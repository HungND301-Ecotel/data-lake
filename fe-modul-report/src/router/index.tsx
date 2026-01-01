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
import DepartmentMy from "../features/department/pages/DepartmentMy";
import WareCategoryPage from "../features/ware/pages/WareCategory";
import WareTemplate from "../features/ware/pages/WareTemplate";
import { WareBatch } from "../features/ware/pages/WareBatch";
import { TemplateDetail } from "../features/ware/pages/WareTemplateDetail";
import { WareBatchDetail } from "../features/ware/pages/WareBatchDetail";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/employee", element: <EmployeePage /> },
      { path: "/employee/:employeeId", element: <ProfilePage /> },
      { path: "/ware", element: <DepartmentMy /> },
      { path: "/ware/department/:departmentId", element: <WareTemplate /> },
      { path: "/ware/template/:templateId", element: <WareBatch /> },
      { path: "/ware/template/detail/:templateId", element: <TemplateDetail /> },
      { path: "/ware/batch/:wareBatchId", element: <WareBatchDetail /> },

      { path: "/category/report", element: <ReportCategoryPage/> },
      { path: "/category/departments", element: <DepartmentCategoryPage/> },
      { path: "/category/ware", element: <WareCategoryPage/> },

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
