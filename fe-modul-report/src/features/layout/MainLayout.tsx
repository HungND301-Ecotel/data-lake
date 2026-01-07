import { Outlet } from "react-router-dom";
import Header from "./HeaderBar";

const MainLayout = () => {
  return (
    <div className="min-h-screen">
      <Header />

      <main className=" min-h-screen">
        <div className="px-4 py-4 min-h-[calc(100vh-4rem)]">
          <div className="bg-white rounded-lg min-h-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
