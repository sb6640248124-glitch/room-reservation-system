import { useState } from "react";
import MainMenuTabs from "../components/MainMenuTabs";
import BuildingsTab from "../pages/admin/BuildingsTab";
import RoomTypesTab from "../pages/admin/RoomTypesTab";
import RoomsTab from "../pages/admin/RoomsTab";
import "../pages/admin/AdminRooms.css";

export default function BuildingRoomAdmin() {
  const [activeTab, setActiveTab] = useState("buildings");

  return (
    <div className="home">
      <MainMenuTabs />

      <div className="admin-container">
        <h2 className="page-title">
          จัดการอาคาร / จัดการประเภทห้อง / จัดการห้อง
        </h2>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={activeTab === "buildings" ? "tab active" : "tab"}
            onClick={() => setActiveTab("buildings")}
          >
            อาคาร
          </button>

          <button
            className={activeTab === "roomTypes" ? "tab active" : "tab"}
            onClick={() => setActiveTab("roomTypes")}
          >
            ประเภทห้อง
          </button>

          <button
            className={activeTab === "rooms" ? "tab active" : "tab"}
            onClick={() => setActiveTab("rooms")}
          >
            ห้อง
          </button>
        </div>

        {/* Content */}
        {activeTab === "buildings" && <BuildingsTab />}
        {activeTab === "roomTypes" && <RoomTypesTab />}
        {activeTab === "rooms" && <RoomsTab />}
      </div>
    </div>
  );
}
