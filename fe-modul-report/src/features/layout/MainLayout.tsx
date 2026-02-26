import { Outlet } from "react-router-dom";
import Header from "./HeaderBar";
import NavBar from "./NavBar";

const MainLayout = () => {
  return (
    <div className="min-h-screen relative">
      <Header />
      <div className="sticky top-0 w-full z-10">
        <NavBar />
      </div>

      <main className=" min-h-screen">
        <div className=" min-h-[calc(100vh-4rem)]">
          <div className="bg-white rounded-lg min-h-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
