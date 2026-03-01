import { FCC } from "@types";

export interface Tab {
  title: string;
  id: string;
}
interface TabProps {
  tabs: Tab[];
  activeTab: number;
  setActiveTab: React.Dispatch<React.SetStateAction<number>>;
}
export const TabsMenu: FCC<TabProps> = ({ tabs, setActiveTab, activeTab }) => {
  return (
    <div
      role="tablist"
      className="inline-flex flex-wrap self-start rounded-full border-2 border-gray-600 p-0.5"
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          id={tab.id}
          role="tab"
          aria-selected={activeTab === index}
          onClick={() => setActiveTab(index)}
          className={`rounded-full px-4 py-2 font-semibold capitalize transition-[bg] duration-75 ease-in-out ${
            activeTab === index ? "bg-blue-500 text-white" : "text-gray-30"
          }`}
        >
          {tab.title}
        </button>
      ))}
    </div>
  );
};
